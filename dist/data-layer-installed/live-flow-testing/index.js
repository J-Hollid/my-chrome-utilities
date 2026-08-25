export function createLiveFlowTestingInstalledController(ports) {
    let mounted = false;
    let unsubscribe;
    let summary;
    let result;
    let generation = 0;
    let completed = [];
    const refresh = () => { if (mounted) {
        summary = ports.currentSummary();
        result = ports.projectEventResult();
    } };
    const liveFlowTestingUi = {
        open: ports.beginTest,
        refreshProject: refresh,
        reset: () => { summary = undefined; result = undefined; },
    };
    function resetLiveFlowTestingSession() {
        completed = [];
        liveFlowTestingUi.reset();
        if (mounted)
            liveFlowTestingUi.refreshProject();
    }
    return {
        mount() { if (!mounted) {
            mounted = true;
            generation += 1;
            unsubscribe = ports.subscribe(refresh);
            refresh();
        } },
        dispose() { if (mounted) {
            mounted = false;
            generation += 1;
            unsubscribe?.();
            unsubscribe = undefined;
            summary = undefined;
            result = undefined;
        } },
        async begin() { const operation = generation; await liveFlowTestingUi.open(); if (mounted && operation === generation)
            refresh(); },
        refresh,
        complete(record) { completed = [structuredClone(record)]; summary = structuredClone(record); },
        reset: resetLiveFlowTestingSession,
        openProjectEntity: ports.openProjectEntity,
        state: () => ({ ...(summary ? { summary: structuredClone(summary) } : {}),
            ...(result ? { result: structuredClone(result) } : {}), completed: structuredClone(completed), mounted }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "live-flow-testing",
    capabilities: ["test lifecycle", "summary", "result projection", "project actions"],
});
//# sourceMappingURL=index.js.map