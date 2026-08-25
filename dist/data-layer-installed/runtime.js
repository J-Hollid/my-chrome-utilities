import { createCaptureInstalledController } from "./capture/index.js";
import { createDefectsInstalledController } from "./defects/index.js";
import { createDurableProjectsInstalledController } from "./durable-projects/index.js";
import { createEventLibraryInstalledController } from "./event-library/index.js";
import { createLiveFlowTestingInstalledController } from "./live-flow-testing/index.js";
import { createProjectEventTransportInstalledController } from "./project-event-transport/index.js";
import { createProjectsInstalledController } from "./projects/index.js";
import { createReplayInstalledController } from "./replay/index.js";
import { createSchemasInstalledController } from "./schemas/index.js";
import { attachSavedSessionToDefect } from "../utilities/data-layer/defect-reporting.js";
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
export function createChromeRuntimeMessagePort(runtimeMessages) {
    return {
        addListener: (listener) => runtimeMessages.addListener(listener),
        removeListener: (listener) => runtimeMessages.removeListener(listener),
    };
}
export function createInstalledSidePanelShellController(ports) {
    const allCommands = [...commandsForUtilityShell(listCommands(), extensionShell.commands)];
    const paletteController = ports.palette;
    const workspaceTabsController = ports.workspaceTabs;
    const hotkeyController = ports.hotkeys;
    let mounted = false;
    async function recordDataLayerCommandRun(entry) {
        if (entry.commandId === "data-layer.start-testing")
            await ports.captureCommands.startTesting();
        if (entry.commandId === "data-layer.end-testing")
            await ports.captureCommands.endTesting();
        if (entry.commandId === "data-layer.choose-observation-target")
            await ports.captureCommands.chooseObservationTarget();
        if (entry.commandId === "data-layer.attach-selected-target")
            await ports.captureCommands.attachSelectedTarget();
        if (entry.commandId === "data-layer.detach-observation-target")
            ports.captureCommands.detachObservationTarget();
    }
    function recordCommandRun(entry) {
        void recordDataLayerCommandRun(entry);
        if (ports.commandLog)
            ports.commandLog.textContent = entry.message;
    }
    function showWorkspace(tab, focus = false) {
        workspaceTabsController.show(tab, focus);
    }
    const commandRunContext = {
        record: recordCommandRun,
        showWorkspace,
        showDataLayerView: ports.showDataLayerView,
    };
    const pageHidden = () => paletteController.dispose();
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            workspaceTabsController.mount();
            hotkeyController.mount();
            paletteController.mount();
            ports.pageLifecycle.addEventListener("pagehide", pageHidden, { once: true });
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            ports.pageLifecycle.removeEventListener("pagehide", pageHidden);
            paletteController.dispose();
            hotkeyController.dispose();
            workspaceTabsController.dispose();
        },
        commandContext: commandRunContext,
        runDataLayerCommand: recordDataLayerCommandRun,
        commands: () => allCommands,
        runCommand: (id) => {
            const command = allCommands.find((candidate) => candidate.id === id);
            if (!command)
                throw new Error(`Unknown installed command ${id}`);
            command.run(commandRunContext);
        },
    };
}
export function installDurableProjectCoordinationSubscription(durableProjectRuntime, ports) {
    return durableProjectRuntime.subscribe(({ active }) => {
        ports.renderProjectEventTransport();
        if (!active?.state)
            return;
        ports.renderSchemas();
        ports.renderSchemaWorkflowRows();
        ports.renderCompactCanonicalEditor();
        ports.renderLayeredProfileEditor();
    });
}
export async function createInstalledSidePanelRuntimeFoundation(root = document, storage = globalThis.localStorage) {
    const app = root.querySelector("#app");
    const panelRoot = root.querySelector("#side-panel-root");
    const utilityDirectory = root.querySelector("#utility-directory");
    const utilityStorageContract = (id) => {
        const contract = utilityRegistry.find((utility) => utility.id === id)?.storage;
        if (!contract)
            throw new Error(`Missing utility storage contract: ${id}`);
        return contract;
    };
    if (panelRoot)
        mountUtilityShell(extensionShell, panelRoot, window);
    if (utilityDirectory)
        renderUtilityDirectory(utilityRegistry, utilityDirectory);
    bindUtilityPanels(utilityRegistry, root);
    const durableProjectRuntime = await openDurableProjectRuntime(storage).catch((error) => {
        installDurableRepositoryStartupFailure(root, error);
        return new Promise(() => { });
    });
    const projectStorage = durableProjectRuntime.storage;
    const scopedDataLayerStorage = createUtilityStorage(storage, utilityStorageContract("data-layer"));
    const dataLayerStorage = {
        get length() { return scopedDataLayerStorage.length; },
        clear() { scopedDataLayerStorage.clear(); projectStorage.removeItem(SCHEMA_LIBRARY_STORAGE_KEY); },
        key: (index) => scopedDataLayerStorage.key(index),
        getItem: (key) => key === SCHEMA_LIBRARY_STORAGE_KEY ? projectStorage.getItem(key) : scopedDataLayerStorage.getItem(key),
        setItem(key, value) { if (key === SCHEMA_LIBRARY_STORAGE_KEY)
            projectStorage.setItem(key, value);
        else
            scopedDataLayerStorage.setItem(key, value); },
        removeItem(key) { if (key === SCHEMA_LIBRARY_STORAGE_KEY)
            projectStorage.removeItem(key);
        else
            scopedDataLayerStorage.removeItem(key); },
    };
    const hotkeyStorage = createUtilityStorage(storage, utilityStorageContract("hotkeys"));
    const shellStorage = createUtilityStorage(storage, { namespace: "my-chrome-utilities.shell", version: 1,
        legacyKeys: ["my-chrome-utilities.workspace-tab.v1"] });
    const sidePanelContent = root.querySelector("#side-panel-content");
    const commandLog = root.querySelector("#command-log");
    const openPaletteButton = root.querySelector("#open-palette");
    const palette = root.querySelector("#palette");
    const paletteFilter = root.querySelector("#palette-filter");
    const paletteResults = root.querySelector("#palette-results");
    const createKeymapButton = root.querySelector("#create-keymap");
    const updateKeymapButton = root.querySelector("#update-keymap");
    const loadKeymapButton = root.querySelector("#load-keymap");
    const keymapFileInput = root.querySelector("#keymap-file");
    const keymapStatus = root.querySelector("#keymap-status");
    const keymapWarning = root.querySelector("#keymap-warning");
    const workspaceTabList = root.querySelector("#workspace-tabs");
    const hotkeyEditorFilter = root.querySelector("#hotkey-editor-filter");
    const hotkeyEditorCommands = root.querySelector("#hotkey-editor-commands");
    return { app, sidePanelContent, commandLog, openPaletteButton, palette, paletteFilter, paletteResults,
        createKeymapButton, updateKeymapButton, loadKeymapButton, keymapFileInput, keymapStatus, keymapWarning,
        workspaceTabList, hotkeyEditorFilter, hotkeyEditorCommands,
        dataLayerStorage, hotkeyStorage, shellStorage, durableProjectRuntime };
}
export function createInstalledDataLayerControllers(ports) {
    const controllers = {
        capture: createCaptureInstalledController(ports.capture),
        "event-library": createEventLibraryInstalledController(ports["event-library"]),
        schemas: createSchemasInstalledController(ports.schemas),
        defects: createDefectsInstalledController(ports.defects),
        replay: createReplayInstalledController(ports.replay),
        projects: createProjectsInstalledController(ports.projects),
        "durable-projects": createDurableProjectsInstalledController(ports["durable-projects"]),
        "project-event-transport": createProjectEventTransportInstalledController(ports["project-event-transport"]),
        "live-flow-testing": createLiveFlowTestingInstalledController(ports["live-flow-testing"]),
    };
    return { controllers, lifecycle: createInstalledDataLayerLifecycle(controllers) };
}
export function createDefectCaptureCoordination(owners, now = () => new Date().toISOString()) {
    return {
        attachCurrentSession(defectId) {
            const draft = owners.capture.currentSessionDraft();
            const result = attachSavedSessionToDefect(owners.defects.library(), owners.capture.savedSessions(), defectId, draft.completed, `Evidence for ${defectId}`, now());
            owners.defects.replace(result.library);
            owners.capture.replaceSavedSessions(result.savedSessions);
        },
        openLinkedSession(defectId) {
            const defect = owners.defects.library().defects.find(({ id }) => id === defectId);
            if (!defect?.savedSession || !owners.capture.openSavedSession(defect.savedSession.id))
                return false;
            const matching = owners.defects.matchingEvent(defect);
            if (matching)
                owners.capture.openInspector(matching.id);
            return true;
        },
    };
}
export function createEventLibrarySchemaCoordination(owners) {
    return {
        schemas: () => owners.schemas.schemas(),
        validateDraft: (draft) => owners.schemas.validateAgainstSchema({ sourceId: draft.sourceId, eventName: draft.eventName,
            payload: structuredClone(draft.payload), rawInput: [] }, draft.schemaId),
        createSchema: (template) => {
            owners.schemas.openSchemaFromSource(template.name, structuredClone(template.payload));
        },
    };
}
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
import { extensionShell, utilityRegistry } from "../utility-registry.js";
import { commandsForUtilityShell, listCommands } from "../utilities/command-palette/index.js";
import { bindUtilityPanels, mountUtilityShell, renderUtilityDirectory } from "../platform/utility-shell-dom.js";
import { createUtilityStorage } from "../platform/utility-storage.js";
import { installDurableRepositoryStartupFailure, openDurableProjectRuntime, SCHEMA_LIBRARY_STORAGE_KEY } from "../utilities/data-layer/schemas.js";
//# sourceMappingURL=runtime.js.map