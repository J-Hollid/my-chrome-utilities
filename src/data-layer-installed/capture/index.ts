import {
  beginDataLayerTestingSession,
  persistSession,
  restoreSession,
  type DataLayerSessionState,
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
}

export function createCaptureInstalledController(ports: CaptureInstalledPorts) {
  const startTestingButton = ports.root.querySelector<HTMLButtonElement>("#start-data-layer-testing");
  const endTestingButton = ports.root.querySelector<HTMLButtonElement>("#end-data-layer-testing");
  const liveObserverElements = findLiveObserverElements(ports.root);
  const pauseCaptureButton = liveObserverElements.pauseCaptureButton;
  const resumeCaptureButton = liveObserverElements.resumeCaptureButton;
  let mounted = false;
  let unsubscribe: (() => void) | undefined;
  let dataLayerSessionState = restoreSession(ports.storage);
  let liveObserverState = createLiveObserverState({ pageUrl:ports.initialPageUrl(), sources:ports.initialSources() });
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
  const pauseInstalledCapture = (): void => { liveObserverState = pauseCapture(liveObserverState);
    ports.setLiveSessionMessage("Capture paused"); publish(); };
  const resumeInstalledCapture = (): void => { liveObserverState = resumeCapture(liveObserverState);
    ports.setLiveSessionMessage("Capture resumed"); publish(); };
  return {
    mount(): void {
      if (mounted) return;
      mounted = true;
      unsubscribe = ports.subscribeToLiveFeed(syncCapturedEventsToLive);
      startTestingButton?.addEventListener("click", startTesting);
      endTestingButton?.addEventListener("click", endTesting);
      pauseCaptureButton?.addEventListener("click", pauseInstalledCapture);
      resumeCaptureButton?.addEventListener("click", resumeInstalledCapture);
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
    },
    async begin(): Promise<void> {
      const started = beginDataLayerTestingSession(dataLayerSessionState, liveObserverState, await ports.sessionStart());
      dataLayerSessionState = started.sessionState; liveObserverState = started.liveObserverState; publish();
    },
    end(): void { dataLayerSessionState = endDataLayerTestingSession(dataLayerSessionState); publish(); },
    pause:pauseInstalledCapture,
    resume:resumeInstalledCapture,
    capture:syncCapturedEventsToLive,
    state:() => ({ session:structuredClone(dataLayerSessionState), observer:structuredClone(liveObserverState) }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"capture",
  capabilities:["observation targets", "sessions", "Live feed", "saved sessions", "refresh lifecycle"],
});
