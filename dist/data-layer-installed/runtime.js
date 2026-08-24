export const installedDataLayerControllerOrder = [
    "capture",
    "event-library",
    "schemas",
    "defects",
    "replay",
    "projects",
    "durable-projects",
    "project-event-transport",
    "live-flow-testing",
];
export function createInstalledDataLayerLifecycle(controllers) {
    let mounted = false;
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            for (const id of installedDataLayerControllerOrder)
                controllers[id].mount();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            for (const id of [...installedDataLayerControllerOrder].reverse()) {
                controllers[id].dispose();
            }
        },
    };
}
//# sourceMappingURL=runtime.js.map