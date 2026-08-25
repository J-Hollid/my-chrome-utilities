export function createProjectEventTransportInstalledController(ports) {
    const observation = ports.root.querySelector("#history-path");
    const push = ports.root.querySelector("#default-push-path");
    let mounted = false;
    let paths = { ...ports.loadPaths() };
    let phase = "idle";
    let generation = 0;
    const input = () => {
        paths = { observationPath: observation?.value ?? paths.observationPath,
            pushPath: push?.value ?? paths.pushPath };
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
            if (observation)
                observation.value = paths.observationPath;
            if (push)
                push.value = paths.pushPath;
            observation?.addEventListener("input", input);
            observation?.addEventListener("change", change);
            push?.addEventListener("input", input);
            push?.addEventListener("change", change);
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            generation += 1;
            phase = "idle";
            observation?.removeEventListener("input", input);
            observation?.removeEventListener("change", change);
            push?.removeEventListener("input", input);
            push?.removeEventListener("change", change);
        },
        state: () => ({ ...paths, phase }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "project-event-transport",
    capabilities: ["observation path", "push path", "settlement", "target refresh"],
});
//# sourceMappingURL=index.js.map