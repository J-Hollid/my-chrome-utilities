export interface DurableProjectsInstalledPorts {
  startRepository(): Promise<void>;
  reviewMigration(): Promise<void>;
  retryFailedSave(): Promise<void>;
  rejectFailedSave(): Promise<void>;
}

export const installedControllerDefinition = Object.freeze({
  id:"durable-projects",
  capabilities:["startup", "migration", "save recovery", "repository lifecycle"],
});
