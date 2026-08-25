export interface DurableProjectsInstalledPorts {
  startRepository(): Promise<() => void>;
  reviewMigration(): Promise<void>;
  retryFailedSave(): Promise<void>;
  rejectFailedSave(): Promise<void>;
}

export function createDurableProjectsInstalledController(ports: DurableProjectsInstalledPorts) {
  let phase: "idle" | "starting" | "ready" | "failed" = "idle";
  let stop: (() => void) | undefined;
  let mounting: Promise<void> | undefined;
  let generation = 0;
  return {
    mount(): Promise<void> {
      if (phase === "ready") return Promise.resolve();
      if (mounting) return mounting;
      const operation = ++generation;
      phase = "starting";
      mounting = ports.startRepository().then((dispose) => {
        if (operation !== generation) { dispose(); return; }
        stop = dispose; phase = "ready";
      }, (error) => { if (operation === generation) phase = "failed"; throw error; })
        .finally(() => { if (operation === generation) mounting = undefined; });
      return mounting;
    },
    dispose(): void { generation += 1; stop?.(); stop = undefined; mounting = undefined; phase = "idle"; },
    reviewMigration:ports.reviewMigration,
    retryFailedSave:ports.retryFailedSave,
    rejectFailedSave:ports.rejectFailedSave,
    state:() => ({ phase }),
  };
}

export const installedControllerDefinition = Object.freeze({
  id:"durable-projects",
  capabilities:["startup", "migration", "save recovery", "repository lifecycle"],
});
