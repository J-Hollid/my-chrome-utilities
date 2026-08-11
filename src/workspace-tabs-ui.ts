import {
  isWorkspaceTabId,
  WORKSPACE_TAB_STORAGE_KEY,
  workspaceTabForNavigationKey,
  workspaceTabs,
  type WorkspaceTabId,
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
}

export function createWorkspaceTabsController({
  storage,
  tabList,
  root,
  pageLifecycle,
}: WorkspaceTabsControllerOptions): WorkspaceTabsController {
  let activeTab: WorkspaceTabId = "data-layer";
  let mounted = false;

  function render(focus = false): void {
    for (const workspaceTab of workspaceTabs) {
      const button = root.querySelector<HTMLButtonElement>(
        `#workspace-tab-${workspaceTab.id}`,
      );
      const panel = root.querySelector<HTMLElement>(
        `#workspace-panel-${workspaceTab.id}`,
      );
      const selected = workspaceTab.id === activeTab;

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

  function show(tab: WorkspaceTabId, focus = false): void {
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

    if (isWorkspaceTabId(tab)) {
      show(tab, true);
    }
  };

  const onTabKeydown = (event: Event): void => {
    const keyboardEvent = event as KeyboardEvent;
    const next = workspaceTabForNavigationKey(activeTab, keyboardEvent.key);

    if (next) {
      keyboardEvent.preventDefault();
      show(next, true);
    }
  };

  const onPageHide = (): void => dispose();

  function mount(): void {
    if (mounted) return;

    const stored = storage.getItem(WORKSPACE_TAB_STORAGE_KEY);
    activeTab = isWorkspaceTabId(stored) ? stored : "data-layer";
    if (!isWorkspaceTabId(stored)) {
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
    show,
    dispose,
  };
}
