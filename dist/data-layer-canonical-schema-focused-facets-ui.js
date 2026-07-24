import { renderCanonicalFocusedCondition } from "./data-layer-canonical-schema-focused-conditions.js";
import { renderCanonicalFocusedRules } from "./data-layer-canonical-schema-focused-rules.js";
import { canonicalFacetText, typedCanonicalValue } from "./data-layer-canonical-schema-facets.js";
const types = ["string", "number", "integer", "boolean", "object", "array", "null"];
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const input = (dom, name, value = "", type = "text") => { const control = dom.createElement("input"); control.name = name; control.type = type; control.value = value; return control; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const presenceText = (mode) => ({ optional: "Optional", required: "Required", "required-when": "Required when", forbidden: "Forbidden", "forbidden-when": "Forbidden when" })[mode];
export function renderCanonicalFacetSection(host, context, working) {
    const { dom } = context;
    if (context.activeSection === "presence") {
        const presence = dom.createElement("select");
        presence.name = "presenceMode";
        presence.append(...["optional", "required", "required-when", "forbidden", "forbidden-when"].map((entry) => new Option(presenceText(entry), entry)));
        presence.value = working.presence.mode;
        presence.addEventListener("change", () => { const next = context.getWorking(); if (next)
            next.presence = { ...next.presence, mode: presence.value }; });
        host.append(labeled(dom, "Presence", presence));
        if (working.presence.condition)
            renderCanonicalFocusedCondition(host, context);
        return;
    }
    if (context.activeSection === "values") {
        const expected = input(dom, "expectedValue", canonicalFacetText(working.expectedValue));
        expected.setAttribute("aria-label", "Expected value");
        expected.addEventListener("input", () => { const next = context.getWorking(); if (!next)
            return; try {
            next.expectedValue = expected.value === "" ? undefined : typedCanonicalValue(next.type, expected.value);
            expected.setCustomValidity("");
        }
        catch {
            expected.setCustomValidity("Value does not match the property type.");
        } });
        const list = dom.createElement("div");
        working.allowedValues.forEach((entry, index) => { const row = dom.createElement("div"), value = input(dom, `allowedValue-${entry.id}`, canonicalFacetText(entry.value)); value.setAttribute("aria-label", `Allowed value ${index + 1}`); value.addEventListener("input", () => { const next = context.getWorking(); if (!next)
            return; try {
            next.allowedValues[index] = { ...entry, value: typedCanonicalValue(next.type, value.value) };
            value.setCustomValidity("");
        }
        catch {
            value.setCustomValidity("Value does not match the property type.");
        } }); row.append(labeled(dom, `Value ${index + 1}`, value), button(dom, "Remove", () => { const next = context.getWorking(); if (next) {
            next.allowedValues.splice(index, 1);
            context.render();
        } })); list.append(row); });
        host.append(labeled(dom, "Expected value", expected), list, button(dom, "Add allowed value", () => { const next = context.getWorking(); if (next) {
            next.allowedValues.push({ id: context.id("allowed-value"), value: next.type === "number" || next.type === "integer" ? 0 : next.type === "boolean" ? false : next.type === "null" ? null : "" });
            context.render();
        } }));
        return;
    }
    if (context.activeSection === "conditions") {
        renderCanonicalFocusedCondition(host, context);
        return;
    }
    if (context.activeSection === "rules") {
        renderCanonicalFocusedRules(host, { ...context, invariant: working.enforcement === "invariant" });
        return;
    }
    if (context.activeSection === "documentation") {
        const display = input(dom, "displayText", working.documentation.displayText), description = dom.createElement("textarea"), comments = dom.createElement("textarea");
        description.name = "description";
        description.value = working.documentation.description;
        comments.name = "comments";
        comments.value = working.documentation.comments;
        display.addEventListener("input", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, displayText: display.value }; });
        description.addEventListener("input", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, description: description.value }; });
        comments.addEventListener("input", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, comments: comments.value }; });
        host.append(labeled(dom, "Display text", display), labeled(dom, "Description", description), labeled(dom, "Comments", comments));
        return;
    }
    if (context.activeSection === "example") {
        const method = dom.createElement("select"), value = input(dom, "exampleValue", canonicalFacetText(working.documentation.example.value));
        method.name = "exampleMethod";
        method.append(...["allowed-value", "custom", "blank"].map((entry) => new Option(entry, entry)));
        method.value = working.documentation.example.method;
        method.addEventListener("change", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, example: { method: method.value, value: method.value === "blank" ? undefined : value.value } }; });
        value.addEventListener("input", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, example: { method: method.value, value: value.value } }; });
        host.append(labeled(dom, "Example method", method), labeled(dom, "Example value", value));
        return;
    }
    if (context.activeSection === "structure")
        host.append(Object.assign(dom.createElement("p"), { textContent: `Stable identity ${working.id} · ${context.current().id}` }), labeled(dom, "Name", input(dom, "structureName", working.name)), button(dom, "Add child", () => applyStructure(context, { kind: "add", baseRevision: context.current().revision, parentId: working.id, name: "child", type: "string", id: context.id })), button(dom, "Add sibling", () => applyStructure(context, { kind: "add", baseRevision: context.current().revision, ...(working.parentId ? { parentId: working.parentId } : {}), afterId: working.id, name: "property", type: "string", id: context.id })), ...structuralControls(dom, context, working));
}
const applyStructure = (context, command) => { const result = context.command(command); if (result.status === "applied" || result.status === "rebased") {
    context.select(result.document.selectedPropertyId);
    context.setWorking(undefined);
    context.render();
} };
const structuralControls = (dom, context, working) => { const document = context.current(), siblings = Object.values(document.nodes).filter(({ parentId }) => parentId === working.parentId).sort((left, right) => left.order - right.order || left.id.localeCompare(right.id)), index = siblings.findIndex(({ id }) => id === working.id), earlier = button(dom, "Move earlier", () => { if (index <= 0)
    return; const afterId = index > 1 ? siblings[index - 2].id : undefined; applyStructure(context, { kind: "move", baseRevision: context.current().revision, propertyId: working.id, ...(working.parentId ? { parentId: working.parentId } : {}), ...(afterId ? { afterId } : {}) }); }), later = button(dom, "Move later", () => { if (index < 0 || index >= siblings.length - 1)
    return; applyStructure(context, { kind: "move", baseRevision: context.current().revision, propertyId: working.id, ...(working.parentId ? { parentId: working.parentId } : {}), afterId: siblings[index + 1].id }); }), toRoot = button(dom, "Move to root", () => { if (!working.parentId)
    return; applyStructure(context, { kind: "move", baseRevision: context.current().revision, propertyId: working.id }); }), duplicate = button(dom, "Duplicate", () => applyStructure(context, { kind: "duplicate", baseRevision: context.current().revision, propertyId: working.id, id: context.id })), remove = button(dom, "Delete property", () => applyStructure(context, { kind: "delete", baseRevision: context.current().revision, propertyId: working.id })); earlier.disabled = index <= 0; later.disabled = index < 0 || index >= siblings.length - 1; toRoot.disabled = !working.parentId; return [earlier, later, toRoot, duplicate, remove]; };
//# sourceMappingURL=data-layer-canonical-schema-focused-facets-ui.js.map