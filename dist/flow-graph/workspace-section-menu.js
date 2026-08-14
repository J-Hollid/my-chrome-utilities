export const FLOW_SECTION_ACTION_LABELS = [
    "Rename",
    "Move",
    "Resize",
    "Wrap selection",
    "Remove Section",
    "Remove with contents",
];
export function flowSectionMenuRequest(event) {
    if (event.type === "contextmenu") {
        return { clientPosition: { x: event.clientX ?? 0, y: event.clientY ?? 0 } };
    }
    if (event.type !== "keydown")
        return undefined;
    if (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey))
        return {};
    return undefined;
}
//# sourceMappingURL=workspace-section-menu.js.map