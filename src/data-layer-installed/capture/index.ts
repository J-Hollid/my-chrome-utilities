import {
  beginDataLayerTestingSession,
  persistSession,
  restoreSession,
  type DataLayerSessionState,
} from "../../utilities/data-layer/capture.js";
import {
  createLiveObserverState,
  pauseCapture,
  recordLiveEvent,
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
  storage: Pick<Storage, "getItem" | "setItem">;
  initialPageUrl(): string;
  initialSources(): LiveObserverState["sources"];
  sessionStart(): Promise<CaptureSessionStart>;
  subscribeToLiveFeed(listener: (event: LiveEvent) => void): () => void;
  changed(session: DataLayerSessionState, observer: LiveObserverState): void;
}

export function createCaptureInstalledController(ports: CaptureInstalledPorts) {
  let mounted = false;
  let unsubscribe: (() => void) | undefined;
  let session = restoreSession(ports.storage);
  let observer = createLiveObserverState({ pageUrl:ports.initialPageUrl(), sources:ports.initialSources() });
  const publish = (): void => { persistSession(session, ports.storage); ports.changed(session, observer); };
  const capture = (event: LiveEvent): void => {
    const previousCount = observer.events.length;
    observer = recordLiveEvent(observer, event);
    if (observer.events.length !== previousCount && session.session?.status === "active") {
      session = { ...session, session:{ ...session.session, currentUrl:event.pageUrl ?? session.session.currentUrl,
        timeline:[...session.session.timeline, { ...event, type:"observed", url:event.pageUrl ?? session.session.currentUrl,
          timestamp:event.captureTime, rawValue:event.rawInput }] } };
    }
    publish();
  };
  return {
    mount(): void {
      if (mounted) return;
      mounted = true;
      unsubscribe = ports.subscribeToLiveFeed(capture);
      ports.changed(session, observer);
    },
    dispose(): void {
      if (!mounted) return;
      mounted = false;
      unsubscribe?.(); unsubscribe = undefined;
    },
    async begin(): Promise<void> {
      const started = beginDataLayerTestingSession(session, observer, await ports.sessionStart());
      session = started.sessionState; observer = started.liveObserverState; publish();
    },
    end(): void { session = endDataLayerTestingSession(session); publish(); },
    pause(): void { observer = pauseCapture(observer); publish(); },
    resume(): void { observer = resumeCapture(observer); publish(); },
    capture,
    state:() => ({ session:structuredClone(session), observer:structuredClone(observer) }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"capture",
  capabilities:["observation targets", "sessions", "Live feed", "saved sessions", "refresh lifecycle"],
});
