export interface ReplayInstalledPorts {
  listSequences(): readonly Readonly<Record<string, unknown>>[];
  saveSequence(): Promise<void>;
  runSequence(id: string): Promise<void>;
  stopReplay(): void;
}

export const installedControllerDefinition = Object.freeze({
  id:"replay",
  capabilities:["sequences", "controls", "execution", "lifecycle"],
});
