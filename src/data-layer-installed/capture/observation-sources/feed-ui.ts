import {filteredLiveEvents, type LiveEvent, type LiveObserverState} from "../../../data-layer-live-observer.js";
import {eventPathname, pathnameVisits, resolveFeedSummaries} from "../../../data-layer-event-feed-summaries.js";
import {liveResponsiveLayout} from "../../../data-layer-live-responsive-layout.js";
import {validationVisual} from "../../../utilities/data-layer/schemas.js";

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
  const events=filteredLiveEvents(state);
  const visits=pathnameVisits(events);
  const ordered=events.length && events.every(event=>event.captureSequence!==undefined)
    ? [...visits].reverse().map(visit=>({...visit,events:[...visit.events].reverse()})) : visits;
  elements.eventFeed?.replaceChildren(...ordered.map((visit, index) => {
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
