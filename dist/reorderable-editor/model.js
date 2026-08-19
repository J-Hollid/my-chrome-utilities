const action = (id, label, disabled) => ({ id, label, disabled });
export function reorderControlModel(input) {
    const position = input.completeOrder.findIndex(({ id }) => id === input.itemId);
    if (position < 0)
        throw new Error(`Unknown reorder item ${input.itemId}.`);
    const legalIds = new Set(input.legalDestinationIds ?? input.completeOrder.map(({ id }) => id));
    legalIds.add(input.itemId);
    const legalOrder = input.completeOrder.filter(({ id }) => legalIds.has(id));
    const legalPosition = legalOrder.findIndex(({ id }) => id === input.itemId);
    const first = legalPosition <= 0, last = legalPosition === legalOrder.length - 1;
    return {
        accessibleName: `Reorder ${input.itemLabel}, position ${position + 1} of ${input.completeOrder.length}`,
        position: position + 1,
        count: input.completeOrder.length,
        canDrag: !input.filterActive,
        actions: [
            action("first", "Move to first", first),
            action("earlier", "Move one position earlier", first),
            action("later", "Move one position later", last),
            action("last", "Move to last", last),
            action("move", "Move…", legalOrder.length <= 1),
        ],
        destinations: legalOrder.filter(({ id }) => id !== input.itemId)
            .map(({ id, label }) => ({ itemId: id, label: label ?? id })),
        ...(input.scopeLabel ? { guidance: `Reordering stays within ${input.scopeLabel}.` } : {}),
    };
}
export function reorderItems(items, itemId, toIndex) {
    const from = items.findIndex(({ id }) => id === itemId);
    if (from < 0)
        return [...items];
    const target = Math.max(0, Math.min(items.length - 1, toIndex));
    if (target === from)
        return [...items];
    const next = [...items], moved = next.splice(from, 1)[0];
    next.splice(target, 0, moved);
    return next;
}
export function reorderValues(values, itemId, toIndex, idOf) {
    const wrapped = values.map((value, index) => ({ id: idOf(value, index), value }));
    return reorderItems(wrapped, itemId, toIndex).map(({ value }) => value);
}
export function reorderPlacementIndex(items, itemId, destinationId, placement) {
    const from = items.findIndex(({ id }) => id === itemId), destination = items.findIndex(({ id }) => id === destinationId);
    if (from < 0 || destination < 0 || from === destination)
        return Math.max(0, from);
    const without = items.filter(({ id }) => id !== itemId), adjusted = without.findIndex(({ id }) => id === destinationId);
    return adjusted + (placement === "after" ? 1 : 0);
}
//# sourceMappingURL=model.js.map