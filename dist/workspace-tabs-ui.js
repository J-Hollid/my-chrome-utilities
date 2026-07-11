import { isWorkspaceTabId, WORKSPACE_TAB_STORAGE_KEY, workspaceTabForNavigationKey, workspaceTabs, } from "./workspace-tabs.js";
export function createWorkspaceTabsController(tabList, storage, root = document) {
    const stored = storage.getItem(WORKSPACE_TAB_STORAGE_KEY);
    let activeTab = isWorkspaceTabId(stored) ? stored : "data-layer";
    function show(tab, focus = false) {
        activeTab = tab;
        storage.setItem(WORKSPACE_TAB_STORAGE_KEY, tab);
        for (const workspaceTab of workspaceTabs) {
            const button = root.querySelector(`#workspace-tab-${workspaceTab.id}`);
            const panel = root.querySelector(`#workspace-panel-${workspaceTab.id}`);
            const selected = workspaceTab.id === tab;
            if (button) {
                button.setAttribute("aria-selected", String(selected));
                button.tabIndex = selected ? 0 : -1;
                if (focus && selected) {
                    button.focus();
                }
            }
            if (panel) {
                panel.hidden = !selected;
            }
        }
    }
    function bind() {
        tabList?.addEventListener("click", (event) => {
            const target = event.target;
            const button = target instanceof Element
                ? target.closest("[role=tab]")
                : null;
            const tab = button?.id.replace("workspace-tab-", "") ?? null;
            if (isWorkspaceTabId(tab)) {
                show(tab, true);
            }
        });
        tabList?.addEventListener("keydown", (event) => {
            const next = workspaceTabForNavigationKey(activeTab, event.key);
            if (next) {
                event.preventDefault();
                show(next, true);
            }
        });
    }
    return {
        activeTab: () => activeTab,
        bind,
        show,
    };
}
//# sourceMappingURL=workspace-tabs-ui.js.map