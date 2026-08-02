const button = (text, action) => { const control = document.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", action); return control; };
/** Render the semantic actions shared by every Page-frame card. */
export function appendFlowPageFrameCardControls(context) {
    const { card, title, state, flow, graph, frame } = context;
    card.append(title);
    const open = button("Open schema contribution", () => { const originFocus = document.activeElement instanceof HTMLElement ? document.activeElement : open; context.saveSelection({ kind: "page-frame", id: frame.id }); context.openOccurrenceSchema?.(frame.id, undefined, originFocus); });
    open.dataset.flowSchemaContribution = "true";
    card.append(context.pageExampleDetails(state, flow.id, frame.id, context.entityName(state.project.collections.pages, frame.pageId)), open, button("Duplicate Page frame", () => context.persist(context.duplicatePageFrame(state, flow.id, frame.id))), button("Remove Page frame", () => context.persist(context.removePageFrame(state, flow.id, frame.id))));
}
//# sourceMappingURL=data-layer-flow-graph-ui-page-frame.js.map