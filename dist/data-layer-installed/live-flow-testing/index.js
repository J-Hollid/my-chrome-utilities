import { mountLiveFlowTestingUi } from "../../data-layer-live-flow-testing-ui.js";
export function createLiveFlowTestingInstalledController(ports) {
    let mounted = false;
    let unsubscribe;
    let generation = 0;
    let completed = [];
    const liveFlowTestingUi = (ports.createUi ?? mountLiveFlowTestingUi)({
        ...ports,
        saveSummary: (summary) => {
            completed = [structuredClone(summary)];
            ports.saveSummary(summary);
        },
    });
    const refresh = () => {
        if (!mounted)
            return;
        const operation = generation;
        void liveFlowTestingUi.refreshProject().then(() => {
            if (!mounted || operation !== generation)
                return;
            const summary = liveFlowTestingUi.summary();
            completed = summary ? [structuredClone(summary)] : [];
        });
    };
    function resetLiveFlowTestingSession() {
        completed = [];
        liveFlowTestingUi.reset();
        if (mounted)
            refresh();
    }
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            generation += 1;
            unsubscribe = ports.subscribe(refresh);
            refresh();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            generation += 1;
            unsubscribe?.();
            unsubscribe = undefined;
            completed = [];
            liveFlowTestingUi.reset();
        },
        async begin() {
            const operation = generation;
            await liveFlowTestingUi.open();
            if (!mounted || operation !== generation)
                return;
            const summary = liveFlowTestingUi.summary();
            completed = summary ? [structuredClone(summary)] : [];
        },
        refresh,
        complete(record) {
            completed = [structuredClone(record)];
        },
        reset: resetLiveFlowTestingSession,
        renderEventDetails: liveFlowTestingUi.renderEventDetails,
        attachDefect: liveFlowTestingUi.attachDefect,
        state: () => {
            const summary = mounted ? liveFlowTestingUi.summary() : undefined;
            const result = mounted ? liveFlowTestingUi.run()?.history.at(-1) : undefined;
            return { ...(summary ? { summary: structuredClone(summary) } : {}),
                ...(result ? { result: structuredClone(result) } : {}),
                completed: structuredClone(completed), mounted };
        },
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "live-flow-testing",
    capabilities: ["test lifecycle", "summary", "result projection", "project actions"],
});
//# sourceMappingURL=index.js.map