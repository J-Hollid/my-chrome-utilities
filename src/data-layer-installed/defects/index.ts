export interface DefectsInstalledPorts {
  listDefects(): readonly Readonly<Record<string, unknown>>[];
  selectDefect(id: string): void;
  copyDefect(id: string): Promise<void>;
  exportDefects(): Promise<void>;
}

export const installedControllerDefinition = Object.freeze({
  id:"defects",
  capabilities:["defect state", "presentation", "copy", "export"],
});
