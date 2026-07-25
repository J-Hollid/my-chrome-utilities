import { applyCanonicalCommand, canonicalPredicateWithStableIds, canonicalTableRows, createCanonicalSchema } from "../data-layer-canonical-schema.js";
import { layeredContributorPath, layeredContributorsForPath } from "../data-layer-layered-schema-project.js";
import { composedSchemaWorkspace } from "./workspace-model.js";
const clone = (value) => structuredClone(value);
const canonicalTypes = new Set(["string", "number", "integer", "boolean", "null", "object", "array"]);
const stableValueIdentity = (owner, value) => { let hash = 2166136261; for (const char of JSON.stringify(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
} return `allowed-value:${owner}:${(hash >>> 0).toString(16)}`; };
const canonicalBytes = (value) => JSON.stringify(value, (_key, entry) => entry && typeof entry === "object" && !Array.isArray(entry) ? Object.fromEntries(Object.entries(entry).sort(([left], [right]) => left.localeCompare(right))) : entry);
const opaqueRevision = (value) => { let hash = 1469598103934665603n; for (const char of canonicalBytes(value)) {
    hash ^= BigInt(char.charCodeAt(0));
    hash = BigInt.asUintN(64, hash * 1099511628211n);
} return Number(hash % 9007199254740881n) + 1; };
const propertyIdFor = (entity, path, effective, used) => { const preferred = effective.definitionId ?? `property:${entity.id}:${encodeURIComponent(path)}`; if (!used.has(preferred)) {
    used.add(preferred);
    return preferred;
} const scoped = `property:${entity.id}:${encodeURIComponent(path)}`; used.add(scoped); return scoped; };
const provenanceSource = (value) => ["created", "saved-schema", "requirements", "structured-schema", "structured-draft", "path-constraint"].includes(String(value)) ? value : "path-constraint";
const itemProvenance = (value, fallback) => { const source = value && typeof value === "object" ? value : {}; return { ...fallback, ...source, source: provenanceSource(source.source ?? fallback.source), state: fallback.state }; };
const ownershipProvenance = (row, entity, itemId, raw, localIds) => {
    const source = raw && typeof raw === "object" ? raw : undefined, local = localIds.has(itemId), sourceId = typeof source?.contributorId === "string" ? source.contributorId : typeof source?.sourceId === "string" ? source.sourceId : undefined, origin = (sourceId ? row.provenance.find(({ contributorId }) => contributorId === sourceId) : undefined) ?? (local ? row.provenance.find(({ contributorId }) => contributorId === entity.id) ?? row.provenance.at(-1) : row.provenance.find(({ state }) => state === "inherited") ?? row.provenance.at(-1)), sourceState = String(source?.state ?? ""), state = local && sourceState === "overridden" ? "overridden" : local ? "local" : sourceState === "shadowed" ? "shadowed" : "inherited";
    return itemProvenance(raw, { source: "path-constraint", ...(origin?.contributorId ? { sourceId: origin.contributorId, contributorId: origin.contributorId } : {}), ...(origin?.contributorName ? { contributorName: origin.contributorName } : {}), ...(origin?.scope ? { scope: origin.scope } : {}), state });
};
const ruleFor = (value, fallbackId, provenance) => ({ id: String(value.id ?? fallbackId), kind: (["pattern", "range", "cardinality", "condition", "custom"].includes(String(value.kind)) ? String(value.kind) : "custom"), ...(typeof value.pattern === "string" ? { pattern: value.pattern } : {}), ...(typeof value.minimum === "number" ? { minimum: value.minimum } : {}), ...(typeof value.maximum === "number" ? { maximum: value.maximum } : {}), ...(typeof value.minItems === "number" ? { minItems: value.minItems } : {}), ...(typeof value.maxItems === "number" ? { maxItems: value.maxItems } : {}), ...(value.condition ? { condition: canonicalPredicateWithStableIds(value.condition, kind => `${fallbackId}:${kind}`) } : {}), severity: value.severity === "warning" ? "warning" : "error", message: String(value.message ?? "Constraint mismatch"), ...(typeof value.reusableRuleId === "string" ? { reusableRuleId: value.reusableRuleId } : {}), provenance });
const addDerivedRules = (row, entity, id, rules) => { const localPatterns = new Set(row.local.patterns ?? []), derived = (rule, local) => ({ ...rule, provenance: ownershipProvenance(row, entity, rule.id, undefined, local ? new Set([rule.id]) : new Set()) }); for (const [at, pattern] of (row.effective.patterns ?? []).entries())
    if (!rules.some((rule) => rule.kind === "pattern" && rule.pattern === pattern)) {
        const ruleId = `rule:${id}:pattern:${at}`;
        rules.push(derived({ id: ruleId, kind: "pattern", pattern, severity: "error", message: "Pattern mismatch" }, localPatterns.has(pattern)));
    } if ((row.effective.minimum !== undefined || row.effective.maximum !== undefined) && !rules.some(({ kind }) => kind === "range")) {
    const ruleId = `rule:${id}:range`;
    rules.push(derived({ id: ruleId, kind: "range", ...(row.effective.minimum !== undefined ? { minimum: row.effective.minimum } : {}), ...(row.effective.maximum !== undefined ? { maximum: row.effective.maximum } : {}), severity: "error", message: "Outside range" }, row.local.minimum !== undefined || row.local.maximum !== undefined));
} if ((row.effective.minItems !== undefined || row.effective.maxItems !== undefined) && !rules.some(({ kind }) => kind === "cardinality")) {
    const ruleId = `rule:${id}:cardinality`;
    rules.push(derived({ id: ruleId, kind: "cardinality", ...(row.effective.minItems !== undefined ? { minItems: row.effective.minItems } : {}), ...(row.effective.maxItems !== undefined ? { maxItems: row.effective.maxItems } : {}), severity: "error", message: "Outside cardinality" }, row.local.minItems !== undefined || row.local.maxItems !== undefined));
} };
export function composedCanonicalSchema(state, entity, scope, flowId) {
    const contributorPath = layeredContributorPath(state, entity, scope, flowId), contributors = layeredContributorsForPath(state, contributorPath), workspace = composedSchemaWorkspace(state, entity, scope, undefined, flowId), document = createCanonicalSchema({ id: `canonical:effective:${entity.id}`, contributorId: entity.id, contributorName: entity.name }), used = new Set(), byPath = new Map(), rows = [...workspace.rows].sort((left, right) => left.path.split("/").length - right.path.split("/").length || left.path.localeCompare(right.path));
    for (const row of rows) {
        const segments = row.path.split("/").filter(Boolean), parentPath = `/${segments.slice(0, -1).join("/")}`, parentId = segments.length > 1 ? byPath.get(parentPath) : undefined, type = canonicalTypes.has(row.effective.type) ? row.effective.type : "string", id = propertyIdFor(entity, row.path, row.effective, used), localRuleIds = new Set((row.local.rules ?? []).map((rule) => String(rule.id ?? ""))), itemOwner = (itemId, kind) => [...contributors].reverse().find(({ constraints }) => constraints.some((constraint) => constraint.path === row.path && (kind === "rule" ? (constraint.rules ?? []).some((rule) => String(rule.id ?? "") === itemId) : (constraint.allowedValueIds ?? []).includes(itemId)))), rules = (row.effective.rules ?? []).map((rule, index) => { const ruleId = String(rule.id ?? `rule:${id}:${index}`), owner = itemOwner(ruleId, "rule"), raw = { ...rule.provenance, ...(owner ? { contributorId: owner.id } : {}) }; return ruleFor(rule, ruleId, ownershipProvenance(row, entity, ruleId, raw, localRuleIds)); });
        addDerivedRules(row, entity, id, rules);
        const localValueIds = new Set([...(row.local.allowedValueIds ?? []), ...(row.local.allowedValueProvenance ?? []).filter(({ state }) => state !== "inherited").map(({ id }) => id)]), valueProvenance = new Map((row.effective.allowedValueProvenance ?? []).map((value) => [value.id, value]));
        const node = { id, name: segments.at(-1), ...(parentId ? { parentId } : {}), order: Object.values(document.nodes).filter((candidate) => candidate.parentId === parentId).length, type, ...(row.effective.itemType ? { itemType: row.effective.itemType } : {}), presence: { mode: row.effective.presence === "required" ? (row.effective.condition ? "required-when" : "required") : row.effective.presence === "forbidden" ? (row.effective.condition ? "forbidden-when" : "forbidden") : "optional", ...(row.effective.condition ? { condition: canonicalPredicateWithStableIds(row.effective.condition, kind => `${id}:${kind}`) } : {}) }, allowedValues: (row.effective.allowedValues ?? []).map((value, index) => { const valueId = row.effective.allowedValueIds?.[index] ?? stableValueIdentity(id, value), source = valueProvenance.get(valueId), owner = itemOwner(valueId, "value"), raw = { ...source, ...(owner ? { contributorId: owner.id } : {}) }; return { id: valueId, value: clone(value), provenance: [ownershipProvenance(row, entity, valueId, raw, localValueIds)] }; }), rules, documentation: { displayText: "", description: row.effective.documentation ?? "", comments: "", example: row.effective.examples?.length ? { method: "custom", value: clone(row.effective.examples[0]) } : { method: "blank" } }, provenance: row.provenance.map(({ contributorId, contributorName, scope: originScope, state: originState }) => ({ source: "path-constraint", sourceId: contributorId, contributorId, contributorName, scope: originScope, state: row.validationState === "blocked" ? "conflict" : originState })), overrideReferences: [...(row.effective.overrideReferences ?? [])], ...(row.effective.expectedValue !== undefined ? { expectedValue: clone(row.effective.expectedValue) } : {}), ...(row.effective.enforcement ? { enforcement: row.effective.enforcement } : {}), ...(row.effective.target ? { target: row.effective.target } : {}) };
        document.nodes[id] = node;
        byPath.set(row.path, id);
    }
    document.rootIds = Object.values(document.nodes).filter(({ parentId }) => !parentId).sort((left, right) => left.order - right.order).map(({ id }) => id);
    document.revision = opaqueRevision(contributors.map(({ id, name, scope: contributorScope, revision, constraints }) => ({ id, name, scope: contributorScope, revision, constraints })));
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