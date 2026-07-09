import {
  listCommands,
  runCommandById,
  type AppCommand,
  type CommandRunRecord,
} from "./commands.js";
import {
  activePageObservation,
  tabPageObservation,
} from "./active-page-observation.js";
import {
  getHistoryArrayPath,
  pathStatus,
  samplePageObject,
  setHistoryArrayPath,
} from "./data-layer.js";
import {
  appendObservedHistoryEntry,
  attachHistoryArrayObserver,
  type DataLayerHistoryObserverState,
} from "./data-layer-observer.js";
import {
  startLiveHistoryPushCapture,
  type StopLiveHistoryPushCapture,
} from "./data-layer-live-observation.js";
import {
  observerAttachmentStatus,
  restartObservation,
} from "./data-layer-recovery.js";
import {
  captureEntry,
  DATA_LAYER_SESSION_STORAGE_KEY,
  endDataLayerTestingSession,
  navigateSession,
  persistSession,
  restoreSession,
  sessionScope,
  startDataLayerTestingSession,
  type DataLayerSessionState,
} from "./data-layer-session.js";
import {
  nestedTimeline,
  type NestedTimelineEvent,
  type NestedTimelinePage,
  type TimelinePayloadProperty,
} from "./data-layer-timeline.js";
import type { ActivePageObservationResult } from "./active-page-observation.js";

const PROJECT_NAME = "my-chrome-utilities";
const OBSERVATION_REFRESH_RETRY_DELAY_MS = 500;
const OBSERVATION_REFRESH_MAX_ATTEMPTS = 10;

const app = document.querySelector<HTMLElement>("#app");
const panelRoot = document.querySelector<HTMLElement>("#side-panel-root");
const commandList = document.querySelector<HTMLElement>("#commands");
const commandLog = document.querySelector<HTMLElement>("#command-log");
const openButton = document.querySelector<HTMLButtonElement>("#open-palette");
const palette = document.querySelector<HTMLElement>("#palette");
const filter = document.querySelector<HTMLInputElement>("#palette-filter");
const results = document.querySelector<HTMLElement>("#palette-results");
const historyPathInput = document.querySelector<HTMLInputElement>("#history-path");
const historyPathDisplay = document.querySelector<HTMLElement>(
  "#history-path-display",
);
const historyPathStatus = document.querySelector<HTMLElement>(
  "#history-path-status",
);
const sessionStatus = document.querySelector<HTMLElement>("#session-status");
const sessionHistoryPath = document.querySelector<HTMLElement>(
  "#session-history-path",
);
const sessionTimeline = document.querySelector<HTMLElement>("#session-timeline");
const sessionWarning = document.querySelector<HTMLElement>("#session-warning");
const observerStatus = document.querySelector<HTMLElement>("#observer-status");
const restartObservationButton = document.querySelector<HTMLButtonElement>(
  "#restart-observation",
);
const allCommands = [...listCommands()];

let visibleCommands: readonly AppCommand[] = allCommands;
let selectedIndex = 0;
let dataLayerSessionState: DataLayerSessionState = restoreSession();
let dataLayerObserverState: DataLayerHistoryObserverState = {
  pageObject: samplePageObject(),
  observedEntries: [],
};
let stopLiveHistoryPushCapture: StopLiveHistoryPushCapture = () => {};
let observationRefreshTimeoutId: number | undefined;
let observationRefreshToken = 0;
let observedPageLoadSequence = 0;
let scheduledObservationRefreshSequence: number | undefined;

interface ObservationRefreshRequest {
  token: number;
  tabId: number;
  pageUrl: string;
  attempt: number;
  pageEntryCaptured: boolean;
}

if (app) {
  app.textContent = PROJECT_NAME;
}

function renderHistoryPath(path: string, fieldValue = path): void {
  if (historyPathInput) {
    historyPathInput.value = fieldValue;
  }

  if (historyPathDisplay) {
    historyPathDisplay.textContent = path;
  }

  if (historyPathStatus) {
    historyPathStatus.textContent = pathStatus(samplePageObject(), path);
  }
}

function renderSessionState(): void {
  const session = dataLayerSessionState.session;

  if (sessionStatus) {
    sessionStatus.textContent = session?.status ?? "inactive";
  }

  if (sessionHistoryPath) {
    sessionHistoryPath.textContent = session?.historyPath ?? "";
  }

  if (sessionTimeline) {
    sessionTimeline.replaceChildren(
      ...nestedTimeline(session?.timeline ?? []).map(renderTimelinePage),
    );
  }

  if (sessionWarning) {
    sessionWarning.textContent = dataLayerSessionState.warning ?? "";
  }
}

function renderTimelinePage(page: NestedTimelinePage): HTMLLIElement {
  const item = document.createElement("li");
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  const eventList = document.createElement("ul");

  summary.textContent = page.url;
  eventList.append(...page.events.map(renderTimelineEvent));
  details.append(summary, eventList);
  item.append(details);
  return item;
}

function renderTimelineEvent(event: NestedTimelineEvent): HTMLLIElement {
  const item = document.createElement("li");
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  const definitionList = document.createElement("dl");

  summary.textContent = [event.name, event.timestamp, event.observerPath]
    .filter((value) => value.length > 0)
    .join(" | ");

  appendDefinition(definitionList, "Event", event.name);
  appendDefinition(definitionList, "URL", event.url);
  appendDefinition(definitionList, "Time", event.timestamp);
  appendDefinition(definitionList, "Path", event.observerPath);
  appendDefinition(definitionList, "Payload", event.payload);
  appendDefinition(definitionList, "Raw", event.rawValue);

  details.append(summary, definitionList);
  if (event.payloadProperties.length > 0) {
    details.append(renderPayloadProperties(event.payloadProperties));
  }
  item.append(details);
  return item;
}

function renderPayloadProperties(
  properties: readonly TimelinePayloadProperty[],
): HTMLUListElement {
  const list = document.createElement("ul");
  list.append(...properties.map(renderPayloadProperty));
  return list;
}

function renderPayloadProperty(
  property: TimelinePayloadProperty,
): HTMLLIElement {
  const item = document.createElement("li");
  item.textContent = `${property.name}: ${property.value}`;
  return item;
}

function appendDefinition(list: HTMLElement, label: string, value: string): void {
  if (!value) {
    return;
  }

  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value;
  list.append(term, description);
}

function renderObserverState(): void {
  if (observerStatus) {
    observerStatus.textContent = observerAttachmentStatus(
      dataLayerSessionState,
      dataLayerObserverState,
    );
  }
}

function updateSessionFromObserverState(): void {
  dataLayerSessionState =
    dataLayerObserverState.sessionState ?? dataLayerSessionState;
}

function persistAndRenderSessionState(): void {
  persistSession(dataLayerSessionState);
  renderSessionState();
}

function persistAndRenderObservationState(): void {
  persistAndRenderSessionState();
  renderObserverState();
}

function restartLiveHistoryCaptureIfActive(
  observation: ActivePageObservationResult,
): void {
  if (dataLayerSessionState.session?.status === "active") {
    void startLiveHistoryCapture(observation);
  }
}

function stopLiveHistoryCapture(): void {
  stopLiveHistoryPushCapture();
  stopLiveHistoryPushCapture = () => {};
}

async function startLiveHistoryCapture(
  observation: ActivePageObservationResult,
): Promise<void> {
  stopLiveHistoryCapture();
  try {
    stopLiveHistoryPushCapture = await startLiveHistoryPushCapture({
      ...(observation.tabId === undefined ? {} : { tabId: observation.tabId }),
      historyPath: observation.historyPath,
      onEntry: ({ rawValue, timestamp }) => {
        dataLayerObserverState = appendObservedHistoryEntry(
          dataLayerObserverState,
          rawValue,
          timestamp,
        );
        updateSessionFromObserverState();
        persistAndRenderObservationState();
      },
    });
  } catch {
    stopLiveHistoryPushCapture = () => {};
  }
}

function clearScheduledObservationRefresh(): void {
  if (observationRefreshTimeoutId !== undefined) {
    globalThis.clearTimeout(observationRefreshTimeoutId);
    observationRefreshTimeoutId = undefined;
  }
}

function activeSessionTabMatches(tabId: number): boolean {
  const session = dataLayerSessionState.session;

  return session?.status === "active" && session.tabId === tabId;
}

function capturePageEntryForRefresh(
  request: ObservationRefreshRequest,
): ObservationRefreshRequest {
  if (request.pageEntryCaptured) {
    return request;
  }

  dataLayerSessionState = navigateSession(dataLayerSessionState, request.pageUrl);
  dataLayerSessionState = captureEntry(dataLayerSessionState, {
    type: "page",
    url: request.pageUrl,
  });
  persistAndRenderSessionState();

  return {
    ...request,
    pageEntryCaptured: true,
  };
}

function scheduleObservationRefresh(request: ObservationRefreshRequest): void {
  clearScheduledObservationRefresh();
  const delay =
    request.attempt === 0 ? 0 : OBSERVATION_REFRESH_RETRY_DELAY_MS;

  observationRefreshTimeoutId = globalThis.setTimeout(() => {
    observationRefreshTimeoutId = undefined;
    void runObservationRefresh(request);
  }, delay);
}

function refreshObservationAfterPageLoad(
  tabId: number,
  pageUrl: string,
  pageLoadSequence: number,
): void {
  if (!activeSessionTabMatches(tabId)) {
    return;
  }

  if (scheduledObservationRefreshSequence === pageLoadSequence) {
    return;
  }

  scheduledObservationRefreshSequence = pageLoadSequence;
  observationRefreshToken += 1;
  scheduleObservationRefresh({
    token: observationRefreshToken,
    tabId,
    pageUrl,
    attempt: 0,
    pageEntryCaptured: false,
  });
}

async function runObservationRefresh(
  request: ObservationRefreshRequest,
): Promise<void> {
  if (
    request.token !== observationRefreshToken ||
    !activeSessionTabMatches(request.tabId)
  ) {
    return;
  }

  const session = dataLayerSessionState.session;

  if (!session) {
    return;
  }

  const nextRequest = capturePageEntryForRefresh(request);
  const observation = await tabPageObservation(
    nextRequest.tabId,
    nextRequest.pageUrl,
    session.historyPath,
  );

  if (
    nextRequest.token !== observationRefreshToken ||
    !activeSessionTabMatches(nextRequest.tabId)
  ) {
    return;
  }

  dataLayerObserverState = restartObservation(
    dataLayerSessionState,
    dataLayerObserverState,
    observation,
  );
  updateSessionFromObserverState();
  persistAndRenderObservationState();

  if (dataLayerObserverState.observer?.status === "ready") {
    await startLiveHistoryCapture(observation);
    return;
  }

  if (
    observation.pageAccessStatus !== "page access unavailable" &&
    nextRequest.attempt + 1 < OBSERVATION_REFRESH_MAX_ATTEMPTS
  ) {
    scheduleObservationRefresh({
      ...nextRequest,
      attempt: nextRequest.attempt + 1,
    });
  }
}

async function recordDataLayerCommandRun(entry: CommandRunRecord): Promise<void> {
  if (entry.commandId === "data-layer.start-testing") {
    const sessionWasActive = dataLayerSessionState.session?.status === "active";
    const historyPath = getHistoryArrayPath();
    const observation = await activePageObservation(historyPath);
    dataLayerSessionState = startDataLayerTestingSession(dataLayerSessionState, {
      tabId: observation.tabId ?? 1,
      url: observation.pageUrl,
      historyPath,
    });
    if (!sessionWasActive) {
      dataLayerSessionState = captureEntry(dataLayerSessionState, {
        type: "page",
        url: observation.pageUrl,
      });
      dataLayerObserverState = attachHistoryArrayObserver(
        { ...dataLayerObserverState, sessionState: dataLayerSessionState },
        observation,
      );
      updateSessionFromObserverState();
      await startLiveHistoryCapture(observation);
    }
    persistAndRenderObservationState();
  }

  if (entry.commandId === "data-layer.end-testing") {
    stopLiveHistoryCapture();
    dataLayerSessionState = endDataLayerTestingSession(dataLayerSessionState);
    persistSession(dataLayerSessionState);
    renderSessionState();
  }
}

function recordCommandRun(entry: CommandRunRecord): void {
  void recordDataLayerCommandRun(entry);

  if (commandLog) {
    commandLog.textContent = entry.message;
  }
}

function renderPalette(commands: readonly AppCommand[]): void {
  if (!results) {
    return;
  }

  visibleCommands = commands;
  selectedIndex = 0;
  results.replaceChildren();

  for (const [index, command] of commands.entries()) {
    const item = document.createElement("li");
    item.textContent = command.title;
    item.dataset.commandId = command.id;
    item.dataset.selected = index === selectedIndex ? "true" : "false";
    results.append(item);
  }
}

function filterCommands(text: string): readonly AppCommand[] {
  const normalized = text.trim().toLowerCase();

  if (!normalized) {
    return allCommands;
  }

  return allCommands.filter((command) =>
    `${command.title} ${command.description} ${command.category}`
      .toLowerCase()
      .includes(normalized),
  );
}

function showPalette(): void {
  if (!palette) {
    return;
  }

  palette.hidden = false;
  renderPalette(filterCommands(filter?.value ?? ""));
  filter?.focus();
}

function hidePalette(): void {
  if (palette) {
    palette.hidden = true;
  }
}

function runSelectedCommand(): void {
  const command = visibleCommands[selectedIndex];

  if (!command) {
    return;
  }

  runCommandById(command.id, { record: recordCommandRun });
  hidePalette();
}

if (commandList) {
  for (const command of allCommands) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = command.title;
    button.addEventListener("click", () => {
      runCommandById(command.id, { record: recordCommandRun });
    });
    commandList.append(button);
  }
}

openButton?.addEventListener("click", showPalette);

panelRoot?.addEventListener("keyup", (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key.toLowerCase() === "k") {
    event.preventDefault();
    showPalette();
  }
});

filter?.addEventListener("input", () => {
  renderPalette(filterCommands(filter.value));
});

filter?.addEventListener("keyup", (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    event.preventDefault();
    runSelectedCommand();
  }

  if (event.key === "Escape") {
    event.preventDefault();
    hidePalette();
  }
});

historyPathInput?.addEventListener("input", () => {
  const typedPath = historyPathInput.value;
  const path = setHistoryArrayPath(typedPath);
  renderHistoryPath(path, typedPath);
  void activePageObservation(path).then((observation) => {
    dataLayerObserverState = attachHistoryArrayObserver(
      dataLayerObserverState,
      observation,
    );
    updateSessionFromObserverState();
    persistAndRenderSessionState();
    restartLiveHistoryCaptureIfActive(observation);
    renderObserverState();
  });
});

restartObservationButton?.addEventListener("click", () => {
  void activePageObservation(getHistoryArrayPath()).then((observation) => {
    dataLayerObserverState = restartObservation(
      dataLayerSessionState,
      dataLayerObserverState,
      observation,
    );
    updateSessionFromObserverState();
    persistAndRenderSessionState();
    restartLiveHistoryCaptureIfActive(observation);
    renderObserverState();
  });
});

if (typeof chrome !== "undefined" && chrome.tabs?.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!activeSessionTabMatches(tabId)) {
      return;
    }

    if (changeInfo.status === "loading" || changeInfo.url !== undefined) {
      observedPageLoadSequence += 1;
      scheduledObservationRefreshSequence = undefined;
      observationRefreshToken += 1;
      clearScheduledObservationRefresh();
      stopLiveHistoryCapture();

      if (changeInfo.url !== undefined) {
        dataLayerSessionState = navigateSession(
          dataLayerSessionState,
          changeInfo.url,
        );
        persistAndRenderSessionState();
      }
    }

    if (changeInfo.status === "complete") {
      const pageUrl =
        tab.url ??
        changeInfo.url ??
        dataLayerSessionState.session?.currentUrl ??
        globalThis.location.href;

      refreshObservationAfterPageLoad(
        tabId,
        pageUrl,
        observedPageLoadSequence,
      );
    }
  });
}

renderHistoryPath(getHistoryArrayPath());
renderSessionState();
renderObserverState();

export {
  DATA_LAYER_SESSION_STORAGE_KEY,
  navigateSession,
  sessionScope,
};
