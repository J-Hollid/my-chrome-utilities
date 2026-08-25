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
import { bindUtilityPanels, mountUtilityShell, renderUtilityDirectory } from "../platform/utility-shell-dom.js";
import { createUtilityStorage } from "../platform/utility-storage.js";
import { installDurableRepositoryStartupFailure, openDurableProjectRuntime, SCHEMA_LIBRARY_STORAGE_KEY } from "../utilities/data-layer/schemas.js";
//# sourceMappingURL=runtime.js.map