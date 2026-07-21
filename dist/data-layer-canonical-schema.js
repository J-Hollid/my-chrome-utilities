const clone = (value) => structuredClone(value);
const emptyDocumentation = () => ({ displayText: "", description: "", comments: "", example: { method: "blank" } });
const orderWithin = (document, parentId) => Object.values(document.nodes).filter((node) => node.parentId === parentId).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
const affectedPropertyIds = (command) => "propertyId" in command ? [command.propertyId] : command.kind === "add" && command.parentId ? [command.parentId] : [];
const appendChange = (document, command, propertyIds) => ({ ...document, revision: document.revision + 1, changes: [...document.changes, { revision: document.revision + 1, propertyIds, kind: command.kind }] });
export function createCanonicalSchema(input) { return { id: input.id, revision: 0, state: "Draft", contributorId: input.contributorId, contributorName: input.contributorName, rootIds: [], nodes: {}, view: "tree", changes: [], ...(input.source ? { source: clone(input.source) } : {}) }; }
export function canonicalPropertyPath(document, propertyId) {
    const parts = [];
    let node = document.nodes[propertyId], guard = 0;
    while (node && guard < Object.keys(document.nodes).length + 1) {
        parts.unshift(node.name);
        node = node.parentId ? document.nodes[node.parentId] : undefined;
        guard += 1;
    }
    if (!parts.length)
        throw new Error(`Canonical property ${propertyId} is unavailable.`);
    return `/${parts.map((part) => part.replaceAll("~", "~0").replaceAll("/", "~1")).join("/")}`;
}
function orderedIds(document, parentId) { return orderWithin(document, parentId).flatMap((node) => [node.id, ...orderedIds(document, node.id)]); }
export function canonicalTableRows(document) { return orderedIds(document).map((id) => { const node = document.nodes[id]; let depth = 0, parent = node.parentId; while (parent) {
    depth += 1;
    parent = document.nodes[parent]?.parentId;
} return { id, node, path: canonicalPropertyPath(document, id), depth, selected: id === document.selectedPropertyId, condition: node.presence.condition, validationState: "valid" }; }); }
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
        const descendants = orderedIds(next, command.propertyId), destructive = node.type === "object" && command.type !== "object" && descendants.length > 0;
        const itemChange = node.type === "array" && command.type === "array" && node.itemType !== command.itemType;
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
        const descendants = [command.propertyId, ...orderedIds(next, command.propertyId)];
        const parentId = node.parentId;
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
        const oldParent = node.parentId;
        delete node.parentId;
        if (command.parentId)
            node.parentId = command.parentId;
        node.order = insertOrder(next, command.parentId, command.afterId);
        normalizeOrders(next, oldParent);
        normalizeOrders(next, command.parentId);
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
function actualFor(document, observation, propertyId) { return Object.hasOwn(observation, propertyId) ? observation[propertyId] : canonicalPropertyPath(document, propertyId).split("/").filter(Boolean).reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, observation); }
function leafMatches(leaf, document, observation) { const actual = actualFor(document, observation, leaf.propertyId), expected = leaf.value; switch (leaf.operator) {
    case "Equals": return Object.is(actual, expected);
    case "Does not equal": return !Object.is(actual, expected);
    case "Exists": return actual !== undefined;
    case "Does not exist": return actual === undefined;
    case "Starts with": return String(actual ?? "").startsWith(String(expected ?? ""));
    case "Contains": return String(actual ?? "").includes(String(expected ?? ""));
    case "Matches pattern": try {
        return new RegExp(String(expected ?? "")).test(String(actual ?? ""));
    }
    catch {
        return false;
    }
    case "Greater than": return Number(actual) > Number(expected);
    case "At least": return Number(actual) >= Number(expected);
    case "Less than": return Number(actual) < Number(expected);
    case "At most": return Number(actual) <= Number(expected);
} }
export function evaluateCanonicalPredicate(predicate, document, observation) { const branches = []; const visit = (branch) => { if (branch.kind === "predicate") {
    const matched = Boolean(document.nodes[branch.propertyId]) && leafMatches(branch, document, observation);
    branches.push({ label: `${document.nodes[branch.propertyId]?.name ?? "Unresolved property"} ${branch.operator}${branch.value === undefined ? "" : ` ${String(branch.value)}`}`, matched, propertyId: branch.propertyId });
    return matched;
} const results = branch.children.map(visit), matched = branch.kind === "all" ? results.every(Boolean) : branch.kind === "any" ? results.some(Boolean) : !results.some(Boolean); branches.push({ label: `${branch.kind.toUpperCase()} group`, matched }); return matched; }; return { matched: visit(predicate), branches }; }
export function canonicalConstraints(document) { return orderedIds(document).map((id) => { const node = document.nodes[id], conditional = node.presence.mode.endsWith("-when"), patterns = node.rules.flatMap((rule) => rule.kind === "pattern" && rule.pattern ? [rule.pattern] : []), ranges = node.rules.filter(({ kind }) => kind === "range"), cardinality = node.rules.filter(({ kind }) => kind === "cardinality"), minimum = ranges.map(({ minimum }) => minimum).filter((value) => value !== undefined).sort((a, b) => b - a)[0], maximum = ranges.map(({ maximum }) => maximum).filter((value) => value !== undefined).sort((a, b) => a - b)[0], minItems = cardinality.map((rule) => rule.minItems).filter((value) => value !== undefined).sort((a, b) => b - a)[0], maxItems = cardinality.map((rule) => rule.maxItems).filter((value) => value !== undefined).sort((a, b) => a - b)[0]; return { path: canonicalPropertyPath(document, id), type: node.type, ...(node.allowedValues.length ? { allowedValues: node.allowedValues.map(({ value }) => clone(value)) } : {}), ...(node.presence.mode.startsWith("required") ? { presence: "required" } : node.presence.mode.startsWith("forbidden") ? { presence: "forbidden" } : {}), ...(conditional && node.presence.condition ? { condition: clone(node.presence.condition) } : {}), ...(node.rules.length ? { rules: clone(node.rules) } : {}), ...(patterns.length ? { patterns } : {}), ...(minimum !== undefined ? { minimum } : {}), ...(maximum !== undefined ? { maximum } : {}), ...(minItems !== undefined ? { minItems } : {}), ...(maxItems !== undefined ? { maxItems } : {}), ...(node.documentation.description ? { documentation: node.documentation.description } : {}), ...(node.documentation.example.method !== "blank" ? { examples: [clone(node.documentation.example.value)] } : {}), ...(node.expectedValue !== undefined ? { expectedValue: clone(node.expectedValue) } : {}), ...(node.enforcement ? { enforcement: node.enforcement } : {}), ...(node.target ? { target: node.target } : {}), definitionId: id, ...(node.overrideReferences.length ? { overrideReferences: clone(node.overrideReferences) } : {}) }; }); }
export function canonicalSchemaWithConstraint(document, constraint, id) { let next = document, parentId, current = ""; for (const name of constraint.path.split("/").filter(Boolean)) {
    current += `/${name}`;
    const existing = canonicalTableRows(next).find(({ path }) => path === current)?.id;
    if (existing) {
        parentId = existing;
        continue;
    }
    const result = addCanonicalProperty(next, { baseRevision: next.revision, name, type: name === constraint.path.split("/").filter(Boolean).at(-1) ? constraint.type ?? "string" : "object", ...(parentId ? { parentId } : {}), id });
    if (result.status !== "applied" && result.status !== "rebased")
        throw new Error(`Cannot add canonical property ${current}.`);
    next = result.document;
    parentId = next.selectedPropertyId;
} if (!parentId)
    throw new Error("A canonical constraint needs a generated property path."); const node = next.nodes[parentId], rules = [...node.rules, ...((constraint.patterns ?? []).map((pattern) => ({ id: id("rule"), kind: "pattern", pattern, severity: "error", message: "Pattern mismatch" }))), ...(constraint.minimum !== undefined || constraint.maximum !== undefined ? [{ id: id("rule"), kind: "range", severity: "error", message: "Outside range", ...(constraint.minimum !== undefined ? { minimum: constraint.minimum } : {}), ...(constraint.maximum !== undefined ? { maximum: constraint.maximum } : {}) }] : []), ...(constraint.minItems !== undefined || constraint.maxItems !== undefined ? [{ id: id("rule"), kind: "cardinality", severity: "error", message: "Outside cardinality", ...(constraint.minItems !== undefined ? { minItems: constraint.minItems } : {}), ...(constraint.maxItems !== undefined ? { maxItems: constraint.maxItems } : {}) }] : [])]; const result = setCanonicalProperty(next, { baseRevision: next.revision, propertyId: parentId, patch: { type: constraint.type ?? node.type, allowedValues: (constraint.allowedValues ?? []).map((value) => ({ id: id("allowed-value"), value: clone(value) })), presence: { mode: constraint.presence === "required" ? "required" : constraint.presence === "forbidden" ? "forbidden" : "optional" }, rules, documentation: { ...node.documentation, description: constraint.documentation ?? node.documentation.description, ...(constraint.examples?.length ? { example: { method: "custom", value: clone(constraint.examples[0]) } } : {}) }, ...(constraint.expectedValue !== undefined ? { expectedValue: clone(constraint.expectedValue) } : {}), ...(constraint.enforcement ? { enforcement: constraint.enforcement } : {}), ...(constraint.target ? { target: constraint.target } : {}), overrideReferences: [...(constraint.overrideReferences ?? [])] } }); if (result.status !== "applied" && result.status !== "rebased")
    throw new Error(`Cannot update canonical property ${constraint.path}.`); return result.document; }
export function canonicalRequirements(document) { return orderedIds(document).map((id) => { const node = document.nodes[id]; return { path: canonicalPropertyPath(document, id), type: node.type, ...(node.presence.mode.startsWith("required") ? { required: true } : {}), ...(node.presence.mode.startsWith("forbidden") ? { forbidden: true } : {}), ...(node.allowedValues.length ? { allowedValues: node.allowedValues.map(({ value }) => clone(value)) } : {}), ...(node.documentation.description ? { description: node.documentation.description } : {}), ...(node.documentation.example.method !== "blank" ? { examples: [clone(node.documentation.example.value)] } : {}), ...(node.rules.length ? { rules: clone(node.rules) } : {}) }; }); }
const supported = new Set(["string", "number", "integer", "boolean", "null", "object", "array"]);
const typeOf = (value) => value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : typeof value === "object" ? "object" : "string";
function definitionAtPath(definitions, path, definition, provenance) { const values = definitions.get(path) ?? []; values.push({ definition, provenance }); definitions.set(path, values); }
function collectStructured(definitions, document, source, parent = "") { const properties = document.properties, required = new Set(document.required ?? []); for (const [name, definition] of Object.entries(properties ?? {})) {
    const path = `${parent}/${name}`, normalized = required.has(name) ? { ...definition, required: true } : definition;
    definitionAtPath(definitions, path, normalized, { source });
    if (definition.type === "object" || definition.properties)
        collectStructured(definitions, definition, source, path);
} }
const semanticallyPopulated = (value) => { if (value === undefined || value === null)
    return false; if (Array.isArray(value))
    return value.some(semanticallyPopulated); if (typeof value === "string")
    return value.trim().length > 0; if (typeof value !== "object")
    return true; return Object.entries(value).some(([key, entry]) => { if (key === "type" && entry === "object")
    return false; if (key === "properties" && entry && typeof entry === "object" && !Array.isArray(entry))
    return Object.keys(entry).length > 0; return semanticallyPopulated(entry); }); };
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
    const explicit = (defs, read) => { const values = []; for (const { definition, provenance } of defs) {
        const value = read(definition);
        if (value === undefined)
            continue;
        const prior = values.find((candidate) => same(candidate.value, value)), source = provenance.source;
        if (prior)
            prior.sources.push(source);
        else
            values.push({ value: clone(value), sources: [source] });
    } return values; };
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
                if (itemTypes[0])
                    node.itemType = itemTypes[0].value;
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
export function resolveCanonicalMigrationConflict(plan, conflictId, choiceId) {
    const conflict = plan.conflicts.find(({ id }) => id === conflictId), choice = conflict?.choices.find(({ id }) => id === choiceId);
    if (!conflict || !choice)
        throw new Error("Choose an available canonical migration resolution.");
    const next = clone(plan), target = next.conflicts.find(({ id }) => id === conflictId), node = next.document.nodes[target.propertyId], value = clone(choice.value);
    if (target.facet === "type")
        node.type = value;
    else if (target.facet === "item type")
        node.itemType = value;
    else if (target.facet === "presence")
        node.presence = value;
    else if (target.facet === "allowed values")
        node.allowedValues = value.map((entry, index) => ({ id: `migration-allowed:${encodeURIComponent(target.path)}:${index}`, value: entry }));
    else if (target.facet === "rules") {
        const replacement = value;
        node.rules = [...node.rules.filter(({ id }) => id !== replacement.id), replacement];
    }
    else if (target.facet === "display text")
        node.documentation.displayText = String(value);
    else if (target.facet === "description")
        node.documentation.description = String(value);
    else if (target.facet === "comments")
        node.documentation.comments = String(value);
    else if (target.facet === "example")
        node.documentation.example = value;
    else if (target.facet === "expected value")
        node.expectedValue = value;
    else if (target.facet === "enforcement")
        node.enforcement = value;
    else if (target.facet === "target")
        node.target = String(value);
    else
        node.overrideReferences = value;
    next.conflicts = next.conflicts.filter(({ id }) => id !== conflictId);
    return next;
}
export function canonicalSchemaFromJsonSchema(input) { const profile = { id: input.contributorId, name: input.contributorName, structuredSchema: input.document }, plan = migrateLegacyProfile(profile, { id: input.idFactory }), firstRootId = plan.document.rootIds[0], document = { ...plan.document, id: input.id, source: { identity: input.sourceIdentity, revision: input.sourceRevision, provenance: "saved-schema-library" }, ...(firstRootId ? { selectedPropertyId: firstRootId } : {}) }; for (const node of Object.values(document.nodes))
    node.provenance = node.provenance.map(() => ({ source: "saved-schema", sourceId: input.sourceIdentity, revision: input.sourceRevision })); return document; }
export function canonicalNodeFromValue(name, value, input) { return { id: input.id("property"), name, ...(input.parentId ? { parentId: input.parentId } : {}), order: input.order, type: typeOf(value), presence: { mode: "optional" }, allowedValues: [], rules: [], documentation: emptyDocumentation(), provenance: [{ source: "created" }], overrideReferences: [] }; }
//# sourceMappingURL=data-layer-canonical-schema.js.map