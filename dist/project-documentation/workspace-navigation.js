export function documentationTabAfterKey(current, key) {
    const tabs = ["build", "preview", "export"], index = tabs.indexOf(current);
    if (key === "Home")
        return tabs[0];
    if (key === "End")
        return tabs.at(-1);
    if (key === "ArrowRight")
        return tabs[(index + 1) % tabs.length];
    if (key === "ArrowLeft")
        return tabs[(index - 1 + tabs.length) % tabs.length];
    return current;
}
export function documentationPreviewSelection(sectionId) {
    return sectionId === "entire" ? { scope: "complete" } : { scope: "current", currentSectionId: sectionId };
}
//# sourceMappingURL=workspace-navigation.js.map