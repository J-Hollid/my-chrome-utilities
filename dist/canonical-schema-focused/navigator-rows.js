import { canonicalTableRows } from "../data-layer-canonical-schema.js";
import { button } from "./dom.js";
export function renderNavigatorRows(tree, context) {
    const { dom, document } = context, filteredRows = canonicalTableRows(document).filter(({ node }) => node.name.toLowerCase().includes(context.query.toLowerCase()));
    for (const row of filteredRows) {
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
}
export function applyNavigatorView(tree, dom, view) {
    if (view === "table") {
        const body = dom.createElement("tbody");
        for (const article of Array.from(tree.children)) {
            const row = dom.createElement("tr"), cell = dom.createElement("td");
            cell.append(article);
            row.append(cell);
            body.append(row);
        }
        tree.replaceChildren(body);
        tree.setAttribute("role", "table");
        tree.dataset.canonicalView = "table";
        return;
    }
    tree.setAttribute("role", "tree");
    tree.dataset.canonicalView = "tree";
}
//# sourceMappingURL=navigator-rows.js.map