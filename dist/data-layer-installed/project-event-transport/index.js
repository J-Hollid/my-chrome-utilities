export function createProjectEventTransportInstalledController(ports) {
    const historyPathInput = ports.root.querySelector("#history-path");
    const defaultPushPathInput = ports.root.querySelector("#default-push-path");
    const defaultPushPathStatus = ports.root.querySelector("#default-push-path-status");
    const projectTransportContext = ports.root.querySelector("#project-transport-context");
    const projectTransportGuidance = ports.root.querySelector("#project-transport-guidance");
    let mounted = false;
    let paths = { ...ports.loadPaths() };
    let phase = "idle";
    let projectTransportSavePending = false;
    let generation = 0;
    const input = () => {
        paths = { observationPath: historyPathInput?.value ?? paths.observationPath,
            pushPath: defaultPushPathInput?.value ?? paths.pushPath };
        phase = "dirty";
        renderProjectEventTransport();
    };
    function currentObservationHistoryPath() { return paths.observationPath; }
    function renderProjectEventTransport() {
        const name = ports.projectName();
        if (projectTransportContext)
            projectTransportContext.textContent = name ? `Project context: ${name}` : "No active project";
        if (projectTransportGuidance)
            projectTransportGuidance.hidden = Boolean(name);
        if (defaultPushPathStatus)
            defaultPushPathStatus.textContent = name
                ? projectTransportSavePending ? "Saving project Draft…" : phase === "failed" ? "Save failed; project Draft is unchanged." : "Saved in project Draft"
                : "Open project";
    }
    async function saveProjectEventTransport() {
        input();
        const operation = ++generation, snapshot = { ...paths };
        phase = "saving";
        projectTransportSavePending = true;
        renderProjectEventTransport();
        try {
            await ports.savePaths(snapshot);
            await ports.settleTransport();
            await ports.refreshTargetPath();
            if (mounted && operation === generation)
                phase = "saved";
        }
        catch (error) {
            if (mounted && operation === generation)
                phase = "failed";
            throw error;
        }
        finally {
            if (operation === generation) {
                projectTransportSavePending = false;
                renderProjectEventTransport();
            }
        }
    }
    const change = () => { void saveProjectEventTransport(); };
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
            renderProjectEventTransport();
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
        currentObservationHistoryPath,
        render: renderProjectEventTransport,
        save: saveProjectEventTransport,
        state: () => ({ ...paths, phase }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "project-event-transport",
    capabilities: ["observation path", "push path", "settlement", "target refresh"],
});
//# sourceMappingURL=index.js.map