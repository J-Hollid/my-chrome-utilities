import { focusedOwnershipActionTarget } from "./data-layer-focused-schema-property-ui.js";
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function renderCanonicalFocusedEditor(document, node, context) {
    const { dom } = context, wrapper = dom.createElement("section"), heading = dom.createElement("h3"), identity = dom.createElement("p"), source = dom.createElement("p"), effective = dom.createElement("p"), section = dom.createElement("section"), actions = dom.createElement("div");
    const inherited = node.provenance.filter(({ state }) => state === "inherited" || state === "shadowed"), local = node.provenance.filter(({ state }) => state !== "inherited" && state !== "shadowed"), conflicts = node.provenance.filter(({ state }) => state === "shadowed"), validation = conflicts.length ? "warning" : "valid";
    wrapper.setAttribute("aria-label", "Focused property editor");
    wrapper.dataset.focusedPropertyEditor = "true";
    wrapper.dataset.schemaOverlayLayer = "child";
    wrapper.dataset.focusedPropertyPath = context.canonicalPropertyPath(document, node.id);
    heading.textContent = `Focused property · ${node.name}`;
    identity.textContent = `${context.canonicalPropertyPath(document, node.id)} · stable identity ${node.id}`;
    source.textContent = `Inherited value and source: ${inherited.map(({ contributorName, source }) => contributorName ?? source).join(" → ") || "none"}`;
    effective.textContent = `Local value: ${local.length ? `${node.type} · ${context.presenceText(node.presence.mode)}` : "none"} · Effective result: ${node.type} · ${context.presenceText(node.presence.mode)} · validation ${validation} · Validation state: ${validation} · Conflicts: ${conflicts.length ? conflicts.map(({ contributorName }) => contributorName ?? "shadowed parent").join(", ") : "none"}`;
    section.setAttribute("aria-label", `Focused ${context.sectionLabel(context.activeSection)} section`);
    context.renderSection(section, node);
    const lifecycle = new Set(["Remove local", "Reset to parent"]), visible = context.ownershipActions.filter((action) => context.activeSection === "definition" ? !lifecycle.has(action) : context.activeSection === "structure" && lifecycle.has(action));
    if (visible.length) {
        const target = focusedOwnershipActionTarget(context.activeSection === "structure" ? "Structure" : "Definition", context.activeSection === "structure" ? "property" : "facet", context.activeSection === "structure" ? node.id : `${node.id}:definition`), group = dom.createElement("div");
        group.dataset.sectionOwnershipActions = "true";
        group.dataset.ownershipTarget = target.label;
        for (const action of visible) {
            const control = button(dom, action, () => context.runOwnershipAction(action, target.label));
            control.dataset.ownershipAction = action;
            control.dataset.ownershipTarget = target.label;
            control.setAttribute("aria-label", `${action} · ${target.label}`);
            group.append(control);
        }
        section.append(group);
    }
    actions.append(button(dom, "Cancel", context.close), button(dom, "Review changes", context.review));
    wrapper.append(heading, identity, source, effective, section, actions);
    return wrapper;
}
//# sourceMappingURL=data-layer-canonical-schema-focused-editor.js.map