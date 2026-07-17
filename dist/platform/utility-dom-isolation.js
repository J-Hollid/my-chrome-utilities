export function retainUtilityElement(element, scope) {
    return element.owner === scope.utilityId && scope.panelIds.includes(element.id);
}
export function isolateUtilityDom(root, scope) {
    for (const selector of scope.removeSelectors ?? [])
        root.querySelector(selector)?.remove();
    for (const element of Array.from(root.querySelectorAll("[data-utility-owner]"))) {
        if (!retainUtilityElement({ id: element.id, owner: element.dataset.utilityOwner }, scope))
            element.remove();
    }
    const tabs = Array.from(root.querySelectorAll('[role="tab"][aria-controls]'));
    for (const tab of tabs)
        if (!root.querySelector(`#${tab.getAttribute("aria-controls")}`))
            tab.remove();
    const tabLists = new Set(tabs.filter((tab) => tab.isConnected).map((tab) => tab.parentElement));
    for (const tabList of tabLists) {
        const group = tabs.filter((tab) => tab.isConnected && tab.parentElement === tabList);
        const selected = group.find((tab) => scope.panelIds.includes(tab.getAttribute("aria-controls") ?? ""));
        if (!selected)
            continue;
        for (const tab of group) {
            const active = tab === selected;
            tab.setAttribute("aria-selected", String(active));
            tab.tabIndex = active ? 0 : -1;
            const panel = root.querySelector(`#${tab.getAttribute("aria-controls")}`);
            if (panel)
                panel.hidden = !active;
        }
    }
}
//# sourceMappingURL=utility-dom-isolation.js.map