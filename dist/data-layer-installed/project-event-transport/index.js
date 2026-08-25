import { targetPathStatusForObservation } from "../../data-layer-target-path-status.js";
export function createProjectEventTransportInstalledController(ports) {
    const historyPathInput = ports.root.querySelector("#history-path");
    const transportHistoryPathDisplay = ports.root.querySelector("#history-path-display");
    const transportHistoryPathStatus = ports.root.querySelector("#history-path-status");
    const defaultPushPathInput = ports.root.querySelector("#default-push-path");
    const defaultPushPathStatus = ports.root.querySelector("#default-push-path-status");
    const projectTransportContext = ports.root.querySelector("#project-transport-context");
    const projectTransportGuidance = ports.root.querySelector("#project-transport-guidance");
    let mounted = false;
    let paths = { ...ports.loadPaths() };
    let phase = "idle";
    let projectTransportSavePending = false;
    let generation = 0;
    let targetPathRequest = 0;
    let currentTargetPathStatus = "Selection required";
    function renderTargetPath(path, fieldValue = path, status = "Selection required") {
        if (historyPathInput)
            historyPathInput.value = fieldValue;
        if (transportHistoryPathDisplay)
            transportHistoryPathDisplay.textContent = path;
        if (transportHistoryPathStatus)
            transportHistoryPathStatus.textContent = status === "Waiting for path" ? "Waiting for observation path" : status;
    }
    function currentObservationHistoryPath() { return paths.observationPath; }
    const targetPathStatusController = {
        apply(observation, path = currentObservationHistoryPath(), fieldValue = path) {
            if (!mounted)
                return;
            targetPathRequest += 1;
            currentTargetPathStatus = targetPathStatusForObservation(observation, path);
            renderTargetPath(path, fieldValue, currentTargetPathStatus);
            ports.renderTargetReadiness();
            ports.applyLiveTargetPathObservation(observation);
        },
        async configure(path, fieldValue = path) {
            const request = ++targetPathRequest, operation = generation;
            const observation = await ports.readTargetObservation(path);
            if (!mounted || operation !== generation || request !== targetPathRequest)
                return;
            if (observation)
                targetPathStatusController.apply(observation, path, fieldValue);
            else {
                currentTargetPathStatus = "Selection required";
                renderTargetPath(path, fieldValue, currentTargetPathStatus);
                ports.renderTargetReadiness();
            }
        },
    };
    function refreshSelectedTargetPathStatus() {
        const path = currentObservationHistoryPath();
        if (!path.trim()) {
            currentTargetPathStatus = "Waiting for path";
            renderTargetPath(path, historyPathInput?.value ?? path, currentTargetPathStatus);
            ports.renderTargetReadiness();
            return;
        }
        void targetPathStatusController.configure(path, historyPathInput?.value ?? path);
    }
    function synchronizeProjectPaths() {
        paths = { ...ports.loadPaths() };
        if (historyPathInput)
            historyPathInput.value = paths.observationPath;
        if (defaultPushPathInput)
            defaultPushPathInput.value = paths.pushPath;
        renderProjectEventTransport();
        refreshSelectedTargetPathStatus();
    }
    const syncPaths = () => {
        paths = { observationPath: historyPathInput?.value ?? paths.observationPath,
            pushPath: defaultPushPathInput?.value ?? paths.pushPath };
        phase = "dirty";
    };
    const input = () => {
        syncPaths();
        void targetPathStatusController.configure(currentObservationHistoryPath(), historyPathInput?.value ?? paths.observationPath);
        renderProjectEventTransport();
    };
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
        syncPaths();
        const operation = ++generation, snapshot = { ...paths };
        phase = "saving";
        projectTransportSavePending = true;
        renderProjectEventTransport();
        try {
            await ports.savePaths(snapshot);
            await ports.settleTransport();
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
    const observationPathChange = () => {
        void saveProjectEventTransport().then(refreshSelectedTargetPathStatus).catch((error) => {
            if (transportHistoryPathStatus)
                transportHistoryPathStatus.textContent = error instanceof Error ? error.message : String(error);
        });
    };
    const pushPathChange = () => {
        void saveProjectEventTransport().catch((error) => {
            if (defaultPushPathStatus)
                defaultPushPathStatus.textContent = error instanceof Error ? error.message : String(error);
        });
    };
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            generation += 1;
            paths = { ...ports.loadPaths() };
            if (historyPathInput)
                historyPathInput.value = paths.observationPath;
            if (defaultPushPathInput)
                defaultPushPathInput.value = paths.pushPath;
            historyPathInput?.addEventListener("input", input);
            historyPathInput?.addEventListener("change", observationPathChange);
            defaultPushPathInput?.addEventListener("change", pushPathChange);
            renderProjectEventTransport();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            generation += 1;
            phase = "idle";
            targetPathRequest += 1;
            historyPathInput?.removeEventListener("input", input);
            historyPathInput?.removeEventListener("change", observationPathChange);
            defaultPushPathInput?.removeEventListener("change", pushPathChange);
        },
        currentObservationHistoryPath,
        configureTargetPath: targetPathStatusController.configure,
        applyTargetPathObservation: targetPathStatusController.apply,
        refreshTargetPath: refreshSelectedTargetPathStatus,
        synchronizeProjectPaths,
        render: renderProjectEventTransport,
        save: saveProjectEventTransport,
        state: () => ({ ...paths, phase, currentTargetPathStatus, targetPathRequest }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "project-event-transport",
    capabilities: ["observation path", "push path", "settlement", "target refresh"],
});
//# sourceMappingURL=index.js.map