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
    const chrome = document.createElement("header"), identity = document.createElement("p"), actions = document.createElement("div"), coreHost = document.createElement("section");
    chrome.setAttribute("aria-label", "Unified schema editor context");
    coreHost.setAttribute("aria-label", "Unified canonical schema editor core");
    chrome.append(identity, actions);
    input.host.replaceChildren(chrome, coreHost);
    input.host.dataset.canonicalEditorMounts = String(Number(input.host.dataset.canonicalEditorMounts ?? 0) + 1);
    const controller = createUnifiedCanonicalEditorController((options) => mountCanonicalSchemaEditor({ ...options, host: coreHost }), input.id);
    const renderContext = () => { const active = controller.active(); identity.textContent = active?.label ?? "Select a saved schema or project contributor."; actions.replaceChildren(...(active?.actions ?? []).map((action) => { const button = document.createElement("button"); button.type = "button"; button.textContent = action.label; button.addEventListener("click", action.run); return button; })); };
    renderContext();
    return { select(adapter) { controller.select(adapter); input.host.hidden = false; input.host.setAttribute("aria-label", "Side panel schema editor region"); renderContext(); }, close() { controller.clear(); input.host.hidden = true; input.host.removeAttribute("aria-label"); renderContext(); }, render() { renderContext(); controller.render(); }, active: controller.active };
}
const pointer = (path) => `/${path.split(/[./]/).filter(Boolean).join("/")}`;
export function savedSchemaCanonicalDocument(schema, id) {
    const canonical = canonicalSchemaFromJsonSchema({ id: `canonical:saved:${schema.id}`, contributorId: schema.id, contributorName: schema.name, sourceIdentity: schema.id, sourceRevision: schema.version, document: schema.document, idFactory: id }), byPath = new Map(Object.values(canonical.nodes).map((node) => [canonicalPropertyPath(canonical, node.id), node]));
    const visit = (definition, path) => { for (const [name, child] of Object.entries(definition.properties ?? {})) {
        const childPath = `${path}/${name}`, node = byPath.get(childPath), documentation = schema.documentation?.properties?.[childPath];
        if (node) {
            if (definition.required?.includes(name))
                node.presence = { mode: "required" };
            if (documentation)
                node.documentation = { displayText: documentation.displayName, description: documentation.description || node.documentation.description, comments: documentation.comments ?? "", example: documentation.example ? { method: documentation.example.selectionMethod === "allowed value" ? "allowed-value" : "custom", value: structuredClone(documentation.example.value) } : node.documentation.example };
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
    return canonical;
}
const orderedChildren = (document, parentId) => Object.values(document.nodes).filter((node) => node.parentId === parentId).sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
function jsonDefinition(document, node) {
    const children = orderedChildren(document, node.id);
    return { type: node.type, ...(node.type === "array" ? { items: { type: node.itemType ?? "string" } } : {}), ...(children.length ? { properties: Object.fromEntries(children.map((child) => [child.name, jsonDefinition(document, child)])), required: children.filter(({ presence }) => presence.mode.startsWith("required")).map(({ name }) => name) } : {}), ...(node.allowedValues.length ? { enum: node.allowedValues.map(({ value }) => structuredClone(value)) } : {}), ...(node.documentation.description ? { description: node.documentation.description } : {}), ...(node.documentation.example.method !== "blank" ? { examples: [structuredClone(node.documentation.example.value)] } : {}) };
}
export function savedSchemaFromCanonical(schema, canonical) {
    const roots = orderedChildren(canonical), document = { type: "object", properties: Object.fromEntries(roots.map((node) => [node.name, jsonDefinition(canonical, node)])), required: roots.filter(({ presence }) => presence.mode.startsWith("required")).map(({ name }) => name) }, attachedRules = [], properties = {};
    for (const node of Object.values(canonical.nodes)) {
        const path = canonicalPropertyPath(canonical, node.id), priorDocumentation = schema.documentation?.properties?.[path], example = node.documentation.example.method === "blank" ? undefined : { value: structuredClone(node.documentation.example.value), selectionMethod: node.documentation.example.method === "allowed-value" ? "allowed value" : "custom" };
        if (node.documentation.displayText || node.documentation.comments || priorDocumentation || node.documentation.example.method === "allowed-value")
            properties[path] = { displayName: node.documentation.displayText, description: node.documentation.description, ...(node.documentation.comments ? { comments: node.documentation.comments } : {}), ...(example ? { example } : {}) };
        for (const rule of node.rules) {
            const prior = (schema.attachedRules ?? []).find(({ id }) => id === rule.id), operator = rule.kind === "pattern" ? (prior?.operator ?? "regular-expression") : rule.kind === "range" ? "numeric-range" : rule.kind === "cardinality" ? "item-count" : prior?.operator ?? rule.kind, parameters = rule.kind === "pattern" ? rule.pattern : rule.kind === "range" ? `${rule.minimum ?? ""},${rule.maximum ?? ""}` : rule.kind === "cardinality" ? `${rule.minItems ?? ""},${rule.maxItems ?? ""}` : prior?.parameters;
            attachedRules.push({ ...prior, id: rule.id, version: prior?.version ?? 1, propertyPath: prior?.propertyPath ?? path, operator, ...(parameters !== undefined ? { parameters } : {}), severity: rule.severity, message: rule.message });
        }
    }
    const clean = (value) => { const next = structuredClone(value); delete next.attachedRules; if (next.required && !next.required.length)
        delete next.required; for (const child of Object.values(next.properties ?? {}))
        clean(child); return next; };
    const documentation = { ...(schema.documentation?.description ? { description: schema.documentation.description } : {}), ...(Object.keys(properties).length ? { properties } : {}) };
    return { ...schema, document: clean(document), ...(attachedRules.length ? { attachedRules } : {}), ...(Object.keys(documentation).length ? { documentation } : {}) };
}
//# sourceMappingURL=data-layer-side-panel-unified-schema-editor.js.map