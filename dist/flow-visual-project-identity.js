const lineageField = (name) => name === "sourceLineage" || name === "externalLineage";
const ownedIdentity = (external, name, value) => !external && name === "id" && typeof value === "string";
const ownedFlowGraphKey = (external, parent) => !external && parent === "documentationFlowGraphs";
const objectRecord = (value) => Boolean(value) && typeof value === "object";
function collectProjectIds(value, ids, external = false, parent = "") {
    if (Array.isArray(value)) {
        collectProjectIdArray(value, ids, external, parent);
        return;
    }
    if (objectRecord(value))
        collectProjectIdObject(value, ids, external, parent);
}
const collectProjectIdArray = (value, ids, external, parent) => { for (const entry of value)
    collectProjectIds(entry, ids, external, parent); };
const collectProjectIdObject = (value, ids, external, parent) => { for (const [name, entry] of Object.entries(value)) {
    const outside = external || lineageField(name);
    if (ownedIdentity(outside, name, entry))
        ids.add(entry);
    if (ownedFlowGraphKey(outside, parent))
        ids.add(name);
    collectProjectIds(entry, ids, outside, name);
} };
export function flowVisualProjectMapping(project, targetProjectId, id) {
    const ids = new Set();
    collectProjectIds(project, ids);
    return new Map([...ids].map(old => [old, old === project.id ? targetProjectId : id(old)]));
}
const mappedProjectKey = (name, parent, external, mapping) => !external && parent === "documentationFlowGraphs" ? (mapping.get(name) ?? name) : name;
const remapObject = (value, mapping, external, parent) => Object.fromEntries(Object.entries(value).map(([name, entry]) => { const outside = external || lineageField(name); return [mappedProjectKey(name, parent, outside, mapping), remapFlowVisualProject(entry, mapping, outside, name)]; }));
export function remapFlowVisualProject(value, mapping, external = false, parent = "") {
    if (typeof value === "string")
        return !external && mapping.has(value) ? mapping.get(value) : value;
    if (Array.isArray(value))
        return value.map(entry => remapFlowVisualProject(entry, mapping, external, parent));
    return objectRecord(value) ? remapObject(value, mapping, external, parent) : value;
}
export function flowVisualAssetReferences(project) { return Object.values(project.documentationFlowGraphs ?? {}).flatMap(graph => [...(graph.pageFrames ?? []), ...(graph.occurrences ?? [])].flatMap(item => item.conceptVisual?.assetId ? [item.conceptVisual.assetId] : [])); }
//# sourceMappingURL=flow-visual-project-identity.js.map