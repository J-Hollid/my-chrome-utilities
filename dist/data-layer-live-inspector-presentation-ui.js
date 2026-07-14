export function captureLiveInspectorPresentation(inspector, focused = document.activeElement) {
    const focusedElement = focused instanceof HTMLElement ? focused : undefined;
    const focusedPropertyPath = focusedElement?.closest(".live-validation-property")?.dataset.propertyPath;
    return {
        showNonApplicableProperties: inspector?.querySelector('[aria-label="Properties"]')?.dataset.showNonApplicableProperties === "true",
        expandedPropertyPaths: Array.from(inspector?.querySelectorAll("details[open][data-property-path]") ?? [])
            .map(({ dataset }) => dataset.propertyPath).filter((path) => Boolean(path)),
        expandedRulePaths: Array.from(inspector?.querySelectorAll('.live-validation-property[data-property-path] .live-property-status[aria-expanded="true"]') ?? [])
            .map((button) => button.closest(".live-validation-property")?.dataset.propertyPath).filter((path) => Boolean(path)),
        ...(focusedElement?.id ? { focusedId: focusedElement.id } : {}),
        ...(focusedPropertyPath ? { focusedPropertyPath } : {}),
        scrollTop: inspector?.scrollTop ?? 0,
    };
}
export function restoreLiveInspectorPresentation(inspector, snapshot, root = document) {
    if (!snapshot)
        return;
    for (const path of snapshot.expandedPropertyPaths)
        inspector?.querySelector(`details[data-property-path="${CSS.escape(path)}"]`)?.setAttribute("open", "");
    for (const path of snapshot.expandedRulePaths) {
        const disclosure = inspector?.querySelector(`.live-validation-property[data-property-path="${CSS.escape(path)}"] .live-property-status`);
        if (disclosure?.getAttribute("aria-expanded") !== "true")
            disclosure?.click();
    }
    if (inspector)
        inspector.scrollTop = snapshot.scrollTop;
    const focusTarget = snapshot.focusedId ? root.getElementById(snapshot.focusedId) : undefined;
    (focusTarget ?? (snapshot.focusedPropertyPath ? inspector?.querySelector(`.live-validation-property[data-property-path="${CSS.escape(snapshot.focusedPropertyPath)}"]`) : undefined))?.focus({ preventScroll: true });
}
//# sourceMappingURL=data-layer-live-inspector-presentation-ui.js.map