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
  validationVisual,
  type ValidationEvaluation,
  type ValidationPropertyNode,
} from "./data-layer-live-validation-presentation.js";

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
  button.append(identity, badge, summary);
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
  return `${evaluation.message} · expected ${evaluation.expected} · actual ${evaluation.actual} · rule ${evaluation.rule} v${evaluation.ruleVersion} · severity ${evaluation.severity} · ${evaluation.schemaName} v${evaluation.schemaVersion}`;
}

function propertyStatusSymbol(symbol: string): string {
  return symbol === "check" ? "✓" : symbol === "warning" ? "⚠" : symbol === "error" ? "!" : "○";
}

function renderPropertyNode(node: ValidationPropertyNode): HTMLLIElement {
  const item = document.createElement("li"); item.className = "live-validation-property"; item.id = `live-property-${node.path.replace(/[^a-z0-9]+/gi, "-")}`; item.tabIndex = -1; item.dataset.validationTreatment = node.summary.treatment;
  const row = document.createElement("div"); row.className = "live-validation-property-row";
  const name = document.createElement("code"); name.textContent = node.name;
  const value = document.createElement("span"); value.textContent = node.valueLabel; if (node.missing) value.dataset.missing = "true";
  const status = document.createElement("button"); status.type = "button"; status.className = "live-property-status"; status.id = `${item.id}-status`; status.setAttribute("aria-expanded", "false"); status.textContent = `${propertyStatusSymbol(node.summary.symbolName)} ${node.summary.status}`;
  const preview = document.createElement("div"); preview.className = "live-property-issue-preview"; preview.id = `${item.id}-preview`; preview.setAttribute("role", "tooltip"); preview.hidden = true;
  preview.tabIndex = 0;
  const primary = node.evaluations.find(({ status: state }) => state === "error") ?? node.evaluations.find(({ status: state }) => state === "warning") ?? node.evaluations[0];
  preview.textContent = primary ? evaluationText(primary) : node.summary.status;
  status.setAttribute("aria-describedby", preview.id);
  const disclosure = document.createElement("section"); disclosure.className = "live-property-rule-details"; disclosure.hidden = true;
  disclosure.setAttribute("aria-label", `${node.path} rule evaluations`);
  const evaluationList = document.createElement("ul"); evaluationList.replaceChildren(...node.evaluations.map((evaluation) => Object.assign(document.createElement("li"), { textContent:`${evaluation.status}: ${evaluationText(evaluation)}` })));
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
  row.append(name, value, status);
  if (node.aggregate.errors || node.aggregate.warnings) {
    const aggregate = document.createElement("span"); aggregate.className = "live-property-aggregate"; aggregate.textContent = [node.aggregate.errors ? `${node.aggregate.errors} error${node.aggregate.errors === 1 ? "" : "s"}` : "", node.aggregate.warnings ? `${node.aggregate.warnings} warning${node.aggregate.warnings === 1 ? "" : "s"}` : ""].filter(Boolean).join(" and "); row.append(aggregate);
  }
  item.append(row, preview, disclosure);
  if (node.children.length) {
    const nested = document.createElement("details"); const nestedSummary = document.createElement("summary"); nestedSummary.textContent = `Expand ${node.name}`;
    const list = document.createElement("ul"); list.replaceChildren(...node.children.map(renderPropertyNode)); nested.append(nestedSummary, list); item.append(nested);
  }
  return item;
}

function renderEventLevelIssues(event: LiveEvent): HTMLElement {
  const section = document.createElement("section"); section.id = "live-event-validation-issues"; section.setAttribute("aria-labelledby", "live-event-validation-issues-heading");
  const heading = document.createElement("h5"); heading.id = "live-event-validation-issues-heading"; heading.textContent = "Event-level issues";
  const list = document.createElement("ul");
  list.replaceChildren(...(event.validationDetails?.issues ?? []).map((issue) => {
    const item = document.createElement("li");
    const path = issue.instancePath.replace(/^\//, "").replaceAll("/", ".");
    const text = `${issue.templatePath ? `template ${issue.templatePath} · ` : ""}${issue.message} · rule ${issue.rule ?? "schema"} · severity ${issue.severity ?? "error"} · ${issue.origin ?? `${issue.schemaName} v${issue.schemaVersion}`} · expected ${issue.expected} · actual ${issue.actual}`;
    if (path) {
      const targetId = `live-property-${path.replace(/[^a-z0-9]+/gi, "-")}`;
      const link = document.createElement("button"); link.type = "button"; link.textContent = `${path}: ${text}`; link.addEventListener("click", () => document.getElementById(targetId)?.focus({ preventScroll:false })); item.append(link);
    } else item.textContent = `Event: ${text}`;
    return item;
  }));
  section.append(heading, list); return section;
}

export function renderLiveInspector(
  elements: LiveObserverElements,
  event: LiveEvent,
  actionHandlers: LiveInspectorActions,
): void {
  if (!elements.eventInspector) return;
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
  appendSummaryItem(summary, "Provenance", event.provenance);

  const payload = document.createElement("section");
  payload.setAttribute("aria-label", "Properties");
  const payloadHeading = document.createElement("h5");
  payloadHeading.textContent = "Properties";
  const propertyList = document.createElement("ul"); propertyList.id = "live-validation-properties";
  const propertyTree = buildValidationPropertyTree(event.payload, event.validationDetails?.evaluations ?? [], event.validationDetails?.issues ?? []);
  propertyList.replaceChildren(...propertyTree.map(renderPropertyNode));
  payload.append(payloadHeading, propertyList);

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
    "Copy payload": async () => actionHandlers.copyPayload(event),
    "Save to Library": async () => actionHandlers.saveToLibrary(event),
    ...(actionHandlers.createSchema ? { "Create schema": async () => actionHandlers.createSchema?.(event) } : {}),
    ...(!draftContinuation && actionHandlers.createValidation ? { "Create validation from this event": async () => actionHandlers.createValidation?.(event) } : {}),
    [event.validation && event.validation !== "Not checked" ? "Revalidate" : "Validate"]: async () => actionHandlers.validate(event),
  } as const;
  for (const [label, callback] of Object.entries(actionCallbacks)) {
    const action = document.createElement("button");
    action.type = "button";
    action.textContent = label;
    action.id = `live-inspector-action-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    if (label === "Create defect report") action.setAttribute("aria-label", `Create defect report for ${event.name}`);
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
      ["Add property from this event", draftContinuation.addProperty],
      ["Review draft", draftContinuation.review],
      ["Publish revision", draftContinuation.publish],
      ["Use a different schema", draftContinuation.useDifferent],
    ];
    continuation.append(heading, status, ...callbacks.map(([label, callback]) => {
      const button = document.createElement("button"); button.type = "button"; button.textContent = label;
      if (label === "Add property from this event") button.dataset.action = "add-property-validation";
      button.addEventListener("click", callback); return button;
    }));
    actions.append(continuation);
  }
  actions.append(feedback);
  const issues = renderEventLevelIssues(event); issues.tabIndex = -1;
  elements.eventInspector.replaceChildren(inspectorHeader, source, status, summary, issues, payload, rawJson, raw, actions);
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
  issues: readonly { instancePath: string; templatePath?: string; message: string; expected: string; actual: string; schemaName: string; schemaVersion: number; schemaLocation: string; rule?: string; severity?: string; origin?: string }[] = [],
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
  list.replaceChildren(...issues.map((issue) => Object.assign(document.createElement("li"), { textContent:`${issue.templatePath ? `template ${issue.templatePath} · ` : ""}${issue.instancePath || "root"} · ${issue.message} · expected ${issue.expected}, received ${issue.actual} · rule ${issue.rule ?? "schema"} · severity ${issue.severity ?? "error"} · ${issue.origin ?? `${issue.schemaName} v${issue.schemaVersion}`} · ${issue.schemaLocation}${assignmentDetails}` })));
  details.append(heading, list); existing?.replaceWith(details) ?? elements.eventInspector?.append(details);
}
