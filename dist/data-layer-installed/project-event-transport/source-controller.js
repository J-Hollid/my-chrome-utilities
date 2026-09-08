import { createObservationSourceEditor } from "../../data-layer-project-observation-sources/editor-state.js";
import { createObservationSourceEditorUi } from "../../data-layer-project-observation-sources/editor-ui.js";
import { pathStatus } from "../../data-layer.js";
export function createInstalledSourceSettings(root, ports, read, changed, apply) {
    const host = root.querySelector("#observation-source-settings");
    let mounted = false, timer, generation = 0;
    let applied = "";
    let identity = "", preferredPath = "", readiness = "Selection required", request = 0;
    const statuses = new Map();
    const editor = createObservationSourceEditor({
        ...ports, id: () => "source:" + crypto.randomUUID(),
        changed: () => {
            if (!mounted)
                return;
            ui?.render();
            statuses.forEach((status, id) => ui?.status(id, status));
            const config = editor.configuration(), next = JSON.stringify(config);
            if (next !== identity) {
                identity = next;
                generation += 1;
                changed();
                void refreshStatus();
            }
        },
    });
    const ui = host ? createObservationSourceEditorUi(host, editor) : undefined;
    async function refreshStatus() {
        const operation = generation, currentRequest = ++request;
        const config = editor.configuration();
        let first, ready;
        const nextStatuses = new Map();
        for (const source of config?.sources ?? []) {
            if (!source.enabled) {
                nextStatuses.set(source.id, "Disabled");
                continue;
            }
            try {
                const observation = await read(source.path);
                if (!mounted || operation !== generation || currentRequest !== request)
                    return;
                let status = "Selection required";
                if (observation) {
                    first ??= observation;
                    const path = pathStatus(observation.pageObject, source.path);
                    status = observation.pageAccessStatus !== "page access available" ? "Access required" :
                        path === "ready" ? "Ready" : path === "path missing" ? "Waiting for path" : "Not an array";
                    if (status === "Ready")
                        ready ??= observation;
                }
                nextStatuses.set(source.id, status);
            }
            catch {
                nextStatuses.set(source.id, "Access required");
            }
        }
        if (!mounted || operation !== generation || currentRequest !== request)
            return;
        statuses.clear();
        nextStatuses.forEach((value, key) => statuses.set(key, value));
        statuses.forEach((status, id) => ui?.status(id, status));
        preferredPath = ready?.historyPath ?? config?.sources.find(source => source.enabled)?.path ?? "";
        readiness = ready ? "Ready" : !config ? "Open project" :
            !config.sources.some(source => source.enabled) ? "Enable an observation source" :
                first?.pageAccessStatus === "page access unavailable" ? "Access required" : "Waiting for path";
        ui?.readiness(readiness);
        const observation = ready ?? first;
        const nextApplied = JSON.stringify([config?.projectId, observation?.tabId, observation?.pageUrl, preferredPath, readiness]);
        if (nextApplied !== applied) {
            applied = nextApplied;
            apply(observation, preferredPath, readiness);
        }
    }
    async function refresh() {
        try {
            await editor.refresh();
        }
        catch {
            readiness = "Access required";
        }
    }
    const poll = () => {
        void refreshStatus().finally(() => { if (mounted)
            timer = setTimeout(poll, 500); });
    };
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            for (const selector of ['label[for="history-path"]', "#history-path", "#history-path-status"]) {
                const node = root.querySelector(selector);
                if (node)
                    node.hidden = true;
            }
            void refresh().then(() => { if (mounted)
                poll(); });
        },
        dispose() { mounted = false; generation += 1; clearTimeout(timer); },
        refresh, refreshStatus, editor,
        configuration: editor.configuration,
        path: () => preferredPath,
        readiness: () => readiness,
        status(source, status) {
            statuses.set(source.id, status);
            ui?.status(source.id, status);
        },
    };
}
//# sourceMappingURL=source-controller.js.map