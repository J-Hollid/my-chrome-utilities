import { createSequence, findSequenceReplayElements, readiness, renderSequenceReplay, runSequence, setSequenceReplayResult, } from "../../utilities/data-layer/replay.js";
export function createReplayInstalledController(ports) {
    const elements = findSequenceReplayElements(ports.root);
    const empty = ports.root.querySelector("#sequence-empty-state");
    let mounted = false;
    let replaySequences = [];
    const render = () => {
        if (!mounted)
            return;
        if (empty)
            empty.hidden = replaySequences.length > 0;
        renderSequenceReplay(elements, replaySequences, (sequence) => {
            const templates = ports.listTemplates();
            const adapters = ports.listSources().map((source) => ({
                ...source,
                kind: "Data Layer",
                destination: "event.history",
                enabled: true,
                capabilities: ["push"],
            }));
            const ready = readiness(sequence, templates, adapters);
            if (!ready.runnable) {
                setSequenceReplayResult(elements, `Not runnable: ${ready.blocked.join(", ")}`);
                return;
            }
            const record = runSequence(sequence, templates, adapters, ports.pageUrl(), "Run all");
            setSequenceReplayResult(elements, `${record.result}: ${record.steps.length} steps.`);
        });
    };
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            render();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            elements.list?.replaceChildren();
            setSequenceReplayResult(elements, "");
        },
        createFromSession(id, name, eventIds) {
            const eventIdSet = new Set(eventIds);
            const templates = ports.listTemplates().filter((template) => eventIdSet.has(template.id.replace(/^template:/u, "")));
            const sequence = createSequence(`sequence:${id}`, `${name} sequence`, id, templates);
            replaySequences = [...replaySequences, sequence];
            render();
            return sequence;
        },
        sequences: () => replaySequences,
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "replay",
    capabilities: ["sequences", "controls", "execution", "lifecycle"],
});
//# sourceMappingURL=index.js.map