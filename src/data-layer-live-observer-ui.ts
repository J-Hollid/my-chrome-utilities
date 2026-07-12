import {
  dataLayerViews,
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
  button.setAttribute(
    "aria-label",
    [event.name, compactTime, sourceName, pathname, event.validation ?? "Not checked", summaryText].filter(Boolean).join(", "),
  );
  button.setAttribute("aria-pressed", String(selected));
  button.textContent = [event.name, compactTime, sourceName, event.validation ?? "Not checked", summaryText].filter(Boolean).join(" · ");
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
  elements.eventFeed?.replaceChildren(...pathnameVisits(state.events).map((visit, index) => {
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
  const status = document.createElement("output");
  status.textContent = event.validation ?? "Not checked";
  const summary = document.createElement("dl");
  appendSummaryItem(summary, "Capture time", event.captureTime);
  appendSummaryItem(summary, "Page", event.pageUrl);
  appendSummaryItem(summary, "Destination", event.destination);
  appendSummaryItem(summary, "Validation", event.validation ?? "Not checked");
  appendSummaryItem(summary, "Provenance", event.provenance);

  const payload = document.createElement("section");
  payload.setAttribute("aria-label", "Payload");
  const payloadHeading = document.createElement("h5");
  payloadHeading.textContent = "Payload";
  const payloadValues = document.createElement("pre");
  payloadValues.textContent = JSON.stringify(event.payload, null, 2);
  payload.append(payloadHeading, payloadValues);

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
  const choices = actionHandlers.manualSchemaChoices?.(event) ?? [];
  if (choices.length) {
    const label = document.createElement("label"); label.textContent = "Manual schema override: ";
    const select = document.createElement("select"); select.setAttribute("aria-label", "Manual schema override");
    select.append(Object.assign(document.createElement("option"), { value:"", textContent:"Automatic assignment" }), ...choices.map((choice) => Object.assign(document.createElement("option"), { value:choice.id, textContent:choice.label })));
    select.addEventListener("change", () => { actionHandlers.selectManualSchema?.(event.id, select.value || undefined); feedback.textContent = select.value ? "Manual schema override recorded." : "Automatic assignment restored."; });
    label.append(select); actions.append(label);
  }
  const actionCallbacks = {
    "Copy payload": async () => actionHandlers.copyPayload(event),
    "Save to Library": async () => actionHandlers.saveToLibrary(event),
    ...(actionHandlers.createSchema ? { "Create schema": async () => actionHandlers.createSchema?.(event) } : {}),
    Validate: async () => actionHandlers.validate(event),
  } as const;
  for (const [label, callback] of Object.entries(actionCallbacks)) {
    const action = document.createElement("button");
    action.type = "button";
    action.textContent = label;
    action.dataset.actionVariant = label === "Copy payload" ? "quiet" : "secondary";
    const availability = label === "Validate"
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
  actions.append(feedback);
  elements.eventInspector.replaceChildren(inspectorHeader, source, status, summary, payload, raw, actions);
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

export function updateLiveInspectorValidation(
  elements: LiveObserverElements,
  validation: string,
  issues: readonly { instancePath: string; message: string; expected: string; actual: string; schemaName: string; schemaVersion: number; schemaLocation: string; rule?: string; severity?: string; origin?: string }[] = [],
  assignment?: { id?: string; name?: string; sourceId?: string; eventName?: string; target?: string; priority?: number; domainCondition?: string; pathnameCondition?: string },
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
  const assignmentDetails = assignment ? ` · assignment ${assignment.name ?? assignment.id ?? "automatic"} · source ${assignment.sourceId ?? "any"} · event ${assignment.eventName ?? "any"} · target ${assignment.target ?? "automatic"} · priority ${assignment.priority ?? 0} · domain ${assignment.domainCondition ?? "any"} · pathname ${assignment.pathnameCondition ?? "any"}` : "";
  list.replaceChildren(...issues.map((issue) => Object.assign(document.createElement("li"), { textContent:`${issue.instancePath || "root"} · ${issue.message} · expected ${issue.expected}, received ${issue.actual} · rule ${issue.rule ?? "schema"} · severity ${issue.severity ?? "error"} · ${issue.origin ?? `${issue.schemaName} v${issue.schemaVersion}`} · ${issue.schemaLocation}${assignmentDetails}` })));
  details.append(heading, list); existing?.replaceWith(details) ?? elements.eventInspector?.append(details);
}
