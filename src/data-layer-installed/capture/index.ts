import {
  appendObservedHistoryEntry,
  attachHistoryArrayObserver,
  attachHistoryArraySnapshot,
  beginDataLayerTestingSession,
  beginObservedPageLoad,
  captureEntry,
  canonicalLiveObserverStatus,
  createLiveSessionSummary,
  createLiveNotificationController,
  findLiveGuidedWorkflowElements,
  findLiveSessionSummaryElements,
  findObservationTargetElements,
  findObservationTargets,
  handleObservationTargetDialogKeydown,
  handleObservationTargetListKeydown,
  handleObservationTargetSearchKeydown,
  createObservationTarget,
  createObservationTargetState,
  restoreAttachedObservationTarget,
  registerObservationTarget,
  refreshDiscoveredObservationTargets,
  selectObservationTarget,
  selectedObservationTarget,
  attachedObservationTarget,
  attachSelectedObservationTarget,
  updateObservationTargetAccess,
  initialObservationActivationState,
  initialObservationRefreshState,
  markObservationRefreshPageEntryCaptured,
  liveGuidedWorkflow,
  navigateObservationTarget,
  navigateSession,
  nextObservationActivation,
  nextObservationRefreshAttempt,
  observationActivationIsCurrent,
  observationRefreshDelay,
  observationRefreshRequestForPageLoad,
  observationRefreshRequestIsCurrent,
  observerAttachmentStatus,
  persistSession,
  restartObservation as restartHistoryObservation,
  restoreFreshSessionLiveObserver,
  restoreSession,
  samplePageObject,
  shouldRetryObservationRefresh,
  startFreshLiveSession,
  stopHistoryArrayObserver,
  renderLiveGuidedWorkflow,
  renderLiveSessionControls,
  renderLiveSessionSummary,
  type DataLayerHistoryObserverState,
  type DataLayerSessionState,
  type ObservationRefreshRequest,
  type ObservationTarget,
  type ObservationTargetState,
} from "../../utilities/data-layer/capture.js";
import { detachObservationTarget, endAndAttachObservationTarget } from "../../data-layer-observation-targets.js";
import {
  SAVED_EVENT_FEED_FILTER_STORAGE_KEY,
  SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY,
  SAVED_SESSION_LIBRARY_STORAGE_KEY,
  SAVED_SESSION_LIVE_FEED_STORAGE_KEY,
  applySavedEventFeedFilter,
  cancelSavedSessionDeletion,
  captureInspectorReturn,
  closeLiveInspector,
  commitSavedEventFeedFilterLibrary,
  confirmSavedSessionDeletion,
  confirmSessionSave,
  createSavedEventFeedFilter,
  createSessionSaveDraft,
  createLiveObserverState,
  exportSavedSession,
  deleteSavedEventFeedFilter,
  findLiveObserverElements,
  importSavedSession,
  openSavedSession,
  openSavedSessionLiveFeed,
  pauseCapture,
  recordBackgroundLiveEvent,
  recordLiveEvent,
  resetLiveObserverForSession,
  renameSavedEventFeedFilter,
  renameSavedSession,
  renderLiveObserverState,
  requestSavedSessionDeletion,
  restoreSavedEventFeedFilterLibrary,
  restoreSavedEventFeedWorkingView,
  restoreSavedSessionLibrary,
  restoreSavedSessionLiveFeed,
  restoreInspectorReturn,
  resumeSavedSession,
  resumeCapture,
  returnToCurrentLiveFeed,
  revalidateSavedSessionLiveFeed,
  savedSessionSummary,
  searchSavedSessions,
  selectLiveEvent,
  dataLayerViewForNavigationKey,
  serializeSavedSessionLibrary,
  serializeSavedSessionLiveFeed,
  serializeSavedEventFeedWorkingView,
  setDefaultSavedEventFeedFilter,
  setLiveQuery,
  updateSavedEventFeedFilter,
  updateSavedSessionLiveFeedView,
  type CompletedSession,
  type EventFeedQuery,
  type InspectorReturnSnapshot,
  type LiveEvent,
  type LiveObserverState,
  type LiveInspectorPresentationSnapshot,
  type SavedSessionLibrary,
  type SavedSessionLiveFeed,
  type SavedEventFeedFilterLibrary,
  type SessionSaveDraft,
} from "../../utilities/data-layer/live-inspection.js";

export interface InstalledSavedSessionListActions {
  open(id:string):void; rename(id:string, name:string):void; export(id:string):void;
  resume(id:string):void; createSequence(id:string):void; requestDelete(id:string):void;
}

export function renderInstalledSavedSessionList(
  list: HTMLElement | null,
  sessions: readonly SavedSession[],
  actions: InstalledSavedSessionListActions,
): void {
  if (!list) return;
  list.replaceChildren(...sessions.map((session) => {
    const item = document.createElement("li");
    item.append(Object.assign(document.createElement("strong"), { textContent:session.name }));
    const controls = [
      ["Open in Live feed", () => actions.open(session.id)],
      ["Rename", () => { const name=globalThis.prompt("Saved session name",session.name);if(name!==null)actions.rename(session.id,name); }],
      ["Export", () => actions.export(session.id)],
      ["Start linked capture", () => actions.resume(session.id)],
      ["Create sequence", () => actions.createSequence(session.id)],
      ["Delete", () => actions.requestDelete(session.id)],
    ] as const;
    for (const [label, activate] of controls) {
      const button=document.createElement("button");button.type="button";button.textContent=label;button.addEventListener("click",activate);item.append(button);
    }
    return item;
  }));
}
import { endDataLayerTestingSession } from "../../data-layer-session.js";
import type { SavedSession } from "../../data-layer-saved-sessions.js";
import type { SavedSessionValidationResult } from "../../data-layer-saved-session-live-feed.js";
import type { ActivePageObservationResult } from "../../active-page-observation.js";
import type { SourceEvent } from "../../data-layer-source.js";
import type { ObservationRefreshState } from "../../data-layer-observation-refresh.js";

export interface CaptureSessionStart {
  id: string;
  tabId: number;
  url: string;
  historyPath: string;
  windowId?: number;
  targetTitle?: string;
  targetOrigin?: string;
}

export interface CaptureTargetTab { tabId:number; windowId:number; pageUrl:string; title:string; activeTab?:boolean; currentWindow?:boolean }

export interface CaptureSavedFilterControls {
  library: SavedEventFeedFilterLibrary;
  activeFilterId?: string;
  feedback: string;
  select(id:string | undefined):void;
  create(name:string):void;
  update():boolean;
  revert():void;
  rename(name:string):void;
  delete():void;
  setDefault(id:string | undefined):void;
}

export interface CaptureTabUpdate {
  status?: "loading" | "complete";
  url?: string;
}

export interface CaptureObserverRuntimePorts {
  read(request:{ tabId:number; pageUrl:string; historyPath:string; pageLoadId:string }): Promise<ActivePageObservationResult>;
  startPush(actions:{ tabId?:number; historyPath:string;
    onSnapshot(snapshot:{ historyPath:string; rawValues:readonly unknown[] }):void;
    onEntry(entry:{ rawValue:unknown; timestamp:string }):void }): Promise<() => void>;
  present(event:SourceEvent, destination:string | undefined): LiveEvent;
  recordCapture(event:{ sessionId:string; pageUrl:string; sourceId:string; rawValue:unknown }):void;
  recordNavigation(event:{ sessionId:string; pageUrl:string }):void;
  subscribeTabUpdated(listener:(tabId:number, change:CaptureTabUpdate, tab:{ url?:string; title?:string }) => void): () => void;
  subscribeTabRemoved(listener:(tabId:number) => void): () => void;
  subscribePermissionsRemoved(listener:(origins:readonly string[]) => void): () => void;
}

export interface CaptureInstalledPorts {
  root: ParentNode;
  storage: Pick<Storage, "getItem" | "setItem"> & Partial<Pick<Storage, "removeItem">>;
  initialPageUrl(): string;
  initialSources(): LiveObserverState["sources"];
  sessionStart(): Promise<CaptureSessionStart>;
  changed(session: DataLayerSessionState, observer: LiveObserverState): void;
  runCommand(id: "data-layer.start-testing" | "data-layer.end-testing"): void;
  setLiveSessionMessage(message: string): void;
  presentEvent?(event:LiveEvent):LiveEvent;
  observerRuntime: CaptureObserverRuntimePorts;
  observation: {
    discover(scope:"current" | "all"): Promise<readonly CaptureTargetTab[]>;
    requestTabsAccess(): Promise<boolean>;
    requestOriginAccess(origin:string): Promise<boolean>;
    probe(target:ObservationTarget, historyPath:string, pageLoadId:string): Promise<ActivePageObservationResult>;
    render(targets:readonly ObservationTarget[], actions:{ select(id:string):void; requestAccess(id:string):void }): void;
  };
  savedSessions: {
    now(): string;
    readImportFile(): Promise<string | undefined>;
    download(name:string, serialized:string): void;
    validate(event:LiveEvent): SavedSessionValidationResult;
    render(sessions:readonly SavedSession[], actions:{
      open(id:string):void; rename(id:string, name:string):void; export(id:string):void;
      resume(id:string):void; createSequence(id:string):void; requestDelete(id:string):void;
    }): void;
    flowTests?(): CompletedSession["flowTests"];
    resetFlowTesting(): void;
    createReplaySequence(session:SavedSession): void;
  };
  savedFilters: {
    createId(): string;
    render(events:readonly LiveEvent[], query:EventFeedQuery, controls:CaptureSavedFilterControls,
      update:(query:EventFeedQuery) => void): void;
    dispose(): void;
  };
  inspector: {
    splitView(): boolean;
    capturePresentation(): LiveInspectorPresentationSnapshot;
    restorePresentation(snapshot:LiveInspectorPresentationSnapshot | undefined): void;
    restoreReturn(snapshot:InspectorReturnSnapshot): void;
    render(event:LiveEvent): void;
  };
  ui: {
    historyPath(): { path:string; fieldValue:string; status:"Selection required" | "Waiting for path" | "Ready" | "Unavailable" };
    chooseObservationTarget(): void;
    browseObservationTargets(): void;
    closeObservationTargetPicker(): void;
    searchObservationTargets(query: string): void;
    cancelDetachTarget(): void;
    confirmDetachTarget(): void;
    selectedTargetChanged?(): void;
    showDataLayerView(view: string): void;
    copyPageUrl(): void;
    reportMissingEvent(): void;
  };
}

export function createCaptureInstalledController(ports: CaptureInstalledPorts) {
  const SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY = "my-chrome-utilities.saved-through-event-count.v1";
  const startTestingButton = ports.root.querySelector<HTMLButtonElement>("#start-data-layer-testing");
  const endTestingButton = ports.root.querySelector<HTMLButtonElement>("#end-data-layer-testing");
  const liveObserverElements = findLiveObserverElements(ports.root);
  const historyPathDisplay = ports.root.querySelector<HTMLElement>("#history-path-display");
  const historyPathStatus = ports.root.querySelector<HTMLElement>("#history-path-status");
  const sessionHistoryPath = ports.root.querySelector<HTMLElement>("#session-history-path");
  const sessionWarning = ports.root.querySelector<HTMLElement>("#session-warning");
  const restartObservationButton = ports.root.querySelector<HTMLButtonElement>("#restart-observation");
  const observationTargetElements = findObservationTargetElements(ports.root);
  const {
    chooseButton:chooseObservationTargetButton,
    browseButton:browseObservationTargetsButton,
    closePickerButton:closeObservationTargetPickerButton,
    picker:observationTargetPicker,
    search:observationTargetSearch,
    list:observationTargetList,
    cancelDetachButton:cancelDetachTargetButton,
    confirmDetachButton:confirmDetachTargetButton,
  } = observationTargetElements;
  const pauseCaptureButton = liveObserverElements.pauseCaptureButton;
  const resumeCaptureButton = liveObserverElements.resumeCaptureButton;
  const liveSessionSummaryElements = findLiveSessionSummaryElements(ports.root);
  const liveGuidedWorkflowElements = findLiveGuidedWorkflowElements(ports.root);
  const dataLayerViewList = liveObserverElements.viewList;
  const backToEventsButton = liveObserverElements.backToEventsButton;
  const copyPageUrlButton = liveSessionSummaryElements.copyPageUrlButton;
  const saveLiveSessionButton = ports.root.querySelector<HTMLButtonElement>("#save-live-session");
  const startFreshSessionButton = ports.root.querySelector<HTMLButtonElement>("#start-fresh-session");
  const reportMissingEventButton = ports.root.querySelector<HTMLButtonElement>("#report-missing-event");
  const saveLiveSessionDialog = ports.root.querySelector<HTMLDialogElement>("#save-live-session-dialog");
  const saveLiveSessionForm = ports.root.querySelector<HTMLFormElement>("#save-live-session-form");
  const saveLiveSessionHeading = ports.root.querySelector<HTMLElement>("#save-live-session-heading");
  const saveLiveSessionName = ports.root.querySelector<HTMLInputElement>("#save-live-session-name");
  const saveLiveSessionSummary = ports.root.querySelector<HTMLElement>("#save-live-session-summary");
  const confirmSaveLiveSessionButton = ports.root.querySelector<HTMLButtonElement>("#confirm-save-live-session");
  const cancelSaveLiveSessionButton = ports.root.querySelector<HTMLButtonElement>("#cancel-save-live-session");
  const freshSessionConfirmation = ports.root.querySelector<HTMLDialogElement>("#fresh-session-confirmation");
  const freshSessionConfirmationHeading = ports.root.querySelector<HTMLElement>("#fresh-session-confirmation-heading");
  const freshSessionConfirmationSummary = ports.root.querySelector<HTMLElement>("#fresh-session-confirmation-summary");
  const saveAndStartFreshSessionButton = ports.root.querySelector<HTMLButtonElement>("#save-and-start-fresh-session");
  const discardAndStartFreshSessionButton = ports.root.querySelector<HTMLButtonElement>("#discard-and-start-fresh-session");
  const cancelFreshSessionButton = ports.root.querySelector<HTMLButtonElement>("#cancel-fresh-session");
  const savedSessionLiveBanner = ports.root.querySelector<HTMLElement>("#saved-session-live-banner");
  const savedSessionLiveSummary = ports.root.querySelector<HTMLElement>("#saved-session-live-summary");
  const savedSessionBackgroundStatus = ports.root.querySelector<HTMLElement>("#saved-session-background-status");
  const returnToCurrentLiveFeedButton = ports.root.querySelector<HTMLButtonElement>("#return-to-current-live-feed");
  const revalidateSavedSessionButton = ports.root.querySelector<HTMLButtonElement>("#revalidate-saved-session");
  const savedSessionValidationComparison = ports.root.querySelector<HTMLElement>("#saved-session-validation-comparison");
  const savedSessionSearch = ports.root.querySelector<HTMLInputElement>("#saved-session-search");
  const importSavedSessionButton = ports.root.querySelector<HTMLButtonElement>("#import-saved-session");
  const savedSessionFileInput = ports.root.querySelector<HTMLInputElement>("#saved-session-file");
  const savedSessionList = ports.root.querySelector<HTMLElement>("#saved-session-list");
  const savedSessionCount = ports.root.querySelector<HTMLElement>("#saved-session-count");
  const savedSessionConfirmation = ports.root.querySelector<HTMLElement>("#saved-session-confirmation");
  const cancelSavedSessionDeleteButton = ports.root.querySelector<HTMLButtonElement>("#cancel-saved-session-delete");
  const confirmSavedSessionDeleteButton = ports.root.querySelector<HTMLButtonElement>("#confirm-saved-session-delete");
  const liveEventsEmptyState = ports.root.querySelector<HTMLElement>("#live-events-empty-state");
  const liveSourceErrorState = ports.root.querySelector<HTMLElement>("#live-source-error-state");
  const savedSessionEmptyState = ports.root.querySelector<HTMLElement>("#saved-session-empty-state");
  const liveNotificationController = createLiveNotificationController(
    (message) => ports.setLiveSessionMessage(message),
    (clear, delayMs) => { globalThis.setTimeout(clear, delayMs); },
  );
  let mounted = false;
  let dataLayerSessionState = restoreSession(ports.storage);
  let liveObserverState = createLiveObserverState({ pageUrl:ports.initialPageUrl(), sources:ports.initialSources() });
  liveObserverState = restoreFreshSessionLiveObserver(liveObserverState, dataLayerSessionState);
  let dataLayerObserverState: DataLayerHistoryObserverState = {
    pageObject:samplePageObject(), observedEntries:[], sourceEvents:[],
  };
  let stopLiveHistoryPushCapture: (() => void) | undefined;
  let liveHistoryActivationState = initialObservationActivationState;
  let presentedSourceEventCount = 0;
  let observationRefreshState: ObservationRefreshState = initialObservationRefreshState;
  let savedEventFeedFilterLibrary: SavedEventFeedFilterLibrary = restoreSavedEventFeedFilterLibrary(
    ports.storage.getItem(SAVED_EVENT_FEED_FILTER_STORAGE_KEY),
  );
  let savedEventFeedFilterFeedback = "";
  let restoredSavedEventFeedWorkingView = false;
  const restoredSavedEventFeedView = restoreSavedEventFeedWorkingView(
    ports.storage.getItem(SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY),
    dataLayerSessionState.session?.id, savedEventFeedFilterLibrary,
  );
  if (restoredSavedEventFeedView) {
    liveObserverState = { ...liveObserverState, query:restoredSavedEventFeedView.query,
      ...(restoredSavedEventFeedView.activeFilterId ? { savedFilterId:restoredSavedEventFeedView.activeFilterId } : {}) };
    restoredSavedEventFeedWorkingView = true;
  }
  if (!restoredSavedEventFeedWorkingView && savedEventFeedFilterLibrary.defaultFilterId) {
    const defaultFilter = savedEventFeedFilterLibrary.filters.find(({ id }) => id === savedEventFeedFilterLibrary.defaultFilterId);
    if (defaultFilter) liveObserverState = { ...liveObserverState,
      query:applySavedEventFeedFilter({ conditions:[] }, defaultFilter), savedFilterId:defaultFilter.id };
  }
  let savedSessionLibrary: SavedSessionLibrary = restoreSavedSessionLibrary(
    ports.storage.getItem(SAVED_SESSION_LIBRARY_STORAGE_KEY),
  );
  let savedSessionLiveFeed: SavedSessionLiveFeed | undefined = restoreSavedSessionLiveFeed(
    ports.storage.getItem(SAVED_SESSION_LIVE_FEED_STORAGE_KEY), savedSessionLibrary,
  );
  if (savedSessionLiveFeed) liveObserverState = savedSessionLiveFeed.savedView;
  let archivedSavedSession: ReturnType<typeof openSavedSession> | undefined;
  let pendingSessionSaveDraft: SessionSaveDraft | undefined;
  let startFreshAfterSessionSave = false;
  let nextSessionSequence = 0;
  let savedThroughEventCount = Math.max(0,
    Number(ports.storage.getItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY)) || 0,
  );
  let inspectorReturnSnapshot: InspectorReturnSnapshot | undefined;
  const liveInspectorPresentation = new Map<string, LiveInspectorPresentationSnapshot>();
  let importGeneration = 0;
  let observationRefreshTimeoutId: number | undefined;
  let unsubscribeTabUpdated: (() => void) | undefined;
  let unsubscribeTabRemoved: (() => void) | undefined;
  let unsubscribePermissionsRemoved: (() => void) | undefined;
  let attachedTargetRecoveryGeneration = 0;
  function restoredObservationTargetState(): ObservationTargetState {
    const session = dataLayerSessionState.session;
    return session?.status === "active" && session.windowId !== undefined
      ? restoreAttachedObservationTarget(createObservationTarget({ tabId:session.tabId, windowId:session.windowId,
        pageUrl:session.currentUrl, title:session.targetTitle ?? session.currentUrl,
        ...(session.targetOrigin ? { origin:session.targetOrigin } : {}), priorSession:true }))
      : createObservationTargetState();
  }
  let observationTargetState = restoredObservationTargetState();
  let pendingObservationTargetSwitchId: string | undefined;
  let targetDiscoveryGeneration = 0;
  function renderHistoryPath(path: string, fieldValue = path,
    status: "Selection required" | "Waiting for path" | "Ready" | "Unavailable" = "Selection required"): void {
    if (historyPathDisplay) historyPathDisplay.textContent = path;
    if (historyPathStatus) historyPathStatus.textContent = status === "Waiting for path"
      ? "Waiting for observation path" : status;
    if (sessionHistoryPath) sessionHistoryPath.textContent = fieldValue;
    if (sessionWarning) sessionWarning.hidden = status !== "Unavailable";
  }
  const setObservationTargetResult = (result: string): void => { if (observationTargetElements.result) observationTargetElements.result.textContent = result; };
  const renderObservationTargetContext = (): void => {
    const context = ports.ui.historyPath();
    renderHistoryPath(context.path, context.fieldValue, context.status);
    observationTargetList?.setAttribute("aria-live", "polite");
    renderLiveContextActions();
  };
  async function restartObservationAction(): Promise<void> {
    const observation = await currentTargetObservation(ports.ui.historyPath().path);
    if (!mounted || !observation) return;
    dataLayerObserverState = restartHistoryObservation(dataLayerSessionState, dataLayerObserverState, observation);
    updateSessionFromObserverState(); persistAndRenderSessionState();
    restartLiveHistoryCaptureIfActive(observation); renderObserverState();
  }
  const requestObservationRestart = (): void => { restartObservationAction().catch(() => {}); };
  function targetFromTab(tab: CaptureTargetTab): ObservationTarget {
    return createObservationTarget({ tabId:tab.tabId, windowId:tab.windowId, pageUrl:tab.pageUrl, title:tab.title,
      ...(tab.activeTab !== undefined ? { activeTab:tab.activeTab } : {}), ...(tab.currentWindow !== undefined ? { currentWindow:tab.currentWindow } : {}) });
  }
  function registerTargetTabs(tabs: readonly CaptureTargetTab[], replaceDiscovery = false): void {
    const targets = tabs.map(targetFromTab); observationTargetState = replaceDiscovery
      ? refreshDiscoveredObservationTargets(observationTargetState, targets)
      : targets.reduce(registerObservationTarget, observationTargetState); renderObservationTargetPicker();
  }
  async function discoverCurrentObservationTarget(): Promise<void> {
    const generation = ++targetDiscoveryGeneration; observationTargetList?.replaceChildren?.(); setObservationTargetResult("Looking for the active tab…");
    const tabs = await ports.observation.discover("current");
    if (!mounted || generation !== targetDiscoveryGeneration) return; registerTargetTabs(tabs);
    const target = tabs[0] ? targetFromTab(tabs[0]) : undefined;
    if (target) { observationTargetState = selectObservationTarget(observationTargetState, target.id); setObservationTargetResult(`Selected ${target.title}`); ports.ui.selectedTargetChanged?.(); }
    else setObservationTargetResult("Selection required"); renderObservationTargetPicker();
  }
  const chooseObservationTarget = (): void => { void discoverCurrentObservationTarget(); };
  async function browseObservationTargets(): Promise<void> {
    const generation = ++targetDiscoveryGeneration;
    if (!await ports.observation.requestTabsAccess()) { if (generation === targetDiscoveryGeneration) setObservationTargetResult("Registered targets remain available"); return; }
    const tabs = await ports.observation.discover("all"); if (!mounted || generation !== targetDiscoveryGeneration) return;
    registerTargetTabs(tabs, true); setObservationTargetResult(`${observationTargetState.targets.length} eligible targets`);
    if (observationTargetPicker) observationTargetPicker.hidden = false;
  }
  const closeObservationTargetPicker = (): void => {
    if (observationTargetPicker) observationTargetPicker.hidden = true;
    ports.ui.closeObservationTargetPicker();
  };
  function renderObservationTargetPicker(): void {
    const targets = findObservationTargets(observationTargetState, observationTargetSearch?.value ?? "");
    ports.observation.render(targets, { select:(id) => { observationTargetState = selectObservationTarget(observationTargetState, id);
      setObservationTargetResult(`Selected ${selectedObservationTarget(observationTargetState)?.title ?? id}`); renderObservationTargetPicker();
      renderObservationTargetContext(); closeObservationTargetPicker(); ports.ui.selectedTargetChanged?.(); },
    requestAccess:(id) => { const target = observationTargetState.targets.find((candidate) => candidate.id === id); if (target) void requestSelectedTargetAccess(target); } });
  }
  const searchObservationTargets = (): void => renderObservationTargetPicker();
  const navigateObservationTargetSearch = (event: KeyboardEvent): void =>
    handleObservationTargetSearchKeydown(observationTargetElements, event);
  const navigateObservationTargetList = (event: KeyboardEvent): void =>
    handleObservationTargetListKeydown(observationTargetElements, event);
  const navigateObservationTargetDialog = (event: KeyboardEvent): void =>
    handleObservationTargetDialogKeydown(observationTargetElements, event);
  const liveTargetPermissionRecoveryCoordinator = {
    async requestAccess(target:ObservationTarget):Promise<boolean> {
      const granted = await ports.observation.requestOriginAccess(target.origin); if (!mounted) return false;
      observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, granted ? "Ready" : "Permission required");
      renderObservationTargetPicker(); renderObservationTargetContext(); return granted;
    },
  };
  async function requestSelectedTargetAccess(target: ObservationTarget): Promise<void> {
    const granted = await liveTargetPermissionRecoveryCoordinator.requestAccess(target); if (!mounted) return;
    if (!granted) { setObservationTargetResult("Permission required"); return; }
    setObservationTargetResult(`Access granted for ${target.origin}`); renderObservationTargetPicker();
    renderObservationTargetContext(); ports.ui.selectedTargetChanged?.();
  }
  async function attachSelectedTarget(): Promise<void> {
    const decision = attachSelectedObservationTarget(observationTargetState);
    if (decision.result === "End current session before attaching selected target") {
      pendingObservationTargetSwitchId = decision.state.selectedTargetId; setObservationTargetResult(decision.result); return;
    }
    const target = selectedObservationTarget(decision.state); if (decision.result !== "Attached" || !target) { setObservationTargetResult(decision.result); return; }
    const observation = await ports.observation.probe(target, ports.ui.historyPath().path, observationPageLoadId(target.tabId));
    if (observation.pageAccessStatus !== "page access available") { observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
      setObservationTargetResult("Permission required"); return; }
    observationTargetState = decision.state; setObservationTargetResult("Attached"); renderObservationTargetPicker();
  }
  function beginDetachSelectedTarget(): void { pendingObservationTargetSwitchId = undefined;
    setObservationTargetResult(attachedObservationTarget(observationTargetState) ? "Confirm detach target" : "No target is attached"); }
  async function confirmDetachSelectedTarget(): Promise<void> {
    const attached = attachedObservationTarget(observationTargetState); if (attached) stopLiveHistoryCapture();
    const switchId = pendingObservationTargetSwitchId; pendingObservationTargetSwitchId = undefined;
    observationTargetState = detachObservationTarget(observationTargetState);
    if (switchId) { const decision = endAndAttachObservationTarget(observationTargetState, switchId); observationTargetState = decision.state;
      const target = attachedObservationTarget(observationTargetState); if (target) { const observation = await ports.observation.probe(target, ports.ui.historyPath().path, observationPageLoadId(target.tabId));
        if (observation.pageAccessStatus !== "page access available") observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required"); } }
    setObservationTargetResult( switchId ? "Attached" : "Detached"); renderObservationTargetPicker();
  }
  const cancelDetachTarget = (): void => { pendingObservationTargetSwitchId = undefined; setObservationTargetResult("Detach cancelled"); };
  const confirmDetachTarget = (): void => { void confirmDetachSelectedTarget(); };
  function showDataLayerView(view: string): void { ports.ui.showDataLayerView(view); }
  const selectDataLayerView = (event: Event): void => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>("[role=tab]");
    if (button?.textContent) showDataLayerView(button.textContent);
  };
  const navigateDataLayerView = (event: KeyboardEvent): void => {
    const next = dataLayerViewForNavigationKey(liveObserverState.view, event.key);
    if (!next) return; event.preventDefault(); showDataLayerView(next);
    dataLayerViewList?.querySelector<HTMLButtonElement>(`#data-layer-view-${next.toLowerCase()}`)?.focus();
  };
  function renderLiveContextActions(): void {
    const activeSession = dataLayerSessionState.session?.status === "active";
    const selectedTarget = selectedObservationTarget(observationTargetState);
    const status = ports.ui.historyPath().status;
    const pathStatus = status === "Ready" || status === "Waiting for path" || status === "Selection required"
      ? status : "Selection required";
    renderLiveSessionControls({ startTestingButton, endTestingButton, pauseCaptureButton, resumeCaptureButton },
      { activeSession, captureStatus:liveObserverState.status });
    renderLiveGuidedWorkflow(liveGuidedWorkflowElements, liveGuidedWorkflow({ activeSession,
      ...(selectedTarget ? { selectedTarget } : {}), pathStatus }));
    if (startFreshSessionButton) { startFreshSessionButton.hidden = !activeSession;
      startFreshSessionButton.disabled = Boolean(savedSessionLiveFeed); }
  }
  function currentLiveSessionSummary() {
    if (savedSessionLiveFeed) return createLiveSessionSummary({ testingState:"Ended", observerStatus:"Disconnected",
      targetPage:`${savedSessionLiveFeed.session.name} · Read-only archive`, pageUrl:savedSessionLiveFeed.session.pageScope,
      observerPath:"Saved session", capturedEventCount:savedSessionLiveFeed.savedView.events.length, connectedSourceCount:0 });
    const session = dataLayerSessionState.session;
    const target = attachedObservationTarget(observationTargetState) ?? selectedObservationTarget(observationTargetState);
    return createLiveSessionSummary({ testingState:session?.status === "active"
      ? (liveObserverState.status === "Paused" ? "Paused" : "Active") : "Ended",
      observerStatus:canonicalLiveObserverStatus(observerAttachmentStatus(dataLayerSessionState, dataLayerObserverState)),
      targetPage:session?.targetTitle ?? target?.title ?? "No target selected",
      pageUrl:session?.currentUrl ?? target?.pageUrl ?? "", observerPath:session?.historyPath ?? ports.ui.historyPath().path,
      capturedEventCount:liveObserverState.events.length,
      connectedSourceCount:liveObserverState.sources.filter(({ status }) => status === "Connected").length });
  }
  function persistSavedEventFeedWorkingView(): void {
    if (savedSessionLiveFeed) { synchronizeSavedSessionFeedView(); return; }
    const sessionId = dataLayerSessionState.session?.id;
    if (!sessionId) {
      if (ports.storage.removeItem) ports.storage.removeItem(SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY);
      else ports.storage.setItem(SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY, "");
      return;
    }
    ports.storage.setItem(SAVED_EVENT_FEED_FILTER_WORKING_STORAGE_KEY, serializeSavedEventFeedWorkingView(
      sessionId, liveObserverState.query ?? { conditions:[] }, liveObserverState.savedFilterId,
    ));
  }
  function installSavedEventFeedWorkingQuery(query: EventFeedQuery, activeFilterId?: string): void {
    const { savedFilterId:_previous, ...state } = setLiveQuery(liveObserverState, query);
    liveObserverState = { ...state, ...(activeFilterId ? { savedFilterId:activeFilterId } : {}) };
    persistSavedEventFeedWorkingView();
  }
  function installDefaultSavedEventFeedFilterForNewSession(): void {
    const filter = savedEventFeedFilterLibrary.filters.find(({ id }) => id === savedEventFeedFilterLibrary.defaultFilterId);
    installSavedEventFeedWorkingQuery(filter ? applySavedEventFeedFilter({ conditions:[] }, filter) : { conditions:[] }, filter?.id);
  }
  function commitSavedEventFeedFilters(proposed: SavedEventFeedFilterLibrary, failureFeedback: string): boolean {
    const result = commitSavedEventFeedFilterLibrary(savedEventFeedFilterLibrary, proposed,
      (serialized) => ports.storage.setItem(SAVED_EVENT_FEED_FILTER_STORAGE_KEY, serialized), failureFeedback);
    savedEventFeedFilterLibrary = result.library; savedEventFeedFilterFeedback = result.feedback;
    return result.committed;
  }
  function applyConfiguredSavedEventFeedFilter(filterId: string | undefined): void {
    const filter = savedEventFeedFilterLibrary.filters.find(({ id }) => id === filterId);
    installSavedEventFeedWorkingQuery(filter
      ? applySavedEventFeedFilter(liveObserverState.query ?? { conditions:[] }, filter) : { conditions:[] }, filter?.id);
    savedEventFeedFilterFeedback = filter ? `${filter.name} applied` : "All events applied";
    renderLiveObserver();
  }
  function renderSavedEventFeedFilterResult(): void { renderLiveObserver(); }
  function savedEventFeedFilterControls(): CaptureSavedFilterControls {
    return { library:savedEventFeedFilterLibrary,
      ...(liveObserverState.savedFilterId ? { activeFilterId:liveObserverState.savedFilterId } : {}),
      feedback:savedEventFeedFilterFeedback,
      select:applyConfiguredSavedEventFeedFilter,
      create:(name) => { try {
        const created = createSavedEventFeedFilter(savedEventFeedFilterLibrary, name,
          liveObserverState.query ?? { conditions:[] }, ports.savedFilters.createId());
        if (commitSavedEventFeedFilters(created.library, "Saving saved filter failed")) {
          installSavedEventFeedWorkingQuery(applySavedEventFeedFilter({ conditions:[] }, created.filter), created.filter.id);
          savedEventFeedFilterFeedback = `Saved ${created.filter.name}`;
        }
      } catch (error) { savedEventFeedFilterFeedback = error instanceof Error ? error.message : "Saving saved filter failed"; }
      renderSavedEventFeedFilterResult(); },
      update:() => { if (!liveObserverState.savedFilterId) return false; let committed = false;
        try { const updated = updateSavedEventFeedFilter(savedEventFeedFilterLibrary, liveObserverState.savedFilterId,
          liveObserverState.query ?? { conditions:[] });
          if (commitSavedEventFeedFilters(updated.library, "Updating saved filter failed")) {
            installSavedEventFeedWorkingQuery(applySavedEventFeedFilter({ conditions:[] }, updated.filter), updated.filter.id);
            savedEventFeedFilterFeedback = `Updated ${updated.filter.name}`; committed = true;
          }
        } catch { savedEventFeedFilterFeedback = "Updating saved filter failed"; }
        renderSavedEventFeedFilterResult(); return committed; },
      revert:() => { const filter = savedEventFeedFilterLibrary.filters.find(({ id }) => id === liveObserverState.savedFilterId);
        if (filter) { installSavedEventFeedWorkingQuery(applySavedEventFeedFilter({ conditions:[] }, filter), filter.id);
          savedEventFeedFilterFeedback = `Reverted ${filter.name}`; }
        renderSavedEventFeedFilterResult(); },
      rename:(name) => { if (!liveObserverState.savedFilterId) return;
        try { const renamed = renameSavedEventFeedFilter(savedEventFeedFilterLibrary, liveObserverState.savedFilterId, name);
          if (commitSavedEventFeedFilters(renamed.library, "Renaming saved filter failed")) savedEventFeedFilterFeedback = `Renamed to ${renamed.filter.name}`;
        } catch (error) { savedEventFeedFilterFeedback = error instanceof Error ? error.message : "Renaming saved filter failed"; }
        renderSavedEventFeedFilterResult(); },
      delete:() => { if (!liveObserverState.savedFilterId) return;
        const deleted = deleteSavedEventFeedFilter(savedEventFeedFilterLibrary, liveObserverState.savedFilterId,
          liveObserverState.query ?? { conditions:[] });
        if (commitSavedEventFeedFilters(deleted.library, "Deleting saved filter failed")) {
          installSavedEventFeedWorkingQuery(deleted.workingQuery); savedEventFeedFilterFeedback = "Saved filter deleted; working conditions retained";
        }
        renderSavedEventFeedFilterResult(); },
      setDefault:(filterId) => { try { const proposed = setDefaultSavedEventFeedFilter(savedEventFeedFilterLibrary, filterId).library;
          if (commitSavedEventFeedFilters(proposed, "Setting default failed")) savedEventFeedFilterFeedback = filterId ? "Default saved filter set" : "Default saved filter removed";
        } catch { savedEventFeedFilterFeedback = "Setting default failed"; }
        renderSavedEventFeedFilterResult(); },
    };
  }
  function persistSavedSessionLibrary(): void {
    ports.storage.setItem(SAVED_SESSION_LIBRARY_STORAGE_KEY, serializeSavedSessionLibrary(savedSessionLibrary));
  }
  function persistSavedSessionFeed(): void {
    if (savedSessionLiveFeed) {
      ports.storage.setItem(SAVED_SESSION_LIVE_FEED_STORAGE_KEY, serializeSavedSessionLiveFeed(savedSessionLiveFeed));
    } else if (ports.storage.removeItem) ports.storage.removeItem(SAVED_SESSION_LIVE_FEED_STORAGE_KEY);
    else ports.storage.setItem(SAVED_SESSION_LIVE_FEED_STORAGE_KEY, "");
  }
  function currentUnsavedEventCount(): number {
    const events = savedSessionLiveFeed?.currentView.events ?? liveObserverState.events;
    return Math.max(0, events.length - savedThroughEventCount);
  }
  function testingEndedMessage(): string {
    const unsaved = currentUnsavedEventCount();
    return unsaved ? `Testing ended; ${unsaved} captured events remain unsaved.` : "Testing ended";
  }
  function synchronizeSavedSessionFeedView(scrollTop = liveObserverElements.eventList?.scrollTop ?? 0): void {
    if (!savedSessionLiveFeed) return;
    savedSessionLiveFeed = updateSavedSessionLiveFeedView(savedSessionLiveFeed, {
      query:liveObserverState.query,
      ...(liveObserverState.inspectorEventId ? { inspectorEventId:liveObserverState.inspectorEventId } : {}),
      listVisible:liveObserverState.listVisible,
      scrollTop,
    });
    persistSavedSessionFeed();
  }
  const synchronizeSavedSessionFeedScroll = (): void => synchronizeSavedSessionFeedView();
  function openSessionInLiveFeed(session: SavedSession): void {
    const currentView = savedSessionLiveFeed?.currentView ?? liveObserverState;
    savedSessionLiveFeed = openSavedSessionLiveFeed(currentView, session, {
      scrollTop:liveObserverElements.eventList?.scrollTop ?? 0,
    });
    liveObserverState = savedSessionLiveFeed.savedView;
    persistSavedSessionFeed();
    showDataLayerView("Live");
    renderLiveObserver();
    if (liveObserverElements.eventList) liveObserverElements.eventList.scrollTop = savedSessionLiveFeed.savedScrollTop;
    renderSavedSessionLiveBanner();
  }
  function startLinkedCaptureFromSavedSession(session: SavedSession): void {
    const archived = openSavedSession(savedSessionLibrary, session.id);
    const resumed = resumeSavedSession(archived, ports.initialPageUrl());
    const currentView = savedSessionLiveFeed?.currentView ?? liveObserverState;
    const previousSession = dataLayerSessionState.session;
    archivedSavedSession = archived;
    savedSessionLiveFeed = undefined;
    persistSavedSessionFeed();
    savedThroughEventCount = 0;
    ports.storage.setItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY, "0");
    liveObserverState = { ...currentView, view:"Live", status:"Live", pageUrl:resumed.activeSession.pageUrl,
      events:[], listVisible:true };
    dataLayerSessionState = { session:{ id:resumed.activeSession.id, status:"active",
      tabId:previousSession?.tabId ?? 0,
      ...(previousSession?.windowId === undefined ? {} : { windowId:previousSession.windowId }),
      historyPath:previousSession?.historyPath ?? "",
      startUrl:resumed.activeSession.pageUrl, currentUrl:resumed.activeSession.pageUrl,
      targetTitle:previousSession?.targetTitle ?? resumed.activeSession.pageUrl,
      parentSavedSessionId:resumed.activeSession.parentSavedSessionId, timeline:[] } };
    ports.savedSessions.resetFlowTesting();
    installDefaultSavedEventFeedFilterForNewSession();
    publish();
    ports.setLiveSessionMessage(`Linked capture started from ${session.name}; 0 events in the new session.`);
    showDataLayerView("Live");
    renderSavedSessionLiveBanner();
  }
  function savedSessionFileName(name: string): string {
    return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "saved-session"}.json`;
  }
  function downloadSavedSessionFile(session: SavedSession): void {
    ports.savedSessions.download(savedSessionFileName(session.name), `${exportSavedSession(session)}\n`);
  }
  function renderSavedSessions(): void {
    const sessions = searchSavedSessions(savedSessionLibrary, savedSessionSearch?.value ?? "");
    if (savedSessionEmptyState) savedSessionEmptyState.hidden = sessions.length > 0;
    if (savedSessionCount) savedSessionCount.textContent = `${sessions.length} saved sessions`;
    ports.savedSessions.render(sessions, {
      open:(id) => { const session = savedSessionLibrary.sessions.find((candidate) => candidate.id === id);
        if (session) openSessionInLiveFeed(session); },
      rename:(id, name) => { if (!name.trim()) return;
        savedSessionLibrary = renameSavedSession(savedSessionLibrary, id, name.trim());
        persistSavedSessionLibrary(); renderSavedSessions(); },
      export:(id) => { const session = savedSessionLibrary.sessions.find((candidate) => candidate.id === id);
        if (!session) return; downloadSavedSessionFile(session);
        if (savedSessionConfirmation) savedSessionConfirmation.textContent = `Exported saved session ${session.name}.`; },
      resume:(id) => { const session = savedSessionLibrary.sessions.find((candidate) => candidate.id === id);
        if (session) startLinkedCaptureFromSavedSession(session); },
      createSequence:(id) => { const session = savedSessionLibrary.sessions.find((candidate) => candidate.id === id);
        if (!session) return; ports.savedSessions.createReplaySequence(session);
        if (savedSessionConfirmation) savedSessionConfirmation.textContent = `Created sequence from ${session.name}; saved session remains unchanged.`; },
      requestDelete:(id) => { savedSessionLibrary = requestSavedSessionDeletion(savedSessionLibrary, id);
        const session = savedSessionLibrary.deletionConfirmation;
        if (savedSessionConfirmation) savedSessionConfirmation.textContent = session ? `Delete saved session ${session.name}?` : "";
        if (cancelSavedSessionDeleteButton) cancelSavedSessionDeleteButton.hidden = !session;
        if (confirmSavedSessionDeleteButton) confirmSavedSessionDeleteButton.hidden = !session; },
    });
  }
  function renderSavedSessionLiveBanner(): void {
    const feed = savedSessionLiveFeed;
    if (savedSessionLiveBanner) savedSessionLiveBanner.hidden = !feed;
    if (feed) {
      const summary = savedSessionSummary(feed.session);
      if (savedSessionLiveSummary) savedSessionLiveSummary.textContent = `${feed.session.name} · Read-only archive · ${summary.eventCount} events · captured ${summary.captureDate}`;
      if (savedSessionBackgroundStatus) savedSessionBackgroundStatus.textContent = dataLayerSessionState.session?.status === "active"
        ? `Live capture continues in the background · ${feed.backgroundEventCount} new events`
        : "No observer was started or attached for this saved session.";
      if (returnToCurrentLiveFeedButton) returnToCurrentLiveFeedButton.textContent = feed.backgroundEventCount
        ? `Return to current Live feed · ${feed.backgroundEventCount} new events` : "Return to current Live feed";
      if (savedSessionValidationComparison) savedSessionValidationComparison.textContent = feed.comparison
        ? `Separate validation comparison · revisions ${feed.comparison.revisions.join(" and ")} · ${feed.comparison.results.length} saved events · original results unchanged` : "";
    }
    if (saveLiveSessionDialog) saveLiveSessionDialog.dataset.controllerOwned = "capture";
    if (freshSessionConfirmation) freshSessionConfirmation.dataset.controllerOwned = "capture";
    if (confirmSaveLiveSessionButton) confirmSaveLiveSessionButton.disabled = !(saveLiveSessionName?.value.trim());
    savedSessionList?.setAttribute("aria-live", "polite");
    liveGuidedWorkflowElements.setupSteps?.setAttribute("data-session-owner", "capture");
    for (const button of [pauseCaptureButton, resumeCaptureButton, saveLiveSessionButton, startFreshSessionButton]) {
      if (button) button.disabled = Boolean(feed);
    }
  }
  function closeInspectorAndReturnToEvents(): void {
    const selectedId = liveObserverState.inspectorEventId;
    if (selectedId) liveInspectorPresentation.set(selectedId, ports.inspector.capturePresentation());
    const returnSnapshot = inspectorReturnSnapshot;
    liveObserverState = closeLiveInspector(liveObserverState);
    synchronizeSavedSessionFeedView(); renderLiveObserver();
    if (returnSnapshot) ports.inspector.restoreReturn(restoreInspectorReturn(returnSnapshot));
    inspectorReturnSnapshot = undefined;
  }
  function openLiveInspector(eventId: string, preserveReturnSnapshot = false): void {
    const previousEventId = liveObserverState.inspectorEventId;
    if (previousEventId) liveInspectorPresentation.set(previousEventId, ports.inspector.capturePresentation());
    if (!preserveReturnSnapshot) inspectorReturnSnapshot = captureInspectorReturn(
      eventId, liveObserverElements.eventList?.scrollTop ?? 0,
    );
    liveObserverState = selectLiveEvent(liveObserverState, eventId, ports.inspector.splitView() ? "split" : "stacked");
    synchronizeSavedSessionFeedView();
    const event = liveObserverState.events.find(({ id }) => id === eventId);
    if (event) ports.inspector.render(ports.presentEvent?.(event) ?? event);
    renderLiveObserver();
    ports.inspector.restorePresentation(liveInspectorPresentation.get(eventId));
  }
  const backToEvents = (): void => closeInspectorAndReturnToEvents();
  function copyLivePageUrl(): void { ports.ui.copyPageUrl(); }
  const requestMissingEventBuilder = (): void => ports.ui.reportMissingEvent();
  function currentSessionSaveDraft(): SessionSaveDraft {
    const now = ports.savedSessions.now();
    const flowTests = ports.savedSessions.flowTests?.();
    return createSessionSaveDraft({ id:`live-${Date.parse(now)}`, pageScope:liveObserverState.pageUrl,
      startedAt:liveObserverState.events[0]?.captureTime ?? now,
      endedAt:liveObserverState.events.at(-1)?.captureTime ?? now,
      events:liveObserverState.events.map((event, index) => ({ ...structuredClone(event),
        sourceName:event.sourceName ?? event.sourceId, payload:event.payload, rawInput:event.rawInput ?? event,
        pageUrl:event.pageUrl ?? liveObserverState.pageUrl, captureOrder:index + 1,
        provenance:event.provenance ?? { source:"live-observer", capturedAt:event.captureTime } })),
      provenance:{ source:"live-observer", capturedAt:now },
      ...(flowTests?.length ? { flowTests:structuredClone(flowTests) } : {}) });
  }
  function openSessionSaveDialog(startFreshAfterSave = false): void {
    if (savedSessionLiveFeed) return;
    startFreshAfterSessionSave = startFreshAfterSave;
    pendingSessionSaveDraft = currentSessionSaveDraft();
    if (saveLiveSessionName) saveLiveSessionName.value = "";
    if (confirmSaveLiveSessionButton) { confirmSaveLiveSessionButton.disabled = true;
      confirmSaveLiveSessionButton.textContent = startFreshAfterSave ? "Save and start fresh" : "Save snapshot"; }
    if (saveLiveSessionHeading) saveLiveSessionHeading.textContent = startFreshAfterSave ? "Save session before starting fresh" : "Save session snapshot";
    if (saveLiveSessionSummary) { const summary = pendingSessionSaveDraft.summary;
      saveLiveSessionSummary.textContent = `${summary.pageScope} · ${summary.eventCount} events · ${summary.sourceCount} sources · ${summary.validationSummary}`; }
    saveLiveSessionDialog?.showModal(); saveLiveSessionHeading?.focus({ preventScroll:true });
  }
  const requestSessionSave = (): void => openSessionSaveDialog();
  function startFreshSession(): void {
    if (savedSessionLiveFeed) return;
    const previous = dataLayerSessionState.session;
    if (!previous || previous.status !== "active") return;
    const fresh = startFreshLiveSession(dataLayerSessionState, liveObserverState, dataLayerObserverState,
      newDataLayerSessionId(previous.tabId));
    if (!fresh.started) return;
    dataLayerSessionState = fresh.sessionState;
    liveObserverState = fresh.liveObserverState;
    dataLayerObserverState = fresh.observerState;
    presentedSourceEventCount = 0;
    archivedSavedSession = undefined; savedThroughEventCount = 0;
    ports.storage.setItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY, "0");
    ports.savedSessions.resetFlowTesting();
    installDefaultSavedEventFeedFilterForNewSession();
    persistAndRenderObservationState();
    if (liveObserverElements.eventList) liveObserverElements.eventList.scrollTop = 0;
    ports.setLiveSessionMessage("Fresh session started with 0 captured events.");
    startFreshSessionButton?.focus({ preventScroll:true });
  }
  function requestFreshSession(): void {
    if (savedSessionLiveFeed) return;
    const unsaved = currentUnsavedEventCount();
    if (!unsaved) { startFreshSession(); return; }
    if (freshSessionConfirmationSummary) freshSessionConfirmationSummary.textContent = `${unsaved} unsaved events would be discarded.`;
    freshSessionConfirmation?.showModal(); freshSessionConfirmationHeading?.focus({ preventScroll:true });
  }
  const updateSaveConfirmation = (): void => { if (confirmSaveLiveSessionButton) confirmSaveLiveSessionButton.disabled = !(saveLiveSessionName?.value.trim()); };
  const confirmSessionSaveSubmission = (event: Event): void => { event.preventDefault();
    const name = saveLiveSessionName?.value.trim() ?? "";
    if (!pendingSessionSaveDraft || !name) return;
    savedSessionLibrary = confirmSessionSave(savedSessionLibrary, pendingSessionSaveDraft, name);
    savedThroughEventCount = pendingSessionSaveDraft.completed.events.length;
    ports.storage.setItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY, String(savedThroughEventCount));
    pendingSessionSaveDraft = undefined; persistSavedSessionLibrary(); saveLiveSessionDialog?.close(); renderSavedSessions();
    if (startFreshAfterSessionSave) { startFreshAfterSessionSave = false; startFreshSession(); return; }
    ports.setLiveSessionMessage(`Saved immutable snapshot ${name}; capture state unchanged.`);
    saveLiveSessionButton?.focus({ preventScroll:true });
  };
  function closeSaveLiveSessionDialog(event?: Event): void { event?.preventDefault(); pendingSessionSaveDraft = undefined;
    const returnToFreshAction = startFreshAfterSessionSave; startFreshAfterSessionSave = false;
    if (saveLiveSessionDialog?.open) saveLiveSessionDialog.close();
    (returnToFreshAction ? startFreshSessionButton : saveLiveSessionButton)?.focus({ preventScroll:true }); }
  const saveAndStartFreshSession = (): void => { if (freshSessionConfirmation?.open) freshSessionConfirmation.close(); openSessionSaveDialog(true); };
  const discardAndStartFreshSession = (): void => { if (freshSessionConfirmation?.open) freshSessionConfirmation.close(); startFreshSession(); };
  function closeFreshSessionConfirmation(event?: Event): void { event?.preventDefault(); if (freshSessionConfirmation?.open) freshSessionConfirmation.close();
    startFreshSessionButton?.focus({ preventScroll:true }); }
  function returnToCurrentLiveFeedAction(): void { if (!savedSessionLiveFeed) return;
    const returned = returnToCurrentLiveFeed(savedSessionLiveFeed); savedSessionLiveFeed = undefined; persistSavedSessionFeed();
    liveObserverState = returned.state; renderLiveObserver();
    if (liveObserverElements.eventList) liveObserverElements.eventList.scrollTop = returned.scrollTop;
    ports.setLiveSessionMessage(`Returned to current Live feed${returned.newEventCount ? ` with ${returned.newEventCount} new events` : ""}.`);
    renderSavedSessionLiveBanner(); }
  function revalidateSavedSession(): void { if (!savedSessionLiveFeed) return;
    savedSessionLiveFeed = revalidateSavedSessionLiveFeed(savedSessionLiveFeed, ports.savedSessions.validate);
    persistSavedSessionFeed(); renderSavedSessionLiveBanner(); }
  const searchSavedSessionsAction = (): void => renderSavedSessions();
  const beginSavedSessionImport = (): void => savedSessionFileInput?.click();
  async function loadSavedSessionFile(): Promise<void> {
    const generation = ++importGeneration;
    try { const serialized = await ports.savedSessions.readImportFile();
      if (!mounted || generation !== importGeneration || !serialized) return;
      savedSessionLibrary = importSavedSession(savedSessionLibrary, serialized); persistSavedSessionLibrary();
      if (savedSessionConfirmation) savedSessionConfirmation.textContent = "Saved session imported as an immutable archive.";
      renderSavedSessions();
    } catch { if (mounted && generation === importGeneration && savedSessionConfirmation)
      savedSessionConfirmation.textContent = "Saved session file must contain valid JSON."; }
    finally { if (mounted && generation === importGeneration && savedSessionFileInput) savedSessionFileInput.value = ""; }
  }
  const requestSavedSessionImport = async (): Promise<void> => { await loadSavedSessionFile(); };
  const selectSavedSession = (event: Event): void => {
    const id = (event.target as Element | null)?.closest<HTMLElement>("[data-session-id]")?.dataset.sessionId;
    const session = savedSessionLibrary.sessions.find((candidate) => candidate.id === id);
    if (session) openSessionInLiveFeed(session);
  };
  const cancelSavedSessionDelete = (): void => { savedSessionLibrary = cancelSavedSessionDeletion(savedSessionLibrary);
    if (savedSessionConfirmation) savedSessionConfirmation.textContent = "";
    if (cancelSavedSessionDeleteButton) cancelSavedSessionDeleteButton.hidden = true;
    if (confirmSavedSessionDeleteButton) confirmSavedSessionDeleteButton.hidden = true; renderSavedSessions(); };
  const confirmSavedSessionDelete = (): void => { savedSessionLibrary = confirmSavedSessionDeletion(savedSessionLibrary);
    persistSavedSessionLibrary(); if (savedSessionConfirmation) savedSessionConfirmation.textContent = "Saved session deleted.";
    if (cancelSavedSessionDeleteButton) cancelSavedSessionDeleteButton.hidden = true;
    if (confirmSavedSessionDeleteButton) confirmSavedSessionDeleteButton.hidden = true; renderSavedSessions(); };
  const renderLiveObserver = (): void => {
    if (mounted) renderLiveSessionSummary(liveSessionSummaryElements, currentLiveSessionSummary());
    if (mounted) renderLiveObserverState(liveObserverElements, { ...liveObserverState,
      events:liveObserverState.events.map((event)=>ports.presentEvent?.(event)??event) }, openLiveInspector);
    if (mounted) ports.savedFilters.render(liveObserverState.events, liveObserverState.query ?? { conditions:[] },
      savedEventFeedFilterControls(), (query) => {
        liveObserverState = setLiveQuery(liveObserverState, query);
        persistSavedEventFeedWorkingView(); renderLiveObserver();
      });
    if (liveEventsEmptyState) liveEventsEmptyState.hidden = liveObserverState.events.length > 0;
    if (liveSourceErrorState) liveSourceErrorState.hidden = Boolean(savedSessionLiveFeed)
      || !liveObserverState.sources.some(({ status }) => status !== "Connected");
    renderSavedSessionLiveBanner();
  };
  const publish = (): void => { persistSession(dataLayerSessionState, ports.storage);
    ports.changed(dataLayerSessionState, liveObserverState); renderLiveObserver(); };
  const recordCapturedLiveEvent = (event: LiveEvent): void => {
    const previousCount = savedSessionLiveFeed?.currentView.events.length ?? liveObserverState.events.length;
    if (savedSessionLiveFeed) {
      savedSessionLiveFeed = recordBackgroundLiveEvent(savedSessionLiveFeed, event);
      persistSavedSessionFeed();
    } else liveObserverState = recordLiveEvent(liveObserverState, event);
    const nextCount = savedSessionLiveFeed?.currentView.events.length ?? liveObserverState.events.length;
    if (nextCount !== previousCount && dataLayerSessionState.session?.status === "active") {
      dataLayerSessionState = { ...dataLayerSessionState, session:{ ...dataLayerSessionState.session,
        currentUrl:event.pageUrl ?? dataLayerSessionState.session.currentUrl,
        timeline:[...dataLayerSessionState.session.timeline, { ...event, type:"observed", url:event.pageUrl ?? dataLayerSessionState.session.currentUrl,
          timestamp:event.captureTime, rawValue:event.rawInput }] } };
    }
    publish();
  };
  const startTesting = (): void => ports.runCommand("data-layer.start-testing");
  const endTesting = (): void => ports.runCommand("data-layer.end-testing");
  const setLiveSessionMessage = (message: string): void => liveNotificationController.announce(message);
  const pauseInstalledCapture = (): void => { liveObserverState = pauseCapture(liveObserverState);
    setLiveSessionMessage("Capture paused"); publish(); };
  const resumeInstalledCapture = (): void => { liveObserverState = resumeCapture(liveObserverState);
    setLiveSessionMessage("Capture resumed"); publish(); };
  function newDataLayerSessionId(tabId:number): string {
    nextSessionSequence += 1;
    const unique = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${nextSessionSequence}`;
    return `tab-${tabId}-session-${unique}`;
  }
  function renderSessionState(): void { renderObservationTargetContext(); }
  function renderObserverState(): void { renderLiveObserver(); }
  function syncCapturedEventsToLive(): void {
    dataLayerSessionState = dataLayerObserverState.sessionState ?? dataLayerSessionState;
    const events = dataLayerObserverState.sourceEvents ?? [];
    const pendingEvents = events.slice(presentedSourceEventCount);
    presentedSourceEventCount = events.length;
    for (const event of pendingEvents) {
      const presented = ports.observerRuntime.present(event, dataLayerObserverState.observer?.historyPath);
      if (savedSessionLiveFeed) {
        savedSessionLiveFeed = recordBackgroundLiveEvent(savedSessionLiveFeed, presented); persistSavedSessionFeed();
      } else liveObserverState = recordLiveEvent(liveObserverState, presented);
    }
  }
  function updateSessionFromObserverState(): void { syncCapturedEventsToLive(); }
  function persistAndRenderSessionState(): void { persistSession(dataLayerSessionState, ports.storage); renderSessionState(); publish(); }
  function persistAndRenderObservationState(): void { persistAndRenderSessionState(); renderObserverState(); }
  async function applyLiveTargetPathObservation(observation:ActivePageObservationResult):Promise<void> {
    dataLayerObserverState = restartHistoryObservation(dataLayerSessionState, dataLayerObserverState, observation);
    updateSessionFromObserverState(); await startLiveHistoryCapture(observation); if (!mounted) return; persistAndRenderObservationState();
  }
  function restartLiveHistoryCaptureIfActive(observation: ActivePageObservationResult): void {
    if (dataLayerSessionState.session?.status === "active") startLiveHistoryCapture(observation).catch(() => {});
  }
  function observationPageLoadId(tabId: number): string {
    return `tab:${tabId}:page-load:${observationRefreshState.observedPageLoadSequence}`;
  }
  async function currentTargetObservation(historyPath: string): Promise<ActivePageObservationResult | undefined> {
    const target = attachedObservationTarget(observationTargetState) ?? selectedObservationTarget(observationTargetState);
    if (!target) { setObservationTargetResult("Selection required"); return undefined; }
    return ports.observerRuntime.read({ tabId:target.tabId, pageUrl:target.pageUrl, historyPath,
      pageLoadId:observationPageLoadId(target.tabId) });
  }
  async function recoverAttachedObservationTarget(): Promise<void> {
    const generation = ++attachedTargetRecoveryGeneration;
    const target = attachedObservationTarget(observationTargetState);
    const session = dataLayerSessionState.session;
    if (!target || session?.status !== "active") return;
    try {
      const observation = await ports.observerRuntime.read({ tabId:target.tabId, pageUrl:target.pageUrl,
        historyPath:session.historyPath, pageLoadId:observationPageLoadId(target.tabId) });
      if (!mounted || generation !== attachedTargetRecoveryGeneration
        || attachedObservationTarget(observationTargetState)?.id !== target.id) return;
      if (observation.pageAccessStatus === "page access unavailable") {
        observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
        stopLiveHistoryCapture(); setObservationTargetResult("Permission required — Request access");
      } else {
        await applyLiveTargetPathObservation(observation);
        if (!mounted || generation !== attachedTargetRecoveryGeneration) return;
        setObservationTargetResult(`Recovered ${target.title}`);
      }
    } catch {
      if (!mounted || generation !== attachedTargetRecoveryGeneration) return;
      observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Closed");
      stopLiveHistoryCapture(); setObservationTargetResult("Target unavailable — Choose target");
    }
    renderObservationTargetPicker(); renderObservationTargetContext();
  }
  function cancelLiveHistoryCaptureRuntime(): void {
    liveHistoryActivationState = nextObservationActivation(liveHistoryActivationState).state;
    stopLiveHistoryPushCapture?.(); stopLiveHistoryPushCapture = undefined;
  }
  function stopLiveHistoryCapture(): void {
    cancelLiveHistoryCaptureRuntime(); dataLayerObserverState = stopHistoryArrayObserver(dataLayerObserverState);
  }
  async function startLiveHistoryCapture(observation: ActivePageObservationResult): Promise<void> {
    cancelLiveHistoryCaptureRuntime();
    const captureGeneration = liveHistoryActivationState.generation;
    try {
      const stopCapture = await ports.observerRuntime.startPush({
        ...(observation.tabId === undefined ? {} : { tabId:observation.tabId }), historyPath:observation.historyPath,
        onSnapshot:({ historyPath, rawValues }) => {
          if (!mounted || !observationActivationIsCurrent(liveHistoryActivationState, captureGeneration)) return;
          dataLayerObserverState = attachHistoryArraySnapshot({ ...dataLayerObserverState, sessionState:dataLayerSessionState },
            { pageUrl:observation.pageUrl, ...(observation.pageLoadId ? { pageLoadId:observation.pageLoadId } : {}),
              historyPath, rawValues, requestId:`activation:${captureGeneration}` });
          updateSessionFromObserverState(); persistAndRenderObservationState();
        },
        onEntry:({ rawValue, timestamp }) => {
          if (!mounted || !observationActivationIsCurrent(liveHistoryActivationState, captureGeneration)) return;
          dataLayerObserverState = appendObservedHistoryEntry(dataLayerObserverState, rawValue, timestamp);
          ports.observerRuntime.recordCapture({
            sessionId:`tab:${observation.tabId ?? dataLayerSessionState.session?.tabId ?? "active"}`,
            pageUrl:dataLayerSessionState.session?.currentUrl ?? observation.pageUrl,
            sourceId:dataLayerSessionState.session?.historyPath ?? observation.historyPath, rawValue,
          });
          updateSessionFromObserverState(); persistAndRenderObservationState();
        },
      });
      if (!mounted || !observationActivationIsCurrent(liveHistoryActivationState, captureGeneration)) { stopCapture(); return; }
      stopLiveHistoryPushCapture = stopCapture;
    } catch { if (observationActivationIsCurrent(liveHistoryActivationState, captureGeneration)) stopLiveHistoryPushCapture = undefined; }
  }
  function clearScheduledObservationRefresh(): void {
    if (observationRefreshTimeoutId !== undefined) {
      globalThis.clearTimeout(observationRefreshTimeoutId);
      observationRefreshTimeoutId = undefined;
    }
  }
  function scheduleObservationRefresh(request: ObservationRefreshRequest): void {
    clearScheduledObservationRefresh();
    const delay = observationRefreshDelay(request.attempt);
    observationRefreshTimeoutId = globalThis.setTimeout(() => {
      observationRefreshTimeoutId = undefined;
      runObservationRefresh(request).catch(() => {});
    }, delay);
  }
  function activeSessionTabMatches(tabId: number): boolean {
    const session = dataLayerSessionState.session;
    return session?.status === "active" && session.tabId === tabId;
  }
  function capturePageEntryForRefresh(request: ObservationRefreshRequest): ObservationRefreshRequest {
    if (request.pageEntryCaptured) return request;
    dataLayerSessionState = navigateSession(dataLayerSessionState, request.pageUrl);
    dataLayerSessionState = captureEntry(dataLayerSessionState, { type:"page", url:request.pageUrl });
    persistAndRenderSessionState(); return markObservationRefreshPageEntryCaptured(request);
  }
  function refreshObservationAfterPageLoad(tabId: number, pageUrl: string, pageLoadSequence: number): void {
    if (!activeSessionTabMatches(tabId)) return;
    const schedule = observationRefreshRequestForPageLoad(observationRefreshState, tabId, pageUrl, pageLoadSequence);
    observationRefreshState = schedule.state; if (schedule.request) scheduleObservationRefresh(schedule.request);
  }
  async function runObservationRefresh(request: ObservationRefreshRequest): Promise<void> {
    if (!observationRefreshRequestIsCurrent(observationRefreshState, request) || !activeSessionTabMatches(request.tabId)) return;
    const session = dataLayerSessionState.session; if (!session) return;
    const nextRequest = capturePageEntryForRefresh(request);
    const observation = await ports.observerRuntime.read({ tabId:nextRequest.tabId, pageUrl:nextRequest.pageUrl,
      historyPath:session.historyPath, pageLoadId:observationPageLoadId(nextRequest.tabId) });
    if (!mounted || !observationRefreshRequestIsCurrent(observationRefreshState, nextRequest)
      || !activeSessionTabMatches(nextRequest.tabId)) return;
    dataLayerObserverState = restartHistoryObservation(dataLayerSessionState, dataLayerObserverState, observation);
    updateSessionFromObserverState(); persistAndRenderObservationState();
    if (observation.pageAccessStatus === "page access unavailable") {
      const target = attachedObservationTarget(observationTargetState) ?? selectedObservationTarget(observationTargetState);
      if (target) observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
      setObservationTargetResult("Permission required — Request access"); renderObservationTargetPicker(); renderObservationTargetContext();
      return;
    }
    if (dataLayerObserverState.observer?.status === "ready") { await startLiveHistoryCapture(observation); return; }
    if (shouldRetryObservationRefresh(observation.pageAccessStatus, nextRequest.attempt)) {
      scheduleObservationRefresh(nextObservationRefreshAttempt(nextRequest));
    }
  }
  function revokeObservationTargetOrigins(origins: readonly string[]): void {
    const affected = observationTargetState.targets.filter((target) =>
      origins.some((originPattern) => originPattern.startsWith(target.origin)));
    for (const target of affected) {
      const attached = observationTargetState.attachedTargetId === target.id;
      observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
      if (attached) { stopLiveHistoryCapture(); setObservationTargetResult("Permission required — Request access"); }
    }
    if (affected.length) { renderObservationTargetPicker(); renderObservationTargetContext(); }
  }
  function handleTabUpdated(tabId:number, changeInfo:CaptureTabUpdate, tab:{ url?:string; title?:string }): void {
    if (changeInfo.url !== undefined) {
      const current = observationTargetState.targets.find((target) => target.tabId === tabId);
      if (current) {
        observationTargetState = navigateObservationTarget(observationTargetState, tabId, changeInfo.url);
        const updated = observationTargetState.targets.find((target) => target.tabId === tabId);
        if (updated && tab.title) observationTargetState = registerObservationTarget(observationTargetState, { ...updated, title:tab.title });
        renderObservationTargetPicker(); renderObservationTargetContext();
      }
    }
    if (!activeSessionTabMatches(tabId)) return;
    if (changeInfo.status === "loading" || changeInfo.url !== undefined) {
      observationRefreshState = beginObservedPageLoad(observationRefreshState);
      clearScheduledObservationRefresh(); stopLiveHistoryCapture();
      if (changeInfo.url !== undefined) {
        dataLayerSessionState = navigateSession(dataLayerSessionState, changeInfo.url);
        ports.observerRuntime.recordNavigation({ sessionId:`tab:${tabId}`, pageUrl:changeInfo.url });
        persistAndRenderSessionState();
      }
    }
    if (changeInfo.status === "complete") {
      refreshObservationAfterPageLoad(tabId, tab.url ?? changeInfo.url
        ?? dataLayerSessionState.session?.currentUrl ?? ports.initialPageUrl(), observationRefreshState.observedPageLoadSequence);
    }
  }
  function handleTabRemoved(tabId:number): void {
    const target = observationTargetState.targets.find((candidate) => candidate.tabId === tabId); if (!target) return;
    observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Closed");
    if (dataLayerSessionState.session?.tabId === tabId) {
      stopLiveHistoryCapture(); setObservationTargetResult("Target unavailable — Save session, End session, or Choose target");
      persistAndRenderObservationState();
    }
    renderObservationTargetPicker(); renderObservationTargetContext();
  }
  return {
    mount(): void {
      if (mounted) return;
      mounted = true;
      unsubscribeTabUpdated = ports.observerRuntime.subscribeTabUpdated(handleTabUpdated);
      unsubscribeTabRemoved = ports.observerRuntime.subscribeTabRemoved(handleTabRemoved);
      unsubscribePermissionsRemoved = ports.observerRuntime.subscribePermissionsRemoved(revokeObservationTargetOrigins);
      startTestingButton?.addEventListener("click", startTesting);
      endTestingButton?.addEventListener("click", endTesting);
      pauseCaptureButton?.addEventListener("click", pauseInstalledCapture);
      resumeCaptureButton?.addEventListener("click", resumeInstalledCapture);
      restartObservationButton?.addEventListener("click", requestObservationRestart);
      chooseObservationTargetButton?.addEventListener("click", chooseObservationTarget);
      browseObservationTargetsButton?.addEventListener("click", browseObservationTargets);
      closeObservationTargetPickerButton?.addEventListener("click", closeObservationTargetPicker);
      observationTargetSearch?.addEventListener("input", searchObservationTargets);
      observationTargetSearch?.addEventListener("keydown", navigateObservationTargetSearch);
      observationTargetList?.addEventListener("keydown", navigateObservationTargetList);
      observationTargetPicker?.addEventListener("keydown", navigateObservationTargetDialog);
      cancelDetachTargetButton?.addEventListener("click", cancelDetachTarget);
      confirmDetachTargetButton?.addEventListener("click", confirmDetachTarget);
      dataLayerViewList?.addEventListener("click", selectDataLayerView);
      dataLayerViewList?.addEventListener("keydown", navigateDataLayerView);
      backToEventsButton?.addEventListener("click", backToEvents);
      copyPageUrlButton?.addEventListener("click", copyLivePageUrl);
      saveLiveSessionButton?.addEventListener("click", requestSessionSave);
      startFreshSessionButton?.addEventListener("click", requestFreshSession);
      reportMissingEventButton?.addEventListener("click", requestMissingEventBuilder);
      saveLiveSessionName?.addEventListener("input", updateSaveConfirmation);
      saveLiveSessionForm?.addEventListener("submit", confirmSessionSaveSubmission);
      cancelSaveLiveSessionButton?.addEventListener("click", closeSaveLiveSessionDialog);
      saveLiveSessionDialog?.addEventListener("cancel", closeSaveLiveSessionDialog);
      saveAndStartFreshSessionButton?.addEventListener("click", saveAndStartFreshSession);
      discardAndStartFreshSessionButton?.addEventListener("click", discardAndStartFreshSession);
      cancelFreshSessionButton?.addEventListener("click", closeFreshSessionConfirmation);
      freshSessionConfirmation?.addEventListener("cancel", closeFreshSessionConfirmation);
      returnToCurrentLiveFeedButton?.addEventListener("click", returnToCurrentLiveFeedAction);
      revalidateSavedSessionButton?.addEventListener("click", revalidateSavedSession);
      liveObserverElements.eventList?.addEventListener("scroll", synchronizeSavedSessionFeedScroll);
      savedSessionSearch?.addEventListener("input", searchSavedSessionsAction);
      importSavedSessionButton?.addEventListener("click", beginSavedSessionImport);
      savedSessionFileInput?.addEventListener("change", requestSavedSessionImport);
      savedSessionList?.addEventListener("click", selectSavedSession);
      cancelSavedSessionDeleteButton?.addEventListener("click", cancelSavedSessionDelete);
      confirmSavedSessionDeleteButton?.addEventListener("click", confirmSavedSessionDelete);
      renderObservationTargetContext();
      renderObservationTargetPicker();
      if (attachedObservationTarget(observationTargetState)) recoverAttachedObservationTarget().catch(() => {});
      renderSavedSessions(); renderSavedSessionLiveBanner();
      ports.changed(dataLayerSessionState, liveObserverState); renderLiveObserver();
    },
    dispose(): void {
      if (!mounted) return;
      mounted = false;
      unsubscribeTabUpdated?.(); unsubscribeTabUpdated = undefined;
      unsubscribeTabRemoved?.(); unsubscribeTabRemoved = undefined;
      unsubscribePermissionsRemoved?.(); unsubscribePermissionsRemoved = undefined;
      startTestingButton?.removeEventListener("click", startTesting);
      endTestingButton?.removeEventListener("click", endTesting);
      pauseCaptureButton?.removeEventListener("click", pauseInstalledCapture);
      resumeCaptureButton?.removeEventListener("click", resumeInstalledCapture);
      restartObservationButton?.removeEventListener("click", requestObservationRestart);
      chooseObservationTargetButton?.removeEventListener("click", chooseObservationTarget);
      browseObservationTargetsButton?.removeEventListener("click", browseObservationTargets);
      closeObservationTargetPickerButton?.removeEventListener("click", closeObservationTargetPicker);
      observationTargetSearch?.removeEventListener("input", searchObservationTargets);
      observationTargetSearch?.removeEventListener("keydown", navigateObservationTargetSearch);
      observationTargetList?.removeEventListener("keydown", navigateObservationTargetList);
      observationTargetPicker?.removeEventListener("keydown", navigateObservationTargetDialog);
      cancelDetachTargetButton?.removeEventListener("click", cancelDetachTarget);
      confirmDetachTargetButton?.removeEventListener("click", confirmDetachTarget);
      dataLayerViewList?.removeEventListener("click", selectDataLayerView);
      dataLayerViewList?.removeEventListener("keydown", navigateDataLayerView);
      backToEventsButton?.removeEventListener("click", backToEvents);
      copyPageUrlButton?.removeEventListener("click", copyLivePageUrl);
      saveLiveSessionButton?.removeEventListener("click", requestSessionSave);
      startFreshSessionButton?.removeEventListener("click", requestFreshSession);
      reportMissingEventButton?.removeEventListener("click", requestMissingEventBuilder);
      saveLiveSessionName?.removeEventListener("input", updateSaveConfirmation);
      saveLiveSessionForm?.removeEventListener("submit", confirmSessionSaveSubmission);
      cancelSaveLiveSessionButton?.removeEventListener("click", closeSaveLiveSessionDialog);
      saveLiveSessionDialog?.removeEventListener("cancel", closeSaveLiveSessionDialog);
      saveAndStartFreshSessionButton?.removeEventListener("click", saveAndStartFreshSession);
      discardAndStartFreshSessionButton?.removeEventListener("click", discardAndStartFreshSession);
      cancelFreshSessionButton?.removeEventListener("click", closeFreshSessionConfirmation);
      freshSessionConfirmation?.removeEventListener("cancel", closeFreshSessionConfirmation);
      returnToCurrentLiveFeedButton?.removeEventListener("click", returnToCurrentLiveFeedAction);
      revalidateSavedSessionButton?.removeEventListener("click", revalidateSavedSession);
      liveObserverElements.eventList?.removeEventListener("scroll", synchronizeSavedSessionFeedScroll);
      savedSessionSearch?.removeEventListener("input", searchSavedSessionsAction);
      importSavedSessionButton?.removeEventListener("click", beginSavedSessionImport);
      savedSessionFileInput?.removeEventListener("change", requestSavedSessionImport);
      savedSessionList?.removeEventListener("click", selectSavedSession);
      cancelSavedSessionDeleteButton?.removeEventListener("click", cancelSavedSessionDelete);
      confirmSavedSessionDeleteButton?.removeEventListener("click", confirmSavedSessionDelete);
      savedSessionList?.removeAttribute("aria-live");
      liveGuidedWorkflowElements.setupSteps?.removeAttribute("data-session-owner");
      observationTargetList?.removeAttribute("aria-live");
      ports.savedFilters.dispose();
      targetDiscoveryGeneration += 1; importGeneration += 1; attachedTargetRecoveryGeneration += 1;
      pendingObservationTargetSwitchId = undefined;
      clearScheduledObservationRefresh(); stopLiveHistoryCapture();
    },
    async begin(): Promise<void> {
      const session = await ports.sessionStart();
      const observation = await ports.observerRuntime.read({ tabId:session.tabId, pageUrl:session.url,
        historyPath:session.historyPath, pageLoadId:observationPageLoadId(session.tabId) });
      if (observation.pageAccessStatus !== "page access available") throw new Error("The selected target is not available for capture.");
      const attachment = attachSelectedObservationTarget(observationTargetState);
      if (attachment.result === "Attached") observationTargetState = attachment.state;
      const started = beginDataLayerTestingSession(dataLayerSessionState, liveObserverState, session);
      dataLayerSessionState = started.sessionState;
      liveObserverState = started.liveObserverState;
      ports.savedSessions.resetFlowTesting(); installDefaultSavedEventFeedFilterForNewSession();
      dataLayerObserverState = attachHistoryArrayObserver({ pageObject:dataLayerObserverState.pageObject,
        sessionState:dataLayerSessionState, observedEntries:[], sourceEvents:[] }, observation);
      presentedSourceEventCount = 0; updateSessionFromObserverState(); await startLiveHistoryCapture(observation);
      savedThroughEventCount = 0; ports.storage.setItem(SAVED_THROUGH_EVENT_COUNT_STORAGE_KEY, "0");
      persistAndRenderObservationState(); setObservationTargetResult(""); ports.setLiveSessionMessage("Testing started");
    },
    end(): void { attachedTargetRecoveryGeneration += 1; stopLiveHistoryCapture();
      dataLayerSessionState = endDataLayerTestingSession(dataLayerSessionState);
      ports.setLiveSessionMessage(testingEndedMessage()); renderLiveContextActions(); publish(); },
    pause:pauseInstalledCapture,
    resume:resumeInstalledCapture,
    capture:recordCapturedLiveEvent,
    discoverTargets:discoverCurrentObservationTarget,
    browseTargets:browseObservationTargets,
    selectTarget(id:string): void { observationTargetState = selectObservationTarget(observationTargetState, id); renderObservationTargetPicker(); },
    requestTargetAccess(id:string): Promise<void> { const target = observationTargetState.targets.find((candidate) => candidate.id === id);
      return target ? requestSelectedTargetAccess(target) : Promise.reject(new Error(`Unknown target ${id}`)); },
    attachTarget:attachSelectedTarget,
    beginDetachTarget:beginDetachSelectedTarget,
    confirmDetachTarget:confirmDetachSelectedTarget,
    openInspector:openLiveInspector,
    closeInspector:closeInspectorAndReturnToEvents,
    updateEvent(id:string, patch:Partial<LiveEvent>):boolean {
      const index=liveObserverState.events.findIndex((event)=>event.id===id);if(index<0)return false;
      liveObserverState={...liveObserverState,events:liveObserverState.events.map((event,candidateIndex)=>candidateIndex===index?{...event,...structuredClone(patch)}:event)};
      updateSessionFromObserverState();persistAndRenderObservationState();return true;
    },
    replaceObserverState(next:LiveObserverState):void {
      liveObserverState=structuredClone(next);updateSessionFromObserverState();persistAndRenderObservationState();
      if(liveObserverState.inspectorEventId)openLiveInspector(liveObserverState.inspectorEventId,true);
    },
    scheduleObservationRefresh,
    refreshPresentation(): void { renderLiveContextActions(); renderLiveObserver(); renderSavedSessionLiveBanner(); },
    currentSessionDraft:() => structuredClone(currentSessionSaveDraft()),
    savedSessions:() => structuredClone(savedSessionLibrary),
    replaceSavedSessions(next:SavedSessionLibrary):void { savedSessionLibrary=structuredClone(next); persistSavedSessionLibrary(); renderSavedSessions(); },
    openSavedSession(id:string):boolean { const session=savedSessionLibrary.sessions.find((candidate) => candidate.id === id);
      if (!session) return false; openSessionInLiveFeed(session); return true; },
    state:() => ({ session:structuredClone(dataLayerSessionState), observer:structuredClone(liveObserverState),
      targets:structuredClone(observationTargetState), savedSessions:structuredClone(savedSessionLibrary),
      savedFeed:structuredClone(savedSessionLiveFeed), archivedSavedSession:structuredClone(archivedSavedSession),
      savedFilters:structuredClone(savedEventFeedFilterLibrary), savedEventFeedFilterFeedback,
      historyObserver:structuredClone(dataLayerObserverState), observationRefresh:structuredClone(observationRefreshState),
      liveHistoryGeneration:liveHistoryActivationState.generation,
      inspectorReturnSnapshot:structuredClone(inspectorReturnSnapshot),
      savedThroughEventCount, pendingObservationTargetSwitchId }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"capture",
  capabilities:["observation targets", "sessions", "Live feed", "saved sessions", "refresh lifecycle"],
});
