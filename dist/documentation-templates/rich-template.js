import { templateBindingsFor, templateDigest, templateValueAt } from "./template-contract.js";
const collections = { overview: ["overview.fields"], flow: ["flow.pages", "table.rows", "flow.rows"], matrix: ["matrix.rows", "matrix.concepts", "table.rows"], profile: ["profile.rows", "profile.concepts", "table.rows"] };
const childBindings = { "overview.fields": ["field.label", "field.value"], "flow.pages": ["page.stepLabel", "page.pageName", "page.sourcePageName", "page.eventName", "page.heading", "page.rows", "page.events"], "page.events": ["event.eventName", "event.heading", "event.rows"], "page.rows": ["row.property", "row.concept", "row.cells"], "event.rows": ["row.property", "row.concept", "row.cells"], "table.rows": ["row.concept", "row.cells"], "flow.rows": ["row.property", "row.cells"], "matrix.rows": ["row.property", "row.concept", "row.cells"], "profile.rows": ["row.property", "row.concept", "row.cells"], "matrix.concepts": ["concept.name", "concept.rows"], "profile.concepts": ["concept.name", "concept.rows"], "concept.rows": ["row.property", "row.concept", "row.cells"], "row.cells": ["cell.columnKey", "cell.heading", "cell.value"] };
const childCollections = { "flow.pages": ["page.events", "page.rows"], "page.events": ["event.rows"], "page.rows": ["row.cells"], "event.rows": ["row.cells"], "table.rows": ["row.cells"], "flow.rows": ["row.cells"], "matrix.rows": ["row.cells"], "profile.rows": ["row.cells"], "matrix.concepts": ["concept.rows"], "profile.concepts": ["concept.rows"], "concept.rows": ["row.cells"] };
const itemRoot = (collection) => collection.endsWith(".pages") ? "page" : collection.endsWith(".events") ? "event" : collection.endsWith(".cells") ? "cell" : collection.endsWith(".concepts") ? "concept" : collection.endsWith(".fields") ? "field" : "row";
export function richTemplateHelpBindingsFor(kind) {
    const help = new Set(templateBindingsFor(kind)), pending = [...collections[kind]], visited = new Set();
    while (pending.length) {
        const collection = pending.shift();
        if (visited.has(collection))
            continue;
        visited.add(collection);
        help.add(collection);
        for (const binding of childBindings[collection] ?? [])
            help.add(binding);
        for (const nested of childCollections[collection] ?? []) {
            help.add(nested);
            pending.push(nested);
        }
    }
    return [...help];
}
export function richTemplateBlockScopes(kind, blocks) { const result = {}; const visit = (items, bindings, available) => { for (const block of items) {
    const nestedBindings = block.type === "repeat" ? [...bindings, ...(childBindings[block.items] ?? [])] : bindings, nestedCollections = block.type === "repeat" ? childCollections[block.items] ?? [] : available;
    result[block.id] = { bindings: [...bindings], collections: [...available], childBindings: [...nestedBindings], childCollections: [...nestedCollections] };
    if (block.type === "repeat")
        visit(block.children, nestedBindings, nestedCollections);
} }; visit(blocks, templateBindingsFor(kind), collections[kind]); return result; }
export function validateRichDocumentationTemplate(template) {
    const findings = [], ids = new Set(), root = new Set(templateBindingsFor(template.kind));
    const visit = (blocks, bindings, availableCollections) => { for (const block of blocks) {
        if (ids.has(block.id))
            findings.push({ blockId: block.id, message: `Duplicate block identity ${block.id}.` });
        ids.add(block.id);
        if ("content" in block)
            for (const inline of block.content)
                if ("binding" in inline && !bindings.has(inline.binding))
                    findings.push({ blockId: block.id, message: `Binding ${inline.binding} is outside this block scope.` });
        if (block.type === "repeat") {
            if (!availableCollections.has(block.items))
                findings.push({ blockId: block.id, message: `Collection ${block.items} is outside this block scope.` });
            if (!/^[a-z][a-zA-Z0-9]*$/u.test(block.variable))
                findings.push({ blockId: block.id, message: "Repeat item name must be a safe binding name." });
            visit(block.children, new Set([...bindings, ...(childBindings[block.items] ?? [])]), new Set(childCollections[block.items] ?? []));
        }
    } };
    visit(template.blocks, root, new Set(collections[template.kind]));
    return { valid: findings.length === 0, findings };
}
export function builtInRichTemplate(kind, id, name) {
    const blocks = [{ id: `${id}:heading`, type: "heading", level: 1, content: [{ binding: "section.name" }] }, { id: `${id}:table`, type: "data-table", source: kind === "overview" ? "overview.fields" : kind === "flow" ? "flow.rows" : kind === "matrix" ? "matrix.rows" : "profile.rows" }];
    return { id, name, format: "rich", kind, contractVersion: 1, digest: templateDigest("rich", blocks), blocks };
}
const htmlEscape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;").replaceAll("\n", "<br>");
const scalar = (value) => value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
const inlineText = (items, context) => items.map(item => "text" in item ? item.text : scalar(templateValueAt(context, item.binding))).join("");
const tableRows = (value) => { if (!value || typeof value !== "object")
    return { headings: [], rows: [] }; if (Array.isArray(value))
    return { headings: [], rows: value.map(item => [scalar(item)]) }; const table = value, columns = Array.isArray(table.columns) ? table.columns.map(column => scalar(column.heading)) : [], rows = Array.isArray(table.rows) ? table.rows.map(row => { const record = row, cells = Array.isArray(record.cells) ? record.cells.map(cell => scalar(cell.value)) : []; return record.property !== undefined && cells.length < columns.length ? [scalar(record.property), ...cells] : cells; }) : []; return { headings: columns, rows }; };
export function renderRichDocumentationTemplate(template, context) {
    const validation = validateRichDocumentationTemplate(template);
    if (!validation.valid)
        throw new Error(validation.findings.map(({ blockId, message }) => `${blockId}: ${message}`).join("\n"));
    const render = (blocks, scope) => {
        let html = "";
        const plain = [];
        for (const block of blocks) {
            if (block.type === "heading" || block.type === "paragraph") {
                const value = inlineText(block.content, scope);
                html += block.type === "heading" ? `<h${block.level}>${htmlEscape(value)}</h${block.level}>` : `<p>${htmlEscape(value)}</p>`;
                plain.push(value);
                continue;
            }
            if (block.type === "divider") {
                html += "<hr>";
                continue;
            }
            if (block.type === "theme-logo") {
                const logo = scalar(templateValueAt(scope, "theme.logo"));
                if (logo)
                    html += `<img src="${htmlEscape(logo)}" alt="">`;
                continue;
            }
            if (block.type === "repeat") {
                const items = templateValueAt(scope, block.items);
                if (Array.isArray(items))
                    for (const item of items) {
                        const child = render(block.children, { ...scope, [block.variable]: item, [itemRoot(block.items)]: item });
                        html += child.html;
                        plain.push(...child.plain);
                    }
                continue;
            }
            if (block.type === "data-table") {
                const value = block.source === "table" ? templateValueAt(scope, "table") : { columns: templateValueAt(scope, "table.columns"), rows: templateValueAt(scope, block.source) }, table = tableRows(value), head = table.headings.length ? `<thead><tr>${table.headings.map(item => `<th>${htmlEscape(item)}</th>`).join("")}</tr></thead>` : "", body = table.rows.map(row => `<tr>${row.map(item => `<td>${htmlEscape(item)}</td>`).join("")}</tr>`).join("");
                html += `<table>${head}<tbody>${body}</tbody></table>`;
                if (table.headings.length)
                    plain.push(table.headings.join("\t"));
                plain.push(...table.rows.map(row => row.join("\t")));
                continue;
            }
            if (block.type === "concept-group") {
                const concepts = templateValueAt(scope, block.source), columns = templateValueAt(scope, "table.columns");
                if (Array.isArray(concepts))
                    for (const value of concepts) {
                        if (!value || typeof value !== "object" || Array.isArray(value))
                            continue;
                        const concept = value, rows = concept.rows;
                        if (!Array.isArray(rows) || rows.length === 0)
                            continue;
                        const name = scalar(concept.name), table = tableRows({ columns, rows }), body = table.rows.map(row => `<tr>${row.map(item => `<td>${htmlEscape(item)}</td>`).join("")}</tr>`).join("");
                        html += `<section data-concept-group="${htmlEscape(name)}"><h3>${htmlEscape(name)}</h3><table><tbody>${body}</tbody></table></section>`;
                        plain.push(name, ...table.rows.map(row => row.join("\t")));
                    }
                continue;
            }
        }
        return { html, plain };
    };
    const output = render(template.blocks, context);
    return { html: `<section data-documentation-template="rich">${output.html}</section>`, plain: output.plain.join("\n") };
}
//# sourceMappingURL=rich-template.js.map