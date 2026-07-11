import {
  listCommands,
  runCommandById,
  type CommandRunRecord,
} from "./commands.js";
import { createPaletteController } from "./command-palette-ui.js";
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
  tabPageObservation,
} from "./active-page-observation.js";
import {
  attachedObservationTarget,
  attachSelectedObservationTarget,
  createObservationTarget,
  createObservationTargetState,
  detachObservationTarget,
  findObservationTargets,
  navigateObservationTarget,
  refreshDiscoveredObservationTargets,
  registerObservationTarget,
  restoreAttachedObservationTarget,
  selectObservationTarget,
  selectedObservationTarget,
  updateObservationTargetAccess,
  type ObservationTarget,
  type ObservationTargetState,
} from "./data-layer-observation-targets.js";
import {
  closeDetachTargetConfirmation,
  closeObservationTargetPicker,
  findObservationTargetElements,
  handleObservationTargetDialogKeydown,
  handleObservationTargetListKeydown,
  handleObservationTargetSearchKeydown,
  renderObservationTargetContext as renderObservationTargetContextUi,
  renderObservationTargetPicker as renderObservationTargetPickerUi,
  setObservationTargetResult as setObservationTargetResultUi,
  showDetachTargetConfirmation,
  showObservationTargetPicker,
} from "./data-layer-observation-targets-ui.js";
import {
  getHistoryArrayPath,
  pathStatus,
  samplePageObject,
  setHistoryArrayPath,
} from "./data-layer.js";
import {
  appendObservedHistoryEntry,
  attachHistoryArrayObserver,
  stopHistoryArrayObserver,
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
  type DataLayerSessionState,
} from "./data-layer-session.js";
import { beginDataLayerTestingSession } from "./data-layer-session-start.js";
import { renderLiveSessionControls } from "./data-layer-live-session-controls-ui.js";
import { createLiveSessionSummary } from "./data-layer-live-session-summary.js";
import { copyLivePageUrl as copyLivePageUrlAction } from "./data-layer-live-session-summary-actions.js";
import {
  findLiveSessionSummaryElements,
  renderLiveSessionSummary,
} from "./data-layer-live-session-summary-ui.js";
import {
  nestedTimeline,
  timelineEventHeading,
  type NestedTimelineEvent,
  type NestedTimelinePage,
  type TimelinePayloadProperty,
} from "./data-layer-timeline.js";
import type { ActivePageObservationResult } from "./active-page-observation.js";
import {
  createLiveObserverState,
  closeLiveInspector,
  dataLayerViewForNavigationKey,
  dataLayerViews,
  pauseCapture,
  recordLiveEvent,
  resumeCapture,
  selectLiveEvent,
  updateLiveSourceStatus,
  type DataLayerView,
  type LiveObserverState,
} from "./data-layer-live-observer.js";
import {
  confirmSavedSessionDeletion,
  cancelSavedSessionDeletion,
  createSavedSessionLibrary,
  exportSavedSession,
  importSavedSession,
  openSavedSession,
  requestSavedSessionDeletion,
  renameSavedSession,
  resumeSavedSession,
  saveCompletedSession,
  searchSavedSessions,
  savedSessionSummary,
  type ArchivedSession,
  type SavedSessionLibrary,
} from "./data-layer-saved-sessions.js";
import {
  findLiveObserverElements,
  renderDataLayerView,
  renderLiveInspector,
  renderLiveObserverState,
  renderLiveSessionMessage,
  updateLiveInspectorValidation,
} from "./data-layer-live-observer-ui.js";
import { createLiveInspectorActions } from "./data-layer-live-inspector-actions.js";
import {
  createEditableTemplate,
  discardDraft,
  openPropertyEditor,
  saveAsTemplateCopy,
  saveDraftRevision,
  searchEventTemplates,
  restoreEventTemplateLibrary,
  serializeEventTemplateLibrary,
  setPushDestination,
  updateDraftJson,
  EVENT_TEMPLATE_LIBRARY_STORAGE_KEY,
  type EditableEventTemplate,
  type PropertyEditorState,
} from "./data-layer-event-library-editor.js";
import { createSchema, duplicateSchema, exportSchema, importSchema, reviseSchema, searchSchemas, validateEvent, type SchemaDefinition } from "./data-layer-schema-verification.js";
import { createSequence, readiness, runSequence, type ReplaySequence, type ReplayTemplate } from "./data-layer-sequence-replay.js";
import {
  findSequenceReplayElements,
  renderSequenceReplay,
  setSequenceReplayResult,
} from "./data-layer-sequence-replay-ui.js";
import {
  findEventLibraryEditorElements,
  renderEventLibraryEditor,
  setEventLibraryResult,
  setEventLibraryValidation,
  setPushDestinationValidation,
} from "./data-layer-event-library-editor-ui.js";
import {
  pushTemplateToSelectedTarget,
  type SelectedTargetPushRequest,
} from "./data-layer-selected-target-push.js";
import {
  pushPayloadInPage,
  type PagePushResult,
} from "./data-layer-selected-target-push-page.js";

const PROJECT_NAME = "my-chrome-utilities";

const app = document.querySelector<HTMLElement>("#app");
const panelRoot = document.querySelector<HTMLElement>("#side-panel-root");
const sidePanelContent = document.querySelector<HTMLElement>("#side-panel-content");
const commandLog = document.querySelector<HTMLElement>("#command-log");
const startTestingButton = document.querySelector<HTMLButtonElement>("#start-data-layer-testing");
const endTestingButton = document.querySelector<HTMLButtonElement>("#end-data-layer-testing");
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
const restartObservationButton = document.querySelector<HTMLButtonElement>(
  "#restart-observation",
);
const observationTargetElements = findObservationTargetElements();
const {
  chooseButton: chooseObservationTargetButton,
  browseButton: browseObservationTargetsButton,
  closePickerButton: closeObservationTargetPickerButton,
  picker: observationTargetPicker,
  search: observationTargetSearch,
  list: observationTargetList,
  cancelDetachButton: cancelDetachTargetButton,
  confirmDetachButton: confirmDetachTargetButton,
} = observationTargetElements;
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
const liveObserverElements = findLiveObserverElements();
const liveSessionSummaryElements = findLiveSessionSummaryElements();
const {
  viewList: dataLayerViewList,
  backToEventsButton,
  pauseCaptureButton,
  resumeCaptureButton,
} = liveObserverElements;
const { copyPageUrlButton } = liveSessionSummaryElements;
const saveLiveSessionButton = document.querySelector<HTMLButtonElement>("#save-live-session");
const savedSessionSearch = document.querySelector<HTMLInputElement>("#saved-session-search");
const importSavedSessionButton = document.querySelector<HTMLButtonElement>("#import-saved-session");
const savedSessionFileInput = document.querySelector<HTMLInputElement>("#saved-session-file");
const savedSessionList = document.querySelector<HTMLElement>("#saved-session-list");
const savedSessionCount = document.querySelector<HTMLElement>("#saved-session-count");
const savedSessionConfirmation = document.querySelector<HTMLElement>("#saved-session-confirmation");
const cancelSavedSessionDeleteButton = document.querySelector<HTMLButtonElement>("#cancel-saved-session-delete");
const confirmSavedSessionDeleteButton = document.querySelector<HTMLButtonElement>("#confirm-saved-session-delete");
const eventLibraryEditorElements = findEventLibraryEditorElements();
const {
  search: eventTemplateSearch,
  saveLatestButton: saveLatestTemplateButton,
  json: eventTemplateJson,
  pushDestination: eventTemplatePushDestination,
  saveRevisionButton: saveTemplateRevisionButton,
  saveCopyButton: saveTemplateCopyButton,
  pushDraftButton: pushTemplateDraftButton,
  discardDraftButton: discardTemplateDraftButton,
} = eventLibraryEditorElements;
const schemaSearch = document.querySelector<HTMLInputElement>("#schema-search");
const createSchemaButton = document.querySelector<HTMLButtonElement>("#create-schema");
const importSchemaButton = document.querySelector<HTMLButtonElement>("#import-schema");
const exportSchemaButton = document.querySelector<HTMLButtonElement>("#export-schema");
const schemaCount = document.querySelector<HTMLElement>("#schema-count");
const schemaList = document.querySelector<HTMLElement>("#schema-list");
const schemaResult = document.querySelector<HTMLElement>("#schema-result");
const sequenceReplayElements = findSequenceReplayElements();
const allCommands = [...listCommands()];
let activeHotkeyKeymap: HotkeyKeymap =
  loadStoredHotkeyKeymap() ?? blankHotkeyKeymap(allCommands);
let pendingHotkeySequence: string[] = [];
let dataLayerSessionState: DataLayerSessionState = restoreSession();
let dataLayerObserverState: DataLayerHistoryObserverState = {
  pageObject: samplePageObject(),
  observedEntries: [],
  sourceEvents: [],
};
let stopLiveHistoryPushCapture: StopLiveHistoryPushCapture = () => {};
let liveHistoryCaptureGeneration = 0;
let presentedSourceEventCount = 0;
let observationRefreshTimeoutId: number | undefined;
let observationRefreshState = initialObservationRefreshState;
let liveObserverState: LiveObserverState = createLiveObserverState({
  pageUrl: globalThis.location.href,
  sources: [{ id: "event-history", name: "Event history", status: "Connected" }],
});
let savedSessionLibrary: SavedSessionLibrary = createSavedSessionLibrary();
let archivedSavedSession: ArchivedSession | undefined;
let eventTemplates: EditableEventTemplate[] = restoreEventTemplateLibrary(localStorage.getItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY));
let propertyEditorState: PropertyEditorState | undefined;
let schemas: SchemaDefinition[] = [];
let replaySequences: ReplaySequence[] = [];
let observationTargetState: ObservationTargetState = restoredObservationTargetState();
let pendingObservationTargetSwitchId: string | undefined;
let nextSessionSequence = 0;

function newDataLayerSessionId(tabId: number): string {
  nextSessionSequence += 1;
  const unique = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${nextSessionSequence}`;
  return `tab-${tabId}-session-${unique}`;
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

function restoredObservationTargetState(): ObservationTargetState {
  const session = dataLayerSessionState.session;
  if (session?.status !== "active" || session.windowId === undefined) {
    return createObservationTargetState();
  }
  return restoreAttachedObservationTarget(createObservationTarget({
    tabId: session.tabId,
    windowId: session.windowId,
    pageUrl: session.currentUrl,
    title: session.targetTitle ?? session.currentUrl,
    ...(session.targetOrigin ? { origin: session.targetOrigin } : {}),
    priorSession: true,
  }));
}

function setObservationTargetResult(result: string): void {
  setObservationTargetResultUi(observationTargetElements, result);
}

function renderObservationTargetContext(): void {
  renderObservationTargetContextUi(
    observationTargetElements,
    observationTargetState,
    getHistoryArrayPath(),
  );
  renderLiveContextActions();
}

function renderLiveContextActions(): void {
  const activeSession = dataLayerSessionState.session?.status === "active";
  const selectedTarget = selectedObservationTarget(observationTargetState);
  renderLiveSessionControls(
    {
      startTestingButton,
      endTestingButton,
      pauseCaptureButton,
      resumeCaptureButton,
    },
    { activeSession, captureStatus: liveObserverState.status },
  );
  if (chooseObservationTargetButton) chooseObservationTargetButton.hidden = activeSession || Boolean(selectedTarget);
}

function targetFromTab(
  tab: chrome.tabs.Tab,
  currentWindow = false,
): ObservationTarget | undefined {
  if (tab.id === undefined || tab.windowId === undefined || !tab.url) return undefined;
  return createObservationTarget({
    tabId: tab.id,
    windowId: tab.windowId,
    pageUrl: tab.url,
    title: tab.title || tab.url,
    activeTab: tab.active,
    currentWindow,
  });
}

function registerTargetTabs(
  tabs: readonly chrome.tabs.Tab[],
  options: { currentWindowId?: number; replaceDiscovery?: boolean } = {},
): void {
  const targets = tabs.flatMap((tab) => {
    const target = targetFromTab(tab, tab.windowId === options.currentWindowId);
    return target ? [target] : [];
  });
  if (options.replaceDiscovery) {
    observationTargetState = refreshDiscoveredObservationTargets(
      observationTargetState,
      targets,
    );
  } else {
    for (const target of targets) {
      observationTargetState = registerObservationTarget(observationTargetState, target);
    }
  }
  renderObservationTargetPicker();
  renderObservationTargetContext();
}

async function discoverCurrentObservationTarget(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) {
    setObservationTargetResult("Selection required");
    return;
  }
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const target = tabs[0] ? targetFromTab(tabs[0], true) : undefined;
  registerTargetTabs(tabs, target ? { currentWindowId: target.windowId } : {});
  if (target) {
    observationTargetState = selectObservationTarget(observationTargetState, target.id);
    setObservationTargetResult(`Selected ${target.title}`);
  } else {
    setObservationTargetResult("Selection required");
  }
  renderObservationTargetPicker();
  renderObservationTargetContext();
}

async function browseObservationTargets(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query || !chrome.permissions) {
    setObservationTargetResult("Browse all tabs is unavailable");
    return;
  }
  const allowed = await chrome.permissions.contains({ permissions: ["tabs"] });
  const granted = allowed || await chrome.permissions.request({ permissions: ["tabs"] });
  if (!granted) {
    setObservationTargetResult("Registered targets remain available");
    return;
  }
  const currentWindow = await chrome.windows?.getCurrent?.();
  registerTargetTabs(await chrome.tabs.query({}), {
    ...(currentWindow?.id === undefined ? {} : { currentWindowId: currentWindow.id }),
    replaceDiscovery: true,
  });
  setObservationTargetResult(`${observationTargetState.targets.length} eligible targets`);
}

function renderObservationTargetPicker(): void {
  const visible = findObservationTargets(observationTargetState, observationTargetSearch?.value ?? "");
  renderObservationTargetPickerUi(observationTargetElements, visible, {
    select: (target) => {
      observationTargetState = selectObservationTarget(observationTargetState, target.id);
      setObservationTargetResult(`Selected ${target.title}`);
      renderObservationTargetPicker();
      renderObservationTargetContext();
      closeObservationTargetPicker(observationTargetElements);
    },
    requestAccess: (target) => void requestSelectedTargetAccess(target),
  });
}

async function requestSelectedTargetAccess(target: ObservationTarget): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.permissions) return;
  const granted = await chrome.permissions.request({ origins: [`${target.origin}/*`] });
  if (!granted) {
    setObservationTargetResult("Permission required");
    return;
  }
  observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Ready");
  setObservationTargetResult(`Access granted for ${target.origin}`);
  renderObservationTargetPicker();
  renderObservationTargetContext();
}

async function recoverAttachedObservationTarget(): Promise<void> {
  const target = attachedObservationTarget(observationTargetState);
  if (!target || typeof chrome === "undefined" || !chrome.tabs?.get) return;
  try {
    const tab = await chrome.tabs.get(target.tabId);
    const recovered = targetFromTab(tab, target.currentWindow) ?? target;
    observationTargetState = restoreAttachedObservationTarget({
      ...recovered,
      priorSession: true,
    });
    const session = dataLayerSessionState.session;
    if (session?.status === "active") {
      const observation = await tabPageObservation(
        recovered.tabId,
        recovered.pageUrl,
        session.historyPath,
      );
      if (observation.pageAccessStatus === "page access available") {
        dataLayerObserverState = attachHistoryArrayObserver(
          {
            ...dataLayerObserverState,
            sessionState: dataLayerSessionState,
          },
          { ...observation, importExisting: false },
        );
        updateSessionFromObserverState();
        await startLiveHistoryCapture(observation);
        persistAndRenderObservationState();
        setObservationTargetResult(`Recovered ${recovered.title}`);
      } else {
        observationTargetState = updateObservationTargetAccess(
          observationTargetState,
          recovered.id,
          "Permission required",
        );
        setObservationTargetResult("Permission required — Request access");
      }
    }
  } catch {
    observationTargetState = updateObservationTargetAccess(
      observationTargetState,
      target.id,
      "Closed",
    );
    stopLiveHistoryCapture();
    setObservationTargetResult("Target unavailable — Choose target");
  }
  renderObservationTargetPicker();
  renderObservationTargetContext();
}

function revokeObservationTargetOrigins(origins: readonly string[]): void {
  const affected = observationTargetState.targets.filter((target) =>
    origins.some((originPattern) => originPattern.startsWith(target.origin)));
  for (const target of affected) {
    const attached = observationTargetState.attachedTargetId === target.id;
    observationTargetState = updateObservationTargetAccess(
      observationTargetState,
      target.id,
      "Permission required",
    );
    if (attached) {
      stopLiveHistoryCapture();
      setObservationTargetResult("Permission required — Request access");
    }
  }
  if (affected.length > 0) {
    renderObservationTargetPicker();
    renderObservationTargetContext();
  }
}

async function attachSelectedTarget(): Promise<void> {
  const decision = attachSelectedObservationTarget(observationTargetState);
  if (decision.result === "End current session before attaching selected target") {
    const current = attachedObservationTarget(observationTargetState);
    const next = selectedObservationTarget(observationTargetState);
    if (current && next) {
      pendingObservationTargetSwitchId = next.id;
      showDetachTargetConfirmation(
        observationTargetElements,
        `Keep ${current.title}, or end its session and attach to ${next.title}?`,
        { cancel: "Keep current session", confirm: "End and attach" },
      );
    }
    setObservationTargetResult(decision.result);
    return;
  }
  if (decision.result !== "Attached") {
    setObservationTargetResult(decision.result);
    return;
  }
  const target = selectedObservationTarget(decision.state);
  if (!target) return;
  const sessionWasActive = dataLayerSessionState.session?.status === "active";
  if (sessionWasActive) {
    setObservationTargetResult("End current session before attaching selected target");
    return;
  }
  const observation = await tabPageObservation(target.tabId, target.pageUrl, getHistoryArrayPath());
  if (observation.pageAccessStatus !== "page access available") {
    observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
    setObservationTargetResult("Permission required");
    renderObservationTargetContext();
    return;
  }
  observationTargetState = decision.state;
  const started = beginDataLayerTestingSession(dataLayerSessionState, liveObserverState, {
    id: newDataLayerSessionId(target.tabId),
    tabId: target.tabId,
    windowId: target.windowId,
    url: target.pageUrl,
    targetTitle: target.title,
    targetOrigin: target.origin,
    historyPath: getHistoryArrayPath(),
  });
  dataLayerSessionState = started.sessionState;
  liveObserverState = started.liveObserverState;
  dataLayerSessionState = captureEntry(dataLayerSessionState, { type: "page", url: target.pageUrl });
  dataLayerObserverState = attachHistoryArrayObserver({
    pageObject: dataLayerObserverState.pageObject,
    sessionState: dataLayerSessionState,
    observedEntries: [],
    sourceEvents: [],
  }, observation);
  presentedSourceEventCount = 0;
  updateSessionFromObserverState();
  await startLiveHistoryCapture(observation);
  persistAndRenderObservationState();
  setObservationTargetResult(`Attached to ${target.title}`);
  renderObservationTargetContext();
}

function beginDetachSelectedTarget(): void {
  const target = attachedObservationTarget(observationTargetState);
  if (!target) {
    setObservationTargetResult("No target is attached");
    return;
  }
  pendingObservationTargetSwitchId = undefined;
  showDetachTargetConfirmation(
    observationTargetElements,
    `Detach ${target.title} from the active testing session?`,
  );
}

async function confirmDetachSelectedTarget(): Promise<void> {
  const switchTargetId = pendingObservationTargetSwitchId;
  pendingObservationTargetSwitchId = undefined;
  stopLiveHistoryCapture();
  dataLayerSessionState = endDataLayerTestingSession(dataLayerSessionState);
  persistAndRenderSessionState();
  observationTargetState = detachObservationTarget(observationTargetState);
  closeDetachTargetConfirmation(observationTargetElements);
  if (switchTargetId) {
    observationTargetState = selectObservationTarget(
      observationTargetState,
      switchTargetId,
    );
    await attachSelectedTarget();
    return;
  }
  setObservationTargetResult("Target detached");
  renderObservationTargetContext();
}

function showDataLayerView(view: DataLayerView, focus = false): void {
  liveObserverState = { ...liveObserverState, view };
  localStorage.setItem("my-chrome-utilities.data-layer-view.v1", view);
  renderDataLayerView(liveObserverElements, view, focus);
}

function renderLiveObserver(): void {
  renderLiveObserverState(liveObserverElements, liveObserverState, openLiveInspector);
  renderLiveSessionSummary(liveSessionSummaryElements, currentLiveSessionSummary());
  renderLiveContextActions();
}

function currentLiveSessionSummary() {
  const session = dataLayerSessionState.session;
  const target = attachedObservationTarget(observationTargetState)
    ?? selectedObservationTarget(observationTargetState);
  return createLiveSessionSummary({
    testingState: session?.status === "active"
      ? (liveObserverState.status === "Paused" ? "Paused" : "Active")
      : "Ended",
    observerStatus: canonicalObserverStatus(),
    targetPage: session?.targetTitle ?? target?.title ?? "No target selected",
    pageUrl: session?.currentUrl ?? target?.pageUrl ?? "",
    observerPath: session?.historyPath ?? getHistoryArrayPath(),
    capturedEventCount: liveObserverState.events.length,
    connectedSourceCount: liveObserverState.sources.filter(({ status }) => status === "Connected").length,
  });
}

function canonicalObserverStatus() {
  switch (observerAttachmentStatus(dataLayerSessionState, dataLayerObserverState)) {
    case "attached": return "Connected" as const;
    case "needs sync": return "Waiting for path" as const;
    case "page access unavailable": return "Error" as const;
    case "inactive": return "Disconnected" as const;
  }
}

function closeInspectorAndReturnToEvents(): void {
  liveObserverState = closeLiveInspector(liveObserverState);
  renderLiveObserver();
  liveObserverElements.eventFeed?.querySelector<HTMLButtonElement>("button")?.focus();
}

function openLiveInspector(eventId: string): void {
  const split = globalThis.innerWidth >= 800;
  liveObserverState = selectLiveEvent(liveObserverState, eventId, split ? "split" : "stacked");
  const event = liveObserverState.events.find(({ id }) => id === eventId);
  if (event) renderLiveInspector(liveObserverElements, event, createLiveInspectorActions({
    currentPageUrl: () => liveObserverState.pageUrl,
    writeClipboard: async (text) => {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable.");
      }
      await navigator.clipboard.writeText(text);
    },
    storeTemplate: (template) => {
      eventTemplates = [...eventTemplates, template];
      persistEventTemplateLibrary();
      renderEventTemplateLibrary();
    },
    validationState: (selected) => validateEvent({
        sourceId: selected.sourceId,
        eventName: selected.name,
        payload: selected.payload,
        rawInput: selected.rawInput,
      }, schemas).state,
    updateValidation: (selectedId, validation) => {
      liveObserverState = { ...liveObserverState, events: liveObserverState.events.map((candidate) =>
        candidate.id === selectedId ? { ...candidate, validation } : candidate) };
      renderLiveObserver();
      updateLiveInspectorValidation(liveObserverElements, validation);
    },
  }));
  renderLiveObserver();
}

function setLiveSessionMessage(message: string): void {
  renderLiveSessionMessage(liveObserverElements, message);
}

async function copyLivePageUrl(): Promise<void> {
  const pageUrl = currentLiveSessionSummary().pageUrl;
  const writeText = navigator.clipboard?.writeText.bind(navigator.clipboard);
  const result = await copyLivePageUrlAction(pageUrl, writeText);
  if (result === "copied") setLiveSessionMessage("Page URL copied");
  if (result === "failed") setLiveSessionMessage("Page URL could not be copied");
}

function renderEventTemplateLibrary(): void {
  const templates = searchEventTemplates(eventTemplates, eventTemplateSearch?.value ?? "");
  renderEventLibraryEditor(
    eventLibraryEditorElements,
    templates,
    propertyEditorState,
    {
      edit: openTemplateEditor,
      duplicate: (template) => {
        const copy = saveAsTemplateCopy(openPropertyEditor(template), `${template.name} copy`);
        eventTemplates = [...eventTemplates, copy];
        persistEventTemplateLibrary();
        renderEventTemplateLibrary();
      },
      push: (template) => {
        openTemplateEditor(template);
        void pushCurrentTemplateDraft();
      },
    },
  );
}

function renderSchemas(): void {
  const visible = searchSchemas(schemas, schemaSearch?.value ?? "");
  if (schemaCount) schemaCount.textContent = `${visible.length} schemas`;
  if (schemaList) schemaList.replaceChildren(...visible.map((schema) => {
    const item = document.createElement("li"); const revise = document.createElement("button"); const duplicate = document.createElement("button"); const remove = document.createElement("button");
    item.textContent = `${schema.name} v${schema.version}: ${schema.assignments.map((assignment) => `${assignment.sourceId}/${assignment.eventName}/${assignment.target}`).join(", ") || "unassigned"}. `;
    revise.type = duplicate.type = remove.type = "button"; revise.textContent = "Edit as new version"; duplicate.textContent = "Duplicate"; remove.textContent = "Delete";
    revise.addEventListener("click", () => { const next = reviseSchema(schema, schema.document); schemas = [...schemas.filter(({ id }) => id !== schema.id), next]; renderSchemas(); });
    duplicate.addEventListener("click", () => { schemas = [...schemas, duplicateSchema(schema, `${schema.name} copy`)]; renderSchemas(); });
    remove.addEventListener("click", () => { schemas = schemas.filter(({ id }) => id !== schema.id); renderSchemas(); }); item.append(revise, duplicate, remove); return item;
  }));
}

function persistEventTemplateLibrary(): void {
  localStorage.setItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, serializeEventTemplateLibrary(eventTemplates));
}

function renderSequences(): void {
  renderSequenceReplay(sequenceReplayElements, replaySequences, (sequence) => {
    const templates: ReplayTemplate[] = eventTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      version: template.version,
      sourceId: template.sourceId,
      destination: template.destination,
      payload: template.payload,
    }));
    const adapters = liveObserverState.sources.map((source) => ({
      id: source.id,
      name: source.name,
      kind: "Data Layer",
      destination: "event.history",
      enabled: true,
      status: source.status,
      capabilities: ["push"] as const,
    }));
    const ready = readiness(sequence, templates, adapters);
    if (!ready.runnable) {
      setSequenceReplayResult(
        sequenceReplayElements,
        `Not runnable: ${ready.blocked.join(", ")}`,
      );
      return;
    }
    const record = runSequence(
      sequence,
      templates,
      adapters,
      liveObserverState.pageUrl,
      "Run all",
    );
    setSequenceReplayResult(
      sequenceReplayElements,
      `${record.result}: ${record.steps.length} steps.`,
    );
  });
}

function openTemplateEditor(template: EditableEventTemplate): void {
  propertyEditorState = openPropertyEditor(template);
  setEventLibraryResult(eventLibraryEditorElements,
                        `Editing ${template.name}; unsaved changes require keep, discard, or save.`);
  renderEventTemplateLibrary();
}

async function pushPayloadToSelectedTargetPage(
  request: SelectedTargetPushRequest,
): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.scripting?.executeScript) {
    throw new Error("Selected-page push is unavailable.");
  }
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId: request.tabId },
    world: "MAIN",
    args: [request.destination, request.eventName, request.payload],
    func: pushPayloadInPage,
  });
  const result = injection?.result as PagePushResult | undefined;
  if (!result?.success) {
    throw new Error(result?.result ?? "Selected-page push failed.");
  }
}

async function pushCurrentTemplateDraft(): Promise<void> {
  if (!propertyEditorState) return;
  const record = await pushTemplateToSelectedTarget(
    propertyEditorState,
    selectedObservationTarget(observationTargetState),
    pushPayloadToSelectedTargetPage,
  );
  setPushDestinationValidation(eventLibraryEditorElements, record.fieldError ?? "");
  if (record.fieldError) setEventLibraryValidation(eventLibraryEditorElements, record.fieldError);
  setEventLibraryResult(eventLibraryEditorElements, record.summary);
}

function renderSavedSessions(): void {
  const sessions = searchSavedSessions(savedSessionLibrary, savedSessionSearch?.value ?? "");
  if (savedSessionCount) savedSessionCount.textContent = `${sessions.length} saved sessions`;
  if (savedSessionList) {
    savedSessionList.replaceChildren(...sessions.map((session) => {
      const item = document.createElement("li");
      const open = document.createElement("button");
      const rename = document.createElement("button");
      const exportButton = document.createElement("button");
      const resumeCapture = document.createElement("button");
      const createSequenceButton = document.createElement("button");
      const remove = document.createElement("button");
      open.type = "button";
      open.textContent = `Open ${session.name}`;
      open.addEventListener("click", () => {
        archivedSavedSession = openSavedSession(savedSessionLibrary, session.id);
        if (savedSessionConfirmation) {
          savedSessionConfirmation.textContent = `Archived session: ${session.name}. Live observer is not running.`;
        }
        showDataLayerView("Sessions");
      });
      rename.type = "button";
      rename.textContent = "Rename";
      rename.addEventListener("click", () => {
        const name = globalThis.prompt("Saved session name", session.name);
        if (name?.trim()) {
          savedSessionLibrary = renameSavedSession(savedSessionLibrary, session.id, name.trim());
          renderSavedSessions();
        }
      });
      exportButton.type = "button";
      exportButton.textContent = "Export";
      exportButton.addEventListener("click", () => {
        downloadSavedSessionFile(session);
        if (savedSessionConfirmation) savedSessionConfirmation.textContent = `Exported saved session ${session.name}.`;
      });
      resumeCapture.type = "button";
      resumeCapture.textContent = "Resume capture";
      resumeCapture.addEventListener("click", () => {
        const archived = openSavedSession(savedSessionLibrary, session.id);
        const resumed = resumeSavedSession(archived, globalThis.location.href);
        archivedSavedSession = archived;
        liveObserverState = {
          ...liveObserverState,
          view: "Live",
          status: "Live",
          pageUrl: resumed.activeSession.pageUrl,
          events: [],
        };
        setLiveSessionMessage(`Capture resumed from ${session.name}; new session linked to archive.`);
        renderLiveObserver();
        showDataLayerView("Live");
      });
      createSequenceButton.type = "button";
      createSequenceButton.textContent = "Create sequence";
      createSequenceButton.addEventListener("click", () => {
        const templates: ReplayTemplate[] = eventTemplates.filter((template) => session.events.some((event) => `template:${event.id}` === template.id)).map((template) => ({ id: template.id, name: template.name, version: template.version, sourceId: template.sourceId, destination: template.destination, payload: template.payload }));
        replaySequences = [...replaySequences, createSequence(`sequence:${session.id}`, `${session.name} sequence`, session.id, templates)];
        renderSequences();
        if (savedSessionConfirmation) savedSessionConfirmation.textContent = `Created sequence from ${session.name}; saved session remains unchanged.`;
      });
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        savedSessionLibrary = requestSavedSessionDeletion(savedSessionLibrary, session.id);
        if (savedSessionConfirmation) savedSessionConfirmation.textContent = `Delete saved session ${session.name}?`;
        if (cancelSavedSessionDeleteButton) cancelSavedSessionDeleteButton.hidden = false;
        if (confirmSavedSessionDeleteButton) confirmSavedSessionDeleteButton.hidden = false;
      });
      const summary = savedSessionSummary(session);
      item.textContent = `${session.name}: ${summary.captureDate}, ${summary.pageScope}, ${summary.duration}, ${summary.sourceCount} sources, ${summary.eventCount} events, ${summary.validationSummary}. `;
      item.append(open, rename, exportButton, resumeCapture, createSequenceButton, remove);
      return item;
    }));
  }
}

function savedSessionFileName(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "saved-session"}.json`;
}

function downloadSavedSessionFile(session: Parameters<typeof exportSavedSession>[0]): void {
  const blob = new Blob([`${exportSavedSession(session)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = savedSessionFileName(session.name);
  link.click();
  URL.revokeObjectURL(url);
}

async function loadSavedSessionFile(): Promise<void> {
  const file = savedSessionFileInput?.files?.[0];
  if (!file) return;
  try {
    savedSessionLibrary = importSavedSession(savedSessionLibrary, await file.text());
    if (savedSessionConfirmation) savedSessionConfirmation.textContent = "Saved session imported as an immutable archive.";
    renderSavedSessions();
  } catch {
    if (savedSessionConfirmation) savedSessionConfirmation.textContent = "Saved session file must contain valid JSON.";
  } finally {
    if (savedSessionFileInput) savedSessionFileInput.value = "";
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

  renderLiveContextActions();
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
  renderLiveSessionSummary(
    liveSessionSummaryElements,
    currentLiveSessionSummary(),
  );
}

function updateSessionFromObserverState(): void {
  dataLayerSessionState =
    dataLayerObserverState.sessionState ?? dataLayerSessionState;
  syncCapturedEventsToLive();
}

function syncCapturedEventsToLive(): void {
  const events = dataLayerObserverState.sourceEvents ?? [];
  const pendingEvents = events.slice(presentedSourceEventCount);
  presentedSourceEventCount = events.length;
  for (const event of pendingEvents) {
    const source = liveObserverState.sources.find(({ id }) => id === event.sourceId);
    liveObserverState = recordLiveEvent(liveObserverState, {
      ...event,
      sourceName: source?.name ?? event.sourceId,
      ...(dataLayerObserverState.observer
        ? { destination: dataLayerObserverState.observer.historyPath }
        : {}),
    });
  }
  if (pendingEvents.length > 0) renderLiveObserver();
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

async function currentTargetObservation(
  historyPath: string,
): Promise<ActivePageObservationResult | undefined> {
  const target = attachedObservationTarget(observationTargetState)
    ?? selectedObservationTarget(observationTargetState);
  if (!target) {
    setObservationTargetResult("Selection required");
    return undefined;
  }
  return tabPageObservation(target.tabId, target.pageUrl, historyPath);
}

function cancelLiveHistoryCaptureRuntime(): void {
  liveHistoryCaptureGeneration += 1;
  stopLiveHistoryPushCapture();
  stopLiveHistoryPushCapture = () => {};
}

function stopLiveHistoryCapture(): void {
  cancelLiveHistoryCaptureRuntime();
  dataLayerObserverState = stopHistoryArrayObserver(dataLayerObserverState);
}

async function startLiveHistoryCapture(
  observation: ActivePageObservationResult,
): Promise<void> {
  cancelLiveHistoryCaptureRuntime();
  const captureGeneration = liveHistoryCaptureGeneration;
  try {
    const stopCapture = await startLiveHistoryPushCapture({
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
    if (captureGeneration !== liveHistoryCaptureGeneration) {
      stopCapture();
      return;
    }
    stopLiveHistoryPushCapture = stopCapture;
  } catch {
    if (captureGeneration === liveHistoryCaptureGeneration) {
      stopLiveHistoryPushCapture = () => {};
    }
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
    await attachSelectedTarget();
  }

  if (entry.commandId === "data-layer.end-testing") {
    stopLiveHistoryCapture();
    dataLayerSessionState = endDataLayerTestingSession(dataLayerSessionState);
    persistSession(dataLayerSessionState);
    renderSessionState();
    observationTargetState = detachObservationTarget(observationTargetState);
    renderObservationTargetContext();
  }

  if (entry.commandId === "data-layer.choose-observation-target") {
    showObservationTargetPicker(observationTargetElements);
    await discoverCurrentObservationTarget();
    observationTargetSearch?.focus();
  }

  if (entry.commandId === "data-layer.attach-selected-target") {
    await attachSelectedTarget();
  }

  if (entry.commandId === "data-layer.detach-observation-target") {
    beginDetachSelectedTarget();
  }
}

function recordCommandRun(entry: CommandRunRecord): void {
  void recordDataLayerCommandRun(entry);

  if (commandLog) {
    commandLog.textContent = entry.message;
  }

  if (entry.commandId === "data-layer.start-testing") {
    setLiveSessionMessage("Data Layer observation started");
  }
  if (entry.commandId === "data-layer.end-testing") {
    setLiveSessionMessage("Data Layer observation stopped");
  }
}

const commandRunContext = {
  record: recordCommandRun,
  showWorkspace,
  showDataLayerView: showDataLayerView,
};

const paletteController = createPaletteController({
  root: panelRoot,
  sidePanelContent,
  commands: allCommands,
  runCommand: (command) => runCommandById(command.id, commandRunContext),
});

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

startTestingButton?.addEventListener("click", () => {
  runCommandById("data-layer.start-testing", commandRunContext);
});
endTestingButton?.addEventListener("click", () => {
  runCommandById("data-layer.end-testing", commandRunContext);
});

workspaceTabsController.bind();
hotkeyEditor.bind();
paletteController.bind();

dataLayerViewList?.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[role=tab]");
  const view = button?.textContent as DataLayerView | null;
  if (view && dataLayerViews.includes(view)) showDataLayerView(view, true);
});

dataLayerViewList?.addEventListener("keydown", (event) => {
  const next = dataLayerViewForNavigationKey(liveObserverState.view, event.key);
  if (next) {
    event.preventDefault();
    showDataLayerView(next, true);
  }
});

pauseCaptureButton?.addEventListener("click", () => {
  liveObserverState = pauseCapture(liveObserverState);
  setLiveSessionMessage("Capture paused");
  renderLiveObserver();
});

resumeCaptureButton?.addEventListener("click", () => {
  liveObserverState = resumeCapture(liveObserverState);
  setLiveSessionMessage("Capture resumed");
  renderLiveObserver();
});

copyPageUrlButton?.addEventListener("click", () => {
  void copyLivePageUrl();
});

saveLiveSessionButton?.addEventListener("click", () => {
  const completed = {
    id: `live-${Date.now()}`,
    pageScope: liveObserverState.pageUrl,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    events: liveObserverState.events.map((event, index) => ({
      id: event.id,
      sourceId: event.sourceId,
      sourceName: event.sourceName ?? event.sourceId,
      name: event.name,
      payload: event.payload,
      rawInput: event.rawInput ?? event,
      pageUrl: event.pageUrl ?? liveObserverState.pageUrl,
      captureOrder: index + 1,
      provenance: event.provenance ?? {
        source: "live-observer",
        capturedAt: event.captureTime,
      },
    })),
    provenance: { source: "live-observer", capturedAt: new Date().toISOString() },
  };
  savedSessionLibrary = saveCompletedSession(
    savedSessionLibrary,
    completed,
    `Session ${savedSessionLibrary.sessions.length + 1}`,
  );
  renderSavedSessions();
  setLiveSessionMessage("Saved session created");
});

savedSessionSearch?.addEventListener("input", renderSavedSessions);

eventTemplateSearch?.addEventListener("input", renderEventTemplateLibrary);
schemaSearch?.addEventListener("input", renderSchemas);
createSchemaButton?.addEventListener("click", () => { const schema = createSchema(`Schema ${schemas.length + 1}`, 1, { type: "object" }); schemas = [...schemas, schema]; if (schemaResult) schemaResult.textContent = `Created ${schema.name}.`; renderSchemas(); });
importSchemaButton?.addEventListener("click", () => { const serialized = globalThis.prompt("Paste schema JSON"); if (!serialized) return; try { schemas = [...schemas, importSchema(serialized)]; renderSchemas(); } catch { if (schemaResult) schemaResult.textContent = "Schema import must contain valid JSON."; } });
exportSchemaButton?.addEventListener("click", () => { const schema = schemas[0]; if (schemaResult) schemaResult.textContent = schema ? exportSchema(schema) : "No schema to export."; });

saveLatestTemplateButton?.addEventListener("click", () => {
  const event = liveObserverState.events.at(-1);
  if (!event) {
    setEventLibraryResult(eventLibraryEditorElements,
                          "Capture an event before saving a template.");
    return;
  }
  const source = liveObserverState.sources.find(({ id }) => id === event.sourceId);
  const template = createEditableTemplate({
    id: event.id,
    sessionId: event.sessionId ?? `live:${liveObserverState.pageUrl}`,
    sourceId: event.sourceId,
    sourceKind: event.sourceKind ?? "page",
    name: event.name,
    captureTime: event.captureTime,
    pageUrl: event.pageUrl ?? liveObserverState.pageUrl,
    payload: event.payload,
    rawInput: event.rawInput ?? event,
    validation: event.validation ?? "Not checked",
    provenance: event.provenance ?? `captured:${event.sourceId}`,
  }, {
    name: event.name,
    destination: "event.history",
    sourceName: source?.name ?? event.sourceId,
  });
  eventTemplates = [...eventTemplates, template];
  persistEventTemplateLibrary();
  setEventLibraryResult(eventLibraryEditorElements,
                        `Saved ${template.name} to Library.`);
  renderEventTemplateLibrary();
});

eventTemplateJson?.addEventListener("input", () => {
  if (!propertyEditorState) return;
  propertyEditorState = updateDraftJson(propertyEditorState, eventTemplateJson.value);
  renderEventTemplateLibrary();
});

eventTemplatePushDestination?.addEventListener("input", () => {
  if (!propertyEditorState) return;
  propertyEditorState = setPushDestination(
    propertyEditorState,
    eventTemplatePushDestination.value,
  );
  setPushDestinationValidation(eventLibraryEditorElements, "");
  renderEventTemplateLibrary();
});

saveTemplateRevisionButton?.addEventListener("click", () => {
  if (!propertyEditorState) return;
  try {
    propertyEditorState = saveDraftRevision(propertyEditorState);
    eventTemplates = eventTemplates.map((template) => template.id === propertyEditorState?.template.id ? propertyEditorState.template : template);
    persistEventTemplateLibrary();
    setEventLibraryResult(eventLibraryEditorElements,
                          `Saved ${propertyEditorState.template.name} as version ${propertyEditorState.template.version}.`);
    renderEventTemplateLibrary();
  } catch (error) {
    setEventLibraryValidation(eventLibraryEditorElements,
                              error instanceof Error ? error.message : "Draft is invalid.");
  }
});

saveTemplateCopyButton?.addEventListener("click", () => {
  if (!propertyEditorState) return;
  try {
    const copy = saveAsTemplateCopy(propertyEditorState, `${propertyEditorState.template.name} copy`);
    eventTemplates = [...eventTemplates, copy];
    persistEventTemplateLibrary();
    setEventLibraryResult(eventLibraryEditorElements,
                          `Saved ${copy.name} as a distinct template.`);
    renderEventTemplateLibrary();
  } catch (error) {
    setEventLibraryValidation(eventLibraryEditorElements,
                              error instanceof Error ? error.message : "Draft is invalid.");
  }
});

pushTemplateDraftButton?.addEventListener("click", () => {
  void pushCurrentTemplateDraft();
});

discardTemplateDraftButton?.addEventListener("click", () => {
  if (!propertyEditorState) return;
  propertyEditorState = discardDraft(propertyEditorState);
  setEventLibraryResult(eventLibraryEditorElements, "Draft discarded.");
  renderEventTemplateLibrary();
});

importSavedSessionButton?.addEventListener("click", () => savedSessionFileInput?.click());
savedSessionFileInput?.addEventListener("change", () => {
  void loadSavedSessionFile();
});

cancelSavedSessionDeleteButton?.addEventListener("click", () => {
  savedSessionLibrary = cancelSavedSessionDeletion(savedSessionLibrary);
  if (savedSessionConfirmation) savedSessionConfirmation.textContent = "";
  cancelSavedSessionDeleteButton.hidden = true;
  if (confirmSavedSessionDeleteButton) confirmSavedSessionDeleteButton.hidden = true;
  renderSavedSessions();
});

confirmSavedSessionDeleteButton?.addEventListener("click", () => {
  savedSessionLibrary = confirmSavedSessionDeletion(savedSessionLibrary);
  if (savedSessionConfirmation) savedSessionConfirmation.textContent = "Saved session deleted.";
  confirmSavedSessionDeleteButton.hidden = true;
  if (cancelSavedSessionDeleteButton) cancelSavedSessionDeleteButton.hidden = true;
  renderSavedSessions();
});

backToEventsButton?.addEventListener("click", () => {
  closeInspectorAndReturnToEvents();
});

createKeymapButton?.addEventListener("click", createHotkeyKeymapFile);
updateKeymapButton?.addEventListener("click", updateHotkeyKeymapFile);
loadKeymapButton?.addEventListener("click", () => {
  keymapFileInput?.click();
});
keymapFileInput?.addEventListener("change", () => {
  void loadHotkeyKeymapFile();
});

historyPathInput?.addEventListener("input", () => {
  const typedPath = historyPathInput.value;
  const path = setHistoryArrayPath(typedPath);
  renderHistoryPath(path, typedPath);
  void currentTargetObservation(path).then((observation) => {
    if (!observation) return;
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
  void currentTargetObservation(getHistoryArrayPath()).then((observation) => {
    if (!observation) return;
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

chooseObservationTargetButton?.addEventListener("click", () => {
  showObservationTargetPicker(observationTargetElements);
  void discoverCurrentObservationTarget().then(() => observationTargetSearch?.focus());
});
browseObservationTargetsButton?.addEventListener("click", () => {
  showObservationTargetPicker(observationTargetElements);
  void browseObservationTargets();
});
closeObservationTargetPickerButton?.addEventListener("click", () => {
  closeObservationTargetPicker(observationTargetElements);
});
cancelDetachTargetButton?.addEventListener("click", () => {
  pendingObservationTargetSwitchId = undefined;
  closeDetachTargetConfirmation(observationTargetElements);
});
confirmDetachTargetButton?.addEventListener("click", () => {
  void confirmDetachSelectedTarget();
});
observationTargetSearch?.addEventListener("input", renderObservationTargetPicker);
observationTargetSearch?.addEventListener("keydown", (event) =>
  handleObservationTargetSearchKeydown(observationTargetElements, event));
observationTargetList?.addEventListener("keydown", (event) =>
  handleObservationTargetListKeydown(observationTargetElements, event));
observationTargetPicker?.addEventListener("keydown", (event) =>
  handleObservationTargetDialogKeydown(observationTargetElements, event));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && liveObserverState.inspectorEventId) {
    event.preventDefault();
    event.stopPropagation();
    closeInspectorAndReturnToEvents();
    return;
  }
  handleHotkeyKeydown(event);
}, true);

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message: unknown) => {
    if (isFocusHotkeysMessage(message)) {
      activateHotkeyFocus();
    }
  });
}

if (typeof chrome !== "undefined" && chrome.tabs?.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url !== undefined) {
      const current = observationTargetState.targets.find((target) => target.tabId === tabId);
      if (current) {
        observationTargetState = navigateObservationTarget(
          observationTargetState,
          tabId,
          changeInfo.url,
        );
        const updated = observationTargetState.targets.find(
          (target) => target.tabId === tabId,
        );
        if (updated && tab.title) {
          observationTargetState = registerObservationTarget(
            observationTargetState,
            { ...updated, title: tab.title },
          );
        }
        renderObservationTargetPicker();
        renderObservationTargetContext();
      }
    }
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

if (typeof chrome !== "undefined" && chrome.tabs?.onRemoved) {
  chrome.tabs.onRemoved.addListener((tabId) => {
    const target = observationTargetState.targets.find((candidate) => candidate.tabId === tabId);
    if (!target) return;
    observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Closed");
    if (dataLayerSessionState.session?.tabId === tabId) {
      stopLiveHistoryCapture();
      setObservationTargetResult("Target unavailable — Save session, End session, or Choose target");
      persistAndRenderObservationState();
    }
    renderObservationTargetPicker();
    renderObservationTargetContext();
  });
}

if (typeof chrome !== "undefined" && chrome.permissions?.onRemoved) {
  chrome.permissions.onRemoved.addListener((permissions) => {
    revokeObservationTargetOrigins(permissions.origins ?? []);
  });
}

renderHistoryPath(getHistoryArrayPath());
renderObservationTargetContext();
void recoverAttachedObservationTarget();
renderSessionState();
renderObserverState();
showWorkspace(workspaceTabsController.activeTab());
hotkeyEditor.render();
showDataLayerView("Live");
renderLiveObserver();
renderSavedSessions();
renderEventTemplateLibrary();
renderSchemas();
renderSequences();
activateHotkeyFocus();

export {
  DATA_LAYER_SESSION_STORAGE_KEY,
  HOTKEY_KEYMAP_STORAGE_KEY,
  navigateSession,
  sessionScope,
};
