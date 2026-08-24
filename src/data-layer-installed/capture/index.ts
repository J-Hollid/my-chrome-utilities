export interface CaptureInstalledPorts {
  listObservationTargets(): readonly Readonly<Record<string, unknown>>[];
  beginSession(): Promise<void>;
  subscribeToLiveFeed(listener: () => void): () => void;
  saveCurrentSession(): Promise<void>;
}

export const installedControllerDefinition = Object.freeze({
  id:"capture",
  capabilities:["observation targets", "sessions", "Live feed", "saved sessions"],
});
