export const WORKSPACE_TAB_STORAGE_KEY = "my-chrome-utilities.workspace-tab.v1";
export const workspaceTabs = [
    { id: "data-layer", label: "Data Layer" },
    { id: "hotkeys", label: "Hotkeys" },
];
export function isWorkspaceTabId(value) {
    return workspaceTabs.some((tab) => tab.id === value);
}
export function workspaceTabForNavigationKey(current, key) {
    const index = workspaceTabs.findIndex((tab) => tab.id === current);
    if (key === "Home") {
        return workspaceTabs[0]?.id;
    }
    if (key === "End") {
        return workspaceTabs.at(-1)?.id;
    }
    if (key === "ArrowRight") {
        return workspaceTabs[(index + 1) % workspaceTabs.length]?.id;
    }
    if (key === "ArrowLeft") {
        return workspaceTabs[(index - 1 + workspaceTabs.length) % workspaceTabs.length]?.id;
    }
    return undefined;
}
//# sourceMappingURL=workspace-tabs.js.map