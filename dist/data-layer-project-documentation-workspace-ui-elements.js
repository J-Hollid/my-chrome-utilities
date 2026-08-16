import { conceptSectionHeading } from "./data-layer-flow-table-documentation-export.js";
import { PROJECT_DOCUMENTATION_LOGO_MAX_HEIGHT, PROJECT_DOCUMENTATION_LOGO_MAX_WIDTH, } from "./data-layer-project-documentation-records.js";
import { themeFingerprint, } from "./data-layer-project-documentation-workspace.js";
export const documentationButton = (text, action) => {
    const value = document.createElement("button");
    value.type = "button";
    value.textContent = text;
    value.addEventListener("click", action);
    return value;
};
export const documentationLabelled = (text, control) => {
    const value = document.createElement("label");
    value.append(control, ` ${text}`);
    return value;
};
export const documentationHeading = (level, text) => Object.assign(document.createElement(`h${level}`), { textContent: text });
export const documentationMove = (items, item, direction) => {
    const index = items.indexOf(item), target = index + direction;
    if (index < 0 || target < 0 || target >= items.length)
        return [...items];
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
};
export const documentationMoveVisible = (items, item, direction, visible) => {
    const projected = items.filter(visible), index = projected.indexOf(item), target = index + direction;
    if (index < 0 || target < 0 || target >= projected.length)
        return [...items];
    const targetItem = projected[target], sourceIndex = items.indexOf(item), targetIndex = items.indexOf(targetItem), next = [...items];
    [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
    return next;
};
export const documentationCheckedOrder = (all, configured) => configured ? [...configured] : [...all];
export const documentationSetChecked = (current, id, checked) => checked ? [...current.filter((candidate) => candidate !== id), id] : current.filter((candidate) => candidate !== id);
export const documentationControlInput = (name, value, type = "text") => {
    const input = document.createElement("input");
    input.name = name;
    input.type = type;
    input.value = value;
    return input;
};
export const documentationLogoArea = (theme) => {
    const area = document.createElement("div");
    area.dataset.documentationLogoArea = "true";
    area.style.width = `${PROJECT_DOCUMENTATION_LOGO_MAX_WIDTH}px`;
    area.style.height = `${PROJECT_DOCUMENTATION_LOGO_MAX_HEIGHT}px`;
    area.style.display = "flex";
    area.style.alignItems = "flex-start";
    const image = Object.assign(document.createElement("img"), { src: theme.logo, alt: `${theme.clientName || theme.name} logo` });
    image.style.maxWidth = `${PROJECT_DOCUMENTATION_LOGO_MAX_WIDTH}px`;
    image.style.maxHeight = `${PROJECT_DOCUMENTATION_LOGO_MAX_HEIGHT}px`;
    image.style.width = "auto";
    image.style.height = "auto";
    image.style.objectFit = "contain";
    area.append(image);
    return area;
};
const applyThemeToTable = (table, theme) => {
    table.dataset.themeFingerprint = themeFingerprint(theme);
    table.dataset.density = theme.density;
    table.style.borderCollapse = "collapse";
    table.style.fontFamily = theme.typography.family;
    table.style.fontSize = `${theme.typography.bodySize}pt`;
    table.style.color = theme.colors.accent;
    const cells = Array.from(table.querySelectorAll("th,td")), padding = theme.density === "compact" ? "2px 4px" : "5px 7px";
    for (const cell of cells) {
        cell.style.padding = padding;
        cell.style.whiteSpace = "pre-wrap";
        cell.style.overflowWrap = "anywhere";
        if (theme.borders)
            cell.style.border = "1px solid #666";
    }
    for (const cell of Array.from(table.querySelectorAll("th"))) {
        cell.style.fontSize = `${theme.typography.headingSize}pt`;
        if (theme.highlightedHeadings) {
            cell.style.backgroundColor = theme.colors.heading;
            cell.style.color = "#fff";
        }
    }
    for (const cell of Array.from(table.querySelectorAll('th[scope="rowgroup"]'))) {
        cell.style.backgroundColor = theme.colors.stripe;
        cell.style.color = theme.colors.accent;
        cell.style.fontSize = `${Math.min(theme.typography.bodySize, theme.typography.headingSize - 2)}pt`;
        cell.style.fontWeight = "600";
        cell.style.textAlign = "start";
    }
    if (theme.striping)
        for (const [index, row] of Array.from(table.querySelectorAll("tbody tr")).entries())
            if (index % 2 === 1)
                row.style.backgroundColor = theme.colors.stripe;
    for (const [index, name] of Array.from(table.querySelectorAll("th")).map(({ textContent }) => textContent ?? "").entries()) {
        const width = theme.columnWidths[name];
        if (!width)
            continue;
        const column = document.createElement("col");
        column.style.width = `${width}ch`;
        let group = table.querySelector("colgroup");
        if (!group) {
            group = document.createElement("colgroup");
            table.prepend(group);
        }
        while (group.children.length < index)
            group.append(document.createElement("col"));
        group.append(column);
    }
};
export function renderDocumentationTable(value, theme) {
    const table = document.createElement("table"), head = document.createElement("thead"), headRow = document.createElement("tr"), body = document.createElement("tbody"), groups = new Map(value.conceptGroups?.map((group) => [group.start, group]) ?? []);
    headRow.append(...value.headings.map((text) => { const cell = document.createElement("th"); cell.scope = "col"; cell.textContent = text; return cell; }));
    head.append(headRow);
    for (const [index, sourceRow] of value.rows.entries()) {
        const group = groups.get(index);
        if (group) {
            const headingRow = document.createElement("tr"), cell = document.createElement("th");
            headingRow.dataset.conceptHeading = group.name;
            cell.colSpan = value.headings.length;
            cell.scope = "rowgroup";
            cell.textContent = conceptSectionHeading(group.name);
            headingRow.append(cell);
            body.append(headingRow);
        }
        const row = document.createElement("tr");
        row.append(...sourceRow.map((cell) => Object.assign(document.createElement("td"), { textContent: cell })));
        body.append(row);
    }
    table.append(head, body);
    applyThemeToTable(table, theme);
    return table;
}
//# sourceMappingURL=data-layer-project-documentation-workspace-ui-elements.js.map