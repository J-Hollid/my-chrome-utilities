import { renderCanonicalStructuralControls } from "./structure.js";
import { button, input, labeled } from "./dom.js";
const types = ["string", "number", "integer", "boolean", "object", "array", "null"];
export function renderDefinitionSection(host, context, working) {
    const { dom } = context, name = input(dom, "propertyName", working.name), type = dom.createElement("select"), itemType = dom.createElement("select");
    type.name = "propertyType";
    type.append(...types.map((entry) => new Option(entry, entry)));
    type.value = working.type;
    name.addEventListener("input", () => { const next = context.getWorking(); if (next)
        next.name = name.value; });
    type.addEventListener("change", () => { const next = context.getWorking(); if (next)
        next.type = type.value; });
    const rename = button(dom, "Rename", () => { const next = context.getWorking(), original = next && context.current().nodes[next.id]; if (!next || !original)
        return; const result = context.command({ kind: "set", baseRevision: context.current().revision, propertyId: next.id, patch: context.patchFor(next, original) }); if (result.status === "applied" || result.status === "rebased") {
        context.setWorking(undefined);
        context.render();
    } }), addChild = button(dom, "Add child", () => { const next = context.getWorking(); if (!next)
        return; applyDefinition(context, { kind: "add", baseRevision: context.current().revision, parentId: next.id, name: "child", type: "string", id: context.id }); }), addSibling = button(dom, "Add sibling", () => { const next = context.getWorking(); if (!next)
        return; applyDefinition(context, { kind: "add", baseRevision: context.current().revision, ...(next.parentId ? { parentId: next.parentId } : {}), afterId: next.id, name: "property", type: "string", id: context.id }); });
    itemType.name = "itemType";
    itemType.append(new Option("No item type", ""), ...types.map((entry) => new Option(entry, entry)));
    itemType.value = working.itemType ?? "";
    itemType.disabled = working.type !== "array";
    itemType.addEventListener("change", () => { const next = context.getWorking(); if (next && next.type === "array")
        next.itemType = itemType.value || undefined; });
    host.append(labeled(dom, "Property name", name), labeled(dom, "Type", type), labeled(dom, "Array item type", itemType), rename, addChild, addSibling, ...renderCanonicalStructuralControls(dom, context, working));
}
const applyDefinition = (context, command) => { const result = context.command(command); if (result.status !== "applied" && result.status !== "rebased")
    return; const selected = result.document.selectedPropertyId ? result.document.nodes[result.document.selectedPropertyId] : undefined; context.select(result.document.selectedPropertyId); context.setWorking(selected ? structuredClone(selected) : undefined); context.render(); };
//# sourceMappingURL=definition.js.map