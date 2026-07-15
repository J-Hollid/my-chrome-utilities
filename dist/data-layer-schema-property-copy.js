import { resolveEffectiveSchemaDocumentation } from "./data-layer-schema-documentation.js";
import { schemaRevision } from "./data-layer-schema-verification.js";
function clone(value) { return structuredClone(value); }
function decode(segment) { return segment.replaceAll("~1", "/").replaceAll("~0", "~"); }
function encode(segment) { return segment.replaceAll("~", "~0").replaceAll("/", "~1"); }
function segments(path) { return path.replace(/^\//, "").split("/").filter(Boolean).map(decode); }
function pointer(parts) { return `/${parts.map(encode).join("/")}`; }
function canonical(path) { return pointer(segments(path)); }
function arraySegment(value) { return value === "*" || /^\d+$/.test(value ?? ""); }
function propertyAt(document, path) {
    return segments(path).reduce((current, segment) => arraySegment(segment) ? current?.items : current?.properties?.[segment], document);
}
function descendants(definition, prefix) {
    if (!definition)
        return [];
    const nested = Object.entries(definition.properties ?? {}).flatMap(([name, child]) => {
        const path = `${prefix}/${encode(name)}`;
        return [path, ...descendants(child, path)];
    });
    if (!definition.items)
        return nested;
    const item = `${prefix}/*`;
    return [...nested, item, ...descendants(definition.items, item)];
}
function ancestorPaths(path) {
    const parts = segments(path);
    return parts.map((_, index) => pointer(parts.slice(0, index + 1)));
}
function schemaFromDraft(schema) {
    const draft = schema.workingDraft;
    if (!draft)
        throw new Error("Schema has no visible working draft.");
    const { workingDraft: _draft, revisionHistory: _history, attachedRules: _rules, documentation: _documentation, parentSchemaId: _parent, inheritedRuleOverrides: _overrides, ...base } = clone(schema);
    return {
        ...base,
        document: clone(draft.document), assignments: clone(draft.assignments),
        ...(draft.attachedRules ? { attachedRules: clone(draft.attachedRules) } : {}),
        ...(draft.documentation ? { documentation: clone(draft.documentation) } : {}),
        ...(draft.parentSchemaId ? { parentSchemaId: draft.parentSchemaId } : {}),
        ...(draft.inheritedRuleOverrides ? { inheritedRuleOverrides: clone(draft.inheritedRuleOverrides) } : {}),
    };
}
function immutableSnapshot(schema) {
    const { workingDraft: _draft, revisionHistory: _history, ...snapshot } = clone(schema);
    return snapshot;
}
export function schemaPropertyCopySource(schema, selection) {
    if (selection.surface === "working draft")
        return { schema: schemaFromDraft(schema), surface: selection.surface, label: `${schema.name} working draft based on ${schema.version}` };
    const snapshot = selection.surface === "historical"
        ? schemaRevision(schema, selection.version ?? -1)
        : immutableSnapshot(schema);
    if (!snapshot)
        throw new Error(`Schema revision ${selection.version} does not exist.`);
    return { schema: immutableSnapshot(snapshot), surface: selection.surface, label: `${schema.name} revision ${snapshot.version}` };
}
function schemaChain(schema, schemas) {
    const result = [];
    const seen = new Set();
    let current = schema;
    while (current && !seen.has(current.id)) {
        seen.add(current.id);
        result.unshift(current);
        current = current.parentSchemaId ? schemas.find(({ id }) => id === current?.parentSchemaId) : undefined;
    }
    return result;
}
function pathCovered(path, roots) {
    return [...roots].some((root) => path === root || path.startsWith(`${root}/`));
}
function sameDefinition(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function container(definition) { return definition?.type === "object" || definition?.type === "array"; }
function ruleConfiguration(rule) {
    const { id: _id, name: _name, version: _version, ...configuration } = clone(rule);
    return JSON.stringify(configuration);
}
export function planSchemaPropertyCopy(options) {
    const selectedPath = canonical(options.selectedPath);
    const selected = propertyAt(options.source.schema.document, selectedPath);
    if (!selected)
        throw new Error(`Unknown source property: ${selectedPath}`);
    const roots = new Set([selectedPath]);
    const dependencies = [];
    const chain = schemaChain(options.source.schema, options.schemas);
    const availableRules = chain.flatMap((origin) => (origin.attachedRules ?? []).map((rule) => ({ origin, rule })));
    let changed = true;
    while (changed) {
        changed = false;
        for (const { rule } of availableRules) {
            const target = canonical(rule.propertyPath ?? "");
            if (!pathCovered(target, roots))
                continue;
            for (const predicate of rule.conditionGroup?.predicates ?? []) {
                const dependency = canonical(predicate.propertyPath);
                if (roots.has(dependency))
                    continue;
                roots.add(dependency);
                dependencies.push({ path: dependency, requiredBy: target });
                changed = true;
            }
        }
    }
    const pathSet = new Set();
    for (const root of roots) {
        for (const ancestor of ancestorPaths(root))
            pathSet.add(ancestor);
        if (root === selectedPath)
            for (const descendant of descendants(propertyAt(options.source.schema.document, root), root))
                pathSet.add(descendant);
    }
    const decisions = options.decisions ?? {};
    const excludedPaths = Object.entries(decisions).filter(([path, decision]) => !path.startsWith("rule:") && (decision === "keep destination" || decision === "exclude dependency")).map(([path]) => canonical(path));
    const propertyPaths = [...pathSet].filter((path) => propertyAt(options.source.schema.document, path)).sort();
    const conflicts = [];
    for (const path of propertyPaths) {
        const sourceDefinition = propertyAt(options.source.schema.document, path);
        const destinationDefinition = propertyAt(options.destination.workingDraft?.document ?? options.destination.document, path);
        if (!destinationDefinition)
            continue;
        const ancestor = path !== selectedPath && [...roots].every((root) => path !== root);
        if (ancestor && !container(destinationDefinition))
            conflicts.push({ path, kind: "blocked structural conflict", source: clone(sourceDefinition), destination: clone(destinationDefinition) });
        else if (sourceDefinition.type !== destinationDefinition.type)
            conflicts.push({ path, kind: "property conflict", source: clone(sourceDefinition), destination: clone(destinationDefinition), ...(decisions[path] ? { decision: decisions[path] } : {}) });
    }
    const reusable = new Set(options.reusableRuleIds);
    const destinationChain = schemaChain(options.destination, options.schemas);
    const effectiveDestinationRules = destinationChain.flatMap((schema) => schema.workingDraft?.attachedRules ?? schema.attachedRules ?? []);
    const dependencyExclusions = new Set(Object.entries(decisions).filter(([, decision]) => decision === "exclude dependency").map(([path]) => canonical(path)));
    const rules = availableRules.filter(({ rule }) => pathSet.has(canonical(rule.propertyPath ?? "")) && !excludedPaths.includes(canonical(rule.propertyPath ?? "")) && !(rule.conditionGroup?.predicates ?? []).some(({ propertyPath }) => dependencyExclusions.has(canonical(propertyPath)))).map(({ origin, rule }) => ({
        sourceId: rule.id, origin: { id: origin.id, name: origin.name, version: origin.version },
        ownership: reusable.has(rule.id) ? "reusable attachment" : origin.id === options.source.schema.id ? "local copy" : "inherited snapshot",
        rule: clone(rule),
        ...(effectiveDestinationRules.some((candidate) => candidate.id === rule.id && ruleConfiguration(candidate) === ruleConfiguration(rule)) ? { reuseExisting: true } : {}),
    }));
    for (const planned of rules) {
        const sameId = effectiveDestinationRules.find(({ id }) => id === planned.rule.id);
        if (sameId && ruleConfiguration(sameId) !== ruleConfiguration(planned.rule)) {
            const key = `rule:${planned.rule.id}`;
            conflicts.push({ path: key, kind: "rule conflict", source: clone(planned.rule), destination: clone(sameId), ...(decisions[key] ? { decision: decisions[key] } : {}) });
        }
    }
    const effectiveDocumentation = resolveEffectiveSchemaDocumentation(options.source.schema, options.schemas);
    const documentation = propertyPaths.flatMap((path) => {
        const entry = effectiveDocumentation.properties[path];
        return entry ? [{ path, entry: { displayName: entry.displayName, description: entry.description }, origin: { ...entry.origin } }] : [];
    });
    for (const item of documentation) {
        const destinationEntry = (options.destination.workingDraft?.documentation ?? options.destination.documentation)?.properties?.[item.path];
        if (destinationEntry && !sameDefinition(destinationEntry, item.entry))
            conflicts.push({ path: item.path, kind: "documentation conflict", source: item.entry, destination: clone(destinationEntry), ...(decisions[item.path] ? { decision: decisions[item.path] } : {}) });
    }
    const replacementRoots = Object.entries(decisions).filter(([path, decision]) => !path.startsWith("rule:") && decision === "replace from source").map(([path]) => canonical(path));
    const destinationDocument = options.destination.workingDraft?.document ?? options.destination.document;
    const destinationRules = options.destination.workingDraft?.attachedRules ?? options.destination.attachedRules ?? [];
    const destinationDocumentation = options.destination.workingDraft?.documentation ?? options.destination.documentation;
    const replacementImpact = {
        paths: [...new Set(replacementRoots.flatMap((root) => { const definition = propertyAt(destinationDocument, root); return definition ? [root, ...descendants(definition, root)] : []; }))].sort(),
        rules: destinationRules.filter((rule) => replacementRoots.some((root) => { const path = canonical(rule.propertyPath ?? ""); return path === root || path.startsWith(`${root}/`); })).map(({ id }) => id),
        documentation: Object.keys(destinationDocumentation?.properties ?? {}).filter((path) => replacementRoots.some((root) => path === root || path.startsWith(`${root}/`))),
    };
    const unresolved = conflicts.some((conflict) => conflict.kind === "blocked structural conflict" || !conflict.decision || conflict.decision === "cancel");
    return { source: clone(options.source), destination: clone(options.destination), selectedPath, propertyPaths, dependencies: dependencies.sort((a, b) => a.path.localeCompare(b.path)), rules, documentation, conflicts, decisions: clone(decisions), excludedPaths, replacementImpact, ready: !unresolved };
}
function definitionShell(definition) {
    const { properties: _properties, items: _items, ...shell } = clone(definition);
    return shell;
}
function insertDefinition(document, path, definition, replace) {
    const result = clone(document);
    const parts = segments(path);
    let current = result;
    parts.forEach((segment, index) => {
        const last = index === parts.length - 1;
        const next = parts[index + 1];
        if (arraySegment(segment)) {
            if (last)
                current.items = replace || !current.items ? clone(definition) : { ...clone(current.items), ...clone(definition) };
            else {
                current.items ??= { type: arraySegment(next) ? "array" : "object" };
                current = current.items;
            }
        }
        else {
            current.type ??= "object";
            current.properties ??= {};
            if (last)
                current.properties[segment] = replace || !current.properties[segment] ? clone(definition) : { ...clone(current.properties[segment]), ...clone(definition), ...(current.properties[segment]?.properties ? { properties: clone(current.properties[segment].properties) } : {}), ...(current.properties[segment]?.items ? { items: clone(current.properties[segment].items) } : {}) };
            else {
                current.properties[segment] ??= { type: arraySegment(next) ? "array" : "object" };
                current = current.properties[segment];
            }
        }
    });
    return result;
}
function requiredInSource(document, path) {
    const parts = segments(path);
    const name = parts.at(-1);
    if (!name || arraySegment(name))
        return false;
    const parent = parts.length === 1 ? document : propertyAt(document, pointer(parts.slice(0, -1)));
    return parent?.required?.includes(name) ?? false;
}
function markRequired(document, source, path) {
    if (!requiredInSource(source, path))
        return document;
    const result = clone(document);
    const parts = segments(path);
    const name = parts.pop();
    const parent = parts.length ? propertyAt(result, pointer(parts)) : result;
    if (parent)
        parent.required = [...new Set([...(parent.required ?? []), name])];
    return result;
}
export function applySchemaPropertyCopy(plan) {
    if (!plan.ready)
        throw new Error("Resolve property-copy conflicts before confirmation.");
    const previousSchema = clone(plan.destination);
    const existing = plan.destination.workingDraft;
    let document = clone(existing?.document ?? plan.destination.document);
    for (const path of plan.propertyPaths) {
        if (plan.excludedPaths.some((excluded) => path === excluded || path.startsWith(`${excluded}/`)))
            continue;
        const definition = propertyAt(plan.source.schema.document, path);
        const replace = plan.decisions[path] === "replace from source";
        document = insertDefinition(document, path, definitionShell(definition), replace);
        document = markRequired(document, plan.source.schema.document, path);
    }
    const replacementRoots = Object.entries(plan.decisions).filter(([path, decision]) => !path.startsWith("rule:") && decision === "replace from source").map(([path]) => canonical(path));
    const attachedRules = Array.from(existing?.attachedRules ?? plan.destination.attachedRules ?? [], (rule) => clone(rule)).filter((rule) => !replacementRoots.some((root) => { const path = canonical(rule.propertyPath ?? ""); return path === root || path.startsWith(`${root}/`); }));
    for (const planned of plan.rules) {
        const ruleDecision = plan.decisions[`rule:${planned.rule.id}`];
        if (ruleDecision === "keep destination")
            continue;
        if (planned.ownership === "reusable attachment") {
            const existingIndex = attachedRules.findIndex(({ id }) => id === planned.rule.id);
            if (existingIndex < 0 && !planned.reuseExisting)
                attachedRules.push(clone(planned.rule));
            else if (existingIndex >= 0 && ruleDecision === "replace from source")
                attachedRules[existingIndex] = clone(planned.rule);
            continue;
        }
        const id = `copy:${plan.source.schema.id}:${planned.rule.id}:${plan.destination.id}`;
        const copied = { ...clone(planned.rule), id, copySourceRuleId: planned.rule.id, copySourceSchemaId: plan.source.schema.id, copySourceSchemaVersion: plan.source.schema.version, ...(planned.ownership === "inherited snapshot" ? { copyInheritedOrigin: planned.origin.id } : {}) };
        const semantic = ruleConfiguration(copied);
        const index = attachedRules.findIndex((rule) => rule.id === id || rule.copySourceRuleId === planned.rule.id || ruleConfiguration(rule) === semantic);
        if (index < 0)
            attachedRules.push(copied);
        else
            attachedRules[index] = copied;
    }
    const baseDocumentation = clone(existing?.documentation ?? plan.destination.documentation ?? {});
    const properties = Object.fromEntries(Object.entries(clone(baseDocumentation.properties ?? {})).filter(([path]) => !replacementRoots.some((root) => path === root || path.startsWith(`${root}/`))));
    for (const item of plan.documentation) {
        const decision = plan.decisions[item.path];
        if (decision === "keep destination" || decision === "use destination text")
            continue;
        properties[item.path] = clone(item.entry);
    }
    const documentation = { ...(baseDocumentation.description ? { description: baseDocumentation.description } : {}), ...(Object.keys(properties).length ? { properties } : {}) };
    const pendingChange = `Copy ${plan.source.label} property ${plan.selectedPath}`;
    const workingDraft = { baseVersion: existing?.baseVersion ?? plan.destination.version, sourceVersion: existing?.sourceVersion ?? plan.destination.version, document, assignments: clone(existing?.assignments ?? plan.destination.assignments), attachedRules, documentation, pendingChanges: [...(existing?.pendingChanges ?? []), pendingChange], ...(existing?.parentSchemaId ?? plan.destination.parentSchemaId ? { parentSchemaId: existing?.parentSchemaId ?? plan.destination.parentSchemaId } : {}), ...(existing?.inheritedRuleOverrides ?? plan.destination.inheritedRuleOverrides ? { inheritedRuleOverrides: clone(existing?.inheritedRuleOverrides ?? plan.destination.inheritedRuleOverrides) } : {}) };
    return { schema: { ...clone(plan.destination), workingDraft }, previousSchema, plan: clone(plan) };
}
export function undoSchemaPropertyCopy(transaction) {
    return { schema: clone(transaction.previousSchema) };
}
//# sourceMappingURL=data-layer-schema-property-copy.js.map