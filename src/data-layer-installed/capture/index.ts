import {
  beginDataLayerTestingSession,
  createLiveNotificationController,
  findObservationTargetElements,
  observationRefreshDelay,
  persistSession,
  restoreSession,
  type DataLayerSessionState,
  type ObservationRefreshRequest,
} from "../../utilities/data-layer/capture.js";
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
  ui: {
    historyPath(): { path:string; fieldValue:string; status:"Selection required" | "Waiting for path" | "Ready" | "Unavailable" };
    restartObservation(): void;
    chooseObservationTarget(): void;
    browseObservationTargets(): void;
    closeObservationTargetPicker(): void;
    searchObservationTargets(query: string): void;
    cancelDetachTarget(): void;
    confirmDetachTarget(): void;
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
  const liveNotificationController = createLiveNotificationController(
    (message) => ports.setLiveSessionMessage(message),
    (clear, delayMs) => { globalThis.setTimeout(clear, delayMs); },
  );
  let mounted = false;
  let unsubscribe: (() => void) | undefined;
  let dataLayerSessionState = restoreSession(ports.storage);
  let liveObserverState = createLiveObserverState({ pageUrl:ports.initialPageUrl(), sources:ports.initialSources() });
  let observationRefreshTimeoutId: number | undefined;
  function renderHistoryPath(path: string, fieldValue = path,
    status: "Selection required" | "Waiting for path" | "Ready" | "Unavailable" = "Selection required"): void {
    if (historyPathDisplay) historyPathDisplay.textContent = path;
    if (historyPathStatus) historyPathStatus.textContent = status === "Waiting for path"
      ? "Waiting for observation path" : status;
    if (sessionHistoryPath) sessionHistoryPath.textContent = fieldValue;
    if (sessionWarning) sessionWarning.hidden = status !== "Unavailable";
  }
  const renderObservationTargetContext = (): void => {
    const context = ports.ui.historyPath();
    renderHistoryPath(context.path, context.fieldValue, context.status);
    observationTargetList?.setAttribute("aria-live", "polite");
  };
  const restartObservation = (): void => ports.ui.restartObservation();
  const chooseObservationTarget = (): void => ports.ui.chooseObservationTarget();
  const browseObservationTargets = (): void => ports.ui.browseObservationTargets();
  const closeObservationTargetPicker = (): void => {
    if (observationTargetPicker) observationTargetPicker.hidden = true;
    ports.ui.closeObservationTargetPicker();
  };
  const searchObservationTargets = (): void => ports.ui.searchObservationTargets(observationTargetSearch?.value ?? "");
  const cancelDetachTarget = (): void => ports.ui.cancelDetachTarget();
  const confirmDetachTarget = (): void => ports.ui.confirmDetachTarget();
  const renderLiveObserver = (): void => {
    if (mounted) renderLiveObserverState(liveObserverElements, liveObserverState, () => {});
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
      renderObservationTargetContext();
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
      observationTargetList?.removeAttribute("aria-live");
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
    scheduleObservationRefresh,
    state:() => ({ session:structuredClone(dataLayerSessionState), observer:structuredClone(liveObserverState) }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"capture",
  capabilities:["observation targets", "sessions", "Live feed", "saved sessions", "refresh lifecycle"],
});
