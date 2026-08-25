export function createProjectEventTransportInstalledController(ports) {
    const historyPathInput = ports.root.querySelector("#history-path");
    const defaultPushPathInput = ports.root.querySelector("#default-push-path");
    let mounted = false;
    let paths = { ...ports.loadPaths() };
    let phase = "idle";
    let generation = 0;
    const input = () => {
        paths = { observationPath: historyPathInput?.value ?? paths.observationPath,
            pushPath: defaultPushPathInput?.value ?? paths.pushPath };
        phase = "dirty";
    };
    const change = () => {
        input();
        const operation = ++generation, snapshot = { ...paths };
        phase = "saving";
        void ports.savePaths(snapshot).then(ports.settleTransport).then(ports.refreshTargetPath)
            .then(() => { if (mounted && operation === generation)
            phase = "saved"; }, () => { if (mounted && operation === generation)
            phase = "failed"; });
    };
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            generation += 1;
            if (historyPathInput)
                historyPathInput.value = paths.observationPath;
            if (defaultPushPathInput)
                defaultPushPathInput.value = paths.pushPath;
            historyPathInput?.addEventListener("input", input);
            historyPathInput?.addEventListener("change", change);
            defaultPushPathInput?.addEventListener("input", input);
            defaultPushPathInput?.addEventListener("change", change);
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            generation += 1;
            phase = "idle";
            historyPathInput?.removeEventListener("input", input);
            historyPathInput?.removeEventListener("change", change);
            defaultPushPathInput?.removeEventListener("input", input);
            defaultPushPathInput?.removeEventListener("change", change);
        },
        state: () => ({ ...paths, phase }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "project-event-transport",
    capabilities: ["observation path", "push path", "settlement", "target refresh"],
});
//# sourceMappingURL=index.js.map