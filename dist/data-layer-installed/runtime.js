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
export async function mountInstalledDataLayerRuntime() {
    const { mountInstalledApplication } = await import("./schemas/application.js");
    let mounted = false;
    let disposeApplication;
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            void mountInstalledApplication({ replay: createReplayInstalledController }).then((dispose) => {
                if (mounted)
                    disposeApplication = dispose;
                else
                    dispose();
            });
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            disposeApplication?.();
            disposeApplication = undefined;
        },
    };
}
import { createReplayInstalledController } from "./replay/index.js";
//# sourceMappingURL=runtime.js.map