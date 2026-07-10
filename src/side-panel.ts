import {
  listCommands,
  runCommandById,
  type AppCommand,
  type CommandRunRecord,
} from "./commands.js";
import {
  advanceHotkeySequence,
  blankHotkeyKeymap,
  duplicateSequences,
  HOTKEY_KEYMAP_STORAGE_KEY,
  keyTokenFromKeyboardEvent,
  updateHotkeyKeymap,
  validateHotkeyKeymap,
  type HotkeyKeymap,
} from "./hotkey-keymap.js";
import { createHotkeyEditor } from "./hotkey-editor.js";
import type { WorkspaceTabId } from "./workspace-tabs.js";
import { createWorkspaceTabsController } from "./workspace-tabs-ui.js";
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
  beginObservedPageLoad,
  initialObservationRefreshState,
  markObservationRefreshPageEntryCaptured,
  nextObservationRefreshAttempt,
  observationRefreshDelay,
  observationRefreshRequestForPageLoad,
  observationRefreshRequestIsCurrent,
  shouldRetryObservationRefresh,
  type ObservationRefreshRequest,
} from "./data-layer-observation-refresh.js";
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
  timelineEventHeading,
  type NestedTimelineEvent,
  type NestedTimelinePage,
  type TimelinePayloadProperty,
} from "./data-layer-timeline.js";
import type { ActivePageObservationResult } from "./active-page-observation.js";

const PROJECT_NAME = "my-chrome-utilities";

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
const createKeymapButton =
  document.querySelector<HTMLButtonElement>("#create-keymap");
const updateKeymapButton =
  document.querySelector<HTMLButtonElement>("#update-keymap");
const loadKeymapButton =
  document.querySelector<HTMLButtonElement>("#load-keymap");
const keymapFileInput =
  document.querySelector<HTMLInputElement>("#keymap-file");
const keymapStatus = document.querySelector<HTMLElement>("#keymap-status");
const keymapWarning = document.querySelector<HTMLElement>("#keymap-warning");
const workspaceTabList = document.querySelector<HTMLElement>("#workspace-tabs");
const hotkeyEditorFilter = document.querySelector<HTMLInputElement>("#hotkey-editor-filter");
const hotkeyEditorCommands = document.querySelector<HTMLElement>("#hotkey-editor-commands");
const allCommands = [...listCommands()];

let visibleCommands: readonly AppCommand[] = allCommands;
let selectedIndex = 0;
let activeHotkeyKeymap: HotkeyKeymap =
  loadStoredHotkeyKeymap() ?? blankHotkeyKeymap(allCommands);
let pendingHotkeySequence: string[] = [];
let dataLayerSessionState: DataLayerSessionState = restoreSession();
let dataLayerObserverState: DataLayerHistoryObserverState = {
  pageObject: samplePageObject(),
  observedEntries: [],
};
let stopLiveHistoryPushCapture: StopLiveHistoryPushCapture = () => {};
let observationRefreshTimeoutId: number | undefined;
let observationRefreshState = initialObservationRefreshState;

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

function expandedTimelinePageIndexes(): Set<number> {
  const expandedIndexes = new Set<number>();

  if (!sessionTimeline) {
    return expandedIndexes;
  }

  const pages = Array.from(
    sessionTimeline.querySelectorAll<HTMLDetailsElement>(
      ":scope > li > details",
    ),
  );

  pages.forEach((page, index) => {
    if (page.open) {
      expandedIndexes.add(index);
    }
  });

  return expandedIndexes;
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
    const expandedPageIndexes = expandedTimelinePageIndexes();
    sessionTimeline.replaceChildren(
      ...nestedTimeline(session?.timeline ?? []).map((page, index) =>
        renderTimelinePage(page, expandedPageIndexes.has(index)),
      ),
    );
  }

  if (sessionWarning) {
    sessionWarning.textContent = dataLayerSessionState.warning ?? "";
  }
}

function renderTimelinePage(
  page: NestedTimelinePage,
  expanded = false,
): HTMLLIElement {
  const item = document.createElement("li");
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  const eventList = document.createElement("ul");

  details.open = expanded;
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

  summary.textContent = timelineEventHeading(event);

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

  return markObservationRefreshPageEntryCaptured(request);
}

function scheduleObservationRefresh(request: ObservationRefreshRequest): void {
  clearScheduledObservationRefresh();
  const delay = observationRefreshDelay(request.attempt);

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

  const schedule = observationRefreshRequestForPageLoad(
    observationRefreshState,
    tabId,
    pageUrl,
    pageLoadSequence,
  );

  observationRefreshState = schedule.state;

  if (schedule.request) {
    scheduleObservationRefresh(schedule.request);
  }
}

async function runObservationRefresh(
  request: ObservationRefreshRequest,
): Promise<void> {
  if (
    !observationRefreshRequestIsCurrent(observationRefreshState, request) ||
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
    !observationRefreshRequestIsCurrent(observationRefreshState, nextRequest) ||
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
    shouldRetryObservationRefresh(
      observation.pageAccessStatus,
      nextRequest.attempt,
    )
  ) {
    scheduleObservationRefresh(nextObservationRefreshAttempt(nextRequest));
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

const commandRunContext = {
  record: recordCommandRun,
  showWorkspace,
};

function setKeymapStatus(message: string): void {
  if (keymapStatus) {
    keymapStatus.textContent = message;
  }
}

function setKeymapWarning(message: string): void {
  if (keymapWarning) {
    keymapWarning.textContent = message;
  }
}

const workspaceTabsController = createWorkspaceTabsController(
  workspaceTabList,
  localStorage,
);

const hotkeyEditor = createHotkeyEditor({
  commands: allCommands,
  container: hotkeyEditorCommands,
  filter: hotkeyEditorFilter,
  getKeymap: () => activeHotkeyKeymap,
  setKeymap: (keymap) => {
    activeHotkeyKeymap = keymap;
    storeHotkeyKeymap(keymap);
  },
  setStatus: setKeymapStatus,
  setWarning: setKeymapWarning,
});

function showWorkspace(tab: WorkspaceTabId, focus = false): void {
  workspaceTabsController.show(tab, focus);
}

function activateHotkeyFocus(): void {
  if (!panelRoot) {
    return;
  }

  panelRoot.focus();
  panelRoot.dataset.hotkeyFocus = "active";
}

function hotkeyFocusActive(): boolean {
  return panelRoot?.dataset.hotkeyFocus === "active";
}

function clearPendingHotkeySequence(): void {
  pendingHotkeySequence = [];
}

function keymapFileName(): string {
  return `${PROJECT_NAME}-hotkey-keymap.json`;
}

function downloadHotkeyKeymapFile(keymap: HotkeyKeymap): void {
  const blob = new Blob([`${JSON.stringify(keymap, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = keymapFileName();
  link.click();
  URL.revokeObjectURL(url);
}

function updateKeymapStatus(
  added: readonly string[],
  removed: readonly string[],
): void {
  setKeymapStatus(
    `Keymap updated: added ${added.length}, removed ${removed.length}`,
  );
}

function shouldIgnoreHotkeyTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function storeHotkeyKeymap(keymap: HotkeyKeymap): void {
  localStorage.setItem(HOTKEY_KEYMAP_STORAGE_KEY, JSON.stringify(keymap));
}

function loadStoredHotkeyKeymap(): HotkeyKeymap | undefined {
  const stored = localStorage.getItem(HOTKEY_KEYMAP_STORAGE_KEY);

  if (!stored) {
    return undefined;
  }

  try {
    const validation = validateHotkeyKeymap(JSON.parse(stored), allCommands);
    return validation.valid ? validation.keymap : undefined;
  } catch {
    return undefined;
  }
}

function loadHotkeyKeymap(value: unknown): boolean {
  const validation = validateHotkeyKeymap(value, allCommands);
  const duplicates = validation.keymap
    ? duplicateSequences(validation.keymap)
    : validation.duplicateSequences;

  if (!validation.valid || !validation.keymap) {
    const duplicateSequence = duplicates[0]?.sequence;
    setKeymapWarning(
      duplicateSequence
        ? `Duplicate key sequence: ${duplicateSequence}`
        : (validation.error ?? "Invalid hotkey keymap."),
    );
    return false;
  }

  activeHotkeyKeymap = validation.keymap;
  storeHotkeyKeymap(activeHotkeyKeymap);
  hotkeyEditor.render();
  clearPendingHotkeySequence();
  setKeymapWarning("");
  setKeymapStatus("Keymap loaded");
  activateHotkeyFocus();
  return true;
}

function createHotkeyKeymapFile(): void {
  activeHotkeyKeymap = blankHotkeyKeymap(allCommands);
  downloadHotkeyKeymapFile(activeHotkeyKeymap);
  hotkeyEditor.render();
  setKeymapWarning("");
  setKeymapStatus("Blank keymap created");
}

function updateHotkeyKeymapFile(): void {
  const summary = updateHotkeyKeymap(activeHotkeyKeymap, allCommands);

  activeHotkeyKeymap = summary.keymap;
  downloadHotkeyKeymapFile(activeHotkeyKeymap);
  hotkeyEditor.render();
  setKeymapWarning("");
  updateKeymapStatus(summary.added, summary.removed);
}

async function loadHotkeyKeymapFile(): Promise<void> {
  const file = keymapFileInput?.files?.[0];

  if (!file) {
    return;
  }

  try {
    loadHotkeyKeymap(JSON.parse(await file.text()));
  } catch {
    setKeymapWarning("Keymap file must contain valid JSON.");
  } finally {
    if (keymapFileInput) {
      keymapFileInput.value = "";
    }
  }
}

function handleHotkeyKeydown(event: KeyboardEvent): void {
  if (!hotkeyFocusActive() || shouldIgnoreHotkeyTarget(event.target)) {
    return;
  }

  if (event.key === "Escape" && pendingHotkeySequence.length > 0) {
    event.preventDefault();
    clearPendingHotkeySequence();
    return;
  }

  const hadPendingSequence = pendingHotkeySequence.length > 0;
  const advance = advanceHotkeySequence(
    activeHotkeyKeymap,
    pendingHotkeySequence,
    keyTokenFromKeyboardEvent(event),
  );

  if (advance.status === "pending") {
    event.preventDefault();
    pendingHotkeySequence = advance.pending;
    return;
  }

  if (advance.status === "matched" && advance.commandId) {
    event.preventDefault();
    clearPendingHotkeySequence();
    runCommandById(advance.commandId, commandRunContext);
    return;
  }

  clearPendingHotkeySequence();
  if (hadPendingSequence) {
    event.preventDefault();
  }
}

function isFocusHotkeysMessage(message: unknown): message is { type: string } {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "focus-app-hotkeys"
  );
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

  runCommandById(command.id, commandRunContext);
  hidePalette();
}

if (commandList) {
  for (const command of allCommands) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = command.title;
    button.addEventListener("click", () => {
      runCommandById(command.id, commandRunContext);
    });
    commandList.append(button);
  }
}

openButton?.addEventListener("click", showPalette);

workspaceTabsController.bind();
hotkeyEditor.bind();

createKeymapButton?.addEventListener("click", createHotkeyKeymapFile);
updateKeymapButton?.addEventListener("click", updateHotkeyKeymapFile);
loadKeymapButton?.addEventListener("click", () => {
  keymapFileInput?.click();
});
keymapFileInput?.addEventListener("change", () => {
  void loadHotkeyKeymapFile();
});

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

document.addEventListener("keydown", handleHotkeyKeydown, true);

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message: unknown) => {
    if (isFocusHotkeysMessage(message)) {
      activateHotkeyFocus();
    }
  });
}

if (typeof chrome !== "undefined" && chrome.tabs?.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!activeSessionTabMatches(tabId)) {
      return;
    }

    if (changeInfo.status === "loading" || changeInfo.url !== undefined) {
      observationRefreshState = beginObservedPageLoad(observationRefreshState);
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
        observationRefreshState.observedPageLoadSequence,
      );
    }
  });
}

renderHistoryPath(getHistoryArrayPath());
renderSessionState();
renderObserverState();
showWorkspace(workspaceTabsController.activeTab());
hotkeyEditor.render();
activateHotkeyFocus();

export {
  DATA_LAYER_SESSION_STORAGE_KEY,
  HOTKEY_KEYMAP_STORAGE_KEY,
  navigateSession,
  sessionScope,
};
