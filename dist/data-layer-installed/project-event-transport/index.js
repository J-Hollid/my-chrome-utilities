export function createProjectEventTransportInstalledController(ports) {
    const observation = ports.root.querySelector("#history-path");
    const push = ports.root.querySelector("#default-push-path");
    let mounted = false;
    let paths = { ...ports.loadPaths() };
    const input = () => {
        paths = { observationPath: observation?.value ?? paths.observationPath,
            pushPath: push?.value ?? paths.pushPath };
    };
    const change = () => { input(); void ports.savePaths(paths).then(ports.settleTransport).then(ports.refreshTargetPath); };
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
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
            observation?.removeEventListener("input", input);
            observation?.removeEventListener("change", change);
            push?.removeEventListener("input", input);
            push?.removeEventListener("change", change);
        },
        state: () => ({ ...paths }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "project-event-transport",
    capabilities: ["observation path", "push path", "settlement", "target refresh"],
});
//# sourceMappingURL=index.js.map