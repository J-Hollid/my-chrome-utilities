import { isWorkspaceTabId, WORKSPACE_TAB_STORAGE_KEY, workspaceTabForNavigationKey, workspaceTabs, } from "./workspace-tabs.js";
export function createWorkspaceTabsController({ storage, tabList, root, pageLifecycle, tabs = workspaceTabs, onShow, }) {
    let activeTab = "data-layer";
    let mounted = false;
    function renderButton(button, selected, focus) {
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
        if (focus && selected) {
            button.focus();
        }
    }
    function render(focus = false) {
        for (const workspaceTab of tabs) {
            const button = root.querySelector(`#workspace-tab-${workspaceTab.id}`);
            const panel = root.querySelector(`#workspace-panel-${workspaceTab.id}`);
            const selected = workspaceTab.id === activeTab;
            if (button)
                renderButton(button, selected, focus);
            if (panel) {
                panel.hidden = !selected;
            }
        }
        onShow?.(activeTab);
    }
    function showWorkspace(tab, focus = false) {
        if (!isWorkspaceTabId(tab, tabs))
            return;
        activeTab = tab;
        storage.setItem(WORKSPACE_TAB_STORAGE_KEY, tab);
        render(focus);
    }
    const onTabClick = (event) => {
        const target = event.target;
        const button = typeof target?.closest === "function"
            ? target.closest("[role=tab]")
            : null;
        const tab = button?.id.replace("workspace-tab-", "") ?? null;
        if (isWorkspaceTabId(tab, tabs)) {
            showWorkspace(tab, true);
        }
    };
    const onTabKeydown = (event) => {
        const keyboardEvent = event;
        const next = workspaceTabForNavigationKey(activeTab, keyboardEvent.key, tabs);
        if (next) {
            keyboardEvent.preventDefault();
            showWorkspace(next, true);
        }
    };
    const onPageHide = () => dispose();
    function mount() {
        if (mounted)
            return;
        const stored = storage.getItem(WORKSPACE_TAB_STORAGE_KEY);
        activeTab = isWorkspaceTabId(stored, tabs) ? stored : "data-layer";
        if (!isWorkspaceTabId(stored, tabs)) {
            storage.setItem(WORKSPACE_TAB_STORAGE_KEY, activeTab);
        }
        tabList?.addEventListener("click", onTabClick);
        tabList?.addEventListener("keydown", onTabKeydown);
        pageLifecycle.addEventListener("pagehide", onPageHide);
        mounted = true;
        render();
    }
    function dispose() {
        if (!mounted)
            return;
        tabList?.removeEventListener("click", onTabClick);
        tabList?.removeEventListener("keydown", onTabKeydown);
        pageLifecycle.removeEventListener("pagehide", onPageHide);
        mounted = false;
    }
    return {
        activeTab: () => activeTab,
        mount,
        render,
        show: showWorkspace,
        dispose,
    };
}
//# sourceMappingURL=workspace-tabs-ui.js.map