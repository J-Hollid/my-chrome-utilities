import { canonicalSetConditionIssue, canonicalTypeTransition, normalizeCanonicalTypeShape } from "./set-transition.js";
const clone = (value) => structuredClone(value);
const orderWithin = (document, parentId) => Object.values(document.nodes).filter((node) => node.parentId === parentId).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
const appendChange = (document, command, propertyIds) => ({ ...document, revision: document.revision + 1, changes: [...document.changes, { revision: document.revision + 1, propertyIds, kind: command.kind }] });
const emptyDocumentation = () => ({ displayText: "", description: "", comments: "", example: { method: "blank" } });
const assertBase = (document, baseRevision) => { if (baseRevision !== document.revision)
    throw new Error(`Command revision ${baseRevision} does not match canonical revision ${document.revision}.`); };
const insertOrder = (document, parentId, afterId) => { const siblings = orderWithin(document, parentId); if (!afterId)
    return siblings.length; const index = siblings.findIndex(({ id }) => id === afterId); return index < 0 ? siblings.length : index + 1; };
const normalizeOrders = (document, parentId) => { orderWithin(document, parentId).forEach((node, index) => { node.order = index; }); };
const orderedIds = (document, parentId) => orderWithin(document, parentId).flatMap((node) => [node.id, ...orderedIds(document, node.id)]);
function applyStructuralOperation(document, operation) {
    if (operation.kind === "add") {
        if (operation.parentId && !document.nodes[operation.parentId])
            throw new Error(`Parent property ${operation.parentId} is unavailable.`);
        const propertyId = operation.id("property"), node = { id: propertyId, name: operation.name.trim() || "property", ...(operation.parentId ? { parentId: operation.parentId } : {}), order: insertOrder(document, operation.parentId, operation.afterId), type: operation.type, presence: { mode: "optional" }, allowedValues: [], rules: [], documentation: emptyDocumentation(), provenance: [{ source: "created" }], overrideReferences: [] };
        for (const sibling of orderWithin(document, operation.parentId))
            if (sibling.order >= node.order)
                sibling.order += 1;
        document.nodes[propertyId] = node;
        document.rootIds = orderWithin(document).map(({ id }) => id);
        document.selectedPropertyId = propertyId;
        return [propertyId, ...(operation.parentId ? [operation.parentId] : [])];
    }
    const node = document.nodes[operation.propertyId];
    if (!node)
        throw new Error(`Canonical property ${operation.propertyId} is unavailable.`);
    if (operation.kind === "rename") {
        node.name = operation.name.trim() || node.name;
        return [operation.propertyId];
    }
    if (operation.kind === "delete") {
        const descendants = [operation.propertyId, ...orderedIds(document, operation.propertyId)], parentId = node.parentId;
        for (const id of descendants)
            delete document.nodes[id];
        normalizeOrders(document, parentId);
        document.rootIds = orderWithin(document).map(({ id }) => id);
        if (descendants.includes(document.selectedPropertyId ?? ""))
            delete document.selectedPropertyId;
        return descendants;
    }
    if (operation.kind === "move") {
        if (operation.parentId === operation.propertyId || orderedIds(document, operation.propertyId).includes(operation.parentId ?? ""))
            throw new Error("A property cannot move inside itself.");
        const oldParent = node.parentId, oldSiblings = orderWithin(document, oldParent).filter(({ id }) => id !== operation.propertyId), targetSiblings = orderWithin(document, operation.parentId).filter(({ id }) => id !== operation.propertyId), afterIndex = operation.afterId ? targetSiblings.findIndex(({ id }) => id === operation.afterId) : -1, insertAt = afterIndex < 0 ? 0 : afterIndex + 1;
        oldSiblings.forEach((sibling, index) => { sibling.order = index; });
        targetSiblings.splice(insertAt, 0, node);
        targetSiblings.forEach((sibling, index) => { sibling.order = index; });
        delete node.parentId;
        if (operation.parentId)
            node.parentId = operation.parentId;
        document.rootIds = orderWithin(document).map(({ id }) => id);
        return [operation.propertyId, ...(oldParent ? [oldParent] : []), ...(operation.parentId ? [operation.parentId] : [])];
    }
    const copies = new Map(), source = node;
    for (const sourceId of [operation.propertyId, ...orderedIds(document, operation.propertyId)]) {
        const copyId = operation.id("property");
        copies.set(sourceId, copyId);
        const original = document.nodes[sourceId], copy = clone(original);
        copy.id = copyId;
        copy.name = sourceId === operation.propertyId ? `${original.name} copy` : original.name;
        const copyParent = sourceId === operation.propertyId ? original.parentId : copies.get(original.parentId);
        delete copy.parentId;
        if (copyParent)
            copy.parentId = copyParent;
        copy.provenance = [...copy.provenance, { source: "created" }];
        document.nodes[copyId] = copy;
    }
    const rootCopy = copies.get(operation.propertyId);
    document.nodes[rootCopy].order = source.order + 1;
    normalizeOrders(document, source.parentId);
    document.rootIds = orderWithin(document).map(({ id }) => id);
    document.selectedPropertyId = rootCopy;
    return [...copies.values()];
}
export function applyCanonicalAtCurrent(document, command) {
    assertBase(document, command.baseRevision);
    if (command.kind === "set") {
        const issue = canonicalSetConditionIssue(command.patch);
        if (issue)
            return { status: "conflict", document, propertyId: command.propertyId, message: `Canonical condition write blocked: ${issue}` };
    }
    const next = clone(document);
    if (command.kind === "policy") {
        next.onlyDefinedFields = command.onlyDefinedFields;
        return { status: "applied", document: appendChange(next, command, []) };
    }
    if (command.kind === "add") {
        if (command.parentId && !next.nodes[command.parentId])
            throw new Error(`Parent property ${command.parentId} is unavailable.`);
        const propertyId = command.id("property"), node = { id: propertyId, name: command.name.trim() || "property", ...(command.parentId ? { parentId: command.parentId } : {}), order: insertOrder(next, command.parentId, command.afterId), type: command.type, presence: { mode: "optional" }, allowedValues: [], rules: [], documentation: emptyDocumentation(), provenance: [{ source: "created" }], overrideReferences: [] };
        for (const sibling of orderWithin(next, command.parentId))
            if (sibling.order >= node.order)
                sibling.order += 1;
        next.nodes[propertyId] = node;
        if (!command.parentId)
            next.rootIds = orderWithin(next).map(({ id }) => id);
        next.selectedPropertyId = propertyId;
        return { status: "applied", document: appendChange(next, command, [propertyId, ...(command.parentId ? [command.parentId] : [])]) };
    }
    if (command.kind === "view")
        return { status: "applied", document: { ...next, view: command.view } };
    const propertyId = "propertyId" in command ? command.propertyId : undefined, node = propertyId ? next.nodes[propertyId] : undefined;
    if (propertyId && !node)
        throw new Error(`Canonical property ${propertyId} is unavailable.`);
    if (command.kind === "select")
        return { status: "applied", document: { ...next, selectedPropertyId: command.propertyId } };
    if (command.kind === "rename") {
        node.name = command.name.trim() || node.name;
        return { status: "applied", document: appendChange(next, command, [command.propertyId]) };
    }
    if (command.kind === "set") {
        const descendants = orderedIds(next, command.propertyId), nextType = command.patch.type ?? node.type, nextItemType = nextType === "array" ? (Object.hasOwn(command.patch, "itemType") ? command.patch.itemType : node.itemType) : undefined, nextItemSchema = nextType === "array" ? (Object.hasOwn(command.patch, "itemSchema") ? command.patch.itemSchema : node.itemSchema) : undefined, change = canonicalTypeTransition(node, nextType, nextItemType, nextItemSchema, descendants, next);
        if (change.confirmationRequired && !command.confirmed)
            return { status: "confirmation-required", document, propertyId: command.propertyId, impact: change.impact };
        if (change.removeDescendants)
            for (const id of descendants)
                delete next.nodes[id];
        Object.assign(node, clone(command.patch));
        normalizeCanonicalTypeShape(node, nextType, Object.hasOwn(command.patch, "itemType"), Object.hasOwn(command.patch, "itemSchema"));
        const affected = new Set([command.propertyId, ...(change.removeDescendants ? descendants : [])]);
        for (const operation of command.operations ?? [])
            for (const id of applyStructuralOperation(next, operation))
                affected.add(id);
        return { status: "applied", document: appendChange(next, command, [...affected]) };
    }
    if (command.kind === "type") {
        const descendants = orderedIds(next, command.propertyId), nextItemSchema = command.type === "array" && command.itemType ? { id: `item:${node.id}`, type: command.itemType } : undefined, change = canonicalTypeTransition(node, command.type, command.itemType, nextItemSchema, descendants, next);
        if (change.confirmationRequired && !command.confirmed)
            return { status: "confirmation-required", document, propertyId: command.propertyId, impact: change.impact };
        if (change.removeDescendants)
            for (const id of descendants)
                delete next.nodes[id];
        node.type = command.type;
        if (command.type === "array" && command.itemType) {
            node.itemType = command.itemType;
            node.itemSchema = nextItemSchema;
        }
        else {
            delete node.itemType;
            delete node.itemSchema;
        }
        return { status: "applied", document: appendChange(next, command, [command.propertyId, ...descendants]) };
    }
    if (command.kind === "delete") {
        const descendants = [command.propertyId, ...orderedIds(next, command.propertyId)], parentId = node.parentId;
        for (const id of descendants)
            delete next.nodes[id];
        normalizeOrders(next, parentId);
        next.rootIds = orderWithin(next).map(({ id }) => id);
        if (descendants.includes(next.selectedPropertyId ?? ""))
            delete next.selectedPropertyId;
        return { status: "applied", document: appendChange(next, command, descendants) };
    }
    if (command.kind === "move") {
        if (command.parentId === command.propertyId || orderedIds(next, command.propertyId).includes(command.parentId ?? ""))
            throw new Error("A property cannot move inside itself.");
        const oldParent = node.parentId, oldSiblings = orderWithin(next, oldParent).filter(({ id }) => id !== command.propertyId), targetSiblings = orderWithin(next, command.parentId).filter(({ id }) => id !== command.propertyId), afterIndex = command.afterId ? targetSiblings.findIndex(({ id }) => id === command.afterId) : -1, insertAt = afterIndex < 0 ? 0 : afterIndex + 1;
        oldSiblings.forEach((sibling, index) => { sibling.order = index; });
        targetSiblings.splice(insertAt, 0, node);
        targetSiblings.forEach((sibling, index) => { sibling.order = index; });
        delete node.parentId;
        if (command.parentId)
            node.parentId = command.parentId;
        next.rootIds = orderWithin(next).map(({ id }) => id);
        return { status: "applied", document: appendChange(next, command, [command.propertyId, ...(oldParent ? [oldParent] : []), ...(command.parentId ? [command.parentId] : [])]) };
    }
    const source = node, copies = new Map();
    for (const sourceId of [command.propertyId, ...orderedIds(next, command.propertyId)]) {
        const copyId = command.id("property");
        copies.set(sourceId, copyId);
        const original = next.nodes[sourceId], copy = clone(original);
        copy.id = copyId;
        copy.name = sourceId === command.propertyId ? `${original.name} copy` : original.name;
        const copyParent = sourceId === command.propertyId ? original.parentId : copies.get(original.parentId);
        delete copy.parentId;
        if (copyParent)
            copy.parentId = copyParent;
        copy.provenance = [...copy.provenance, { source: "created" }];
        next.nodes[copyId] = copy;
    }
    const rootCopy = copies.get(command.propertyId);
    next.nodes[rootCopy].order = source.order + 1;
    normalizeOrders(next, source.parentId);
    next.rootIds = orderWithin(next).map(({ id }) => id);
    next.selectedPropertyId = rootCopy;
    return { status: "applied", document: appendChange(next, command, [...copies.values()]) };
}
//# sourceMappingURL=commands-apply.js.map