import { createWorkspaceTabsController } from "../workspace-tabs-ui.js";
import { workspaceTabs } from "../workspace-tabs.js";
import { validateUtilityContributions, type UtilityPageContribution } from "./contribution.js";
import { createRetainedUtilityPage, type RetainedPageOptions } from "./retained-page.js";

export interface UtilityWorkspaceOptions {
  document: Document;
  page: Window;
  storage: Pick<Storage, "getItem" | "setItem">;
  contributions: readonly UtilityPageContribution[];
  selectTarget: RetainedPageOptions["selectTarget"];
  subscribeTargetClosed: RetainedPageOptions["subscribeTargetClosed"];
}

export function mountUtilityWorkspace(options: UtilityWorkspaceOptions) {
  const { document: doc, page, storage, contributions, selectTarget, subscribeTargetClosed } = options;
  validateUtilityContributions(contributions);
  const tabList = doc.querySelector<HTMLElement>("#workspace-tabs");
  const container = doc.querySelector("#workspace-panel-data-layer")?.parentElement;
  if (!tabList || !container) throw new Error("The workspace host is missing");
  const pages = new Map<string, ReturnType<typeof createRetainedUtilityPage>>();
  const elements: HTMLElement[] = [];
  for (const contribution of contributions) {
    const button = doc.createElement("button"), panel = doc.createElement("section");
    button.type = "button"; button.id = `workspace-tab-${contribution.id}`;
    button.textContent = contribution.label; button.setAttribute("role", "tab");
    panel.id = `workspace-panel-${contribution.id}`; panel.hidden = true;
    panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", button.id);
    button.setAttribute("aria-controls", panel.id); tabList.append(button); container.append(panel);
    elements.push(button, panel);
    pages.set(contribution.id, createRetainedUtilityPage({ contribution, panel, page, selectTarget, subscribeTargetClosed }));
  }
  const tabs = createWorkspaceTabsController({ storage, tabList, root: doc, pageLifecycle: page,
    tabs: [...workspaceTabs, ...contributions], onShow: (id) => { void pages.get(id)?.load(); } });
  tabs.mount();
  const dispose = (): void => {
    tabs.dispose(); for (const session of pages.values()) session.dispose();
    for (const element of elements) element.remove(); page.removeEventListener("pagehide", dispose);
  };
  page.addEventListener("pagehide", dispose, { once: true });
  return { tabs, dispose };
}
