import { clientPointToFlowPoint, openFlowSurface, placeFlowSurface, type FlowPoint, type FlowWorkspaceSurface, type FlowWorkspaceView } from "./workspace.js";
import { installFlowCamera } from "./workspace-camera-ui.js";
import { decorateCompactFlowCards } from "./workspace-card-ui.js";
import { flowControl } from "./workspace-dom.js";
import { prepareFlowOutline } from "./workspace-outline-ui.js";
import { installFlowSections, type FlowSectionMenuRequest } from "./workspace-section-ui.js";
import { createFlowTidyPanel } from "./workspace-tidy-ui.js";
import { flowWorkspaceView, rememberFlowInvoker, restoreFlowInvoker, saveFlowWorkspaceView } from "./workspace-view-state.js";
import {
  prepareFlowActionsButton,
  prepareFlowItemMenu,
  type FlowItemMenuKind,
  type FlowItemMenuRequest,
} from "./workspace-item-menu.js";

export interface FlowItemMenuOpenRequest {
  kind: FlowItemMenuKind;
  id: string;
  request: FlowItemMenuRequest;
}

interface EmptyConnectionDrop {
  sourceId: string;
  sourcePort: string;
  targetPort: string;
  position: FlowPoint;
  clientPosition?: FlowPoint;
}

interface WorkspaceElements {
  workspace: HTMLElement;
  legacyToolbar: HTMLElement;
  viewport: HTMLElement;
  canvas: SVGSVGElement;
  outline: HTMLOListElement;
  rawSections: HTMLElement | undefined;
  duplicateFrames: HTMLElement | undefined;
  actions: HTMLElement | undefined;
  relationship: HTMLElement | undefined;
}

interface FlowDetailsRestoration {
  scrollTop: number;
  tagName: string;
  ariaLabel?: string;
  text?: string;
}

const flowDetailsRestorations = new Map<string, FlowDetailsRestoration>();
const flowDetailsRestorationStorageKey = (workspaceKey: string): string => `my-chrome-utilities.flow-details-restoration.v1:${workspaceKey}`;

function rememberFlowDetailsCommit(workspaceKey: string, surface: HTMLElement, target: EventTarget | null): void {
  if (!(target instanceof Element)) return;
  const control = target.closest<HTMLElement>("button,a");
  if (!control || (control.tagName === "BUTTON" && !control.textContent?.trim().startsWith("Save"))) return;
  const restoration: FlowDetailsRestoration = {
    scrollTop: surface.scrollTop,
    tagName: control.tagName,
    ...(control.getAttribute("aria-label") ? { ariaLabel: control.getAttribute("aria-label")! } : {}),
    ...(control.textContent?.trim() ? { text: control.textContent.trim() } : {}),
  };
  flowDetailsRestorations.set(workspaceKey, restoration);
  sessionStorage.setItem(flowDetailsRestorationStorageKey(workspaceKey), JSON.stringify(restoration));
}

function restoreFlowDetailsCommit(workspaceKey: string, surface: HTMLElement): void {
  const stored = sessionStorage.getItem(flowDetailsRestorationStorageKey(workspaceKey));
  const restoration = flowDetailsRestorations.get(workspaceKey) ?? (stored ? JSON.parse(stored) as FlowDetailsRestoration : undefined);
  if (!restoration) return;
  flowDetailsRestorations.set(workspaceKey, restoration);
  const apply = (): void => {
    if (!surface.isConnected) return;
    surface.scrollTop = restoration.scrollTop;
    const controls = Array.from(surface.querySelectorAll<HTMLElement>(restoration.tagName.toLowerCase()));
    const focusTarget = controls.find((control) => restoration.ariaLabel
      ? control.getAttribute("aria-label") === restoration.ariaLabel
      : control.textContent?.trim() === restoration.text);
    focusTarget?.focus({ preventScroll: true });
  };
  apply();
  setTimeout(apply, 0);
  setTimeout(apply, 50);
  setTimeout(apply, 150);
  setTimeout(() => {
    if (flowDetailsRestorations.get(workspaceKey) !== restoration) return;
    flowDetailsRestorations.delete(workspaceKey);
    sessionStorage.removeItem(flowDetailsRestorationStorageKey(workspaceKey));
  }, 300);
}

function elements(root: HTMLElement): WorkspaceElements | undefined {
  const workspace = root.querySelector<HTMLElement>(".documentary-flow");
  const legacyToolbar = workspace?.querySelector<HTMLElement>('[aria-label="Flow component catalogs"]');
  const viewport = workspace?.querySelector<HTMLElement>(".flow-canvas-scroll");
  const canvas = viewport?.querySelector<SVGSVGElement>(".flow-graph-canvas");
  const outline = workspace?.querySelector<HTMLOListElement>('[aria-label="Synchronized editable Flow outline"]');
  if (!workspace || !legacyToolbar || !viewport || !canvas || !outline) return undefined;
  return {
    workspace, legacyToolbar, viewport, canvas, outline,
    rawSections: workspace.querySelector<HTMLElement>('[aria-label="Flow Section controls"]') ?? undefined,
    duplicateFrames: workspace.querySelector<HTMLElement>('[aria-label="Flow Page frames"]') ?? undefined,
    actions: workspace.querySelector<HTMLElement>('[aria-label^="Selected "]') ?? undefined,
    relationship: workspace.querySelector<HTMLElement>('[aria-label="Inline relationship popover"]') ?? undefined,
  };
}

export function upgradeFlowWorkspace(root: HTMLElement, pendingMenu?: FlowItemMenuOpenRequest): void {
  const found = elements(root);
  if (!found || found.workspace.dataset.canvasFirstR02 === "true") return;
  const { workspace, legacyToolbar, viewport, canvas, outline, rawSections, duplicateFrames, actions, relationship } = found;
  workspace.dataset.canvasFirstR02 = "true";
  const flowId = workspace.dataset.flowSectionWorkspace ?? "flow";
  const projectId = rawSections?.dataset.flowProjectId ?? workspace.dataset.flowProjectId ?? "project";
  let view = flowWorkspaceView(projectId, flowId), emptyDrop: EmptyConnectionDrop | undefined, addPosition: FlowPoint | undefined, itemActionsButton: HTMLButtonElement | undefined;
  const toolbar = document.createElement("nav"), surface = document.createElement("section"), surfaceHeading = document.createElement("h4"), surfaceBody = document.createElement("div");
  const pageCatalog = legacyToolbar.querySelector<HTMLElement>('[aria-label="Pages catalog"]'), eventCatalog = legacyToolbar.querySelector<HTMLElement>('[aria-label="Events catalog"]');
  const detailsSource = duplicateFrames?.querySelector<HTMLElement>('[aria-pressed="true"]') ?? duplicateFrames?.querySelector<HTMLElement>(".is-selected") ?? undefined;
  const selectedOutline = outline.querySelector<HTMLElement>(".is-selected") ?? undefined;
  const detailsParents = new Map<Node, Node>();
  if (detailsSource && duplicateFrames) detailsParents.set(detailsSource, duplicateFrames);
  if (selectedOutline) detailsParents.set(selectedOutline, outline);
  if (pageCatalog) detailsParents.set(pageCatalog, legacyToolbar);
  if (eventCatalog) detailsParents.set(eventCatalog, legacyToolbar);

  const saveView = (next: FlowWorkspaceView): void => { view = next; saveFlowWorkspaceView(projectId, flowId, view); };
  const closeSurface = (): void => showSurface(undefined);
  const close = flowControl("Close", () => { emptyDrop = undefined; closeSurface(); });
  try {
    const selectedItem = JSON.parse(sessionStorage.getItem(`my-chrome-utilities.flow-view.v1:${projectId}:${flowId}`) ?? "{}").selectedItem as { kind?: string; id?: string } | undefined;
    if (selectedItem?.kind === "section" && selectedItem.id) canvas.querySelector(`[data-section-dropzone="${CSS.escape(selectedItem.id)}"]`)?.closest("g")?.classList.add("is-selected");
  } catch {
    // A malformed optional view record must not prevent the Flow from opening.
  }
  const cameraUi = installFlowCamera({
    canvas, viewport, camera: () => view.camera,
    save(camera) { saveView({ ...view, camera, cameraInitialized: true }); },
  });
  const sectionUi = installFlowSections({ root, canvas, viewport, camera: () => view.camera, closeSurface, openMenu: showSectionMenu });
  for (let item = workspace.firstElementChild; item && item !== legacyToolbar;) {
    const next = item.nextElementSibling;
    (item as HTMLElement).hidden = true;
    (item as HTMLElement).dataset.flowLegacyPrelude = "true";
    item = next;
  }

  toolbar.className = "flow-workspace-toolbar";
  toolbar.setAttribute("aria-label", "Flow toolbar");
  surface.className = "flow-workspace-surface";
  surface.setAttribute("aria-label", "Flow contextual surface");
  surface.hidden = true;
  Object.assign(surface.style, { position: "absolute", boxSizing: "border-box", overflow: "auto" });
  surfaceHeading.textContent = "Flow tools";
  surface.append(surfaceHeading, close, surfaceBody);
  const workspaceKey = `${projectId}\u0000${flowId}`;
  surface.addEventListener("pointerdown", (event) => rememberFlowDetailsCommit(workspaceKey, surface, event.target), true);
  surface.addEventListener("mousedown", (event) => rememberFlowDetailsCommit(workspaceKey, surface, event.target), true);

  const restoreDetailsNodes = (): void => {
    for (const [node, parent] of detailsParents) if (node.parentNode === surfaceBody) parent.appendChild(node);
  };
  const placeSurface = (client?: FlowPoint): void => {
    const rect = viewport.getBoundingClientRect(), placement = placeFlowSurface(
      { width: rect.width, height: rect.height },
      client ? { x: client.x - rect.left, y: client.y - rect.top } : undefined,
    );
    Object.assign(surface.style, { left: `${placement.left}px`, top: `${placement.top}px`, right: "auto", width: `${placement.width}px`, maxWidth: "calc(100% - 12px)", maxHeight: `${placement.maxHeight}px` });
  };
  const addContents = (): Node[] => {
    return [sectionUi.addPanel(), ...(pageCatalog ? [pageCatalog] : []), ...(eventCatalog ? [eventCatalog] : [])];
  };
  const detailsContents = (): Node[] => [
    ...(detailsSource ? [detailsSource] : []), ...(selectedOutline ? [selectedOutline] : []),
  ];
  const contents = (kind: FlowWorkspaceSurface): Node[] => {
    if (kind === "add") return addContents();
    if (kind === "outline") return [prepareFlowOutline({ outline, canvas, reveal: cameraUi.reveal })];
    if (kind === "details") return detailsContents();
    return [createFlowTidyPanel({ root, canvas, closeSurface })];
  };
  function showSurface(kind: FlowWorkspaceSurface | undefined, invoker?: HTMLElement, client?: FlowPoint): void {
    if (invoker) rememberFlowInvoker(projectId, flowId, invoker);
    saveView(kind ? openFlowSurface(view, kind) : { ...view, surface: undefined });
    surface.hidden = !kind;
    restoreDetailsNodes();
    surfaceBody.replaceChildren(...(kind ? contents(kind) : []));
    surfaceHeading.textContent = kind ? `${kind[0]!.toUpperCase()}${kind.slice(1)}` : "Flow tools";
    toolbar.querySelectorAll<HTMLButtonElement>("[data-flow-surface]").forEach((button) => button.setAttribute("aria-expanded", String(button.dataset.flowSurface === kind)));
    itemActionsButton?.setAttribute("aria-expanded", "false");
    if (kind) placeSurface(client);
    else restoreFlowInvoker(projectId, flowId);
  }
  function showSectionMenu(section: SVGGraphicsElement, request: FlowSectionMenuRequest): void {
    const panel = sectionUi.actions(section), id = section.dataset.flowSectionId ?? "section";
    prepareFlowItemMenu(panel, "section", id);
    showItemMenu(section as unknown as HTMLElement, panel, request, `${section.querySelector("text")?.textContent?.trim() || "Section"} actions`);
  }
  function showItemMenu(invoker: HTMLElement, menu: HTMLElement, request: FlowItemMenuRequest, heading: string): void {
    rememberFlowInvoker(projectId, flowId, invoker);
    saveView({ ...view, surface: undefined });
    surface.hidden = false;
    restoreDetailsNodes();
    menu.hidden = false;
    surfaceBody.replaceChildren(menu);
    surfaceHeading.textContent = heading;
    toolbar.querySelectorAll<HTMLButtonElement>("[data-flow-surface]").forEach((button) => button.setAttribute("aria-expanded", "false"));
    itemActionsButton?.setAttribute("aria-expanded", "true");
    placeSurface(request.clientPosition);
    menu.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }
  surface.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); closeSurface(); return; }
    const menuItems = Array.from(surfaceBody.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    if (!menuItems.length || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = Math.max(0, menuItems.indexOf(document.activeElement as HTMLButtonElement));
    const next = event.key === "Home" ? 0 : event.key === "End" ? menuItems.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + menuItems.length) % menuItems.length;
    menuItems[next]?.focus({ preventScroll: true });
  });
  workspace.addEventListener("flow-open-item-editor", (event) => {
    const detail = (event as CustomEvent<{ title?: string; content?: Node; firstControl?: HTMLElement }>).detail;
    if (!detail?.content) return;
    itemActionsButton?.setAttribute("aria-expanded", "false");
    surfaceBody.replaceChildren(detail.content);
    surfaceHeading.textContent = detail.title ?? "Flow item details";
    surface.hidden = false;
    placeSurface();
    queueMicrotask(() => detail.firstControl?.focus({ preventScroll: true }));
  });
  workspace.addEventListener("flow-close-item-editor", closeSurface);
  const surfaceButton = (label: string, kind: FlowWorkspaceSurface): HTMLButtonElement => {
    const result = flowControl(label, () => showSurface(view.surface === kind ? undefined : kind, result));
    result.dataset.flowSurface = kind;
    result.setAttribute("aria-expanded", String(view.surface === kind));
    return result;
  };

  const projectNavigation = document.querySelector<HTMLElement>("#project-workspace > nav");
  const applyNavigationVisibility = (): void => { if (projectNavigation) projectNavigation.hidden = !view.navigationVisible; };
  applyNavigationVisibility();
  const navigationToggle = flowControl(view.navigationVisible ? "Hide navigation" : "Show navigation", () => {
    saveView({ ...view, navigationVisible: !view.navigationVisible });
    applyNavigationVisibility();
    navigationToggle.textContent = view.navigationVisible ? "Hide navigation" : "Show navigation";
    navigationToggle.setAttribute("aria-expanded", String(view.navigationVisible));
  });
  navigationToggle.setAttribute("aria-controls", "project-tree");
  navigationToggle.setAttribute("aria-expanded", String(view.navigationVisible));
  const add = surfaceButton("Add", "add"), outlineButton = surfaceButton("Outline", "outline"), details = surfaceButton("Details", "details"), tidy = surfaceButton("Tidy", "tidy");
  canvas.setAttribute("tabindex", "0");
  const skip = flowControl("Skip to canvas", () => canvas.focus({ preventScroll: true }));
  const focusCanvas = flowControl("Focus Canvas", () => {
    if (!view.focusCanvas) rememberFlowInvoker(projectId, flowId, focusCanvas);
    saveView({ ...view, focusCanvas: !view.focusCanvas });
    document.body.classList.toggle("flow-focus-canvas", view.focusCanvas);
    focusCanvas.textContent = view.focusCanvas ? "Exit Focus Canvas" : "Focus Canvas";
    if (!view.focusCanvas) restoreFlowInvoker(projectId, flowId);
  });
  document.body.classList.toggle("flow-focus-canvas", view.focusCanvas);
  focusCanvas.textContent = view.focusCanvas ? "Exit Focus Canvas" : "Focus Canvas";
  const minimapToggle = flowControl("Minimap", () => {
    saveView({ ...view, minimap: !view.minimap });
    cameraUi.setMinimapVisible(view.minimap);
    minimapToggle.setAttribute("aria-pressed", String(view.minimap));
  });
  minimapToggle.setAttribute("aria-pressed", String(view.minimap));
  const visualMode=document.createElement("select");visualMode.setAttribute("aria-label","Visual display mode");for(const mode of ["Hidden","Badges","Thumbnails"] as const)visualMode.append(new Option(mode,mode));visualMode.value=view.visualDisplayMode;visualMode.addEventListener("change",()=>{saveView({...view,visualDisplayMode:visualMode.value as FlowWorkspaceView["visualDisplayMode"]});workspace.dispatchEvent(new CustomEvent("flow-visual-display-mode",{bubbles:true,detail:{mode:view.visualDisplayMode}}));});
  toolbar.append(skip, navigationToggle, add, focusCanvas, ...cameraUi.controls, outlineButton, details, tidy, minimapToggle, visualMode);

  decorateCompactFlowCards(canvas, duplicateFrames, outline);
  if (actions?.getAttribute("aria-label")?.includes("Page instance")) {
    const rename = flowControl("Rename in Flow", () => { showSurface("details", rename); detailsSource?.querySelector<HTMLInputElement>('[aria-label^="Name in this Flow"]')?.focus(); });
    const addEvent = flowControl("Add Event", () => showSurface("add", addEvent));
    const duplicate = flowControl("Duplicate", () => detailsSource?.querySelector<HTMLButtonElement>('button[data-flow-duplicate-frame],button:nth-last-child(2)')?.click());
    const openDetails = flowControl("Details", () => { showSurface("details", openDetails); surfaceBody.querySelector<HTMLElement>("input,select,textarea,button")?.focus({ preventScroll: true }); });
    for (const control of [rename, addEvent, duplicate, openDetails]) control.dataset.flowItemCommand = control.textContent ?? "";
    actions.prepend(rename, addEvent, duplicate, openDetails);
  }
  if (actions?.getAttribute("aria-label")?.includes("Event occurrence")) {
    const openDetails = flowControl("Details", () => { showSurface("details", openDetails); surfaceBody.querySelector<HTMLElement>("input,select,textarea,button")?.focus({ preventScroll: true }); });
    openDetails.dataset.flowItemCommand = "Details";
    actions.prepend(openDetails);
  }
  if (relationship && actions) {
    actions.setAttribute("aria-label", "Selected relationship actions");
    const label = relationship.querySelector<HTMLInputElement>('[aria-label="Optional relationship label"]');
    const edit = flowControl("Edit documentation", () => actions.dispatchEvent(new CustomEvent("flow-open-item-editor", { bubbles: true, detail: { title: "Relationship details", content: relationship, firstControl: label } })));
    const remove = relationship.querySelector<HTMLButtonElement>('button[aria-label^="Delete relationship"]');
    const deleteAction = flowControl("Delete relationship", () => remove?.click());
    if (remove?.getAttribute("aria-label")) deleteAction.setAttribute("aria-label", remove.getAttribute("aria-label")!);
    edit.dataset.flowItemCommand = "Edit documentation";
    deleteAction.dataset.flowItemCommand = "Delete relationship";
    actions.append(edit, deleteAction);
    if (relationship.dataset.flowRelationshipAutofocus !== "true") relationship.remove();
  }
  const selectedSection = Array.from(canvas.querySelectorAll<SVGGraphicsElement>("g[data-flow-section-id].is-selected")).find((candidate) => candidate.querySelector(":scope > [data-section-dropzone]"));
  const sectionActions = selectedSection ? sectionUi.actions(selectedSection) : undefined;
  const itemMenu = actions ?? sectionActions;
  const itemKind = itemMenu?.dataset.flowItemKind as FlowItemMenuKind | undefined, itemId = itemMenu?.dataset.flowItemId;
  let itemToolbar: HTMLElement | undefined;
  if (itemMenu && itemKind && itemId) {
    const commands = prepareFlowItemMenu(itemMenu, itemKind, itemId);
    if (commands.length) {
      itemMenu.hidden = true;
      itemToolbar = document.createElement("section");
      itemToolbar.className = "flow-contextual-toolbar";
      itemToolbar.setAttribute("aria-label", `Selected ${itemKind} actions`);
      itemActionsButton = flowControl("Actions", () => showItemMenu(itemActionsButton!, itemMenu, {}, `${itemKind} actions`));
      prepareFlowActionsButton(itemActionsButton, itemMenu.id);
      itemToolbar.append(itemActionsButton);
    }
  }

  workspace.addEventListener("flow-empty-connection-drop", (event) => {
    const detail = (event as CustomEvent<EmptyConnectionDrop & { sourceElement?: HTMLElement }>).detail;
    if (!detail) return;
    emptyDrop = detail;
    addPosition = detail.position;
    const viewportRect = viewport.getBoundingClientRect();
    const releasePoint = detail.clientPosition ?? {
      x: viewportRect.left + (detail.position.x - view.camera.x) * view.camera.zoom,
      y: viewportRect.top + (detail.position.y - view.camera.y) * view.camera.zoom,
    };
    showSurface("add", detail.sourceElement, releasePoint);
    surfaceHeading.textContent = "Choose target Page";
  });
  viewport.addEventListener("dblclick", (event) => {
    if (event.target !== canvas) return;
    const rect = viewport.getBoundingClientRect();
    addPosition = clientPointToFlowPoint(rect, view.camera, { x: event.clientX, y: event.clientY });
    showSurface("add", viewport, { x: event.clientX, y: event.clientY });
  });
  viewport.addEventListener("keydown", (event) => {
    if (event.target !== viewport || event.key.toLowerCase() !== "a") return;
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    addPosition = { x: view.camera.x + rect.width / view.camera.zoom / 2, y: view.camera.y + rect.height / view.camera.zoom / 2 };
    showSurface("add", viewport, { x: rect.left + rect.width / 2, y: rect.top + 24 });
  });
  workspace.addEventListener("click", (event) => {
    const target = (event.target as Element).closest<HTMLButtonElement>("button"), label = target?.textContent?.trim();
    rememberFlowDetailsCommit(workspaceKey, surface, target);
    if (label === "Open schema contribution") {
      saveView(openFlowSurface(view, "details"));
      setTimeout(() => {
        const editor = Array.from(document.querySelectorAll<HTMLElement>('[aria-label="Shared schema constraints editor"]'))
          .find((candidate) => !candidate.hidden);
        if (!editor) return;
        const destination = editor.querySelector<HTMLElement>("h2,h3,h4,button,input,select,textarea") ?? editor;
        if (!destination.matches("button,input,select,textarea,[tabindex]")) destination.tabIndex = -1;
        destination.focus({ preventScroll: true });
      }, 0);
      return;
    }
    if (view.surface !== "add" || !label?.startsWith("Add ") || target?.dataset.componentKind !== "page") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (emptyDrop) root.dispatchEvent(new CustomEvent("flow-empty-connection-page", { bubbles: true, detail: { ...emptyDrop, pageId: target.dataset.componentId } }));
    else root.dispatchEvent(new CustomEvent("flow-add-page-at", { bubbles: true, detail: { pageId: target.dataset.componentId, position: addPosition } }));
    emptyDrop = undefined;
    addPosition = undefined;
    closeSurface();
  }, true);

  legacyToolbar.replaceWith(toolbar);
  rawSections?.remove();
  if (duplicateFrames) {
    duplicateFrames.hidden = true;
    duplicateFrames.removeAttribute("aria-label");
    duplicateFrames.dataset.flowDetailsSource = "true";
    workspace.append(duplicateFrames);
  }
  outline.remove();
  const projections = viewport.parentElement, status = projections?.previousElementSibling instanceof HTMLParagraphElement ? projections.previousElementSibling : undefined;
  projections?.classList.add("flow-canvas-viewport");
  viewport.style.position = "relative";
  if (status) { status.classList.add("flow-workspace-status"); viewport.append(status); }
  viewport.append(surface, cameraUi.minimap, ...(itemToolbar ? [itemToolbar] : []));
  canvas.style.removeProperty("width"); canvas.style.removeProperty("height");
  viewport.tabIndex = 0; viewport.setAttribute("aria-label", "Flow canvas viewport");
  viewport.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown");
  queueMicrotask(() => workspace.scrollIntoView({ block: "start", inline: "nearest" }));
  cameraUi.setMinimapVisible(view.minimap);
  if (view.cameraInitialized) cameraUi.apply(view.camera);
  else cameraUi.fitFlow();
  if (view.surface) {
    showSurface(view.surface);
    if (view.surface === "details") queueMicrotask(() => restoreFlowDetailsCommit(workspaceKey, surface));
  }
  if (pendingMenu && itemMenu && pendingMenu.kind === itemKind && pendingMenu.id === itemId) {
    const attribute = itemKind === "page" ? "data-page-frame-id" : itemKind === "event" ? "data-occurrence-id" : itemKind === "relationship" ? "data-relationship-id" : "data-flow-section-id";
    const invoker = canvas.querySelector<HTMLElement>(`[${attribute}="${CSS.escape(itemId!)}"]`);
    if (invoker) showItemMenu(invoker, itemMenu, pendingMenu.request, `${itemKind} actions`);
  }
  document.body.classList.toggle("flow-focus-canvas", view.focusCanvas);
}
