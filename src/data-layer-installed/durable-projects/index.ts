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
  return {
    mount(): Promise<void> {
      if (phase === "ready") return Promise.resolve();
      if (mounting) return mounting;
      phase = "starting";
      mounting = ports.startRepository().then((dispose) => { stop = dispose; phase = "ready"; },
        (error) => { phase = "failed"; throw error; }).finally(() => { mounting = undefined; });
      return mounting;
    },
    dispose(): void { stop?.(); stop = undefined; phase = "idle"; },
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
