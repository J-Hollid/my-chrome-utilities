export function flowSelectionContains(selection, item) {
    return selection.some(({ kind, id }) => kind === item.kind && id === item.id);
}
export function primaryFlowSelection(selection) {
    return selection.at(-1);
}
export function selectionAfterActivation(selection, item, extend) {
    if (!extend)
        return [item];
    if (flowSelectionContains(selection, item)) {
        return selection.filter(({ kind, id }) => kind !== item.kind || id !== item.id);
    }
    return [...selection, item];
}
export function selectionAfterRemoval(selection, id) {
    return selection.filter((item) => item.id !== id);
}
export function normalizedFlowSelection(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((item) => Boolean(item && typeof item === "object" &&
        ["section", "page-frame", "occurrence", "relationship"].includes(String(item.kind)) &&
        typeof item.id === "string" && item.id));
}
export function selectionFromStoredView(view) {
    const multiple = normalizedFlowSelection(view?.selectedItems);
    if (multiple.length)
        return multiple;
    return view?.selectedItem ? normalizedFlowSelection([view.selectedItem]) : [];
}
export function storedViewWithSelection(view, selection) {
    const next = { ...view, selectedItems: [...selection] };
    const primary = primaryFlowSelection(selection);
    if (primary)
        next.selectedItem = primary;
    else
        delete next.selectedItem;
    return next;
}
//# sourceMappingURL=workspace-selection.js.map