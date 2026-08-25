export interface DurableProjectsInstalledPorts {
  root: ParentNode;
  startRepository(): Promise<() => void>;
  reviewMigration(): Promise<void>;
  retryFailedSave(): Promise<void>;
  rejectFailedSave(): Promise<void>;
  storageRecoveryClosed(): void;
}

export function createDurableProjectsInstalledController(ports: DurableProjectsInstalledPorts) {
  const durableStorageRecovery = ports.root.querySelector<HTMLDialogElement>("#durable-storage-recovery");
  let phase: "idle" | "starting" | "ready" | "failed" = "idle";
  let stop: (() => void) | undefined;
  let mounting: Promise<void> | undefined;
  let generation = 0;
  const storageRecoveryClosed = (): void => ports.storageRecoveryClosed();
  return {
    mount(): Promise<void> {
      if (phase === "ready") return Promise.resolve();
      if (mounting) return mounting;
      const operation = ++generation;
      phase = "starting";
      durableStorageRecovery?.addEventListener("close", storageRecoveryClosed);
      mounting = ports.startRepository().then((dispose) => {
        if (operation !== generation) { dispose(); return; }
        stop = dispose; phase = "ready";
      }, (error) => { if (operation === generation) phase = "failed"; throw error; })
        .finally(() => { if (operation === generation) mounting = undefined; });
      return mounting;
    },
    dispose(): void { generation += 1; durableStorageRecovery?.removeEventListener("close", storageRecoveryClosed);
      stop?.(); stop = undefined; mounting = undefined; phase = "idle"; },
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
