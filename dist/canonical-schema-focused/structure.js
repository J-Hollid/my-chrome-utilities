import { button, input, labeled } from "./dom.js";
import { renderReorderControl } from "../reorderable-editor/control.js";
import { reorderValues } from "../reorderable-editor/model.js";
export const applyStructure = (context, operation) => context.stageStructure(operation);
const orderedChildren = (document, parentId, excluded = new Set()) => Object.values(document.nodes).filter(node => node.parentId === parentId && !excluded.has(node.id))
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
const descendantIds = (document, itemId) => {
    const result = new Set([itemId]), pending = [itemId];
    while (pending.length) {
        const parentId = pending.pop();
        for (const child of orderedChildren(document, parentId))
            if (!result.has(child.id)) {
                result.add(child.id);
                pending.push(child.id);
            }
    }
    return result;
};
const acceptsChildren = (node) => {
    if (node.type === "object")
        return true;
    let item = node.itemSchema;
    while (item?.type === "array")
        item = item.items;
    return node.type === "array" && (item?.type ?? node.itemType) === "object";
};
export const canonicalMoveDestinations = (document, working) => {
    const excluded = descendantIds(document, working.id), parents = [
        [undefined, "Root"],
        ...Object.values(document.nodes)
            .filter(candidate => !excluded.has(candidate.id) && acceptsChildren(candidate) && (candidate.structureOwned === true || !candidate.inheritedDefinition))
            .map(candidate => [candidate, candidate.name]),
    ];
    return parents.flatMap(([parent, parentLabel]) => orderedChildren(document, parent?.id, excluded).map(sibling => ({
        itemId: sibling.id, label: sibling.name, parentId: parent?.id ?? null, parentLabel,
    })));
};
const canonicalMove = (context, working, request) => {
    const document = context.current();
    if (request.method === "dialog" && request.destinationId && request.placement) {
        const parentId = request.destinationParentId ?? undefined, excluded = descendantIds(document, working.id), siblings = orderedChildren(document, parentId, excluded), destination = siblings.findIndex(({ id }) => id === request.destinationId);
        if (destination < 0)
            return false;
        const afterIndex = request.placement === "after" ? destination : destination - 1, afterId = afterIndex >= 0 ? siblings[afterIndex].id : undefined;
        applyStructure(context, { kind: "move", propertyId: working.id, ...(parentId ? { parentId } : {}), ...(afterId ? { afterId } : {}) });
        return true;
    }
    const siblings = orderedChildren(document, working.parentId), next = reorderValues(siblings, working.id, request.toIndex, value => value.id), position = next.findIndex(({ id }) => id === working.id), afterId = position > 0 ? next[position - 1].id : undefined;
    if (position < 0)
        return false;
    applyStructure(context, { kind: "move", propertyId: working.id, ...(working.parentId ? { parentId: working.parentId } : {}), ...(afterId ? { afterId } : {}) });
    return true;
};
export const renderCanonicalStructuralControls = (dom, context, working) => {
    const document = context.current(), siblings = orderedChildren(document, working.parentId), reorder = renderReorderControl({
        itemId: working.id, itemLabel: working.name, completeOrder: siblings.map(({ id, name }) => ({ id, label: name })),
        moveDestinations: canonicalMoveDestinations(document, working), onMove: (request) => canonicalMove(context, working, request),
    }), toRoot = button(dom, "Move to root", () => { if (!working.parentId)
        return; applyStructure(context, { kind: "move", propertyId: working.id }); }), duplicate = button(dom, "Duplicate", () => applyStructure(context, { kind: "duplicate", propertyId: working.id, id: context.id })), remove = button(dom, "Delete property", () => applyStructure(context, { kind: "delete", propertyId: working.id }));
    toRoot.disabled = !working.parentId;
    return [reorder, toRoot, duplicate, remove];
};
export function renderStructureFacet(host, context, working) {
    const { dom } = context, name = input(dom, "structureName", working.name), newName = input(dom, "newStructureName", "property"), terminalItem = (() => { let item = working.itemSchema; while (item?.type === "array")
        item = item.items; return item?.type ?? working.itemType; })();
    name.addEventListener("input", () => { const next = context.getWorking(); if (next)
        next.name = name.value; });
    let childControls = [];
    if (working.type === "array" && terminalItem === "object") {
        const itemName = input(dom, "itemPropertyName", "property"), add = button(dom, "Add item property", () => applyStructure(context, { kind: "add", propertyId: working.id, parentId: working.id, name: itemName.value.trim() || "property", type: "string", id: context.id }));
        childControls = [labeled(dom, "Item property name", itemName), add];
    }
    else if (working.type !== "array")
        childControls = [button(dom, "Add child", () => applyStructure(context, { kind: "add", propertyId: working.id, parentId: working.id, name: "child", type: "string", id: context.id }))];
    const removable = (candidate) => candidate.structureOwned === true || !candidate.inheritedDefinition, localRemoval = removable(working) ? [button(dom, `Remove local ${working.name}`, () => applyStructure(context, { kind: "delete", propertyId: working.id }))] : [], localSiblingRemovals = Object.values(context.current().nodes).filter((candidate) => candidate.id !== working.id && candidate.parentId === working.parentId && removable(candidate)).map((candidate) => button(dom, `Remove local ${candidate.name}`, () => applyStructure(context, { kind: "delete", propertyId: candidate.id })));
    host.append(Object.assign(dom.createElement("p"), { textContent: `Stable identity ${working.id} · ${context.current().id}` }), labeled(dom, "Name", name), ...childControls, labeled(dom, "New local property name", newName), button(dom, "Add sibling", () => applyStructure(context, { kind: "add", propertyId: working.id, ...(working.parentId ? { parentId: working.parentId } : {}), afterId: working.id, name: newName.value.trim() || "property", type: "string", id: context.id })), ...localRemoval, ...localSiblingRemovals, ...renderCanonicalStructuralControls(dom, context, working));
}
//# sourceMappingURL=structure.js.map