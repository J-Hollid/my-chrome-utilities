export function retainUtilityElement(element, scope) {
    return element.owner === scope.utilityId && scope.panelIds.includes(element.id);
}
export function utilityDomScopeFromSearch(search) {
    const parameters = new URLSearchParams(search);
    const utilityId = parameters.get("utility");
    const panelIds = parameters.getAll("panel");
    if (!utilityId || panelIds.length === 0)
        return undefined;
    const removeSelectors = parameters.getAll("remove");
    return {
        utilityId,
        panelIds,
        ...(removeSelectors.length > 0 ? { removeSelectors } : {}),
    };
}
function removeExcludedElements(root, selectors) {
    for (const selector of selectors)
        root.querySelector(selector)?.remove();
}
function removePanelsOutsideScope(root, panelIds) {
    const panels = root.querySelectorAll("#palette,[id^='workspace-panel-'],[id^='data-layer-panel-']");
    for (const panel of Array.from(panels)) {
        if (!panelIds.includes(panel.id))
            panel.remove();
    }
}
function removeElementsOutsideScope(root, scope) {
    for (const element of Array.from(root.querySelectorAll("[data-utility-owner]"))) {
        const ownedElement = { id: element.id, owner: element.dataset.utilityOwner };
        if (!retainUtilityElement(ownedElement, scope))
            element.remove();
    }
}
function synchronizeTabList(root, tabs, panelIds) {
    const selected = tabs.find((tab) => panelIds.includes(tab.getAttribute("aria-controls") ?? ""));
    if (!selected)
        return;
    for (const tab of tabs) {
        const active = tab === selected;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        const panel = root.querySelector(`#${tab.getAttribute("aria-controls")}`);
        if (panel)
            panel.hidden = !active;
    }
}
function synchronizeTabs(root, panelIds) {
    const tabs = Array.from(root.querySelectorAll('[role="tab"][aria-controls]'));
    for (const tab of tabs) {
        const panelId = tab.getAttribute("aria-controls");
        if (!panelId || !root.querySelector(`#${panelId}`))
            tab.remove();
    }
    const connectedTabs = tabs.filter((tab) => tab.isConnected);
    const tabLists = new Set(connectedTabs.map((tab) => tab.parentElement));
    for (const tabList of tabLists) {
        synchronizeTabList(root, connectedTabs.filter((tab) => tab.parentElement === tabList), panelIds);
    }
}
export function isolateUtilityDom(root, scope) {
    removeExcludedElements(root, scope.removeSelectors ?? []);
    removePanelsOutsideScope(root, scope.panelIds);
    removeElementsOutsideScope(root, scope);
    synchronizeTabs(root, scope.panelIds);
}
export function isolateUtilityDomFromSearch(root, search) {
    const scope = utilityDomScopeFromSearch(search);
    if (!scope)
        return undefined;
    isolateUtilityDom(root, scope);
    const documentRoot = root.documentElement;
    if (documentRoot)
        documentRoot.dataset.utilityIsolation = scope.utilityId;
    return scope;
}
//# sourceMappingURL=utility-dom-isolation.js.map