import { applyCanonicalCommand, canonicalPredicateWithStableIds, canonicalTableRows, createCanonicalSchema } from "../data-layer-canonical-schema.js";
import { layeredContributorPath, layeredContributorsForPath } from "../data-layer-layered-schema-project.js";
import { composedSchemaWorkspace } from "./workspace-model.js";
const clone = (value) => structuredClone(value);
const entities = (state) => Object.values(state.project.collections).flat();
const canonicalTypes = new Set(["string", "number", "integer", "boolean", "null", "object", "array"]);
const stableValueIdentity = (owner, value) => { let hash = 2166136261; for (const char of JSON.stringify(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
} return `allowed-value:${owner}:${(hash >>> 0).toString(16)}`; };
const propertyIdFor = (entity, path, effective, used) => { const preferred = effective.definitionId ?? `property:${entity.id}:${encodeURIComponent(path)}`; if (!used.has(preferred)) {
    used.add(preferred);
    return preferred;
} const scoped = `property:${entity.id}:${encodeURIComponent(path)}`; used.add(scoped); return scoped; };
const ruleFor = (value, fallbackId) => ({ id: String(value.id ?? fallbackId), kind: (["pattern", "range", "cardinality", "condition", "custom"].includes(String(value.kind)) ? String(value.kind) : "custom"), ...(typeof value.pattern === "string" ? { pattern: value.pattern } : {}), ...(typeof value.minimum === "number" ? { minimum: value.minimum } : {}), ...(typeof value.maximum === "number" ? { maximum: value.maximum } : {}), ...(typeof value.minItems === "number" ? { minItems: value.minItems } : {}), ...(typeof value.maxItems === "number" ? { maxItems: value.maxItems } : {}), ...(value.condition ? { condition: canonicalPredicateWithStableIds(value.condition, kind => `${fallbackId}:${kind}`) } : {}), severity: value.severity === "warning" ? "warning" : "error", message: String(value.message ?? "Constraint mismatch"), ...(typeof value.reusableRuleId === "string" ? { reusableRuleId: value.reusableRuleId } : {}) });
const addDerivedRules = (row, id, rules) => { for (const [at, pattern] of (row.effective.patterns ?? []).entries())
    if (!rules.some((rule) => rule.kind === "pattern" && rule.pattern === pattern))
        rules.push({ id: `rule:${id}:pattern:${at}`, kind: "pattern", pattern, severity: "error", message: "Pattern mismatch" }); if ((row.effective.minimum !== undefined || row.effective.maximum !== undefined) && !rules.some(({ kind }) => kind === "range"))
    rules.push({ id: `rule:${id}:range`, kind: "range", ...(row.effective.minimum !== undefined ? { minimum: row.effective.minimum } : {}), ...(row.effective.maximum !== undefined ? { maximum: row.effective.maximum } : {}), severity: "error", message: "Outside range" }); if ((row.effective.minItems !== undefined || row.effective.maxItems !== undefined) && !rules.some(({ kind }) => kind === "cardinality"))
    rules.push({ id: `rule:${id}:cardinality`, kind: "cardinality", ...(row.effective.minItems !== undefined ? { minItems: row.effective.minItems } : {}), ...(row.effective.maxItems !== undefined ? { maxItems: row.effective.maxItems } : {}), severity: "error", message: "Outside cardinality" }); };
export function composedCanonicalSchema(state, entity, scope) {
    const workspace = composedSchemaWorkspace(state, entity, scope), document = createCanonicalSchema({ id: `canonical:effective:${entity.id}`, contributorId: entity.id, contributorName: entity.name }), used = new Set(), byPath = new Map(), rows = [...workspace.rows].sort((left, right) => left.path.split("/").length - right.path.split("/").length || left.path.localeCompare(right.path));
    for (const row of rows) {
        const segments = row.path.split("/").filter(Boolean), parentPath = `/${segments.slice(0, -1).join("/")}`, parentId = segments.length > 1 ? byPath.get(parentPath) : undefined, type = canonicalTypes.has(row.effective.type) ? row.effective.type : "string", id = propertyIdFor(entity, row.path, row.effective, used), rules = (row.effective.rules ?? []).map((rule, index) => ruleFor(rule, `rule:${id}:${index}`));
        addDerivedRules(row, id, rules);
        const node = { id, name: segments.at(-1), ...(parentId ? { parentId } : {}), order: Object.values(document.nodes).filter((candidate) => candidate.parentId === parentId).length, type, ...(row.effective.itemType ? { itemType: row.effective.itemType } : {}), presence: { mode: row.effective.presence === "required" ? "required" : row.effective.presence === "forbidden" ? "forbidden" : "optional", ...(row.effective.condition ? { condition: canonicalPredicateWithStableIds(row.effective.condition, kind => `${id}:${kind}`) } : {}) }, allowedValues: (row.effective.allowedValues ?? []).map((value, index) => ({ id: row.effective.allowedValueIds?.[index] ?? stableValueIdentity(id, value), value: clone(value) })), rules, documentation: { displayText: "", description: row.effective.documentation ?? "", comments: "", example: row.effective.examples?.length ? { method: "custom", value: clone(row.effective.examples[0]) } : { method: "blank" } }, provenance: row.provenance.map(({ contributorId, contributorName, scope: originScope, state: originState }) => ({ source: "path-constraint", sourceId: contributorId, contributorId, contributorName, scope: originScope, state: originState })), overrideReferences: [...(row.effective.overrideReferences ?? [])], ...(row.effective.expectedValue !== undefined ? { expectedValue: clone(row.effective.expectedValue) } : {}), ...(row.effective.enforcement ? { enforcement: row.effective.enforcement } : {}), ...(row.effective.target ? { target: row.effective.target } : {}) };
        document.nodes[id] = node;
        byPath.set(row.path, id);
    }
    document.rootIds = Object.values(document.nodes).filter(({ parentId }) => !parentId).sort((left, right) => left.order - right.order).map(({ id }) => id);
    document.revision = Math.max(1, ...layeredContributorsForPath(state, layeredContributorPath(state, entity, scope)).map((contributor) => Number(entities(state).find(({ id }) => id === contributor.id)?.canonicalSchema?.revision ?? 0))) + (entity.localSchemaContributions?.length ?? 0);
    document.changes = [];
    document.source = { identity: entity.id, revision: document.revision, provenance: "project-composed-effective" };
    if (document.rootIds[0])
        document.selectedPropertyId = document.rootIds[0];
    return document;
}
export function resetCanonicalRow(canonical, path, next) { const row = canonical && canonicalTableRows(canonical).find((candidate) => candidate.path === path); if (row) {
    const result = applyCanonicalCommand(canonical, { kind: "delete", baseRevision: canonical.revision, propertyId: row.id });
    if (result.status === "applied" || result.status === "rebased")
        next.canonicalSchema = result.document;
} return next; }
//# sourceMappingURL=canonical-workspace.js.map