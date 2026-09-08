import { utilityPageContributions } from "../utility-contributions/index.js";
import { mountUtilityWorkspace } from "./workspace.js";
import { createUtilityStorage } from "../platform/utility-storage.js";
import { WORKSPACE_TAB_STORAGE_KEY } from "../workspace-tabs.js";
export async function mountInstalledUtilityWorkspace() {
    const storage = createUtilityStorage(localStorage, { namespace: "my-chrome-utilities.shell", version: 1,
        legacyKeys: [WORKSPACE_TAB_STORAGE_KEY] });
    const workspace = mountUtilityWorkspace({ document, page: window, storage,
        contributions: utilityPageContributions,
        selectTarget: async () => {
            const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            const target = tabs.find((tab) => tab.id !== undefined && /^https?:\/\//.test(tab.url ?? ""));
            return target?.id ?? null;
        },
        subscribeTargetClosed: (listener) => {
            chrome.tabs.onRemoved.addListener(listener);
            return () => chrome.tabs.onRemoved.removeListener(listener);
        } });
    const status = document.createElement("output");
    status.id = "data-layer-startup-status";
    status.setAttribute("aria-live", "polite");
    status.textContent = "Opening Data Layer…";
    document.querySelector("#workspace-panel-data-layer")?.prepend(status);
    let closed = false;
    const onClose = () => { closed = true; workspace.dispose(); };
    window.addEventListener("pagehide", onClose, { once: true });
    try {
        const { mountInstalledDataLayerRuntime } = await import("../utilities/data-layer/index.js");
        const runtime = await mountInstalledDataLayerRuntime(document, localStorage, workspace.tabs);
        if (closed)
            runtime.dispose();
        return {
            mount() { if (!closed) {
                runtime.mount();
                status.remove();
            } },
            dispose() { runtime.dispose(); workspace.dispose(); window.removeEventListener("pagehide", onClose); },
        };
    }
    catch (error) {
        status.textContent = `Data Layer could not start: ${String(error)}`;
        status.setAttribute("role", "alert");
        return { mount() { }, dispose() { workspace.dispose(); window.removeEventListener("pagehide", onClose); } };
    }
}
//# sourceMappingURL=installed-entry.js.map