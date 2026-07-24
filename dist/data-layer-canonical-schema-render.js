import { canonicalTableRows } from "./data-layer-canonical-schema.js";
const input = (dom, name, value = "", type = "text") => { const control = dom.createElement("input"); control.name = name; control.type = type; control.value = value; return control; };
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function renderCanonicalSchemaEditor(context) {
    const { dom, options, document } = context;
    options.host.replaceChildren();
    options.host.setAttribute("aria-label", `${options.surface} canonical schema editor`);
    options.host.dataset.canonicalSchemaId = document.id;
    options.host.dataset.canonicalRevision = String(document.revision);
    options.host.dataset.canonicalEditorMode = "focused-property";
    const header = dom.createElement("header"), title = dom.createElement("h2"), status = dom.createElement("p"), undo = button(dom, "Undo", () => options.onUndo?.()), redo = button(dom, "Redo", () => options.onRedo?.());
    title.textContent = document.contributorName;
    status.setAttribute("aria-label", "Canonical Draft status");
    status.textContent = `Draft · ${document.source ? `source ${document.source.identity} revision ${document.source.revision}` : "no source revision"} · lineage ${document.source?.provenance ?? "project-created"} · Saved · Draft token ${document.revision}`;
    undo.disabled = !options.onUndo;
    redo.disabled = !options.onRedo;
    header.append(title, status, undo, redo);
    const navigator = dom.createElement("section"), search = dom.createElement("input"), filter = dom.createElement("select"), tree = dom.createElement("div"), rootName = input(dom, "newRootPropertyName", "property"), addRoot = button(dom, "Add root property", () => { const name = rootName.value.trim(); if (name)
        context.command({ kind: "add", baseRevision: document.revision, name, type: "string", id: options.id }); });
    navigator.setAttribute("aria-label", "Canonical property navigator");
    search.type = "search";
    search.setAttribute("aria-label", "Canonical property search");
    search.placeholder = "Search properties";
    search.value = context.query;
    search.addEventListener("input", () => { context.setQuery(search.value); context.render(); });
    filter.name = "propertyFilter";
    filter.append(...["All properties", "With conditions", "With documentation", "With issues"].map((entry) => new Option(entry, entry)));
    tree.setAttribute("aria-label", "Canonical property search results");
    for (const row of canonicalTableRows(document).filter(({ node }) => node.name.toLowerCase().includes(context.query.toLowerCase()))) {
        const article = dom.createElement("article"), choose = button(dom, `${"› ".repeat(row.depth)}${row.node.name} · ${row.path} · ${row.node.type}`, () => context.openProperty(row.node, choose));
        choose.dataset.propertyId = row.id;
        choose.setAttribute("aria-current", String((context.activePropertyId ?? document.selectedPropertyId) === row.id));
        article.dataset.propertyRow = "true";
        article.dataset.propertyId = row.id;
        const actions = button(dom, "Property actions", () => { context.setMenuPropertyId(row.id); context.openProperty(row.node, actions); });
        actions.setAttribute("aria-label", `Property actions for ${row.path}`);
        actions.dataset.propertyActionsPath = row.path;
        article.append(choose, actions);
        if (context.menuPropertyId === row.id)
            article.append(context.renderMenu(row.node));
        tree.append(article);
    }
    navigator.append(search, filter, tree, labeled(dom, "New root property name", rootName), addRoot);
    options.host.append(header, navigator);
    const body = dom.createElement("tbody");
    for (const article of Array.from(tree.children)) {
        const row = dom.createElement("tr"), cell = dom.createElement("td");
        cell.append(article);
        row.append(cell);
        body.append(row);
    }
    tree.replaceChildren(body);
    tree.setAttribute("role", "table");
    navigator.prepend(button(dom, "Table", () => { }), button(dom, "Tree", () => { }));
    const node = context.selectedNode(document);
    if (node && context.activePropertyId === node.id) {
        context.ensureWorking(node);
        options.host.append(context.renderFocusedEditor(document, node));
        if (context.review)
            options.host.append(context.review);
    }
    const preview = dom.createElement("section"), previewHeading = dom.createElement("h3"), previewText = dom.createElement("p"), feedbackOutput = dom.createElement("output");
    preview.setAttribute("aria-label", "Effective documentation preview");
    previewHeading.textContent = "Effective documentation";
    previewText.textContent = node ? [node.documentation.displayText, node.documentation.description, node.documentation.comments].filter(Boolean).join(" · ") || "No documentation yet." : "Select a property.";
    preview.append(previewHeading, previewText);
    feedbackOutput.setAttribute("aria-label", "Canonical command result");
    feedbackOutput.textContent = context.feedback;
    options.host.append(preview, feedbackOutput);
}
//# sourceMappingURL=data-layer-canonical-schema-render.js.map