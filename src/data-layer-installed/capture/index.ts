import {
  beginDataLayerTestingSession,
  createLiveNotificationController,
  findLiveGuidedWorkflowElements,
  findLiveSessionSummaryElements,
  findObservationTargetElements,
  findObservationTargets,
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
  observationRefreshDelay,
  persistSession,
  restoreSession,
  type DataLayerSessionState,
  type ObservationRefreshRequest,
  type ObservationTarget,
  type ObservationTargetState,
} from "../../utilities/data-layer/capture.js";
import { detachObservationTarget, endAndAttachObservationTarget } from "../../data-layer-observation-targets.js";
import {
  createLiveObserverState,
  findLiveObserverElements,
  pauseCapture,
  recordLiveEvent,
  renderLiveObserverState,
  resumeCapture,
  type LiveEvent,
  type LiveObserverState,
} from "../../utilities/data-layer/live-inspection.js";
import { endDataLayerTestingSession } from "../../data-layer-session.js";

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

export interface CaptureInstalledPorts {
  root: ParentNode;
  storage: Pick<Storage, "getItem" | "setItem">;
  initialPageUrl(): string;
  initialSources(): LiveObserverState["sources"];
  sessionStart(): Promise<CaptureSessionStart>;
  subscribeToLiveFeed(listener: (event: LiveEvent) => void): () => void;
  changed(session: DataLayerSessionState, observer: LiveObserverState): void;
  runCommand(id: "data-layer.start-testing" | "data-layer.end-testing"): void;
  setLiveSessionMessage(message: string): void;
  runObservationRefresh(request: ObservationRefreshRequest): Promise<void> | void;
  observation: {
    discover(scope:"current" | "all"): Promise<readonly CaptureTargetTab[]>;
    requestTabsAccess(): Promise<boolean>;
    requestOriginAccess(origin:string): Promise<boolean>;
    attach(target:ObservationTarget): Promise<boolean>;
    detach(target:ObservationTarget): Promise<void>;
    render(targets:readonly ObservationTarget[], actions:{ select(id:string):void; requestAccess(id:string):void }): void;
  };
  ui: {
    historyPath(): { path:string; fieldValue:string; status:"Selection required" | "Waiting for path" | "Ready" | "Unavailable" };
    restartObservation(): void;
    chooseObservationTarget(): void;
    browseObservationTargets(): void;
    closeObservationTargetPicker(): void;
    searchObservationTargets(query: string): void;
    cancelDetachTarget(): void;
    confirmDetachTarget(): void;
    sessionPresentation(): { heading:string; summary:string; freshHeading:string; freshSummary:string;
      liveSummary:string; backgroundStatus:string; validationComparison:string; savedCount:string; confirmation:string };
    savedSessionCount(): number;
    showDataLayerView(view: string): void;
    backToEvents(): void;
    copyPageUrl(): void;
    openSessionSave(): void;
    startFreshSession(): void;
    reportMissingEvent(): void;
    confirmSaveSession(name: string): void;
    cancelSaveSession(): void;
    saveAndStartFreshSession(): void;
    discardAndStartFreshSession(): void;
    cancelFreshSession(): void;
    returnToCurrentLiveFeed(): void;
    revalidateSavedSession(): void;
    searchSavedSessions(query: string): void;
    importSavedSession(): void;
    selectSavedSession(id: string): void;
    cancelSavedSessionDelete(): void;
    confirmSavedSessionDelete(): void;
  };
}

export function createCaptureInstalledController(ports: CaptureInstalledPorts) {
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
  let unsubscribe: (() => void) | undefined;
  let dataLayerSessionState = restoreSession(ports.storage);
  let liveObserverState = createLiveObserverState({ pageUrl:ports.initialPageUrl(), sources:ports.initialSources() });
  let observationRefreshTimeoutId: number | undefined;
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
  };
  const restartObservation = (): void => ports.ui.restartObservation();
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
    const generation = ++targetDiscoveryGeneration; const tabs = await ports.observation.discover("current");
    if (!mounted || generation !== targetDiscoveryGeneration) return; registerTargetTabs(tabs);
    const target = tabs[0] ? targetFromTab(tabs[0]) : undefined;
    if (target) { observationTargetState = selectObservationTarget(observationTargetState, target.id); setObservationTargetResult(`Selected ${target.title}`); }
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
      setObservationTargetResult(`Selected ${selectedObservationTarget(observationTargetState)?.title ?? id}`); renderObservationTargetPicker(); },
    requestAccess:(id) => { const target = observationTargetState.targets.find((candidate) => candidate.id === id); if (target) void requestSelectedTargetAccess(target); } });
  }
  const searchObservationTargets = (): void => renderObservationTargetPicker();
  async function requestSelectedTargetAccess(target: ObservationTarget): Promise<void> {
    const granted = await ports.observation.requestOriginAccess(target.origin); if (!mounted) return;
    if (!granted) { setObservationTargetResult("Permission required"); return; }
    observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Ready");
    setObservationTargetResult(`Access granted for ${target.origin}`); renderObservationTargetPicker();
  }
  async function attachSelectedTarget(): Promise<void> {
    const decision = attachSelectedObservationTarget(observationTargetState);
    if (decision.result === "End current session before attaching selected target") {
      pendingObservationTargetSwitchId = decision.state.selectedTargetId; setObservationTargetResult(decision.result); return;
    }
    const target = selectedObservationTarget(decision.state); if (decision.result !== "Attached" || !target) { setObservationTargetResult(decision.result); return; }
    if (!await ports.observation.attach(target)) { observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required");
      setObservationTargetResult("Permission required"); return; }
    observationTargetState = decision.state; setObservationTargetResult("Attached"); renderObservationTargetPicker();
  }
  function beginDetachSelectedTarget(): void { pendingObservationTargetSwitchId = undefined;
    setObservationTargetResult(attachedObservationTarget(observationTargetState) ? "Confirm detach target" : "No target is attached"); }
  async function confirmDetachSelectedTarget(): Promise<void> {
    const attached = attachedObservationTarget(observationTargetState); if (attached) await ports.observation.detach(attached);
    const switchId = pendingObservationTargetSwitchId; pendingObservationTargetSwitchId = undefined;
    observationTargetState = detachObservationTarget(observationTargetState);
    if (switchId) { const decision = endAndAttachObservationTarget(observationTargetState, switchId); observationTargetState = decision.state;
      const target = attachedObservationTarget(observationTargetState); if (target && !await ports.observation.attach(target)) observationTargetState = updateObservationTargetAccess(observationTargetState, target.id, "Permission required"); }
    setObservationTargetResult( switchId ? "Attached" : "Detached"); renderObservationTargetPicker();
  }
  const cancelDetachTarget = (): void => { pendingObservationTargetSwitchId = undefined; setObservationTargetResult("Detach cancelled"); };
  const confirmDetachTarget = (): void => { void confirmDetachSelectedTarget(); };
  function showDataLayerView(view: string): void { ports.ui.showDataLayerView(view); }
  const selectDataLayerView = (event: Event): void => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>("[role=tab]");
    if (button?.textContent) showDataLayerView(button.textContent);
  };
  function renderSavedSessionLiveBanner(): void {
    const presentation = ports.ui.sessionPresentation();
    if (saveLiveSessionHeading) saveLiveSessionHeading.textContent = presentation.heading;
    if (saveLiveSessionSummary) saveLiveSessionSummary.textContent = presentation.summary;
    if (freshSessionConfirmationHeading) freshSessionConfirmationHeading.textContent = presentation.freshHeading;
    if (freshSessionConfirmationSummary) freshSessionConfirmationSummary.textContent = presentation.freshSummary;
    if (savedSessionLiveSummary) savedSessionLiveSummary.textContent = presentation.liveSummary;
    if (savedSessionBackgroundStatus) savedSessionBackgroundStatus.textContent = presentation.backgroundStatus;
    if (savedSessionValidationComparison) savedSessionValidationComparison.textContent = presentation.validationComparison;
    if (savedSessionCount) savedSessionCount.textContent = presentation.savedCount;
    if (savedSessionConfirmation) savedSessionConfirmation.textContent = presentation.confirmation;
    if (savedSessionLiveBanner) savedSessionLiveBanner.hidden = presentation.liveSummary.length === 0;
    if (saveLiveSessionDialog) saveLiveSessionDialog.dataset.controllerOwned = "capture";
    if (freshSessionConfirmation) freshSessionConfirmation.dataset.controllerOwned = "capture";
    if (confirmSaveLiveSessionButton) confirmSaveLiveSessionButton.disabled = !(saveLiveSessionName?.value.trim());
    savedSessionList?.setAttribute("aria-live", "polite");
    liveGuidedWorkflowElements.setupSteps?.setAttribute("data-session-owner", "capture");
    if (savedSessionEmptyState) savedSessionEmptyState.hidden = ports.ui.savedSessionCount() > 0;
  }
  const backToEvents = (): void => ports.ui.backToEvents();
  function copyLivePageUrl(): void { ports.ui.copyPageUrl(); }
  const openSessionSaveDialog = (): void => ports.ui.openSessionSave();
  const startFreshSession = (): void => ports.ui.startFreshSession();
  const openMissingEventBuilder = (): void => ports.ui.reportMissingEvent();
  const confirmSessionSave = (event: Event): void => { event.preventDefault();
    ports.ui.confirmSaveSession(saveLiveSessionName?.value.trim() ?? ""); };
  const cancelSessionSave = (): void => ports.ui.cancelSaveSession();
  const saveAndStartFreshSession = (): void => ports.ui.saveAndStartFreshSession();
  const discardAndStartFreshSession = (): void => ports.ui.discardAndStartFreshSession();
  const cancelFreshSession = (): void => ports.ui.cancelFreshSession();
  const returnToCurrentLiveFeed = (): void => ports.ui.returnToCurrentLiveFeed();
  const revalidateSavedSession = (): void => ports.ui.revalidateSavedSession();
  const searchSavedSessions = (): void => ports.ui.searchSavedSessions(savedSessionSearch?.value ?? "");
  const beginSavedSessionImport = (): void => savedSessionFileInput?.click();
  const loadSavedSessionFile = (): void => ports.ui.importSavedSession();
  const selectSavedSession = (event: Event): void => {
    const id = (event.target as Element | null)?.closest<HTMLElement>("[data-session-id]")?.dataset.sessionId;
    if (id) ports.ui.selectSavedSession(id);
  };
  const cancelSavedSessionDelete = (): void => ports.ui.cancelSavedSessionDelete();
  const confirmSavedSessionDelete = (): void => ports.ui.confirmSavedSessionDelete();
  const renderLiveObserver = (): void => {
    if (mounted) renderLiveObserverState(liveObserverElements, liveObserverState, () => {});
    if (liveEventsEmptyState) liveEventsEmptyState.hidden = liveObserverState.events.length > 0;
    if (liveSourceErrorState) liveSourceErrorState.hidden = !liveObserverState.sources.some(({ status }) => status !== "Connected");
  };
  const publish = (): void => { persistSession(dataLayerSessionState, ports.storage);
    ports.changed(dataLayerSessionState, liveObserverState); renderLiveObserver(); };
  const syncCapturedEventsToLive = (event: LiveEvent): void => {
    const previousCount = liveObserverState.events.length;
    liveObserverState = recordLiveEvent(liveObserverState, event);
    if (liveObserverState.events.length !== previousCount && dataLayerSessionState.session?.status === "active") {
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
      void ports.runObservationRefresh(request);
    }, delay);
  }
  return {
    mount(): void {
      if (mounted) return;
      mounted = true;
      unsubscribe = ports.subscribeToLiveFeed(syncCapturedEventsToLive);
      startTestingButton?.addEventListener("click", startTesting);
      endTestingButton?.addEventListener("click", endTesting);
      pauseCaptureButton?.addEventListener("click", pauseInstalledCapture);
      resumeCaptureButton?.addEventListener("click", resumeInstalledCapture);
      restartObservationButton?.addEventListener("click", restartObservation);
      chooseObservationTargetButton?.addEventListener("click", chooseObservationTarget);
      browseObservationTargetsButton?.addEventListener("click", browseObservationTargets);
      closeObservationTargetPickerButton?.addEventListener("click", closeObservationTargetPicker);
      observationTargetSearch?.addEventListener("input", searchObservationTargets);
      cancelDetachTargetButton?.addEventListener("click", cancelDetachTarget);
      confirmDetachTargetButton?.addEventListener("click", confirmDetachTarget);
      dataLayerViewList?.addEventListener("click", selectDataLayerView);
      backToEventsButton?.addEventListener("click", backToEvents);
      copyPageUrlButton?.addEventListener("click", copyLivePageUrl);
      saveLiveSessionButton?.addEventListener("click", openSessionSaveDialog);
      startFreshSessionButton?.addEventListener("click", startFreshSession);
      reportMissingEventButton?.addEventListener("click", openMissingEventBuilder);
      saveLiveSessionForm?.addEventListener("submit", confirmSessionSave);
      cancelSaveLiveSessionButton?.addEventListener("click", cancelSessionSave);
      saveAndStartFreshSessionButton?.addEventListener("click", saveAndStartFreshSession);
      discardAndStartFreshSessionButton?.addEventListener("click", discardAndStartFreshSession);
      cancelFreshSessionButton?.addEventListener("click", cancelFreshSession);
      returnToCurrentLiveFeedButton?.addEventListener("click", returnToCurrentLiveFeed);
      revalidateSavedSessionButton?.addEventListener("click", revalidateSavedSession);
      savedSessionSearch?.addEventListener("input", searchSavedSessions);
      importSavedSessionButton?.addEventListener("click", beginSavedSessionImport);
      savedSessionFileInput?.addEventListener("change", loadSavedSessionFile);
      savedSessionList?.addEventListener("click", selectSavedSession);
      cancelSavedSessionDeleteButton?.addEventListener("click", cancelSavedSessionDelete);
      confirmSavedSessionDeleteButton?.addEventListener("click", confirmSavedSessionDelete);
      renderObservationTargetContext();
      renderObservationTargetPicker();
      renderSavedSessionLiveBanner();
      ports.changed(dataLayerSessionState, liveObserverState); renderLiveObserver();
    },
    dispose(): void {
      if (!mounted) return;
      mounted = false;
      unsubscribe?.(); unsubscribe = undefined;
      startTestingButton?.removeEventListener("click", startTesting);
      endTestingButton?.removeEventListener("click", endTesting);
      pauseCaptureButton?.removeEventListener("click", pauseInstalledCapture);
      resumeCaptureButton?.removeEventListener("click", resumeInstalledCapture);
      restartObservationButton?.removeEventListener("click", restartObservation);
      chooseObservationTargetButton?.removeEventListener("click", chooseObservationTarget);
      browseObservationTargetsButton?.removeEventListener("click", browseObservationTargets);
      closeObservationTargetPickerButton?.removeEventListener("click", closeObservationTargetPicker);
      observationTargetSearch?.removeEventListener("input", searchObservationTargets);
      cancelDetachTargetButton?.removeEventListener("click", cancelDetachTarget);
      confirmDetachTargetButton?.removeEventListener("click", confirmDetachTarget);
      dataLayerViewList?.removeEventListener("click", selectDataLayerView);
      backToEventsButton?.removeEventListener("click", backToEvents);
      copyPageUrlButton?.removeEventListener("click", copyLivePageUrl);
      saveLiveSessionButton?.removeEventListener("click", openSessionSaveDialog);
      startFreshSessionButton?.removeEventListener("click", startFreshSession);
      reportMissingEventButton?.removeEventListener("click", openMissingEventBuilder);
      saveLiveSessionForm?.removeEventListener("submit", confirmSessionSave);
      cancelSaveLiveSessionButton?.removeEventListener("click", cancelSessionSave);
      saveAndStartFreshSessionButton?.removeEventListener("click", saveAndStartFreshSession);
      discardAndStartFreshSessionButton?.removeEventListener("click", discardAndStartFreshSession);
      cancelFreshSessionButton?.removeEventListener("click", cancelFreshSession);
      returnToCurrentLiveFeedButton?.removeEventListener("click", returnToCurrentLiveFeed);
      revalidateSavedSessionButton?.removeEventListener("click", revalidateSavedSession);
      savedSessionSearch?.removeEventListener("input", searchSavedSessions);
      importSavedSessionButton?.removeEventListener("click", beginSavedSessionImport);
      savedSessionFileInput?.removeEventListener("change", loadSavedSessionFile);
      savedSessionList?.removeEventListener("click", selectSavedSession);
      cancelSavedSessionDeleteButton?.removeEventListener("click", cancelSavedSessionDelete);
      confirmSavedSessionDeleteButton?.removeEventListener("click", confirmSavedSessionDelete);
      savedSessionList?.removeAttribute("aria-live");
      liveGuidedWorkflowElements.setupSteps?.removeAttribute("data-session-owner");
      observationTargetList?.removeAttribute("aria-live");
      targetDiscoveryGeneration += 1; pendingObservationTargetSwitchId = undefined;
      clearScheduledObservationRefresh();
    },
    async begin(): Promise<void> {
      const started = beginDataLayerTestingSession(dataLayerSessionState, liveObserverState, await ports.sessionStart());
      dataLayerSessionState = started.sessionState; liveObserverState = started.liveObserverState; publish();
    },
    end(): void { dataLayerSessionState = endDataLayerTestingSession(dataLayerSessionState); publish(); },
    pause:pauseInstalledCapture,
    resume:resumeInstalledCapture,
    capture:syncCapturedEventsToLive,
    discoverTargets:discoverCurrentObservationTarget,
    browseTargets:browseObservationTargets,
    selectTarget(id:string): void { observationTargetState = selectObservationTarget(observationTargetState, id); renderObservationTargetPicker(); },
    requestTargetAccess(id:string): Promise<void> { const target = observationTargetState.targets.find((candidate) => candidate.id === id);
      return target ? requestSelectedTargetAccess(target) : Promise.reject(new Error(`Unknown target ${id}`)); },
    attachTarget:attachSelectedTarget,
    beginDetachTarget:beginDetachSelectedTarget,
    confirmDetachTarget:confirmDetachSelectedTarget,
    scheduleObservationRefresh,
    refreshPresentation(): void { renderLiveObserver(); renderSavedSessionLiveBanner(); },
    state:() => ({ session:structuredClone(dataLayerSessionState), observer:structuredClone(liveObserverState),
      targets:structuredClone(observationTargetState), pendingObservationTargetSwitchId }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"capture",
  capabilities:["observation targets", "sessions", "Live feed", "saved sessions", "refresh lifecycle"],
});
