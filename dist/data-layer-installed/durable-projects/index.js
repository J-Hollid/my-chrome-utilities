export function createDurableProjectsInstalledController(ports) {
    const durableStorageRecovery = ports.root.querySelector("#durable-storage-recovery");
    let phase = "idle";
    let stop;
    let mounting;
    let generation = 0;
    const storageRecoveryClosed = () => ports.storageRecoveryClosed();
    return {
        mount() {
            if (phase === "ready")
                return Promise.resolve();
            if (mounting)
                return mounting;
            const operation = ++generation;
            phase = "starting";
            durableStorageRecovery?.addEventListener("close", storageRecoveryClosed);
            mounting = ports.startRepository().then((dispose) => {
                if (operation !== generation) {
                    dispose();
                    return;
                }
                stop = dispose;
                phase = "ready";
            }, (error) => { if (operation === generation)
                phase = "failed"; throw error; })
                .finally(() => { if (operation === generation)
                mounting = undefined; });
            return mounting;
        },
        dispose() {
            generation += 1;
            durableStorageRecovery?.removeEventListener("close", storageRecoveryClosed);
            stop?.();
            stop = undefined;
            mounting = undefined;
            phase = "idle";
        },
        reviewMigration: ports.reviewMigration,
        retryFailedSave: ports.retryFailedSave,
        rejectFailedSave: ports.rejectFailedSave,
        state: () => ({ phase }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "durable-projects",
    capabilities: ["startup", "migration", "save recovery", "repository lifecycle"],
});
//# sourceMappingURL=index.js.map