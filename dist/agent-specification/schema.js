import { canonicalTableRows, canonicalSchemaFromJsonSchema } from "../data-layer-canonical-schema.js";
import { record } from "./contract.js";
export function agentCanonicalSchema(id, name, schema, previous) {
    let sequence = 0;
    const revision = (previous?.revision ?? 0) + 1;
    const document = canonicalSchemaFromJsonSchema({ id: previous?.id ?? `schema:${id}`, contributorId: id, contributorName: name, sourceIdentity: `agent:${id}`, sourceRevision: revision, document: schema, idFactory: kind => `${kind}:${id}:r${revision}:${++sequence}` });
    if (!previous)
        return { ...document, revision };
    const prior = new Map(canonicalTableRows(previous).map(row => [row.path, row.node.id]));
    const ids = new Map(canonicalTableRows(document).flatMap(row => prior.has(row.path) ? [[row.node.id, prior.get(row.path)]] : []));
    const rewrite = (value, key = "") => {
        if (typeof value === "string" && ["id", "parentId", "propertyId", "rootIds", "selectedPropertyId", "propertyIds", "overrideReferences"].includes(key))
            return ids.get(value) ?? value;
        if (Array.isArray(value))
            return value.map(item => rewrite(item, key));
        if (record(value))
            return Object.fromEntries(Object.entries(value).map(([field, item]) => [["nodes", "definitionsByNodeId", "pathsByNodeId"].includes(key) ? ids.get(field) ?? field : field, rewrite(item, field)]));
        return value;
    };
    return { ...rewrite(document), revision };
}
//# sourceMappingURL=schema.js.map