const clone = (value) => structuredClone(value);
const orderWithin = (document, parentId) => Object.values(document.nodes).filter((node) => node.parentId === parentId).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
const orderedIds = (document, parentId) => orderWithin(document, parentId).flatMap((node) => [node.id, ...orderedIds(document, node.id)]);
export function createCanonicalSchema(input) { return { id: input.id, revision: 0, state: "Draft", contributorId: input.contributorId, contributorName: input.contributorName, rootIds: [], nodes: {}, view: "tree", changes: [], ...(input.source ? { source: clone(input.source) } : {}) }; }
export function canonicalPropertyPath(document, propertyId) { const parts = []; let node = document.nodes[propertyId], guard = 0; while (node && guard < Object.keys(document.nodes).length + 1) {
    parts.unshift(node.name);
    node = node.parentId ? document.nodes[node.parentId] : undefined;
    guard += 1;
} if (!parts.length)
    throw new Error(`Canonical property ${propertyId} is unavailable.`); return `/${parts.map((part) => part.replaceAll("~", "~0").replaceAll("/", "~1")).join("/")}`; }
export function canonicalTableRows(document) { return orderedIds(document).map((id) => { const node = document.nodes[id]; let depth = 0, parent = node.parentId; while (parent) {
    depth += 1;
    parent = document.nodes[parent]?.parentId;
} return { id, node, path: canonicalPropertyPath(document, id), depth, selected: id === document.selectedPropertyId, condition: node.presence.condition, validationState: "valid" }; }); }
//# sourceMappingURL=data-layer-canonical-schema-model.js.map