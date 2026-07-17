export function mountDataLayerNavigation(root) {
    const tabs = Array.from(root.querySelectorAll('[role="tab"][aria-controls^="data-layer-panel-"]'));
    const select = (selected) => {
        for (const tab of tabs) {
            const active = tab === selected;
            tab.setAttribute("aria-selected", String(active));
            tab.tabIndex = active ? 0 : -1;
            const panel = root.querySelector(`#${tab.getAttribute("aria-controls")}`);
            if (panel)
                panel.hidden = !active;
        }
    };
    const onClick = (event) => {
        const tab = event.target.closest('[role="tab"]');
        if (tab && tabs.includes(tab))
            select(tab);
    };
    const tabList = tabs[0]?.parentElement;
    tabList?.addEventListener("click", onClick);
    if (tabs[0])
        select(tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0]);
    return () => tabList?.removeEventListener("click", onClick);
}
//# sourceMappingURL=navigation.js.map