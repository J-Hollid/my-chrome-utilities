import { canonicalPropertyPath, canonicalSchemaFromJsonSchema } from "./data-layer-canonical-schema.js";
import { mountCanonicalSchemaEditor } from "./data-layer-canonical-schema-ui.js";
export function createUnifiedCanonicalEditorController(mount, id = (kind) => `${kind}:${crypto.randomUUID()}`) {
    let active;
    const empty = savedSchemaCanonicalDocument({ id: "schema:empty", name: "No schema selected", version: 0, document: { type: "object" } }, id);
    const core = mount({ host: globalThis.document?.createElement("section"), surface: "Side panel", load: () => active?.load() ?? empty, dispatch: (command) => active?.dispatch(command) ?? { status: "conflict", document: empty, message: "Select a schema before editing." }, id, onUndo: () => active?.onUndo?.(), onRedo: () => active?.onRedo?.() });
    return {
        select(adapter) { active = adapter; core.render(); },
        clear() { active = undefined; },
        current: () => active?.load() ?? empty,
        dispatch: (command) => active?.dispatch(command) ?? { status: "conflict", document: empty, message: "Select a schema before editing." },
        active: () => active,
        render: () => core.render(),
    };
}
export function mountUnifiedSidePanelCanonicalEditor(input) {
    const chrome = document.createElement("header"), identity = document.createElement("p"), actions = document.createElement("div"), coreShell = document.createElement("section"), coreHost = document.createElement("section"), contextHost = document.createElement("section");
    chrome.setAttribute("aria-label", "Unified schema editor context");
    coreShell.setAttribute("aria-label", "Unified canonical schema editor core");
    coreShell.append(coreHost);
    contextHost.setAttribute("aria-label", "Unified schema inheritance context");
    chrome.append(identity, actions);
    input.host.replaceChildren(chrome, coreShell, contextHost);
    input.host.dataset.canonicalEditorMounts = String(Number(input.host.dataset.canonicalEditorMounts ?? 0) + 1);
    const controller = createUnifiedCanonicalEditorController((options) => mountCanonicalSchemaEditor({ ...options, host: coreHost }), input.id);
    const renderContext = () => { const active = controller.active(); identity.textContent = active?.label ?? "Select a saved schema or project contributor."; actions.replaceChildren(...(active?.actions ?? []).map((action) => { const button = document.createElement("button"); button.type = "button"; button.textContent = action.label; button.addEventListener("click", action.run); return button; })); contextHost.replaceChildren(); contextHost.hidden = !active?.renderContext; if (active?.renderContext)
        active.renderContext(contextHost); };
    renderContext();
    return { select(adapter) { controller.select(adapter); input.host.hidden = false; input.host.setAttribute("aria-label", "Side panel schema editor region"); renderContext(); }, close() { controller.clear(); input.host.hidden = true; input.host.removeAttribute("aria-label"); renderContext(); }, render() { renderContext(); controller.render(); }, active: controller.active };
}
const pointer = (path) => `/${path.split(/[./]/).filter(Boolean).join("/")}`;
const clone = (value) => structuredClone(value);
const jsonFacetRule = (schemaId, nodeId, kind) => `json-facet:${schemaId}:${nodeId}:${kind}`;
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
        commands.push({ kind: "set", baseRevision: revision++, propertyId: nodeId, patch: { presence: clone(candidate.presence), allowedValues: clone(candidate.allowedValues), rules: clone(candidate.rules), documentation: clone(candidate.documentation) } });
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
        const patch = {
            presence: clone(candidatePresence),
            allowedValues: valuesWithStableIds(current.allowedValues, candidate.allowedValues, id),
            rules: clone(candidate.rules),
            documentation: clone(candidate.documentation),
        };
        const currentFacets = { presence: current.presence, allowedValues: current.allowedValues, rules: current.rules, documentation: current.documentation };
        if (!same(currentFacets, patch))
            commands.push({ kind: "set", baseRevision: revision++, propertyId: current.id, patch });
    }
    return commands;
}
export function savedSchemaCanonicalDocument(schema, id) {
    if (schema.canonicalSchema)
        return clone(schema.canonicalSchema);
    const canonical = canonicalSchemaFromJsonSchema({ id: `canonical:saved:${schema.id}`, contributorId: schema.id, contributorName: schema.name, sourceIdentity: schema.id, sourceRevision: schema.version, document: schema.document, idFactory: id }), byPath = new Map(Object.values(canonical.nodes).map((node) => [canonicalPropertyPath(canonical, node.id), node]));
    const definitionsByNodeId = {};
    const visit = (definition, path) => { for (const [name, child] of Object.entries(definition.properties ?? {})) {
        const childPath = `${path}/${name}`, node = byPath.get(childPath), documentation = schema.documentation?.properties?.[childPath], rich = child;
        if (node) {
            definitionsByNodeId[node.id] = clone(rich);
            if (definition.required?.includes(name))
                node.presence = { mode: "required" };
            else if (definition.forbidden?.includes(name))
                node.presence = { mode: "forbidden" };
            if (node.type === "array" && rich.items && typeof rich.items === "object" && typeof rich.items.type === "string")
                node.itemType = rich.items.type;
            node.allowedValues = node.allowedValues.map((entry, index) => ({ ...entry, id: `allowed-value:${node.id}:${index}` }));
            if (documentation)
                node.documentation = { displayText: documentation.displayName, description: documentation.description || node.documentation.description, comments: documentation.comments ?? "", example: documentation.example ? { method: documentation.example.selectionMethod === "allowed value" ? "allowed-value" : "custom", value: clone(documentation.example.value) } : node.documentation.example };
            const minimum = typeof rich.minimum === "number" ? rich.minimum : undefined, maximum = typeof rich.maximum === "number" ? rich.maximum : undefined, minItems = typeof rich.minItems === "number" ? rich.minItems : undefined, maxItems = typeof rich.maxItems === "number" ? rich.maxItems : undefined;
            if (typeof rich.pattern === "string")
                node.rules.push({ id: jsonFacetRule(schema.id, node.id, "pattern"), kind: "pattern", pattern: rich.pattern, severity: "error", message: "Pattern mismatch" });
            if (minimum !== undefined || maximum !== undefined)
                node.rules.push({ id: jsonFacetRule(schema.id, node.id, "range"), kind: "range", ...(minimum !== undefined ? { minimum } : {}), ...(maximum !== undefined ? { maximum } : {}), severity: "error", message: "Outside range" });
            if (minItems !== undefined || maxItems !== undefined)
                node.rules.push({ id: jsonFacetRule(schema.id, node.id, "cardinality"), kind: "cardinality", ...(minItems !== undefined ? { minItems } : {}), ...(maxItems !== undefined ? { maxItems } : {}), severity: "error", message: "Outside cardinality" });
        }
        visit(child, childPath);
    } };
    visit(schema.document, "");
    for (const rule of schema.attachedRules ?? []) {
        const node = byPath.get(pointer(rule.propertyPath ?? ""));
        if (!node)
            continue;
        const operator = rule.operator?.replaceAll("_", "-").replaceAll(" ", "-").toLowerCase(), bounds = rule.parameters?.split(",") ?? [], number = (value) => value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : undefined, minimum = number(bounds[0]), maximum = number(bounds[1]), kind = operator === "pattern" || operator === "regular-expression" ? "pattern" : operator === "range" || operator === "numeric-range" ? "range" : operator === "cardinality" || operator === "item-count" ? "cardinality" : "custom";
        node.rules.push({ id: rule.id, kind, ...(kind === "pattern" && rule.parameters ? { pattern: rule.parameters } : {}), ...(kind === "range" && minimum !== undefined ? { minimum } : {}), ...(kind === "range" && maximum !== undefined ? { maximum } : {}), ...(kind === "cardinality" && minimum !== undefined ? { minItems: minimum } : {}), ...(kind === "cardinality" && maximum !== undefined ? { maxItems: maximum } : {}), severity: rule.severity === "warning" ? "warning" : "error", message: rule.message ?? rule.name ?? rule.id, ...(rule.id.startsWith("rule:") ? { reusableRuleId: rule.id } : {}) });
    }
    canonical.sourceContent = { document: clone(schema.document), rules: clone((schema.attachedRules ?? [])), documentation: clone(schema.documentation ?? {}), examples: [], definitionsByNodeId };
    return canonical;
}
const orderedChildren = (document, parentId) => Object.values(document.nodes).filter((node) => node.parentId === parentId).sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
function jsonDefinition(document, node) {
    const base = clone(document.sourceContent?.definitionsByNodeId?.[node.id] ?? {}), children = orderedChildren(document, node.id), definition = { ...base, type: node.type };
    for (const key of ["properties", "required", "forbidden", "enum", "description", "examples", "pattern", "minimum", "maximum", "minItems", "maxItems"])
        delete definition[key];
    if (node.type === "array") {
        const prior = base.items && typeof base.items === "object" ? clone(base.items) : undefined;
        definition.items = node.itemType && prior?.type === node.itemType ? prior : { type: node.itemType ?? "string" };
    }
    else
        delete definition.items;
    if (children.length) {
        definition.properties = Object.fromEntries(children.map((child) => [child.name, jsonDefinition(document, child)]));
        const required = children.filter(({ presence }) => presence.mode.startsWith("required")).map(({ name }) => name), forbidden = children.filter(({ presence }) => presence.mode.startsWith("forbidden")).map(({ name }) => name);
        if (required.length)
            definition.required = required;
        if (forbidden.length)
            definition.forbidden = forbidden;
    }
    if (node.allowedValues.length)
        definition.enum = node.allowedValues.map(({ value }) => clone(value));
    if (node.documentation.description)
        definition.description = node.documentation.description;
    if (node.documentation.example.method !== "blank")
        definition.examples = [clone(node.documentation.example.value)];
    for (const rule of node.rules.filter(({ id }) => id.startsWith("json-facet:"))) {
        if (rule.kind === "pattern" && rule.pattern)
            definition.pattern = rule.pattern;
        if (rule.kind === "range") {
            if (rule.minimum !== undefined)
                definition.minimum = rule.minimum;
            if (rule.maximum !== undefined)
                definition.maximum = rule.maximum;
        }
        if (rule.kind === "cardinality") {
            if (rule.minItems !== undefined)
                definition.minItems = rule.minItems;
            if (rule.maxItems !== undefined)
                definition.maxItems = rule.maxItems;
        }
    }
    return definition;
}
export function savedSchemaFromCanonical(schema, canonical) {
    const roots = orderedChildren(canonical), root = clone(canonical.sourceContent?.document ?? {});
    for (const key of ["properties", "required", "forbidden"])
        delete root[key];
    root.type = "object";
    root.properties = Object.fromEntries(roots.map((node) => [node.name, jsonDefinition(canonical, node)]));
    const rootRequired = roots.filter(({ presence }) => presence.mode.startsWith("required")).map(({ name }) => name), rootForbidden = roots.filter(({ presence }) => presence.mode.startsWith("forbidden")).map(({ name }) => name);
    if (rootRequired.length)
        root.required = rootRequired;
    if (rootForbidden.length)
        root.forbidden = rootForbidden;
    const document = root, attachedRules = [], properties = {};
    for (const node of Object.values(canonical.nodes)) {
        const path = canonicalPropertyPath(canonical, node.id), priorDocumentation = schema.documentation?.properties?.[path], example = node.documentation.example.method === "blank" ? undefined : { value: structuredClone(node.documentation.example.value), selectionMethod: node.documentation.example.method === "allowed-value" ? "allowed value" : "custom" };
        if (node.documentation.displayText || node.documentation.comments || priorDocumentation || node.documentation.example.method === "allowed-value")
            properties[path] = { displayName: node.documentation.displayText, description: node.documentation.description, ...(node.documentation.comments ? { comments: node.documentation.comments } : {}), ...(example ? { example } : {}) };
        for (const rule of node.rules) {
            if (rule.id.startsWith("json-facet:"))
                continue;
            const prior = (schema.attachedRules ?? []).find(({ id }) => id === rule.id), operator = rule.kind === "pattern" ? (prior?.operator ?? "regular-expression") : rule.kind === "range" ? "numeric-range" : rule.kind === "cardinality" ? "item-count" : prior?.operator ?? rule.kind, parameters = rule.kind === "pattern" ? rule.pattern : rule.kind === "range" ? `${rule.minimum ?? ""},${rule.maximum ?? ""}` : rule.kind === "cardinality" ? `${rule.minItems ?? ""},${rule.maxItems ?? ""}` : prior?.parameters, propertyPath = prior?.propertyPath && pointer(prior.propertyPath) === path ? prior.propertyPath : path;
            attachedRules.push({ ...prior, id: rule.id, version: prior?.version ?? 1, propertyPath, operator, ...(parameters !== undefined ? { parameters } : {}), severity: rule.severity, message: rule.message });
        }
    }
    const clean = (value) => { const next = structuredClone(value); delete next.attachedRules; if (next.required && !next.required.length)
        delete next.required; for (const child of Object.values(next.properties ?? {}))
        clean(child); return next; };
    const documentation = { ...(schema.documentation?.description ? { description: schema.documentation.description } : {}), ...(Object.keys(properties).length ? { properties } : {}) };
    const { attachedRules: _attachedRules, documentation: _documentation, canonicalSchema: _canonicalSchema, ...current } = schema;
    return { ...current, document: clean(document), ...(attachedRules.length ? { attachedRules } : {}), ...(Object.keys(documentation).length ? { documentation } : {}), canonicalSchema: clone(canonical) };
}
//# sourceMappingURL=data-layer-side-panel-unified-schema-editor.js.map