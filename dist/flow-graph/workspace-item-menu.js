export const FLOW_ITEM_MENU_SPECS = Object.freeze({
    section: Object.freeze({
        commands: Object.freeze(["Rename", "Move", "Resize", "Wrap selection", "Remove Section", "Remove with contents"]),
        editorCommands: Object.freeze(["Rename"]),
        destructiveCommand: "Remove with contents",
    }),
    page: Object.freeze({
        commands: Object.freeze(["Rename in Flow", "Add Event", "Move", "Connect", "Duplicate", "Details", "Open schema contribution", "Remove"]),
        editorCommands: Object.freeze(["Rename in Flow", "Details"]),
        destructiveCommand: "Remove",
    }),
    event: Object.freeze({
        commands: Object.freeze(["Move", "Change Page", "Duplicate", "Details", "Open schema contribution", "Remove"]),
        editorCommands: Object.freeze(["Change Page", "Details"]),
        destructiveCommand: "Remove",
    }),
    relationship: Object.freeze({
        commands: Object.freeze(["Edit documentation", "Delete relationship"]),
        editorCommands: Object.freeze(["Edit documentation"]),
        destructiveCommand: "Delete relationship",
    }),
});
export function flowItemMenuRequest(event) {
    if (event.type === "contextmenu") {
        return { clientPosition: { x: event.clientX ?? 0, y: event.clientY ?? 0 } };
    }
    if (event.type !== "keydown")
        return undefined;
    return event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey) ? {} : undefined;
}
export function flowItemActivationRequest(event) {
    if (event.type === "click" && (event.button === undefined || event.button === 0))
        return "select";
    if (event.type === "keydown" && (event.key === "Enter" || event.key === " "))
        return "select";
    return undefined;
}
export function flowItemMenuIdentity(kind, itemId) {
    const stableId = itemId.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
    return `flow-${kind}-${stableId}-actions-menu`;
}
export function prepareFlowItemMenu(menu, kind, itemId) {
    const spec = FLOW_ITEM_MENU_SPECS[kind];
    const controls = Array.from(menu.querySelectorAll("button[data-flow-item-command]"));
    const byCommand = new Map(controls.map((control) => [control.dataset.flowItemCommand, control]));
    const ordered = spec.commands.flatMap((command) => {
        const control = byCommand.get(command);
        return control ? [control] : [];
    });
    menu.id = flowItemMenuIdentity(kind, itemId);
    menu.setAttribute("role", "menu");
    menu.dataset.flowItemMenu = kind;
    for (const control of ordered) {
        control.setAttribute("role", "menuitem");
        control.dataset.flowEditorCommand = String(spec.editorCommands.includes(control.dataset.flowItemCommand));
    }
    menu.replaceChildren(...ordered);
    return ordered;
}
export function prepareFlowActionsButton(button, menuId, expanded = false) {
    button.setAttribute("aria-haspopup", "menu");
    button.setAttribute("aria-controls", menuId);
    button.setAttribute("aria-expanded", String(expanded));
}
//# sourceMappingURL=workspace-item-menu.js.map