export interface CaptureInstalledPorts {
  beginSession(): Promise<void>;
  endSession(): Promise<void>;
  subscribeToLiveFeed(listener: () => void): () => void;
  saveCurrentSession(): Promise<void>;
}

export interface CaptureInstalledState {
  phase: "idle" | "active";
  capturedEventCount: number;
}

export function createCaptureInstalledController(ports: CaptureInstalledPorts) {
  let mounted = false;
  let unsubscribe: (() => void) | undefined;
  let state: CaptureInstalledState = { phase:"idle", capturedEventCount:0 };
  const noteCapturedEvent = (): void => {
    state = { ...state, capturedEventCount:state.capturedEventCount + 1 };
  };
  return {
    mount(): void {
      if (mounted) return;
      mounted = true;
      unsubscribe = ports.subscribeToLiveFeed(noteCapturedEvent);
    },
    dispose(): void {
      if (!mounted) return;
      mounted = false;
      unsubscribe?.();
      unsubscribe = undefined;
    },
    async begin(): Promise<void> { await ports.beginSession(); state = { ...state, phase:"active" }; },
    async end(): Promise<void> { await ports.endSession(); state = { ...state, phase:"idle" }; },
    save:ports.saveCurrentSession,
    noteCapturedEvent,
    state:(): CaptureInstalledState => ({ ...state }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"capture",
  capabilities:["observation targets", "sessions", "Live feed", "saved sessions"],
});
