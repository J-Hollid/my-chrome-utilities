export const schemaTableEditableFacets = ["concept", "type", "presence", "description", "expected-or-allowed", "example"];
export function schemaTableQuickEditIntent(key, shiftKey) {
    if (key === "Escape")
        return { kind: "cancel" };
    if (key === "Enter")
        return { kind: "commit" };
    if (key === "Tab")
        return { kind: "commit", direction: shiftKey ? -1 : 1 };
    return undefined;
}
export function schemaTableQuickEditCommitsOnChange(control) {
    return control.tagName.toUpperCase() === "SELECT";
}
export function schemaTableQuickEditDestination(cells, origin, direction) {
    const index = cells.findIndex(({ path, facet }) => path === origin.path && facet === origin.facet);
    return index < 0 ? undefined : cells[index + direction];
}
export function schemaTableQuickEditFocusGenerationAfterFocus(generation, pending, scope, focused) {
    return pending?.scope === scope && pending.cell.path === focused.path && pending.cell.facet === focused.facet ? generation : generation + 1;
}
const quickEditControls = (root) => Array.from(root.querySelectorAll("input[data-inline-schema-facet][data-inline-schema-path],select[data-inline-schema-facet][data-inline-schema-path]"));
const quickEditCell = (control) => ({ path: control.dataset.inlineSchemaPath, facet: control.dataset.inlineSchemaFacet });
const quickEditFocusGeneration = new WeakMap();
const pendingQuickEditFocus = new WeakMap();
const focusQuickEditCell = (binding, cell) => {
    const target = quickEditControls(binding.root()).find((control) => control.dataset.inlineSchemaPath === cell.path && control.dataset.inlineSchemaFacet === cell.facet);
    target?.focus({ preventScroll: true });
};
const quickEditDocument = (binding) => {
    const root = binding.root();
    return root instanceof Document ? root : root.ownerDocument;
};
const rememberQuickEditFocus = (binding, cell) => { pendingQuickEditFocus.set(quickEditDocument(binding), { scope: binding.scope, cell, expires: Date.now() + 5000 }); };
const restoreQuickEditFocus = (binding, cell) => {
    const document = quickEditDocument(binding), generation = (quickEditFocusGeneration.get(document) ?? 0) + 1;
    quickEditFocusGeneration.set(document, generation);
    rememberQuickEditFocus(binding, cell);
    const restore = () => { if (quickEditFocusGeneration.get(document) === generation)
        focusQuickEditCell(binding, cell); };
    restore();
    queueMicrotask(restore);
    for (const delay of [0, 25, 75, 150, 300, 600])
        setTimeout(restore, delay);
};
export function bindSchemaTableQuickEdit(control, binding) {
    const origin = { path: binding.path, facet: binding.facet }, destination = (direction) => schemaTableQuickEditDestination(quickEditControls(control.closest("table") ?? binding.root()).map(quickEditCell), origin, direction);
    let settled = false;
    const pending = pendingQuickEditFocus.get(control.ownerDocument);
    if (pending && pending.expires >= Date.now() && pending.scope === binding.scope && pending.cell.path === origin.path && pending.cell.facet === origin.facet)
        queueMicrotask(() => { if (control.isConnected)
            control.focus({ preventScroll: true }); });
    const commit = (target) => {
        if (settled)
            return;
        if (control.value === binding.savedValue) {
            settled = true;
            binding.diagnostic("");
            if (target)
                restoreQuickEditFocus(binding, target);
            return;
        }
        if (target)
            rememberQuickEditFocus(binding, target);
        settled = true;
        const result = binding.commit(control.value);
        if (result.status === "invalid") {
            settled = false;
            binding.diagnostic(result.diagnostic);
            restoreQuickEditFocus(binding, origin);
            return;
        }
        binding.diagnostic("");
        if (target)
            restoreQuickEditFocus(binding, target);
    };
    control.addEventListener("input", () => { settled = false; });
    if (schemaTableQuickEditCommitsOnChange(control))
        control.addEventListener("change", () => commit());
    control.addEventListener("focus", () => { settled = false; const document = control.ownerDocument, current = pendingQuickEditFocus.get(document), generation = quickEditFocusGeneration.get(document) ?? 0, nextGeneration = schemaTableQuickEditFocusGenerationAfterFocus(generation, current, binding.scope, origin); quickEditFocusGeneration.set(document, nextGeneration); if (current && nextGeneration !== generation)
        pendingQuickEditFocus.delete(document); });
    control.addEventListener("keydown", (rawEvent) => {
        const event = rawEvent;
        const intent = schemaTableQuickEditIntent(event.key, event.shiftKey);
        if (!intent)
            return;
        event.preventDefault();
        if (intent.kind === "cancel") {
            event.stopPropagation();
            settled = true;
            control.value = binding.savedValue;
            binding.diagnostic("");
            binding.cancel();
            restoreQuickEditFocus(binding, origin);
            return;
        }
        commit(intent.direction ? destination(intent.direction) : undefined);
    });
    control.addEventListener("blur", () => commit());
}
//# sourceMappingURL=data-layer-schema-table-quick-edit.js.map