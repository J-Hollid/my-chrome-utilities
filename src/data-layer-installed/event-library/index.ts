export interface EventLibraryInstalledPorts {
  listTemplates(): readonly Readonly<Record<string, unknown>>[];
  saveTemplate(): Promise<void>;
  reviewTransfer(): Promise<void>;
  pushSelectedTemplate(): Promise<void>;
}

export const installedControllerDefinition = Object.freeze({
  id:"event-library",
  capabilities:["templates", "reviews", "transfer", "deletion", "push"],
});
