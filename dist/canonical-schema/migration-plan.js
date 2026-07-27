import { addCanonicalProperty, createCanonicalSchema } from "../data-layer-canonical-schema.js";
import { clone, collectStructured, definitionAtPath, explicitValues, semanticallyPopulated } from "./migration-helpers.js";
const emptyDocumentation = () => ({ displayText: "", description: "", comments: "", example: { method: "blank" } });
const supported = new Set(["string", "number", "integer", "boolean", "null", "object", "array"]);
const typeOf = (value) => value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : typeof value === "object" ? "object" : "string";
export function hasLegacySchemaRepresentation(profile) { return semanticallyPopulated(profile.requirements) || semanticallyPopulated(profile.structuredSchema) || semanticallyPopulated(profile.structuredDraft?.document) || semanticallyPopulated(profile.schemaConstraints); }
export function migrateLegacyProfile(profile, options) {
    const definitions = new Map();
    for (const requirement of profile.requirements ?? [])
        definitionAtPath(definitions, String(requirement.path), requirement, { source: "requirements" });
    const structured = profile.structuredSchema;
    if (structured)
        collectStructured(definitions, structured, "structured-schema");
    const draft = profile.structuredDraft?.document;
    if (draft)
        collectStructured(definitions, draft, "structured-draft");
    for (const constraint of profile.schemaConstraints ?? [])
        definitionAtPath(definitions, String(constraint.path), constraint, { source: "path-constraint" });
    let document = createCanonicalSchema({ id: options.id("canonical-schema"), contributorId: profile.id, contributorName: profile.name }), revision = 0;
    const byPath = {}, conflicts = [];
    const same = (left, right) => JSON.stringify(left) === JSON.stringify(right), shown = (value) => { const serialized = JSON.stringify(value); return serialized === undefined ? String(value) : serialized; };
    const explicit = (defs, read) => explicitValues(defs, read);
    const addConflict = (path, propertyId, facet, values) => { if (values.length < 2)
        return; conflicts.push({ id: `migration-conflict:${encodeURIComponent(path)}:${facet.replaceAll(" ", "-")}`, path, facet, propertyId, message: `Conflicting ${facet} facet from ${values.flatMap(({ sources }) => sources).join(", ")}`, choices: values.map(({ value, sources }, index) => ({ id: String(index), label: `Use ${shown(value)} from ${sources.join(" + ")}`, value: clone(value) })) }); };
    const canonicalRules = (definition, path, source) => { const given = (definition.rules ?? definition["x-rules"]) ?? [], patterns = [...definition.patterns ?? [], ...(typeof definition.pattern === "string" ? [definition.pattern] : [])], facetId = (kind, index) => `json-facet:${profile.id}:${encodeURIComponent(path)}:${source}:${kind}${index === undefined ? "" : `:${index}`}`, range = definition.minimum !== undefined || definition.maximum !== undefined ? [{ id: facetId("range"), kind: "range", severity: "error", message: "Outside migrated range", ...(typeof definition.minimum === "number" ? { minimum: definition.minimum } : {}), ...(typeof definition.maximum === "number" ? { maximum: definition.maximum } : {}) }] : [], cardinality = definition.minItems !== undefined || definition.maxItems !== undefined ? [{ id: facetId("cardinality"), kind: "cardinality", severity: "error", message: "Outside migrated cardinality", ...(typeof definition.minItems === "number" ? { minItems: definition.minItems } : {}), ...(typeof definition.maxItems === "number" ? { maxItems: definition.maxItems } : {}) }] : []; return [...given.map(clone), ...patterns.map((pattern, index) => ({ id: facetId("pattern", index), kind: "pattern", pattern, severity: "error", message: "Pattern mismatch" })), ...range, ...cardinality]; };
    const paths = [...definitions.keys()].filter((path) => path.startsWith("/")).sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
    for (const path of paths) {
        const segments = path.split("/").filter(Boolean);
        let parentId, current = "";
        for (const segment of segments) {
            current += `/${segment}`;
            if (!byPath[current]) {
                const defs = definitions.get(current) ?? [], types = explicit(defs, (definition) => { const value = String(definition.type ?? ""); return supported.has(value) ? value : undefined; }), type = types[0]?.value ?? (defs.length ? "string" : "object"), stablePropertyId = `property:${profile.id}:${encodeURIComponent(current)}`, result = addCanonicalProperty(document, { baseRevision: revision, name: segment, type, ...(parentId ? { parentId } : {}), id: (kind) => kind === "property" ? stablePropertyId : options.id(kind) });
                if (result.status !== "applied")
                    throw new Error("Canonical migration could not add a property.");
                document = result.document;
                revision = document.revision;
                const propertyId = document.selectedPropertyId;
                byPath[current] = propertyId;
                const node = document.nodes[propertyId];
                node.provenance = defs.map(({ provenance }) => provenance);
                const itemTypes = explicit(defs, (definition) => { const value = String(definition.itemType ?? definition.items?.type ?? ""); return supported.has(value) ? value : undefined; }), presences = explicit(defs, (definition) => { const raw = definition.presence; if (raw === "required" || definition.required === true)
                    return { mode: "required", ...(definition.condition ? { condition: clone(definition.condition) } : {}) }; if (raw === "forbidden" || definition.forbidden === true)
                    return { mode: "forbidden", ...(definition.condition ? { condition: clone(definition.condition) } : {}) }; if (raw === "optional" || raw === "permitted")
                    return { mode: "optional" }; return undefined; }), allowed = explicit(defs, (definition) => (definition.allowedValues ?? definition.enum)), displayTexts = explicit(defs, (definition) => typeof definition.displayText === "string" ? definition.displayText : undefined), descriptions = explicit(defs, (definition) => typeof (definition.description ?? definition.documentation) === "string" ? String(definition.description ?? definition.documentation) : undefined), comments = explicit(defs, (definition) => typeof definition.comments === "string" ? definition.comments : undefined), examples = explicit(defs, (definition) => Array.isArray(definition.examples) && definition.examples.length ? { method: "custom", value: clone(definition.examples[0]) } : undefined), expected = explicit(defs, (definition) => definition.expectedValue), enforcement = explicit(defs, (definition) => definition.enforcement), targets = explicit(defs, (definition) => typeof definition.target === "string" ? definition.target : undefined), overrideReferences = explicit(defs, (definition) => definition.overrideReferences);
                const rules = [];
                for (const { definition, provenance } of defs)
                    for (const rule of canonicalRules(definition, current, provenance.source)) {
                        const prior = rules.find(({ id }) => id === rule.id);
                        if (prior && !same(prior, rule))
                            addConflict(current, propertyId, "rules", [{ value: prior, sources: ["earlier legacy definition"] }, { value: rule, sources: [provenance.source] }]);
                        else if (!prior)
                            rules.push(rule);
                    }
                node.rules = rules;
                node.presence = presences[0]?.value ?? { mode: "optional" };
                node.allowedValues = (allowed[0]?.value ?? []).map((value) => ({ id: options.id("allowed-value"), value: clone(value) }));
                node.documentation = { displayText: displayTexts[0]?.value ?? "", description: descriptions[0]?.value ?? "", comments: comments[0]?.value ?? "", example: examples[0]?.value ?? { method: "blank" } };
                if (itemTypes[0]) {
                    node.itemType = itemTypes[0].value;
                    node.itemSchema = { id: `item:${node.id}`, type: itemTypes[0].value };
                }
                if (expected[0])
                    node.expectedValue = clone(expected[0].value);
                if (enforcement[0])
                    node.enforcement = enforcement[0].value;
                if (targets[0])
                    node.target = targets[0].value;
                if (overrideReferences[0])
                    node.overrideReferences = clone(overrideReferences[0].value);
                addConflict(current, propertyId, "type", types);
                addConflict(current, propertyId, "item type", itemTypes);
                addConflict(current, propertyId, "presence", presences);
                addConflict(current, propertyId, "allowed values", allowed);
                addConflict(current, propertyId, "display text", displayTexts);
                addConflict(current, propertyId, "description", descriptions);
                addConflict(current, propertyId, "comments", comments);
                addConflict(current, propertyId, "example", examples);
                addConflict(current, propertyId, "expected value", expected);
                addConflict(current, propertyId, "enforcement", enforcement);
                addConflict(current, propertyId, "target", targets);
                addConflict(current, propertyId, "override references", overrideReferences);
            }
            parentId = byPath[current];
        }
    }
    document.revision = 1;
    document.changes = [{ revision: 1, propertyIds: Object.keys(document.nodes), kind: "add" }];
    return { profileId: profile.id, document, byPath, conflicts, legacyKeys: ["requirements", "structuredSchema", "structuredDraft", "schemaConstraints"] };
}
//# sourceMappingURL=migration-plan.js.map