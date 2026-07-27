import { canonicalPropertyPath, canonicalTableRows } from "../data-layer-canonical-schema.js";
import { bindSchemaTableQuickEdit, mountSchemaTableOverlay, schemaTableAllowedValues, schemaTableCellMetadata, schemaTableColumns } from "../data-layer-schema-table.js";
import { button } from "./dom.js";
export function canonicalNavigatorRows(context) {
    const query = context.query.trim().toLowerCase(), matches = (node) => !query || node.name.toLowerCase().includes(query) || canonicalPropertyPath(context.document, node.id).toLowerCase().includes(query), facet = (node) => context.propertyFilter === "all" || context.propertyFilter === "conditions" && Boolean(node.presence.condition) || context.propertyFilter === "documentation" && Boolean(node.documentation.displayText || node.documentation.description || node.documentation.comments) || context.propertyFilter === "issues" && node.provenance.some(({ state }) => state === "shadowed");
    const rows = canonicalTableRows(context.document).filter(({ node }) => matches(node) && facet(node));
    if (context.propertySort === "name")
        rows.sort((left, right) => left.node.name.localeCompare(right.node.name) || left.path.localeCompare(right.path));
    else if (context.propertySort === "type")
        rows.sort((left, right) => left.node.type.localeCompare(right.node.type) || left.path.localeCompare(right.path));
    return rows;
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
const editableCell = (context, node, facet, value) => { const control = context.dom.createElement("input"), path = canonicalPropertyPath(context.document, node.id); control.type = "text"; control.value = value; control.dataset.inlineSchemaFacet = facet; control.dataset.inlineSchemaPath = path; control.setAttribute("aria-label", `${facet} for ${path}`); bindSchemaTableQuickEdit(control, { root: context.quickEditRoot, scope: context.quickEditScope, path, facet, savedValue: value, commit: (next) => context.commitInline(node, facet, next), cancel: context.cancelInline, diagnostic: context.inlineDiagnostic }); return control; };
const sourceText = (node, fallback) => node.provenance.map(({ contributorName, source, state }) => contributorName ?? state ?? (source === "created" ? fallback : source)).join(", ") || fallback;
function renderTable(tree, context) {
    const { dom } = context, table = context.tableElement ?? dom.createElement("table"), head = dom.createElement("thead"), headRow = dom.createElement("tr"), body = dom.createElement("tbody");
    let pendingOverlay;
    const cell = (index, text) => { const value = dom.createElement("td"), metadata = schemaTableCellMetadata[index]; value.dataset.schemaTableCell = metadata.key; value.dataset.schemaTableLabel = metadata.label; if (text !== undefined)
        value.textContent = text; return value; };
    for (const { label } of schemaTableColumns)
        headRow.append(Object.assign(dom.createElement("th"), { textContent: label }));
    head.append(headRow);
    for (const row of canonicalNavigatorRows(context)) {
        const node = context.working?.id === row.id ? context.working : row.node, tr = dom.createElement("tr"), identity = cell(0), name = dom.createElement("span"), trigger = button(dom, "⋯", () => context.openProperty(row.node, trigger)), example = node.documentation.example.value, states = node.provenance.map(({ state }) => state).filter(Boolean);
        tr.dataset.propertyRow = "true";
        tr.dataset.propertyId = row.id;
        identity.style.position = "relative";
        name.textContent = `${node.name} · `;
        trigger.setAttribute("aria-label", `Property actions for ${row.path}`);
        trigger.dataset.propertyActionsPath = row.path;
        identity.append(name, trigger);
        tr.append(identity, cell(1, row.path), cell(2, node.type), cell(3, node.presence.mode));
        for (const [offset, control] of [editableCell(context, row.node, "description", node.documentation.description), editableCell(context, row.node, "expected-or-allowed", schemaTableAllowedValues({ expectedValue: node.expectedValue, allowedValues: node.allowedValues.map(({ value }) => value) })), editableCell(context, row.node, "example", example === undefined ? "" : String(example))].entries()) {
            const valueCell = cell(offset + 4);
            valueCell.append(control);
            tr.append(valueCell);
        }
        tr.append(cell(7, sourceText(node, context.document.contributorName)), cell(8, states.join(", ") || "local"), cell(9, states.includes("conflict") || states.includes("shadowed") ? "Needs attention" : "Ready"));
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