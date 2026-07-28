const clone = (value) => structuredClone(value);
const orderWithin = (document, parentId) => Object.values(document.nodes).filter((node) => node.parentId === parentId).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
const orderedIds = (document, parentId) => orderWithin(document, parentId).flatMap((node) => [node.id, ...orderedIds(document, node.id)]);
export function createCanonicalSchema(input) { return { id: input.id, revision: 0, state: "Draft", contributorId: input.contributorId, contributorName: input.contributorName, rootIds: [], nodes: {}, view: "tree", changes: [], ...(input.source ? { source: clone(input.source) } : {}) }; }
const propertySegments = (document, propertyId) => { const parts = []; let node = document.nodes[propertyId], guard = 0; while (node && guard < Object.keys(document.nodes).length + 1) {
    let arrayBoundaries = node.type === "array" ? 1 : 0, item = node.itemSchema;
    while (item?.type === "array") {
        arrayBoundaries += 1;
        item = item.items;
    }
    parts.unshift({ name: node.name, arrayBoundaries });
    node = node.parentId ? document.nodes[node.parentId] : undefined;
    guard += 1;
} if (!parts.length)
    throw new Error(`Canonical property ${propertyId} is unavailable.`); return parts; };
export function canonicalPropertyPath(document, propertyId) { const parts = propertySegments(document, propertyId), segments = parts.flatMap(({ name, arrayBoundaries }, index) => [name.replaceAll("~", "~0").replaceAll("/", "~1"), ...(index < parts.length - 1 ? Array.from({ length: arrayBoundaries }, () => "*") : [])]); return `/${segments.join("/")}`; }
export function canonicalFriendlyPropertyPath(document, propertyId) { return propertySegments(document, propertyId).map(({ name, arrayBoundaries }, index, parts) => `${name}${index < parts.length - 1 ? "[]".repeat(arrayBoundaries) : ""}`).join("."); }
export function canonicalTableRows(document) { return orderedIds(document).map((id) => { const node = document.nodes[id]; let depth = 0, parent = node.parentId; while (parent) {
    depth += 1;
    parent = document.nodes[parent]?.parentId;
} return { id, node, path: canonicalPropertyPath(document, id), friendlyPath: canonicalFriendlyPropertyPath(document, id), depth, selected: id === document.selectedPropertyId, condition: node.presence.condition, validationState: "valid" }; }); }
export function canonicalConceptIndex(documents) { const values = new Map(); for (const document of documents)
    for (const { concept } of Object.values(document.nodes)) {
        const display = concept?.trim();
        if (display && !values.has(display.toLocaleLowerCase()))
            values.set(display.toLocaleLowerCase(), display);
    } return [...values.values()].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" })); }
export function canonicalConceptSortedRows(document) { return canonicalTableRows(document).sort((left, right) => { const leftConcept = left.node.concept?.trim(), rightConcept = right.node.concept?.trim(); if (Boolean(leftConcept) !== Boolean(rightConcept))
    return leftConcept ? -1 : 1; return (leftConcept ?? "").localeCompare(rightConcept ?? "", undefined, { sensitivity: "base" }) || left.path.localeCompare(right.path); }); }
export { canonicalJsonSchemaDocument } from "./data-layer-canonical-array-items.js";
//# sourceMappingURL=data-layer-canonical-schema-model.js.map