const states = new WeakMap();
export function registerSchemaExportEditState(host, pending) {
    host.dataset.schemaExportEditState = "true";
    states.set(host, pending);
}
export function hasUnconfirmedSchemaEdits(root) {
    if (!root)
        return false;
    return [root, ...Array.from(root.querySelectorAll("[data-schema-export-edit-state]"))].some(host => states.get(host)?.() === true);
}
//# sourceMappingURL=edit-state.js.map