import {
  isWorkspaceTabId,
  WORKSPACE_TAB_STORAGE_KEY,
  workspaceTabForNavigationKey,
  workspaceTabs,
  type WorkspaceTabId,
  type WorkspaceTab,
} from "./workspace-tabs.js";

export interface WorkspaceTabsController {
  activeTab(): WorkspaceTabId;
  mount(): void;
  render(): void;
  show(tab: WorkspaceTabId, focus?: boolean): void;
  dispose(): void;
}

export interface WorkspaceTabsControllerOptions {
  storage: Pick<Storage, "getItem" | "setItem">;
  tabList: HTMLElement | null;
  root: ParentNode;
  pageLifecycle: Pick<Window, "addEventListener" | "removeEventListener">;
  tabs?: readonly WorkspaceTab[];
  onShow?: (tab: WorkspaceTabId) => void;
}

export function createWorkspaceTabsController({
  storage,
  tabList,
  root,
  pageLifecycle,
  tabs = workspaceTabs,
  onShow,
}: WorkspaceTabsControllerOptions): WorkspaceTabsController {
  let activeTab: WorkspaceTabId = "data-layer";
  let mounted = false;

  function renderButton(
    button: HTMLButtonElement,
    selected: boolean,
    focus: boolean,
  ): void {
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (focus && selected) {
      button.focus();
    }
  }

  function render(focus = false): void {
    for (const workspaceTab of tabs) {
      const button = root.querySelector<HTMLButtonElement>(
        `#workspace-tab-${workspaceTab.id}`,
      );
      const panel = root.querySelector<HTMLElement>(
        `#workspace-panel-${workspaceTab.id}`,
      );
      const selected = workspaceTab.id === activeTab;

      if (button) renderButton(button, selected, focus);
      if (panel) {
        panel.hidden = !selected;
      }
    }
    onShow?.(activeTab);
  }

  function showWorkspace(tab: WorkspaceTabId, focus = false): void {
    if (!isWorkspaceTabId(tab, tabs)) return;
    activeTab = tab;
    storage.setItem(WORKSPACE_TAB_STORAGE_KEY, tab);
    render(focus);
  }

  const onTabClick = (event: Event): void => {
    const target = event.target as Element | null;
    const button = typeof target?.closest === "function"
      ? target.closest<HTMLButtonElement>("[role=tab]")
      : null;
    const tab = button?.id.replace("workspace-tab-", "") ?? null;

    if (isWorkspaceTabId(tab, tabs)) {
      showWorkspace(tab, true);
    }
  };

  const onTabKeydown = (event: Event): void => {
    const keyboardEvent = event as KeyboardEvent;
    const next = workspaceTabForNavigationKey(activeTab, keyboardEvent.key, tabs);

    if (next) {
      keyboardEvent.preventDefault();
      showWorkspace(next, true);
    }
  };

  const onPageHide = (): void => dispose();

  function mount(): void {
    if (mounted) return;

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

  function dispose(): void {
    if (!mounted) return;

    tabList?.removeEventListener("click", onTabClick);
    tabList?.removeEventListener("keydown", onTabKeydown);
    pageLifecycle.removeEventListener("pagehide", onPageHide);
    mounted = false;
  }

  return {
    activeTab: () => activeTab,
    mount,
    render,
    show:showWorkspace,
    dispose,
  };
}
