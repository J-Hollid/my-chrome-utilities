export function createDurableProjectsInstalledController(ports) {
    let phase = "idle";
    let stop;
    let mounting;
    return {
        mount() {
            if (phase === "ready")
                return Promise.resolve();
            if (mounting)
                return mounting;
            phase = "starting";
            mounting = ports.startRepository().then((dispose) => { stop = dispose; phase = "ready"; }, (error) => { phase = "failed"; throw error; }).finally(() => { mounting = undefined; });
            return mounting;
        },
        dispose() { stop?.(); stop = undefined; phase = "idle"; },
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