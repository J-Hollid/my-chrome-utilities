export const WORKSPACE_TAB_STORAGE_KEY =
  "my-chrome-utilities.workspace-tab.v1";

export const workspaceTabs = [
  { id: "data-layer", label: "Data Layer" },
  { id: "hotkeys", label: "Hotkeys" },
] as const;

export type WorkspaceTabId = string;
export interface WorkspaceTab { readonly id: string; readonly label: string; }

export function isWorkspaceTabId(value: string | null, tabs: readonly WorkspaceTab[] = workspaceTabs): value is WorkspaceTabId {
  return tabs.some((tab) => tab.id === value);
}

export function workspaceTabForNavigationKey(
  current: WorkspaceTabId,
  key: string,
  tabs: readonly WorkspaceTab[] = workspaceTabs,
): WorkspaceTabId | undefined {
  const index = tabs.findIndex((tab) => tab.id === current);

  if (key === "Home") {
    return tabs[0]?.id;
  }
  if (key === "End") {
    return tabs.at(-1)?.id;
  }
  if (key === "ArrowRight") {
    return tabs[(index + 1) % tabs.length]?.id;
  }
  if (key === "ArrowLeft") {
    return tabs[(index - 1 + tabs.length) % tabs.length]?.id;
  }

  return undefined;
}
