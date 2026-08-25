export function createLiveFlowTestingInstalledController(ports) {
    let mounted = false;
    let unsubscribe;
    let summary;
    let result;
    const refresh = () => { summary = ports.currentSummary(); result = ports.projectEventResult(); };
    return {
        mount() { if (!mounted) {
            mounted = true;
            unsubscribe = ports.subscribe(refresh);
            refresh();
        } },
        dispose() { if (mounted) {
            mounted = false;
            unsubscribe?.();
            unsubscribe = undefined;
        } },
        begin: ports.beginTest,
        refresh,
        openProjectEntity: ports.openProjectEntity,
        state: () => ({ ...(summary ? { summary: structuredClone(summary) } : {}),
            ...(result ? { result: structuredClone(result) } : {}) }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "live-flow-testing",
    capabilities: ["test lifecycle", "summary", "result projection", "project actions"],
});
//# sourceMappingURL=index.js.map