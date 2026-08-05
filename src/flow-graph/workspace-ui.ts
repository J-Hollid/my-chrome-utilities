import { clientPointToFlowPoint, openFlowSurface, type FlowPoint, type FlowWorkspaceSurface, type FlowWorkspaceView } from "./workspace.js";
import { installFlowCamera } from "./workspace-camera-ui.js";
import { flowControl, renderedElementBounds } from "./workspace-dom.js";
import { prepareFlowOutline } from "./workspace-outline-ui.js";
import { installFlowSections } from "./workspace-section-ui.js";
import { createFlowTidyPanel } from "./workspace-tidy-ui.js";
import { flowWorkspaceView, rememberFlowInvoker, restoreFlowInvoker, saveFlowWorkspaceView } from "./workspace-view-state.js";

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

function decorateCompactCards(canvas: SVGSVGElement, duplicateFrames?: HTMLElement, outline?: HTMLOListElement): void {
  for (const card of Array.from(duplicateFrames?.querySelectorAll<HTMLElement>("[data-page-frame-id]") ?? [])) {
    const frameId = card.dataset.pageFrameId;
    const group = frameId ? canvas.querySelector<SVGGElement>(`[data-page-frame-id="${CSS.escape(frameId)}"]`) : undefined;
    if (!group || group.querySelector(".flow-page-source")) continue;
    const source = card.querySelector<HTMLInputElement>('[aria-label^="Name in this Flow for "]')?.getAttribute("aria-label")?.replace("Name in this Flow for ", "") ?? "Page";
    const status = card.querySelector<HTMLDetailsElement>("[data-example-status]")?.dataset.exampleStatus ?? "Incomplete";
    const provenance = document.createElementNS(canvas.namespaceURI, "text"), readiness = document.createElementNS(canvas.namespaceURI, "text");
    provenance.setAttribute("x", "14"); provenance.setAttribute("y", "54"); provenance.classList.add("flow-page-source"); provenance.textContent = source;
    readiness.setAttribute("x", "14"); readiness.setAttribute("y", "76"); readiness.classList.add("flow-readiness"); readiness.textContent = status;
    group.classList.add("flow-page-card"); group.append(provenance, readiness);
    group.setAttribute("aria-label", `${group.getAttribute("aria-label") ?? "Page frame"}. Source Page ${source}. ${status}.`);
  }
  for (const row of Array.from(outline?.querySelectorAll<HTMLElement>("[data-occurrence-id]") ?? [])) {
    const occurrenceId = row.dataset.occurrenceId;
    const group = occurrenceId ? canvas.querySelector<SVGGElement>(`[data-occurrence-id="${CSS.escape(occurrenceId)}"]`) : undefined;
    if (!group || group.querySelector(".flow-readiness")) continue;
    const status = row.querySelector<HTMLDetailsElement>("[data-example-status]")?.dataset.exampleStatus ?? "Incomplete";
    const readiness = document.createElementNS(canvas.namespaceURI, "text");
    readiness.setAttribute("x", "12"); readiness.setAttribute("y", "76"); readiness.classList.add("flow-readiness"); readiness.textContent = status;
    group.append(readiness); group.setAttribute("aria-label", `${group.getAttribute("aria-label") ?? "Event occurrence"}. ${status}.`);
  }
  const frames = Array.from(canvas.querySelectorAll<SVGGraphicsElement>("g[data-page-frame-id]"))
    .filter((candidate) => !candidate.dataset.occurrenceId)
    .flatMap((item) => {
      const bounds = renderedElementBounds(item);
      return bounds && item.dataset.pageFrameId ? [{ id: item.dataset.pageFrameId, bounds }] : [];
    });
  for (const occurrence of Array.from(canvas.querySelectorAll<SVGGraphicsElement>("[data-occurrence-id]"))) {
    const bounds = renderedElementBounds(occurrence);
    const frame = bounds && frames.find(({ bounds: candidate }) =>
      bounds.x >= candidate.x && bounds.y >= candidate.y
      && bounds.x + bounds.width <= candidate.x + candidate.width
      && bounds.y + bounds.height <= candidate.y + candidate.height);
    if (!frame) continue;
    occurrence.dataset.pageFrameId = frame.id;
    const occurrenceId = occurrence.dataset.occurrenceId;
    if (occurrenceId) outline?.querySelector<HTMLElement>(`[data-occurrence-id="${CSS.escape(occurrenceId)}"]`)?.setAttribute("data-page-frame-id", frame.id);
  }
}

export function upgradeFlowWorkspace(root: HTMLElement): void {
  const found = elements(root);
  if (!found || found.workspace.dataset.canvasFirstR02 === "true") return;
  const { workspace, legacyToolbar, viewport, canvas, outline, rawSections, duplicateFrames, actions, relationship } = found;
  workspace.dataset.canvasFirstR02 = "true";
  const flowId = workspace.dataset.flowSectionWorkspace ?? "flow";
  const projectId = rawSections?.dataset.flowProjectId ?? workspace.dataset.flowProjectId ?? "project";
  let view = flowWorkspaceView(projectId, flowId), emptyDrop: EmptyConnectionDrop | undefined, addPosition: FlowPoint | undefined;
  const toolbar = document.createElement("nav"), surface = document.createElement("section"), surfaceHeading = document.createElement("h4"), surfaceBody = document.createElement("div");
  const detailsSource = duplicateFrames?.querySelector<HTMLElement>('[aria-pressed="true"]') ?? duplicateFrames?.querySelector<HTMLElement>(".is-selected") ?? undefined;
  const selectedOutline = outline.querySelector<HTMLElement>(".is-selected") ?? undefined;
  const parked = document.createDocumentFragment(), detailsParents = new Map<Node, Node>();
  if (detailsSource && duplicateFrames) detailsParents.set(detailsSource, duplicateFrames);
  if (selectedOutline) detailsParents.set(selectedOutline, outline);
  if (relationship) detailsParents.set(relationship, parked);

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
    save(camera) { saveView({ ...view, camera }); },
  });
  const sectionUi = installFlowSections({ root, canvas, viewport, camera: () => view.camera, closeSurface });

  toolbar.className = "flow-workspace-toolbar";
  toolbar.setAttribute("aria-label", "Flow toolbar");
  surface.className = "flow-workspace-surface";
  surface.setAttribute("aria-label", "Flow contextual surface");
  surface.hidden = true;
  Object.assign(surface.style, { position: "absolute", boxSizing: "border-box", overflow: "auto" });
  surfaceHeading.textContent = "Flow tools";
  surface.append(surfaceHeading, close, surfaceBody);

  const restoreDetailsNodes = (): void => {
    for (const [node, parent] of detailsParents) if (node.parentNode === surfaceBody) parent.appendChild(node);
  };
  const placeSurface = (client?: FlowPoint): void => {
    const rect = viewport.getBoundingClientRect(), width = Math.min(380, Math.max(280, rect.width - 12)), height = Math.max(180, rect.height - 12);
    const left = client ? Math.max(6, Math.min(rect.width - width - 6, client.x - rect.left)) : Math.max(6, rect.width - width - 6);
    const top = client ? Math.max(6, Math.min(rect.height - 180, client.y - rect.top)) : 6;
    Object.assign(surface.style, { left: `${left}px`, top: `${top}px`, right: "auto", width: `${width}px`, maxWidth: "calc(100% - 12px)", maxHeight: `${height}px` });
  };
  const addContents = (): Node[] => {
    const pageCatalog = legacyToolbar.querySelector<HTMLElement>('[aria-label="Pages catalog"]'), eventCatalog = legacyToolbar.querySelector<HTMLElement>('[aria-label="Events catalog"]');
    return [sectionUi.addPanel(), ...(pageCatalog ? [pageCatalog] : []), ...(eventCatalog ? [eventCatalog] : [])];
  };
  const detailsContents = (): Node[] => [
    ...(relationship ? [relationship] : []), ...(detailsSource ? [detailsSource] : []), ...(selectedOutline ? [selectedOutline] : []),
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
    if (kind) placeSurface(client);
    else restoreFlowInvoker(projectId, flowId);
  }
  const surfaceButton = (label: string, kind: FlowWorkspaceSurface): HTMLButtonElement => {
    const result = flowControl(label, () => showSurface(view.surface === kind ? undefined : kind, result));
    result.dataset.flowSurface = kind;
    result.setAttribute("aria-expanded", String(view.surface === kind));
    return result;
  };

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
  const minimapToggle = flowControl("Minimap", () => {
    saveView({ ...view, minimap: !view.minimap });
    cameraUi.setMinimapVisible(view.minimap);
    minimapToggle.setAttribute("aria-pressed", String(view.minimap));
  });
  minimapToggle.setAttribute("aria-pressed", String(view.minimap));
  toolbar.append(skip, add, outlineButton, details, tidy, focusCanvas, ...cameraUi.controls, minimapToggle);

  decorateCompactCards(canvas, duplicateFrames, outline);
  if (actions?.getAttribute("aria-label")?.includes("Page instance")) {
    actions.classList.add("flow-contextual-toolbar");
    const rename = flowControl("Rename in Flow", () => { showSurface("details", rename); detailsSource?.querySelector<HTMLInputElement>('[aria-label^="Name in this Flow"]')?.focus(); });
    const addEvent = flowControl("Add Event", () => showSurface("add", addEvent));
    const duplicate = flowControl("Duplicate", () => detailsSource?.querySelector<HTMLButtonElement>('button[data-flow-duplicate-frame],button:nth-last-child(2)')?.click());
    const openDetails = flowControl("Details", () => showSurface("details", openDetails));
    actions.prepend(rename, addEvent, duplicate, openDetails);
  }
  if (actions?.getAttribute("aria-label")?.includes("Event occurrence")) {
    actions.classList.add("flow-contextual-toolbar");
    const openDetails = flowControl("Details", () => showSurface("details", openDetails));
    actions.prepend(openDetails);
  }
  if (relationship && actions) {
    actions.classList.add("flow-contextual-toolbar");
    actions.setAttribute("aria-label", "Selected relationship actions");
    const edit = flowControl("Edit documentation", () => showSurface("details", edit));
    const remove = relationship.querySelector<HTMLButtonElement>('button[aria-label^="Delete relationship"]');
    actions.append(edit, ...(remove ? [remove] : []));
  }
  const selectedSection = Array.from(canvas.querySelectorAll<SVGGraphicsElement>("g[data-flow-section-id].is-selected")).find((candidate) => candidate.querySelector(":scope > [data-section-dropzone]"));
  const sectionActions = selectedSection ? sectionUi.actions(selectedSection) : undefined;

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
    if (label === "Open schema contribution") {
      saveView(openFlowSurface(view, "details"));
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
  outline.remove(); relationship?.remove();
  const projections = viewport.parentElement, status = projections?.previousElementSibling instanceof HTMLParagraphElement ? projections.previousElementSibling : undefined;
  projections?.classList.add("flow-canvas-viewport");
  viewport.style.position = "relative";
  if (status) { status.classList.add("flow-workspace-status"); viewport.append(status); }
  viewport.append(surface, cameraUi.minimap, ...(actions ? [actions] : []), ...(sectionActions ? [sectionActions] : []));
  canvas.style.removeProperty("width"); canvas.style.removeProperty("height");
  viewport.tabIndex = 0; viewport.setAttribute("aria-label", "Flow canvas viewport");
  queueMicrotask(() => workspace.scrollIntoView({ block: "start", inline: "nearest" }));
  cameraUi.setMinimapVisible(view.minimap); cameraUi.apply(view.camera);
  if (view.surface) showSurface(view.surface);
  document.body.classList.toggle("flow-focus-canvas", view.focusCanvas);
}
