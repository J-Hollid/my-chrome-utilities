const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function renderCanonicalFocusedEditor(document, node, context) {
    const { dom } = context, wrapper = dom.createElement("section"), heading = dom.createElement("h3"), identity = dom.createElement("p"), source = dom.createElement("p"), effective = dom.createElement("p"), section = dom.createElement("section"), actions = dom.createElement("div");
    wrapper.setAttribute("aria-label", "Focused property editor");
    wrapper.dataset.focusedPropertyEditor = "true";
    wrapper.dataset.focusedPropertyPath = context.canonicalPropertyPath(document, node.id);
    heading.textContent = `Focused property · ${node.name}`;
    identity.textContent = `${context.canonicalPropertyPath(document, node.id)} · stable identity ${node.id}`;
    source.textContent = `Inherited value and source: ${context.provenanceText(node)}`;
    effective.textContent = `Effective result: ${node.type} · ${context.presenceText(node.presence.mode)} · validation valid · conflicts none`;
    section.setAttribute("aria-label", `Focused ${context.sectionLabel(context.activeSection)} section`);
    context.renderSection(section, node);
    actions.append(button(dom, "Cancel", context.close), button(dom, "Review changes", context.review), button(dom, "Save property", context.save));
    wrapper.append(heading, identity, source, effective, section, actions);
    return wrapper;
}
//# sourceMappingURL=data-layer-canonical-schema-focused-editor.js.map