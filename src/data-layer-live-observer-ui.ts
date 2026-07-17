import {
  dataLayerViews,
  filteredLiveEvents,
  type DataLayerView,
  type LiveEvent,
  type LiveObserverState,
} from "./data-layer-live-observer.js";
import {
  runLiveInspectorAction,
  type LiveInspectorActions,
} from "./data-layer-live-inspector-actions.js";
import {
  eventPathname,
  pathnameVisits,
  resolveFeedSummaries,
} from "./data-layer-event-feed-summaries.js";
import { liveResponsiveLayout } from "./data-layer-live-responsive-layout.js";
import {
  buildValidationPropertyTree,
  applyArrayValidationRollups,
  presentValidationPropertyTree,
  propertyValidationSummary,
  validationVisual,
  type ValidationEvaluation,
  type ValidationPropertyNode,
} from "./utilities/data-layer/schemas.js";
import { buildRecursivePropertyTree, parseTargetExpression, type RecursivePropertyNode } from "./utilities/data-layer/schemas.js";
import { resolvePropertyDocumentation, schemaDocumentationSearchText, type ResolvedSchemaDocumentation } from "./utilities/data-layer/schemas.js";
import { allowedValueExpansionAvailability } from "./utilities/data-layer/schemas.js";

export interface LiveObserverElements {
  livePanel: HTMLElement | null;
  viewList: HTMLElement | null;
  sessionMessage: HTMLElement | null;
  sourceStatuses: HTMLElement | null;
  eventFeed: HTMLElement | null;
  eventList: HTMLElement | null;
  eventInspector: HTMLElement | null;
  backToEventsButton: HTMLButtonElement | null;
  pauseCaptureButton: HTMLButtonElement | null;
  resumeCaptureButton: HTMLButtonElement | null;
}
export interface LiveInspectorPresentationOptions {
  showNonApplicableProperties?: boolean;
}

export function findLiveObserverElements(
  root: ParentNode = document,
): LiveObserverElements {
  return {
    livePanel: root.querySelector<HTMLElement>("#data-layer-panel-live"),
    viewList: root.querySelector<HTMLElement>("#data-layer-views"),
    sessionMessage: root.querySelector<HTMLElement>("#live-session-message"),
    sourceStatuses: root.querySelector<HTMLElement>("#live-source-statuses"),
    eventFeed: root.querySelector<HTMLElement>("#live-event-feed"),
    eventList: root.querySelector<HTMLElement>("#live-event-list"),
    eventInspector: root.querySelector<HTMLElement>("#live-event-inspector"),
    backToEventsButton: root.querySelector<HTMLButtonElement>("#back-to-events"),
    pauseCaptureButton: root.querySelector<HTMLButtonElement>("#pause-capture"),
    resumeCaptureButton: root.querySelector<HTMLButtonElement>("#resume-capture"),
  };
}

export function renderDataLayerView(
  elements: LiveObserverElements,
  view: DataLayerView,
  focus = false,
): void {
  for (const candidate of dataLayerViews) {
    const button = elements.viewList?.querySelector<HTMLButtonElement>(
      `#data-layer-view-${candidate.toLowerCase()}`,
    );
    const panel = document.querySelector<HTMLElement>(
      `#data-layer-panel-${candidate.toLowerCase()}`,
    );
    const selected = candidate === view;
    if (button) {
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (focus && selected) button.focus();
    }
    if (panel) panel.hidden = !selected;
  }
}

function eventRow(
  event: LiveEvent,
  selected: boolean,
  openEvent: (eventId: string) => void,
): HTMLLIElement {
  const item = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.eventId = event.id;
  const sourceName = event.sourceName ?? event.sourceId;
  const summaries = resolveFeedSummaries(event);
  const pathname = eventPathname(event.pageUrl);
  const compactTime = event.captureTime.includes("T") ? event.captureTime.slice(11, 19) : event.captureTime;
  const summaryText = summaries.map(({ label, value }) => `${label} ${String(value)}`).join(", ");
  const validation = event.validation ?? "Not checked";
  const visual = validationVisual(validation);
  button.setAttribute(
    "aria-label",
    [event.name, compactTime, sourceName, pathname, validation, summaryText].filter(Boolean).join(", "),
  );
  button.setAttribute("aria-pressed", String(selected));
  button.dataset.validationTreatment = visual.treatment;
  const identity = document.createElement("span"); identity.className = "live-event-row-identity"; identity.textContent = [event.name, compactTime, sourceName].filter(Boolean).join(" · ");
  const badge = document.createElement("span"); badge.className = "live-validation-badge"; badge.dataset.symbol = visual.symbolName; badge.setAttribute("aria-label", validation); badge.textContent = ` · ${visual.badgeText}`;
  const summary = document.createElement("span"); summary.className = "live-event-row-summary"; summary.textContent = summaryText ? ` · ${summaryText}` : "";
  const triage = document.createElement("span"); triage.className = "live-defect-triage-badge"; triage.textContent = event.defectTriage ? ` · ${event.defectTriage.state}` : "";
  button.append(identity, badge, triage, summary);
  button.addEventListener("click", () => openEvent(event.id));
  item.append(button);
  return item;
}

function visitHeader(pathname: string, events: readonly LiveEvent[]): HTMLHeadingElement {
  const heading = document.createElement("h5");
  heading.className = "pathname-visit-heading";
  const latest = events[0]?.captureTime ?? "Unknown";
  heading.setAttribute("aria-label", `${pathname}, Latest ${latest}, Events ${events.length}`);
  const pathnameText = document.createElement("span");
  pathnameText.className = "pathname-visit-path";
  pathnameText.textContent = pathname;
  const latestLabel = document.createElement("span");
  latestLabel.className = "pathname-visit-latest";
  latestLabel.textContent = `Latest ${latest}`;
  const eventCount = document.createElement("span");
  eventCount.className = "pathname-visit-count";
  eventCount.textContent = `Events ${events.length}`;
  heading.append(pathnameText, latestLabel, eventCount);
  return heading;
}

export function renderLiveObserverState(
  elements: LiveObserverElements,
  state: LiveObserverState,
  openEvent: (eventId: string) => void,
): void {
  elements.livePanel?.setAttribute(
    "data-live-layout",
    liveResponsiveLayout(state, globalThis.innerWidth),
  );
  if (elements.sourceStatuses) {
    elements.sourceStatuses.replaceChildren(
      ...state.sources.map((source) => {
        const item = document.createElement("li");
        item.textContent = source.name;
        return item;
      }),
    );
  }
  elements.eventFeed?.replaceChildren(...pathnameVisits(filteredLiveEvents(state)).map((visit, index) => {
    const group = document.createElement("li");
    group.className = "pathname-visit";
    const heading = visitHeader(visit.pathname, visit.events);
    heading.id = `pathname-visit-heading-${index}`;
    group.setAttribute("aria-labelledby", heading.id);
    const rows = document.createElement("ul");
    rows.replaceChildren(...visit.events.map((event) => eventRow(event, event.id === state.inspectorEventId, openEvent)));
    group.append(heading, rows);
    return group;
  }));
  if (elements.eventList) elements.eventList.hidden = !state.listVisible;
  if (elements.eventInspector) {
    elements.eventInspector.hidden = !state.inspectorEventId;
  }
  if (elements.backToEventsButton) {
    elements.backToEventsButton.hidden = state.listVisible;
  }
}

function evaluationText(evaluation: ValidationEvaluation): string {
  if (evaluation.status === "not-applicable") return `${evaluation.message} · rule ${evaluation.rule} v${evaluation.ruleVersion} · ${evaluation.schemaName} v${evaluation.schemaVersion}`;
  return `${evaluation.message} · expected ${evaluation.expected} · actual ${evaluation.actual} · rule ${evaluation.rule} v${evaluation.ruleVersion} · severity ${evaluation.severity} · ${evaluation.schemaName} v${evaluation.schemaVersion}`;
}

function propertyStatusSymbol(symbol: string): string {
  return symbol === "check" ? "✓" : symbol === "warning" ? "⚠" : symbol === "error" ? "!" : "○";
}

function revealLiveProperty(path: string): void {
  const target = document.querySelector<HTMLElement>(`.live-validation-property[data-property-path="${CSS.escape(path)}"]`);
  if (!target) return;
  const concretePrefixes = new Set(path.split("/").slice(1, -1).map((_, index, parts) => `/${parts.slice(0, index + 1).join("/")}`));
  const wildcardPrefixes = new Set([...concretePrefixes].map((prefix) => prefix.replace(/\/\d+(?=\/|$)/g, "/*")));
  const propertyList = target.closest("#live-validation-properties");
  for (const disclosure of Array.from(propertyList?.querySelectorAll<HTMLDetailsElement>("details[data-property-path]") ?? [])) {
    const disclosurePath = disclosure.dataset.propertyPath ?? "";
    const affectedBase = disclosurePath.endsWith("#affected") ? disclosurePath.slice(0, -"#affected".length) : undefined;
    if (concretePrefixes.has(disclosurePath) || wildcardPrefixes.has(disclosurePath)
        || (affectedBase && (path === affectedBase || path.startsWith(`${affectedBase}/`)))) disclosure.open = true;
  }
  let ancestor = target.parentElement?.closest<HTMLDetailsElement>("details");
  while (ancestor) { ancestor.open = true; ancestor = ancestor.parentElement?.closest<HTMLDetailsElement>("details"); }
  target.focus({ preventScroll:false });
}

function renderPropertyNode(
  node: ValidationPropertyNode,
  addValidation?: (path: string, trigger: HTMLButtonElement) => void,
  schemaDocumentation?: ResolvedSchemaDocumentation,
  expandAllowedValue?: (evaluation: ValidationEvaluation, trigger: HTMLButtonElement) => void,
  addToSchema?: (path: string, trigger: HTMLButtonElement) => void,
  declaration?: (path: string) => { destination?: string; alreadyDeclared?: boolean },
): HTMLLIElement {
  const item = document.createElement("li"); item.className = "live-validation-property"; item.id = `live-property-${node.path.replace(/[^a-z0-9]+/gi, "-")}`; item.tabIndex = -1; item.dataset.validationTreatment = node.summary.treatment;
  item.dataset.propertyPath = node.technicalPath ?? node.path;
  if (node.expression) item.dataset.propertyExpression = node.expression;
  const row = document.createElement("div"); row.className = "live-validation-property-row";
  const name = document.createElement("code"); name.textContent = node.name;
  const documentation = schemaDocumentation ? resolvePropertyDocumentation(schemaDocumentation, node.technicalPath ?? node.path) : undefined;
  if (documentation) row.dataset.documentationSearch = schemaDocumentationSearchText(node.technicalPath ?? node.path, documentation);
  const displayName = document.createElement("span"); displayName.className = "live-property-display-name"; displayName.textContent = documentation?.displayName ?? "";
  const value = document.createElement("span"); value.textContent = node.valueLabel; if (node.missing) value.dataset.missing = "true";
  const status = document.createElement("button"); status.type = "button"; status.className = "live-property-status"; status.id = `${item.id}-status`; status.setAttribute("aria-expanded", "false"); status.textContent = `${propertyStatusSymbol(node.summary.symbolName)} ${node.summary.status}`;
  const preview = document.createElement("div"); preview.className = "live-property-issue-preview"; preview.id = `${item.id}-preview`; preview.setAttribute("role", "tooltip"); preview.hidden = true;
  preview.tabIndex = 0;
  const primary = node.evaluations.find(({ status: state }) => state === "error") ?? node.evaluations.find(({ status: state }) => state === "warning") ?? node.evaluations[0];
  preview.textContent = primary ? evaluationText(primary) : node.summary.status;
  status.setAttribute("aria-describedby", preview.id);
  const disclosure = document.createElement("section"); disclosure.className = "live-property-rule-details"; disclosure.hidden = true;
  disclosure.setAttribute("aria-label", `${node.path} rule evaluations`);
  const evaluationList = document.createElement("ul"); evaluationList.replaceChildren(...node.evaluations.map((evaluation) => {
    const item = document.createElement("li"); item.textContent = `${evaluation.status}: ${evaluationText(evaluation)}`;
    if (expandAllowedValue && allowedValueExpansionAvailability(evaluation).available) {
      const add = document.createElement("button"); add.type = "button"; add.className = "live-allowed-value-expansion";
      add.id = `live-allowed-value-${(evaluation.ruleId ?? "rule").replace(/[^a-z0-9]+/gi, "-")}`;
      add.textContent = "Add this value to schema as an allowed value";
      add.dataset.ruleId = evaluation.ruleId ?? ""; add.dataset.ruleVersion = String(evaluation.ruleVersion);
      add.addEventListener("click", () => expandAllowedValue(evaluation, add)); item.append(add);
    }
    return item;
  }));
  disclosure.append(evaluationList);
  let previewHovered = false;
  const showPreview = () => { if (primary) preview.hidden = false; };
  const hidePreview = () => { if (!previewHovered && document.activeElement !== status && document.activeElement !== preview) preview.hidden = true; };
  status.addEventListener("pointerenter", showPreview); status.addEventListener("pointerleave", () => globalThis.setTimeout(hidePreview, 0));
  status.addEventListener("focus", showPreview); status.addEventListener("blur", () => globalThis.setTimeout(hidePreview, 0));
  preview.addEventListener("pointerenter", () => { previewHovered = true; }); preview.addEventListener("pointerleave", () => { previewHovered = false; hidePreview(); });
  preview.addEventListener("focus", showPreview); preview.addEventListener("blur", hidePreview);
  preview.addEventListener("keydown", (event) => { if (event.key === "Escape") { preview.hidden = true; status.focus({ preventScroll:true }); event.preventDefault(); } });
  status.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { preview.hidden = true; event.preventDefault(); return; }
    if (event.key !== "Enter" && event.key !== " ") return;
    status.click(); event.preventDefault();
  });
  status.addEventListener("click", () => { disclosure.hidden = !disclosure.hidden; status.setAttribute("aria-expanded", String(!disclosure.hidden)); });
  row.append(name, ...(documentation?.displayName ? [displayName] : []), value, status);
  if (documentation) {
    const information = document.createElement("button"); information.type = "button"; information.className = "live-property-documentation-control"; information.textContent = "Information";
    const documentationId = `${item.id}-documentation`; const previewId = `${documentationId}-preview`;
    information.setAttribute("aria-label", `Information for ${documentation.displayName || node.name}`); information.setAttribute("aria-describedby", previewId); information.setAttribute("aria-expanded", "false");
    const documentationPreview = document.createElement("div"); documentationPreview.id = previewId; documentationPreview.className = "live-property-documentation-preview"; documentationPreview.setAttribute("role", "tooltip"); documentationPreview.hidden = true; documentationPreview.textContent = documentation.description;
    const persistent = document.createElement("section"); persistent.id = documentationId; persistent.className = "live-property-documentation-details"; persistent.hidden = true; persistent.tabIndex = -1; persistent.setAttribute("aria-label", `${documentation.displayName || node.name} documentation`);
    const persistentDescription = document.createElement("p"); persistentDescription.textContent = documentation.description;
    const comments = document.createElement("p"); comments.className = "live-property-documentation-comments"; comments.textContent = documentation.comments ? `Comments: ${documentation.comments}` : ""; comments.hidden = !documentation.comments;
    const example = document.createElement("p"); example.textContent = documentation.example ? `Example value: ${String(documentation.example.value)}` : ""; example.hidden = !documentation.example;
    const provenance = document.createElement("p"); provenance.textContent = `${documentation.origin.name} revision ${documentation.origin.version}${documentation.inherited ? " · inherited" : " · local"}`;
    persistent.append(persistentDescription, comments, example, provenance);
    const showDocumentationPreview = () => { if (persistent.hidden) documentationPreview.hidden = false; };
    const hideDocumentationPreview = () => { if (document.activeElement !== information) documentationPreview.hidden = true; };
    information.addEventListener("pointerenter", showDocumentationPreview); information.addEventListener("pointerleave", () => globalThis.setTimeout(hideDocumentationPreview, 0));
    information.addEventListener("focus", showDocumentationPreview); information.addEventListener("blur", () => globalThis.setTimeout(hideDocumentationPreview, 0));
    const closePersistent = () => { persistent.hidden = true; information.setAttribute("aria-expanded", "false"); information.focus({ preventScroll:true }); };
    information.addEventListener("click", () => { persistent.hidden = !persistent.hidden; documentationPreview.hidden = true; information.setAttribute("aria-expanded", String(!persistent.hidden)); if (!persistent.hidden) persistent.focus({ preventScroll:true }); });
    information.addEventListener("keydown", (event) => { if (event.key === "Escape") { closePersistent(); event.preventDefault(); } });
    persistent.addEventListener("keydown", (event) => { if (event.key === "Escape") { closePersistent(); event.preventDefault(); } });
    row.append(information); item.append(documentationPreview, persistent);
  }
  if (addValidation) { const add = document.createElement("button"); add.type = "button"; add.textContent = "Add validation"; add.className = "live-property-add-validation"; add.dataset.action = "add-property-validation"; add.dataset.propertyPath = node.technicalPath ?? node.path; add.setAttribute("aria-label", `Add validation for ${node.technicalPath ?? node.path}`); add.addEventListener("click", () => addValidation(node.technicalPath ?? node.path, add)); row.append(add); }
  const declarationState = declaration?.(node.technicalPath ?? node.path);
  if (declarationState?.alreadyDeclared) {
    const destination = declarationState.destination ?? "schema";
    const declared = document.createElement("button"); declared.type = "button"; declared.className = "live-property-declared"; declared.textContent = `Already declared in ${destination}`; declared.dataset.action = "add-property-to-schema"; declared.dataset.propertyPath = node.technicalPath ?? node.path; declared.setAttribute("aria-disabled", "true"); declared.setAttribute("aria-label", `${node.technicalPath ?? node.path} is already declared in ${destination}`); row.append(declared);
  } else if (addToSchema) {
    const destination = declarationState?.destination ?? "schema";
    const add = document.createElement("button"); add.type = "button"; add.textContent = "Add to schema"; add.className = "live-property-add-to-schema"; add.dataset.action = "add-property-to-schema"; add.dataset.propertyPath = node.technicalPath ?? node.path; add.setAttribute("aria-label", `Add ${node.technicalPath ?? node.path} to ${destination}`); add.addEventListener("click", () => addToSchema(node.technicalPath ?? node.path, add)); row.append(add);
  }
  if (node.aggregate.errors || node.aggregate.warnings) {
    const aggregate = document.createElement(node.rollup?.affectedPaths.length ? "button" : "span"); aggregate.className = "live-property-aggregate";
    const counts = [node.aggregate.errors ? `${node.aggregate.errors} error${node.aggregate.errors === 1 ? "" : "s"}` : "", node.aggregate.warnings ? `${node.aggregate.warnings} warning${node.aggregate.warnings === 1 ? "" : "s"}` : ""].filter(Boolean).join(" and ");
    aggregate.textContent = node.rollup ? `${counts} in ${node.rollup.affectedItemCount} of ${node.rollup.totalItemCount} items${node.name === "Every item" ? ` · ${node.rollup.ruleCount} wildcard-scoped rule${node.rollup.ruleCount === 1 ? "" : "s"}` : ""}` : counts;
    if (aggregate instanceof HTMLButtonElement) { aggregate.type = "button"; aggregate.setAttribute("aria-label", `${node.name} aggregate status: ${aggregate.textContent}`); aggregate.addEventListener("click", () => revealLiveProperty(node.rollup!.affectedPaths[0]!)); }
    row.append(aggregate);
  }
  item.append(row, preview, disclosure);
  if (node.children.length) {
    const nested = document.createElement("details"); const nestedSummary = document.createElement("summary"); nestedSummary.textContent = `Expand ${node.name}`;
    nested.dataset.propertyPath = node.technicalPath ?? node.path;
    const list = document.createElement("ul"); list.replaceChildren(...node.children.map((child) => renderPropertyNode(child, addValidation, schemaDocumentation, expandAllowedValue, addToSchema, declaration))); nested.append(nestedSummary, list); item.append(nested);
  }
  if (node.affectedItems?.length) { const affected = document.createElement("details"); affected.className = "live-property-affected-items"; affected.dataset.propertyPath = `${node.technicalPath ?? node.path}#affected`; const summary = document.createElement("summary"); summary.textContent = `Affected items (${node.affectedItems.length})`; const list = document.createElement("ul"); list.replaceChildren(...node.affectedItems.map((child) => renderPropertyNode(child, addValidation, schemaDocumentation, expandAllowedValue, addToSchema, declaration))); affected.append(summary, list); item.append(affected); }
  if (node.specificItems?.length) { const specific = document.createElement("details"); specific.className = "live-property-specific-items"; specific.dataset.propertyPath = `${node.technicalPath ?? node.path}#specific`; const summary = document.createElement("summary"); summary.textContent = "Specific items"; const list = document.createElement("ul"); list.replaceChildren(...node.specificItems.map((child) => renderPropertyNode(child, addValidation, schemaDocumentation, expandAllowedValue, addToSchema, declaration))); specific.append(summary, list); item.append(specific); }
  return item;
}

function recursiveValidationTree(payload: unknown, evaluations: readonly ValidationEvaluation[], issues: NonNullable<LiveEvent["validationDetails"]>["issues"]): ValidationPropertyNode[] {
  const legacyRoots = buildValidationPropertyTree(payload, evaluations, issues);
  const legacyByPath = new Map<string, ValidationPropertyNode>();
  const indexLegacy = (node: ValidationPropertyNode): void => { legacyByPath.set(node.path, node); node.children.forEach(indexLegacy); };
  legacyRoots.forEach(indexLegacy);
  const copyLegacy = (node: ValidationPropertyNode): ValidationPropertyNode => {
    const children = node.children.map(copyLegacy);
    const aggregate = children.reduce((counts, child) => ({ errors:counts.errors + child.summary.errors + child.aggregate.errors, warnings:counts.warnings + child.summary.warnings + child.aggregate.warnings }), { errors:0, warnings:0 });
    return { ...node, technicalPath:`/${node.path.replaceAll(".", "/")}`, expression:`$${node.path.split(".").map((segment) => `[${JSON.stringify(segment)}]`).join("")}`, children, specificItems:[], aggregate };
  };
  const convert = (node: RecursivePropertyNode): ValidationPropertyNode => {
    const normalized = parseTargetExpression(node.expression)
      .map((segment) => segment.kind === "property" ? segment.value : segment.kind === "every" ? "*" : String(segment.value))
      .join(".");
    const legacy = legacyByPath.get(normalized);
    const children = node.children.map(convert);
    if (!node.detectedTypes.includes("Array")) for (const child of legacy?.children ?? []) if (!children.some(({ path }) => path === child.path)) children.push(copyLegacy(child));
    const specificItems = node.specificItems.map(convert);
    const summary = legacy?.summary ?? propertyValidationSummary([]);
    const aggregate = legacy?.aggregate ?? children.reduce((counts, child) => ({ errors:counts.errors + child.summary.errors + child.aggregate.errors, warnings:counts.warnings + child.summary.warnings + child.aggregate.warnings }), { errors:0, warnings:0 });
    return { path:normalized, technicalPath:node.path, expression:node.expression, name:node.label, value:legacy?.value, valueLabel:[node.summary, node.assistance].filter(Boolean).join(" · "), missing:false, evaluations:legacy?.evaluations ?? [], summary, aggregate, children, specificItems, matchedValueCount:node.matchedValueCount, detectedTypes:node.detectedTypes, examples:node.examples, ...(node.zeroBasedIndex === undefined ? {} : { zeroBasedIndex:node.zeroBasedIndex }) };
  };
  const roots = buildRecursivePropertyTree(payload).map(convert);
  for (const legacy of legacyRoots) if (!roots.some(({ path }) => path === legacy.path)) roots.push(copyLegacy(legacy));
  return roots;
}

function renderEventLevelIssues(event: LiveEvent, actionHandlers: LiveInspectorActions): HTMLElement {
  const section = document.createElement("section"); section.id = "live-event-validation-issues"; section.setAttribute("aria-labelledby", "live-event-validation-issues-heading");
  const heading = document.createElement("h5"); heading.id = "live-event-validation-issues-heading"; heading.textContent = "Event-level issues";
  const list = document.createElement("ul");
  list.replaceChildren(...(event.validationDetails?.issues ?? []).map((issue, issueIndex) => {
    const item = document.createElement("li");
    const path = issue.instancePath.replace(/^\//, "").replaceAll("/", ".");
    const text = `${issue.templatePath ? `template ${issue.templatePath} · ` : ""}${issue.message} · rule ${issue.rule ?? "schema"} · severity ${issue.severity ?? "error"} · ${issue.origin ?? `${issue.schemaName} v${issue.schemaVersion}`} · expected ${issue.expected} · actual ${issue.actual}`;
    if (path) {
      const link = document.createElement("button"); link.type = "button"; link.textContent = `${path}: ${text}`; link.addEventListener("click", () => revealLiveProperty(issue.instancePath)); item.append(link);
    } else item.textContent = `Event: ${text}`;
    const issueTriage = event.defectTriage?.issueDetails[issueIndex];
    if (issueTriage?.state === "Reported") {
      for (const defect of issueTriage.defectLinks) {
        const reported = document.createElement("button"); reported.type = "button"; reported.className = "live-reported-defect-link"; reported.textContent = `Reported · ${defect.label}`;
        reported.dataset.issueIndex = String(issueIndex); reported.dataset.defectId = defect.id;
        reported.addEventListener("click", () => actionHandlers.openReportedDefect?.(defect.id, event, issueIndex, reported)); item.append(reported);
      }
    } else if (issueTriage) {
      const state = document.createElement("span"); state.className = "live-new-defect-state"; state.textContent = issueTriage.state; item.append(state);
      if (actionHandlers.startDefectReport) {
        const create = document.createElement("button"); create.type = "button"; create.textContent = "Create defect report"; create.addEventListener("click", () => actionHandlers.startDefectReport?.(event)); item.append(create);
      }
    }
    return item;
  }));
  section.append(heading, list); return section;
}

export function renderLiveInspector(
  elements: LiveObserverElements,
  event: LiveEvent,
  actionHandlers: LiveInspectorActions,
  presentation: LiveInspectorPresentationOptions = {},
): void {
  if (!elements.eventInspector) return;
  const priorScrollTop = elements.eventInspector.scrollTop;
  const priorOpenPaths = new Set(Array.from(elements.eventInspector.querySelectorAll<HTMLDetailsElement>("#live-validation-properties details[open][data-property-path]")).map(({ dataset }) => dataset.propertyPath ?? ""));
  const priorFocusedPropertyPath = document.activeElement instanceof HTMLElement
    && document.activeElement.classList.contains("live-validation-property")
    && elements.eventInspector.contains(document.activeElement)
    ? document.activeElement.dataset.propertyPath
    : undefined;
  elements.eventInspector.classList.add("live-detail-view");
  const inspectorHeader = document.createElement("header");
  inspectorHeader.className = "detail-view-header";
  const heading = document.createElement("h4");
  heading.textContent = event.name;
  if (elements.backToEventsButton) inspectorHeader.append(elements.backToEventsButton);
  inspectorHeader.append(heading);
  const source = document.createElement("p");
  source.textContent = `Source: ${event.sourceName ?? event.sourceId}`;
  const visual = validationVisual(event.validation ?? "Not checked");
  const status = document.createElement("output");
  status.id = "live-inspector-validation-summary"; status.dataset.validationTreatment = visual.treatment; status.textContent = visual.summary;
  const summary = document.createElement("dl");
  appendSummaryItem(summary, "Capture time", event.captureTime);
  appendSummaryItem(summary, "Page", event.pageUrl);
  appendSummaryItem(summary, "Destination", event.destination);
  appendSummaryItem(summary, "Validation", event.validation ?? "Not checked");
  if (event.validationDetails?.schema) appendSummaryItem(summary, "Assigned schema", `${event.validationDetails.schema.name} version ${event.validationDetails.schema.version}`);
  if (event.validationDetails?.documentation?.description) appendSummaryItem(summary, "Schema description", `${event.validationDetails.documentation.description} · ${event.validationDetails.documentation.descriptionOrigin?.name ?? event.validationDetails.schema?.name ?? "Schema"} revision ${event.validationDetails.documentation.descriptionOrigin?.version ?? event.validationDetails.schema?.version ?? "current"}`);
  appendSummaryItem(summary, "Provenance", event.provenance);

  const payload = document.createElement("section");
  payload.setAttribute("aria-label", "Properties");
  const payloadHeading = document.createElement("h5");
  payloadHeading.textContent = "Properties";
  const propertyList = document.createElement("ul"); propertyList.id = "live-validation-properties";
  const nonApplicableVisibility = document.createElement("button"); nonApplicableVisibility.type = "button"; nonApplicableVisibility.id = "live-non-applicable-properties";
  const searchLabel = document.createElement("label"); searchLabel.htmlFor = "live-property-search"; searchLabel.textContent = "Search properties"; const propertySearch = document.createElement("input"); propertySearch.id = "live-property-search"; propertySearch.type = "search";
  const propertyTree = recursiveValidationTree(event.payload, event.validationDetails?.evaluations ?? [], event.validationDetails?.issues ?? []);
  const addValidation = actionHandlers.addPropertyValidation ? (path: string, trigger: HTMLButtonElement) => actionHandlers.addPropertyValidation?.(event, path, trigger) : undefined;
  const addToSchema = actionHandlers.addPropertyToSchema ? (path: string, trigger: HTMLButtonElement) => actionHandlers.addPropertyToSchema?.(event, path, trigger) : undefined;
  const declaration = actionHandlers.propertyDeclaration ? (path: string) => actionHandlers.propertyDeclaration?.(event, path) ?? {} : undefined;
  const expandAllowedValue = actionHandlers.expandAllowedValue ? (evaluation: ValidationEvaluation, trigger: HTMLButtonElement) => actionHandlers.expandAllowedValue?.(event, evaluation, trigger) : undefined;
  let showNonApplicable = presentation.showNonApplicableProperties === true;
  const previousOpen = new Set<string>(); let searchActive = false;
  const applyPropertySearch = () => {
    const query = propertySearch.value.trim().toLowerCase();
    const disclosures = Array.from(propertyList.querySelectorAll<HTMLDetailsElement>("details"));
    if (query && !searchActive) for (const disclosure of disclosures) if (disclosure.hasAttribute("open")) previousOpen.add(disclosure.dataset.propertyPath ?? "");
    const terms = query.split(/\s+/).filter(Boolean);
    const rows = Array.from(propertyList.querySelectorAll<HTMLLIElement>(".live-validation-property"));
    const matches = query ? rows.filter((row) => {
      if (row.closest(".live-property-specific-items")) return false;
      const ownRow = Array.from(row.children).find((child) => child.classList.contains("live-validation-property-row"));
      const searchable = `${row.dataset.propertyPath ?? ""} ${ownRow?.textContent ?? ""} ${ownRow instanceof HTMLElement ? ownRow.dataset.documentationSearch ?? "" : ""}`.toLowerCase();
      return terms.every((term) => searchable.includes(term));
    }) : [];
    const visible = new Set<HTMLLIElement>(matches);
    for (const match of matches) {
      let parent = match.parentElement?.closest<HTMLLIElement>(".live-validation-property");
      while (parent) { visible.add(parent); parent = parent.parentElement?.closest<HTMLLIElement>(".live-validation-property"); }
    }
    for (const row of rows) row.hidden = Boolean(query) && !visible.has(row);
    for (const disclosure of disclosures) {
      if (query) disclosure.toggleAttribute("open", matches.some((row) => disclosure.contains(row)));
      else if (searchActive) disclosure.toggleAttribute("open", previousOpen.has(disclosure.dataset.propertyPath ?? ""));
    }
    searchActive = Boolean(query);
  };
  const renderProperties = () => {
    const openPaths = new Set(Array.from(propertyList.querySelectorAll<HTMLDetailsElement>("details[open][data-property-path]")).map(({ dataset }) => dataset.propertyPath ?? ""));
    payload.dataset.showNonApplicableProperties = String(showNonApplicable);
    nonApplicableVisibility.textContent = showNonApplicable ? "Hide non-applicable properties" : "Show non-applicable properties";
    nonApplicableVisibility.setAttribute("aria-pressed", String(showNonApplicable));
    propertyList.replaceChildren(...applyArrayValidationRollups(presentValidationPropertyTree(propertyTree, showNonApplicable), event.validationDetails?.evaluations ?? [])
      .map((node) => renderPropertyNode(node, addValidation, event.validationDetails?.documentation, expandAllowedValue, addToSchema, declaration)));
    for (const disclosure of Array.from(propertyList.querySelectorAll<HTMLDetailsElement>("details[data-property-path]"))) disclosure.toggleAttribute("open", openPaths.has(disclosure.dataset.propertyPath ?? ""));
    applyPropertySearch();
  };
  propertySearch.addEventListener("input", applyPropertySearch);
  nonApplicableVisibility.addEventListener("click", () => { showNonApplicable = !showNonApplicable; renderProperties(); });
  renderProperties();
  payload.append(payloadHeading, nonApplicableVisibility, searchLabel, propertySearch, propertyList);

  const rawJson = document.createElement("details"); rawJson.id = "live-raw-json";
  const rawJsonSummary = document.createElement("summary"); rawJsonSummary.textContent = "Raw JSON";
  const payloadValues = document.createElement("pre"); payloadValues.textContent = JSON.stringify(event.payload, null, 2);
  rawJson.append(rawJsonSummary, payloadValues);

  const raw = document.createElement("details");
  const rawSummary = document.createElement("summary");
  rawSummary.textContent = "Raw input";
  const rawValue = document.createElement("pre");
  rawValue.textContent = JSON.stringify(event.rawInput, null, 2);
  raw.append(rawSummary, rawValue);

  const actions = document.createElement("div");
  actions.className = "live-inspector-actions";
  const feedback = document.createElement("output");
  feedback.setAttribute("aria-live", "polite");
  feedback.id = "live-validation-update-status";
  const choices = actionHandlers.manualSchemaChoices?.(event) ?? [];
  const draftContinuation = actionHandlers.draftContinuation?.(event);
  if (choices.length) {
    const label = document.createElement("label"); label.textContent = "Manual schema override: ";
    const select = document.createElement("select"); select.id = "live-change-schema"; select.setAttribute("aria-label", "Change schema");
    select.append(Object.assign(document.createElement("option"), { value:"", textContent:"Automatic assignment" }), ...choices.map((choice) => Object.assign(document.createElement("option"), { value:choice.id, textContent:choice.label })));
    select.addEventListener("change", () => { actionHandlers.selectManualSchema?.(event.id, select.value || undefined); feedback.textContent = select.value ? "Manual schema override recorded." : "Automatic assignment restored."; });
    label.append(select); actions.append(label);
  }
  const actionCallbacks = {
    ...(event.validationDetails?.issues.length ? { "Show validation issues": async () => { const issues = elements.eventInspector?.querySelector<HTMLElement>("#live-event-validation-issues"); if (issues) { issues.hidden = !issues.hidden; if (!issues.hidden) issues.focus({ preventScroll:false }); } } } : {}),
    ...(event.validationDetails?.issues.length && actionHandlers.startDefectReport ? { "Create defect report": async () => actionHandlers.startDefectReport?.(event) } : {}),
    ...(actionHandlers.startOccurrenceDefectReport ? {
      "Report unexpected event": async () => actionHandlers.startOccurrenceDefectReport?.(event, "Unexpected event"),
      "Report wrong event name": async () => actionHandlers.startOccurrenceDefectReport?.(event, "Wrong event name"),
    } : {}),
    "Copy payload": async () => actionHandlers.copyPayload(event),
    "Save to Library": async () => actionHandlers.saveToLibrary(event),
    ...(actionHandlers.createSchema ? { "Create schema": async () => actionHandlers.createSchema?.(event) } : {}),
    [event.validation && event.validation !== "Not checked" ? "Revalidate" : "Validate"]: async () => actionHandlers.validate(event),
  } as const;
  for (const [label, callback] of Object.entries(actionCallbacks)) {
    const action = document.createElement("button");
    action.type = "button";
    action.textContent = label;
    action.id = `live-inspector-action-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    if (label === "Create defect report") action.setAttribute("aria-label", `Create defect report for ${event.name}`);
    if (label === "Report unexpected event" || label === "Report wrong event name") action.setAttribute("aria-label", `${label} for ${event.name}`);
    if (label === "Create validation from this event") action.dataset.action = "create-validation";
    action.dataset.actionVariant = label === "Copy payload" ? "quiet" : "secondary";
    const availability = label === "Validate" || label === "Revalidate"
      ? actionHandlers.validationAvailability(event)
      : { enabled: true };
    if (!availability.enabled) {
      action.disabled = true;
      action.setAttribute("aria-description", availability.reason ?? "Action unavailable");
      action.title = availability.reason ?? "Action unavailable";
    }
    action.addEventListener("click", () => {
      void runLiveInspectorAction(
        label,
        event,
        callback,
        (message) => { feedback.textContent = message; },
      );
    });
    actions.append(action);
  }
  if (draftContinuation) {
    const continuation = document.createElement("section"); continuation.id = "guided-draft-continuation"; continuation.setAttribute("aria-label", `${draftContinuation.schemaName} working draft`);
    const heading = document.createElement("h5"); heading.textContent = `${draftContinuation.schemaName} working draft`;
    const status = document.createElement("p"); status.textContent = `Current revision ${draftContinuation.schemaVersion} · ${draftContinuation.pendingChanges} pending changes`;
    const callbacks: readonly [string, () => void][] = [
      ["Review draft", draftContinuation.review],
      ["Publish revision", draftContinuation.publish],
      ["Use a different schema", draftContinuation.useDifferent],
    ];
    continuation.append(heading, status, ...callbacks.map(([label, callback]) => {
      const button = document.createElement("button"); button.type = "button"; button.textContent = label;
      button.addEventListener("click", callback); return button;
    }));
    actions.append(continuation);
  }
  actions.append(feedback);
  const issues = renderEventLevelIssues(event, actionHandlers); issues.tabIndex = -1;
  elements.eventInspector.replaceChildren(inspectorHeader, source, status, summary, issues, payload, rawJson, raw, actions);
  for (const disclosure of Array.from(propertyList.querySelectorAll<HTMLDetailsElement>("details[data-property-path]"))) disclosure.toggleAttribute("open", priorOpenPaths.has(disclosure.dataset.propertyPath ?? ""));
  if (priorFocusedPropertyPath) {
    const target = Array.from(propertyList.querySelectorAll<HTMLElement>(".live-validation-property[data-property-path]")).find(({ dataset }) => dataset.propertyPath === priorFocusedPropertyPath);
    if (target) {
      let ancestor = target.parentElement?.closest<HTMLDetailsElement>("details");
      while (ancestor) { ancestor.open = true; ancestor = ancestor.parentElement?.closest<HTMLDetailsElement>("details"); }
      target.focus({ preventScroll:true });
    }
  }
  elements.eventInspector.scrollTop = priorScrollTop;
}

function appendSummaryItem(
  summary: HTMLDListElement,
  label: string,
  value: string | undefined,
): void {
  if (!value) return;
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.dataset.field = label.toLowerCase();
  term.textContent = label;
  description.textContent = value;
  summary.append(term, description);
}

export function renderLiveSessionMessage(
  elements: LiveObserverElements,
  message: string,
): void {
  if (elements.sessionMessage) elements.sessionMessage.textContent = message;
}

export function setEventValidationUpdateStatus(elements: LiveObserverElements, message: string): void {
  const status = elements.eventInspector?.querySelector<HTMLElement>("#live-validation-update-status");
  if (status) status.textContent = message;
}

export function updateLiveInspectorValidation(
  elements: LiveObserverElements,
  validation: string,
  issues: readonly { instancePath: string; templatePath?: string; message: string; expected: string; actual: string; schemaName: string; schemaVersion: number; schemaLocation: string; rule?: string; severity?: string; origin?: string; conditionSummary?: string }[] = [],
  assignment?: { id?: string; name?: string; sourceId?: string; eventName?: string; target?: string; priority?: number; domainCondition?: string; pathnameCondition?: string; versionPolicy?: string; enabled?: boolean },
): void {
  const term = elements.eventInspector?.querySelector<HTMLElement>(
    'dt[data-field="validation"]',
  );
  const description = term?.nextElementSibling;
  if (description instanceof HTMLElement) description.textContent = validation;
  const existing = elements.eventInspector?.querySelector("[data-validation-details]");
  if (!issues.length) { existing?.remove(); return; }
  const details = document.createElement("section"); details.dataset.validationDetails = "true"; details.setAttribute("aria-label", "Validation details");
  const heading = document.createElement("h5"); heading.textContent = "Validation details";
  const list = document.createElement("ul");
  const assignmentDetails = assignment ? ` · assignment id ${assignment.id ?? "none"} · name ${assignment.name ?? "none"} · source ${assignment.sourceId ?? "any"} · event ${assignment.eventName ?? "any"} · target ${assignment.target ?? "automatic"} · priority ${assignment.priority ?? 0} · domain ${assignment.domainCondition ?? "any"} · pathname ${assignment.pathnameCondition ?? "any"} · policy ${assignment.versionPolicy ?? "pinned"} · ${assignment.enabled === false ? "disabled" : "enabled"}` : "";
  list.replaceChildren(...issues.map((issue) => Object.assign(document.createElement("li"), { textContent:`${issue.templatePath ? `template ${issue.templatePath} · ` : ""}${issue.instancePath || "root"} · ${issue.message} · expected ${issue.expected}, received ${issue.actual}${issue.conditionSummary ? ` · condition ${issue.conditionSummary}` : ""} · rule ${issue.rule ?? "schema"} · severity ${issue.severity ?? "error"} · ${issue.origin ?? `${issue.schemaName} v${issue.schemaVersion}`} · ${issue.schemaLocation}${assignmentDetails}` })));
  details.append(heading, list); existing?.replaceWith(details) ?? elements.eventInspector?.append(details);
}
