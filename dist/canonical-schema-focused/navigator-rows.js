import { canonicalPropertyPath, canonicalTableRows } from "../data-layer-canonical-schema.js";
import { applySchemaTablePathAllocation, bindSchemaTableQuickEdit, mountSchemaTableOverlay, schemaTableAllowedValues, schemaTableCellMetadata, schemaTableColumns, schemaTableSortComparison } from "../data-layer-schema-table.js";
import { button } from "./dom.js";
import { canonicalFacetText } from "../data-layer-canonical-schema-facets.js";
export function canonicalNavigatorRows(context) {
    const query = context.query.trim().toLowerCase(), matches = (node) => !query || String(node.name ?? "").toLowerCase().includes(query) || canonicalPropertyPath(context.document, node.id).toLowerCase().includes(query), facet = (node) => context.propertyFilter === "all" || context.propertyFilter === "conditions" && Boolean(node.presence.condition) || context.propertyFilter === "documentation" && Boolean(node.documentation.displayText || node.documentation.description || node.documentation.comments) || context.propertyFilter === "issues" && node.provenance.some(({ state }) => state === "shadowed");
    const source = (node) => node.provenance.map(({ contributorName, source, state }) => contributorName ?? state ?? source).join(", ") || context.document.contributorName, rows = canonicalTableRows(context.document).filter(({ node }) => matches(node) && facet(node)), ordered = rows.map((row, order) => ({ row, order }));
    ordered.sort((left, right) => schemaTableSortComparison({ path: left.row.path, concept: left.row.node.concept, source: source(left.row.node), order: left.order }, { path: right.row.path, concept: right.row.node.concept, source: source(right.row.node), order: right.order }, context.propertySort));
    return ordered.map(({ row }) => row);
}
export function renderNavigatorRows(tree, context) {
    const { dom, document } = context;
    for (const row of canonicalNavigatorRows(context)) {
        const article = dom.createElement("article"), choose = button(dom, `${"› ".repeat(row.depth)}${row.node.name} · ${row.path} · ${row.node.type}`, () => context.openProperty(row.node, choose));
        choose.dataset.propertyId = row.id;
        choose.setAttribute("aria-current", String((context.activePropertyId ?? document.selectedPropertyId) === row.id));
        article.dataset.propertyRow = "true";
        article.dataset.propertyId = row.id;
        const actions = button(dom, "Property actions", () => { context.setMenuPropertyId(row.id); context.openProperty(row.node, actions); });
        actions.setAttribute("aria-label", `Property actions for ${row.path}`);
        actions.dataset.propertyActionsPath = row.path;
        article.append(choose, actions);
        tree.append(article);
        if (row.node.type === "array") {
            let item = row.node.itemSchema ?? (row.node.itemType ? { id: `item:${row.node.id}`, type: row.node.itemType } : undefined), level = row.depth + 1;
            while (item?.type) {
                const boundary = dom.createElement("article");
                boundary.dataset.itemBoundary = "true";
                boundary.setAttribute("role", "treeitem");
                boundary.textContent = `${"› ".repeat(level)}Each item · ${item.type[0].toUpperCase() + item.type.slice(1)}`;
                tree.append(boundary);
                if (item.type !== "array")
                    break;
                item = item.items;
                level += 1;
            }
        }
        if (context.menuPropertyId === row.id) {
            const layers = [context.renderMenu(row.node)];
            if (context.focusedPropertyId === row.id) {
                layers.push(context.renderFocusedEditor(context.document, row.node));
                if (context.review)
                    layers.push(context.review);
            }
            mountSchemaTableOverlay(context.options.host, actions, row.path, layers, context.dismissOverlay);
        }
    }
}
const bindEditable = (context, node, facet, value, control) => { const path = canonicalPropertyPath(context.document, node.id); control.value = value; control.dataset.inlineSchemaFacet = facet; control.dataset.inlineSchemaPath = path; control.setAttribute("aria-label", `${facet} for ${path}`); bindSchemaTableQuickEdit(control, { root: context.quickEditRoot, scope: context.quickEditScope, path, facet, savedValue: value, commit: (next) => context.commitInline(node, facet, next), cancel: context.cancelInline, diagnostic: context.inlineDiagnostic }); return control; };
const editableCell = (context, node, facet, value) => { const control = context.dom.createElement("input"); control.type = "text"; return bindEditable(context, node, facet, value, control); };
const selectCell = (context, node, facet, value, choices) => { const control = context.dom.createElement("select"); control.append(...choices.map((choice) => new Option(choice[0].toUpperCase() + choice.slice(1).replaceAll("-", " "), choice))); return bindEditable(context, node, facet, value, control); };
const exampleCell = (context, node, value) => { const control = editableCell(context, node, "example", value), suggestions = context.dom.createElement("datalist"), listId = `schema-example-${node.id.replace(/[^a-z0-9_-]/gi, "-")}`; suggestions.id = listId; for (const allowed of node.allowedValues) {
    const text = String(allowed.value);
    suggestions.append(new Option(text, text));
} control.setAttribute("role", "combobox"); control.setAttribute("aria-autocomplete", "list"); control.setAttribute("list", listId); return { control, suggestions }; };
const conceptCell = (context, node) => { const control = editableCell(context, node, "concept", node.concept?.trim() ?? ""), suggestions = context.dom.createElement("datalist"), listId = `schema-concept-${node.id.replace(/[^a-z0-9_-]/gi, "-")}`; suggestions.id = listId; for (const concept of context.options.conceptSuggestions?.() ?? [])
    suggestions.append(new Option(concept, concept)); control.setAttribute("role", "combobox"); control.setAttribute("aria-autocomplete", "list"); control.setAttribute("list", listId); return { control, suggestions }; };
const sourceText = (node, fallback) => node.provenance.map(({ contributorName, source, state }) => contributorName ?? state ?? (source === "created" ? fallback : source)).join(", ") || fallback;
function renderTable(tree, context) {
    const { dom } = context, table = context.tableElement ?? dom.createElement("table"), head = dom.createElement("thead"), headRow = dom.createElement("tr"), body = dom.createElement("tbody");
    let pendingOverlay;
    const cell = (index, text) => { const value = dom.createElement("td"), metadata = schemaTableCellMetadata[index]; value.dataset.schemaTableCell = metadata.key; value.dataset.schemaTableLabel = metadata.label; if (text !== undefined)
        value.textContent = text; return value; };
    for (const [index, { label }] of schemaTableColumns.entries()) {
        const heading = Object.assign(dom.createElement("th"), { textContent: label });
        if (index === 0) {
            heading.setAttribute("aria-label", "Property editor");
            heading.style.width = "1%";
            heading.style.whiteSpace = "nowrap";
        }
        headRow.append(heading);
    }
    head.append(headRow);
    for (const row of canonicalNavigatorRows(context)) {
        const node = context.working?.id === row.id ? context.working : row.node, tr = dom.createElement("tr"), identity = cell(0), trigger = button(dom, "⋯", () => context.openProperty(row.node, trigger)), example = node.documentation.example.value, states = node.provenance.map(({ state }) => state).filter(Boolean), invalid = states.includes("conflict") || states.includes("shadowed");
        tr.dataset.propertyRow = "true";
        tr.dataset.propertyId = row.id;
        tr.dataset.validationState = invalid ? "invalid" : "valid";
        if (invalid) {
            tr.classList.add("invalid");
            tr.setAttribute("aria-label", `${row.friendlyPath}: Needs attention; open Property editor for issue summary and repair actions.`);
        }
        identity.style.position = "relative";
        trigger.setAttribute("aria-label", `Property actions for ${row.path}${invalid ? "; Needs attention" : ""}`);
        trigger.dataset.propertyActionsPath = row.path;
        identity.append(trigger);
        const pathCell = cell(1, row.friendlyPath), compatibilityMarker = dom.createElement("span");
        compatibilityMarker.hidden = true;
        compatibilityMarker.textContent = " ·";
        pathCell.append(compatibilityMarker);
        applySchemaTablePathAllocation(pathCell);
        const conceptEditor = conceptCell(context, row.node), concept = cell(2), typeCell = cell(3), presenceCell = cell(4), appendReset = (host, facet, label, value) => { if (value === undefined || !node.localDefinitionFacets?.includes(facet))
            return; const reset = button(dom, `Reset ${label} to parent`, () => { const result = context.commitInline(row.node, facet, value); if (result.status === "invalid")
            context.inlineDiagnostic(result.diagnostic); }); reset.setAttribute("aria-label", `Reset ${label} to parent for ${row.path}`); reset.dataset.inlineFacetReset = facet; host.append(reset); };
        concept.append(conceptEditor.control, conceptEditor.suggestions);
        appendReset(concept, "concept", "Concept", node.inheritedDefinition?.concept);
        typeCell.append(selectCell(context, row.node, "type", node.type, ["string", "number", "integer", "boolean", "null", "object", "array"]));
        appendReset(typeCell, "type", "Type", node.inheritedDefinition?.type);
        presenceCell.append(selectCell(context, row.node, "presence", node.presence.mode.endsWith("-when") ? node.presence.mode.replace("-when", "") : node.presence.mode, ["optional", "required", "forbidden"]));
        appendReset(presenceCell, "presence", "Presence", node.inheritedDefinition?.presence);
        tr.append(identity, pathCell, concept, typeCell, presenceCell);
        const exampleEditor = exampleCell(context, row.node, canonicalFacetText(example));
        for (const [offset, control] of [editableCell(context, row.node, "description", node.documentation.description), editableCell(context, row.node, "expected-or-allowed", schemaTableAllowedValues({ expectedValue: node.expectedValue, allowedValues: node.allowedValues.map(({ value }) => value) })), exampleEditor.control].entries()) {
            const valueCell = cell(offset + 5);
            valueCell.append(control);
            if (control === exampleEditor.control)
                valueCell.append(exampleEditor.suggestions);
            tr.append(valueCell);
        }
        tr.append(cell(8, sourceText(node, context.document.contributorName)), cell(9, states.join(", ") || "local"));
        if (context.menuPropertyId === row.id) {
            const layers = [context.renderMenu(row.node)];
            if (context.focusedPropertyId === row.id) {
                layers.push(context.renderFocusedEditor(context.document, row.node));
                if (context.review)
                    layers.push(context.review);
            }
            pendingOverlay = { trigger, path: row.path, layers };
        }
        body.append(tr);
    }
    table.replaceChildren(head, body);
    table.setAttribute("aria-label", "Canonical property table");
    table.dataset.canonicalView = "table";
    tree.replaceChildren(table);
    tree.dataset.canonicalView = "table";
    if (pendingOverlay)
        mountSchemaTableOverlay(context.options.host, pendingOverlay.trigger, pendingOverlay.path, pendingOverlay.layers, context.dismissOverlay);
}
export function applyNavigatorView(tree, dom, view, context) {
    if (view === "table" && context) {
        renderTable(tree, context);
        return;
    }
    tree.setAttribute("role", "tree");
    tree.dataset.canonicalView = "tree";
}
//# sourceMappingURL=navigator-rows.js.map