import { canonicalPropertyPath } from "./data-layer-canonical-schema.js";
import { savedSchemaCanonicalDocument, savedSchemaFromCanonical } from "./data-layer-saved-schema-canonical.js";
export { savedSchemaCanonicalDocument, savedSchemaFromCanonical } from "./data-layer-saved-schema-canonical.js";
const clone = (value) => structuredClone(value);
export function compactSchemaProjection(document, identity) {
    const base = {
        ...identity,
        published: false,
        assignments: [],
        document: { type: "object" },
    };
    const projected = savedSchemaFromCanonical(base, document);
    const { canonicalSchema: _canonicalSchema, ...compact } = projected;
    return compact;
}
export function compactConditionalPresence(mode, propertyId, operator, value) {
    return { mode, condition: { kind: "predicate", propertyId, operator, ...(!operator.includes("exist") && !operator.includes("Exist") ? { value } : {}) } };
}
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const presenceFamily = (mode) => mode.startsWith("required") ? "required" : mode.startsWith("forbidden") ? "forbidden" : "optional";
const valuesWithStableIds = (current, next, id) => next.map((entry, index) => {
    const prior = current[index];
    return prior && same(prior.value, entry.value) ? { ...entry, id: prior.id } : { ...entry, id: id("allowed-value") };
});
const rulesWithStableConditions = (current, next) => {
    const claimed = new Set();
    return next.map((rule) => {
        const prior = current.find(({ id }) => id === rule.id && !claimed.has(id)) ?? (rule.id.startsWith("json-facet:") ? current.find((candidate) => candidate.id.startsWith("json-facet:") && candidate.kind === rule.kind && !claimed.has(candidate.id)) : undefined), stable = prior && rule.id.startsWith("json-facet:") ? { ...rule, id: prior.id } : rule;
        if (prior)
            claimed.add(prior.id);
        return prior?.condition && !stable.condition ? { ...stable, condition: clone(prior.condition) } : stable;
    });
};
export function canonicalCommandsFromCompactProjection(document, projection, id) {
    const { canonicalSchema: _canonicalSchema, ...source } = projection;
    const parsed = savedSchemaCanonicalDocument(source, id), parsedByPath = new Map(Object.values(parsed.nodes).map((node) => [canonicalPropertyPath(parsed, node.id), node])), currentByPath = new Map(Object.values(document.nodes).map((node) => [canonicalPropertyPath(document, node.id), node]));
    const commands = [];
    let revision = document.revision;
    const removedPaths = new Set([...currentByPath.keys()].filter((path) => !parsedByPath.has(path)));
    for (const [path, current] of [...currentByPath].filter(([candidatePath]) => removedPaths.has(candidatePath) && !candidatePath.split("/").slice(1, -1).some((_, index) => removedPaths.has(`/${candidatePath.split("/").slice(1, index + 2).join("/")}`)))) {
        commands.push({ kind: "delete", baseRevision: revision++, propertyId: current.id });
    }
    const addedIdsByPath = new Map();
    for (const [path, candidate] of [...parsedByPath].filter(([candidatePath]) => !currentByPath.has(candidatePath)).sort(([left], [right]) => left.split("/").length - right.split("/").length)) {
        const parentPath = path.split("/").slice(0, -1).join("/"), parentId = parentPath ? (currentByPath.get(parentPath)?.id ?? addedIdsByPath.get(parentPath)) : undefined, nodeId = candidate.id;
        commands.push({ kind: "add", baseRevision: revision++, name: candidate.name, type: candidate.type, ...(parentId ? { parentId } : {}), id: () => nodeId });
        addedIdsByPath.set(path, nodeId);
        if (candidate.itemType)
            commands.push({ kind: "type", baseRevision: revision++, propertyId: nodeId, type: candidate.type, itemType: candidate.itemType, confirmed: true });
        const facets = { presence: candidate.presence, allowedValues: candidate.allowedValues, rules: candidate.rules, documentation: candidate.documentation }, defaults = { presence: { mode: "optional" }, allowedValues: [], rules: [], documentation: { displayText: "", description: "", comments: "", example: { method: "blank" } } };
        if (!same(facets, defaults))
            commands.push({ kind: "set", baseRevision: revision++, propertyId: nodeId, patch: clone(facets) });
    }
    for (const current of Object.values(document.nodes)) {
        const path = canonicalPropertyPath(document, current.id), candidate = parsedByPath.get(path);
        if (!candidate)
            continue;
        if (current.type !== candidate.type || current.itemType !== candidate.itemType) {
            commands.push({ kind: "type", baseRevision: revision++, propertyId: current.id, type: candidate.type, ...(candidate.itemType ? { itemType: candidate.itemType } : {}), confirmed: true });
        }
        const candidatePresence = presenceFamily(candidate.presence.mode) === presenceFamily(current.presence.mode)
            ? current.presence
            : candidate.presence;
        const candidateFacets = {
            presence: clone(candidatePresence),
            allowedValues: valuesWithStableIds(current.allowedValues, candidate.allowedValues, id),
            rules: rulesWithStableConditions(current.rules, candidate.rules),
            documentation: clone(candidate.documentation),
        };
        const currentFacets = { presence: current.presence, allowedValues: current.allowedValues, rules: current.rules, documentation: current.documentation }, patch = {};
        for (const key of ["presence", "allowedValues", "rules", "documentation"])
            if (!same(currentFacets[key], candidateFacets[key]))
                Object.assign(patch, { [key]: candidateFacets[key] });
        if (Object.keys(patch).length)
            commands.push({ kind: "set", baseRevision: revision++, propertyId: current.id, patch });
    }
    return commands;
}
//# sourceMappingURL=data-layer-side-panel-unified-schema-editor.js.map