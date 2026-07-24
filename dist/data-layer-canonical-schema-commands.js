import { canonicalPropertyPath } from "./data-layer-canonical-schema.js";
const clone = (value) => structuredClone(value);
const orderWithin = (document, parentId) => Object.values(document.nodes).filter((node) => node.parentId === parentId).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
const affectedPropertyIds = (command) => "propertyId" in command ? [command.propertyId] : command.kind === "add" && command.parentId ? [command.parentId] : [];
const appendChange = (document, command, propertyIds) => ({ ...document, revision: document.revision + 1, changes: [...document.changes, { revision: document.revision + 1, propertyIds, kind: command.kind }] });
const emptyDocumentation = () => ({ displayText: "", description: "", comments: "", example: { method: "blank" } });
export function canonicalCommandOutcome(command, result, prior) {
    const label = (() => { if (command.kind !== "set")
        return { add: "property addition", rename: "name", move: "position", duplicate: "property duplication", delete: "property removal", type: "type", select: "selection", view: "view" }[command.kind]; const facets = Object.keys(command.patch), names = { allowedValues: "allowed values", expectedValue: "expected value", overrideReferences: "override references" }; return facets.length === 1 ? (names[facets[0]] ?? facets[0]) : "property facets"; })();
    const propertyId = "propertyId" in command ? command.propertyId : command.kind === "add" ? [...result.document.changes].reverse().find(({ revision }) => revision === result.document.revision)?.propertyIds.find((id) => Boolean(result.document.nodes[id])) : undefined, path = propertyId ? (() => { const source = result.document.nodes[propertyId] ? result.document : prior; try {
        return canonicalPropertyPath(source, propertyId);
    }
    catch {
        return undefined;
    } })() : undefined, scope = path ? ` for ${path}` : command.kind === "add" ? ` for ${command.name}` : "";
    return `${result.status === "rebased" ? "Rebased" : "Saved"} ${label}${scope} from Draft token ${command.baseRevision} at Draft token ${result.document.revision}.`;
}
function assertBase(document, baseRevision) { if (baseRevision !== document.revision)
    throw new Error(`Command revision ${baseRevision} does not match canonical revision ${document.revision}.`); }
function insertOrder(document, parentId, afterId) { const siblings = orderWithin(document, parentId); if (!afterId)
    return siblings.length; const index = siblings.findIndex(({ id }) => id === afterId); return index < 0 ? siblings.length : index + 1; }
function normalizeOrders(document, parentId) { orderWithin(document, parentId).forEach((node, index) => { node.order = index; }); }
function applyAtCurrent(document, command) {
    assertBase(document, command.baseRevision);
    const next = clone(document);
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
        return { status: "applied", document: appendChange({ ...next, view: command.view }, command, []) };
    const propertyId = "propertyId" in command ? command.propertyId : undefined, node = propertyId ? next.nodes[propertyId] : undefined;
    if (propertyId && !node)
        throw new Error(`Canonical property ${propertyId} is unavailable.`);
    if (command.kind === "select")
        return { status: "applied", document: appendChange({ ...next, selectedPropertyId: command.propertyId }, command, [command.propertyId]) };
    if (command.kind === "rename") {
        node.name = command.name.trim() || node.name;
        return { status: "applied", document: appendChange(next, command, [command.propertyId]) };
    }
    if (command.kind === "set") {
        Object.assign(node, clone(command.patch));
        return { status: "applied", document: appendChange(next, command, [command.propertyId]) };
    }
    if (command.kind === "type") {
        const descendants = orderedIds(next, command.propertyId), destructive = node.type === "object" && command.type !== "object" && descendants.length > 0, itemChange = node.type === "array" && command.type === "array" && node.itemType !== command.itemType;
        if ((destructive || itemChange) && !command.confirmed)
            return { status: "confirmation-required", document, propertyId: command.propertyId, impact: destructive ? "child definitions and documentation removed; destructive confirmation required" : `every item changes from ${node.itemType ?? "unspecified"} to ${command.itemType ?? "unspecified"}` };
        if (destructive)
            for (const id of descendants)
                delete next.nodes[id];
        node.type = command.type;
        if (command.type === "array" && command.itemType)
            node.itemType = command.itemType;
        else
            delete node.itemType;
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
function orderedIds(document, parentId) { return orderWithin(document, parentId).flatMap((node) => [node.id, ...orderedIds(document, node.id)]); }
export function applyCanonicalCommand(document, command) {
    if (command.baseRevision === document.revision)
        return applyAtCurrent(document, command);
    if (command.baseRevision > document.revision)
        return { status: "conflict", document, message: `Base revision ${command.baseRevision} is newer than ${document.revision}.` };
    const touched = new Set(document.changes.filter(({ revision }) => revision > command.baseRevision).flatMap(({ propertyIds }) => propertyIds)), affected = affectedPropertyIds(command), conflicting = affected.find((id) => touched.has(id));
    if (conflicting)
        return { status: "conflict", document, propertyId: conflicting, message: `Property ${canonicalPropertyPath(document, conflicting)} changed after revision ${command.baseRevision}; review only this command.` };
    const result = applyAtCurrent(document, { ...command, baseRevision: document.revision });
    return result.status === "applied" ? { ...result, status: "rebased" } : result;
}
export function addCanonicalProperty(document, command) { return applyCanonicalCommand(document, { kind: "add", ...command }); }
export function renameCanonicalProperty(document, command) { return applyCanonicalCommand(document, { kind: "rename", ...command }); }
export function setCanonicalProperty(document, command) { return applyCanonicalCommand(document, { kind: "set", ...command }); }
export function changeCanonicalPropertyType(document, command) { return applyCanonicalCommand(document, { kind: "type", ...command }); }
export function createCanonicalRepository(initial) { let current = clone(initial); const listeners = new Set(); return { current: () => clone(current), subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }, dispatch(command) { const result = applyCanonicalCommand(current, command); if (result.status === "applied" || result.status === "rebased") {
        current = result.document;
        for (const listener of listeners)
            listener(clone(current));
    } return result; } }; }
//# sourceMappingURL=data-layer-canonical-schema-commands.js.map