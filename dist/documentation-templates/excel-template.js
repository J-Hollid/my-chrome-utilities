import { safeWorksheetName, templateBindingsFor, templateValueAt, } from "./template-contract.js";
import { excelTemplateItemPaths as itemPaths, excelTemplateItemRoot as itemRoot, excelTemplateNestedCollections as nestedCollections, excelTemplateRootCollections as rootCollections, } from "./excel-template-catalogue.js";
export { excelTemplateGuideFor } from "./excel-template-catalogue.js";
const cellPattern = /^\$?([A-Z]+)\$?([1-9]\d*)$/u;
const coordinate = (raw) => {
    const value = raw.includes("!") ? raw.slice(raw.lastIndexOf("!") + 1) : raw;
    const match = cellPattern.exec(value.toUpperCase());
    if (!match)
        throw new Error(`Invalid cell ${raw}.`);
    let column = 0;
    for (const char of match[1])
        column = column * 26 + char.charCodeAt(0) - 64;
    const row = Number(match[2]);
    if (column > 16_384 || row > 1_048_576)
        throw new Error(`Cell ${raw} is outside Excel worksheet limits.`);
    return { row, column };
};
const address = ({ row, column }) => { let letters = "", current = column; while (current > 0) {
    current -= 1;
    letters = String.fromCharCode(65 + current % 26) + letters;
    current = Math.floor(current / 26);
} return `${letters}${row}`; };
const rectangle = (range) => { const clean = range.replace(/^'?Template'?!/u, "").replaceAll("$", ""), [first, last = first] = clean.split(":"), start = coordinate(first), end = coordinate(last); if (end.row < start.row || end.column < start.column)
    throw new Error(`Invalid range ${range}.`); return { top: start.row, left: start.column, bottom: end.row, right: end.column }; };
const contains = (outer, inner) => outer.top <= inner.top && outer.left <= inner.left && outer.bottom >= inner.bottom && outer.right >= inner.right;
const overlaps = (left, right) => !(left.right < right.left || right.right < left.left || left.bottom < right.top || right.bottom < left.top);
const crosses = (left, right) => overlaps(left, right) && !contains(left, right) && !contains(right, left);
const pointInside = (point, bounds) => point.row >= bounds.top && point.row <= bounds.bottom && point.column >= bounds.left && point.column <= bounds.right;
const areaSize = (value) => (value.bottom - value.top + 1) * (value.right - value.left + 1);
const placeholderPaths = (value) => [...value.matchAll(/\{\{\s*([a-z][a-zA-Z0-9.]*)\s*\}\}/gu)].map(([, path]) => path);
function repeatAreas(prototype, findings) {
    const result = [];
    const names = new Set();
    for (const area of prototype.areas) {
        if (names.has(area.name)) {
            findings.push({ area: area.name, message: `Repeat area ${area.name} is declared more than once.`, repair: "Use one unique Excel name for each area." });
            continue;
        }
        names.add(area.name);
        if (area.type !== "repeat")
            continue;
        try {
            result.push({ area, rectangle: rectangle(area.range) });
        }
        catch {
            findings.push({ area: area.name, message: `Repeat area ${area.name} cannot be found.`, repair: `Select the intended Template cells and define the named area ${area.name}.` });
        }
    }
    for (let left = 0; left < result.length; left += 1)
        for (let right = left + 1; right < result.length; right += 1)
            if (crosses(result[left].rectangle, result[right].rectangle))
                findings.push({ area: result[left].area.name, message: `Repeat areas ${result[left].area.name} and ${result[right].area.name} cross.`, repair: "Resize the areas so they are separate or one fits completely inside the other." });
    for (const item of result) {
        const parent = result.filter(candidate => candidate !== item && contains(candidate.rectangle, item.rectangle)).sort((a, b) => areaSize(a.rectangle) - areaSize(b.rectangle))[0];
        if (parent)
            item.parent = parent;
    }
    return result;
}
export function validateExcelTemplatePrototype(prototype) {
    const findings = [];
    if (prototype.contractVersion !== 2)
        findings.push({ message: "Use guided Excel template contract 2.", repair: "Download guided starter." });
    const repeats = repeatAreas(prototype, findings);
    for (const item of repeats) {
        const available = item.parent ? nestedCollections[item.parent.area.source] ?? [] : rootCollections[prototype.kind];
        if (!available.includes(item.area.source))
            findings.push({ area: item.area.name, message: `${item.area.name} cannot repeat that data here.`, repair: `Choose a collection shown as available in the ${prototype.kind === "flow" ? "Flow" : prototype.kind} guide.` });
    }
    for (const area of prototype.areas.filter((item) => item.type === "image")) {
        let bounds;
        try {
            bounds = rectangle(area.range);
        }
        catch {
            findings.push({ area: area.name, message: `Image area ${area.name} cannot be found.`, repair: `Select the intended Template cells and define the named area ${area.name}.` });
            continue;
        }
        if (area.source === "page.visual.image") {
            const nearest = repeats.filter((item) => contains(item.rectangle, bounds)).sort((left, right) => areaSize(left.rectangle) - areaSize(right.rectangle))[0];
            const nestedOverlap = repeats.find((item) => item !== nearest && overlaps(item.rectangle, bounds));
            if (prototype.kind !== "flow" || nearest?.area.source !== "flow.pages" || nestedOverlap)
                findings.push({ area: area.name, message: `${area.name}'s nearest repeat owner must be flow.pages when using page.visual.image, with no nested repeat crossing or enclosed by the image area.`, repair: "Move the image area directly inside its owning Flow Page repeat, outside nested Event, concept, row, or cell repeats." });
        }
    }
    for (const merge of prototype.merges) {
        try {
            const bounds = rectangle(merge);
            for (const item of repeats)
                if (overlaps(bounds, item.rectangle) && !contains(item.rectangle, bounds))
                    findings.push({ area: item.area.name, message: `Merged range ${merge} crosses or encloses repeat area ${item.area.name}.`, repair: "Keep the merged cells wholly inside or outside the repeat area." });
        }
        catch {
            findings.push({ message: `Merged range ${merge} is invalid.` });
        }
    }
    const roots = new Set(templateBindingsFor(prototype.kind));
    for (const cell of prototype.cells)
        for (const path of placeholderPaths(String(cell.value))) {
            if (roots.has(path))
                continue;
            const point = coordinate(cell.address), owners = repeats.filter(item => pointInside(point, item.rectangle)).sort((a, b) => areaSize(a.rectangle) - areaSize(b.rectangle));
            const allowed = owners.some(owner => (itemPaths[owner.area.source] ?? []).includes(path));
            if (!allowed)
                findings.push({ cell: cell.address, message: `${cell.address} cannot use ${path} here.`, repair: `Put ${cell.address} inside a repeat of the collection that provides ${path} or choose a field shown as available here.` });
        }
    return { valid: findings.length === 0, findings };
}
const literal = (value) => typeof value === "number" || typeof value === "boolean" ? value : value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
const renderCell = (value, context) => { if (typeof value !== "string")
    return value; const matches = [...value.matchAll(/\{\{\s*([a-z][a-zA-Z0-9.]*)\s*\}\}/gu)]; if (matches.length === 1 && matches[0][0] === value)
    return literal(templateValueAt(context, matches[0][1])); return value.replace(/\{\{\s*([a-z][a-zA-Z0-9.]*)\s*\}\}/gu, (_match, path) => String(literal(templateValueAt(context, String(path))))); };
function repeatTree(items) { const nodes = new Map(items.map(item => [item, { item, children: [] }])); const roots = []; for (const item of items) {
    const node = nodes.get(item);
    if (item.parent)
        nodes.get(item.parent).children.push(node);
    else
        roots.push(node);
} return roots; }
function shiftedPoint(point, children) { let row = point.row, column = point.column; for (const { region, rendered } of children) {
    const bounds = region.item.rectangle, originalHeight = bounds.bottom - bounds.top + 1, originalWidth = bounds.right - bounds.left + 1;
    if (region.item.area.direction === "down" && point.row > bounds.bottom)
        row += rendered.height - originalHeight;
    if (region.item.area.direction === "across" && point.column > bounds.right)
        column += rendered.width - originalWidth;
} return { row, column }; }
function renderContainer(prototype, bounds, children, scope) {
    const childOutputs = children.map(region => ({ region, rendered: renderRepeat(prototype, region, scope) })), cells = [];
    for (const cell of prototype.cells) {
        const point = coordinate(cell.address);
        if (!pointInside(point, bounds) || children.some(({ item }) => pointInside(point, item.rectangle)))
            continue;
        const shifted = shiftedPoint(point, childOutputs);
        cells.push({ ...cell, address: address({ row: shifted.row - bounds.top + 1, column: shifted.column - bounds.left + 1 }), value: renderCell(cell.value, scope) });
    }
    for (const { region, rendered } of childOutputs) {
        const origin = shiftedPoint({ row: region.item.rectangle.top, column: region.item.rectangle.left }, childOutputs.filter(item => item.region !== region));
        for (const cell of rendered.cells) {
            const point = coordinate(cell.address);
            cells.push({ ...cell, address: address({ row: origin.row - bounds.top + point.row, column: origin.column - bounds.left + point.column }) });
        }
    }
    const originalHeight = bounds.bottom - bounds.top + 1, originalWidth = bounds.right - bounds.left + 1, height = originalHeight + childOutputs.filter(({ region }) => region.item.area.direction === "down").reduce((sum, { region, rendered }) => sum + rendered.height - (region.item.rectangle.bottom - region.item.rectangle.top + 1), 0), width = originalWidth + childOutputs.filter(({ region }) => region.item.area.direction === "across").reduce((sum, { region, rendered }) => sum + rendered.width - (region.item.rectangle.right - region.item.rectangle.left + 1), 0);
    return { cells, height, width };
}
function renderRepeat(prototype, region, scope) {
    const items = templateValueAt(scope, region.item.area.source);
    if (!Array.isArray(items))
        throw new Error(`Repeat area ${region.item.area.name} cannot use ${region.item.area.source} here.`);
    const prefix = itemRoot(region.item.area.source), copies = items.map(item => renderContainer(prototype, region.item.rectangle, region.children, { ...scope, [prefix]: item })), baseHeight = Math.max(0, ...copies.map(({ height }) => height)), baseWidth = Math.max(0, ...copies.map(({ width }) => width)), height = region.item.area.direction === "down" ? copies.reduce((sum, copy) => sum + copy.height, 0) : baseHeight, width = region.item.area.direction === "across" ? copies.reduce((sum, copy) => sum + copy.width, 0) : baseWidth;
    if (height > 1_048_576 || width > 16_384)
        throw new Error(`Repeat area ${region.item.area.name} requests ${items.length} copies and exceeds the Excel worksheet limit.`);
    const cells = [];
    let rowOffset = 0, columnOffset = 0;
    for (const copy of copies) {
        for (const cell of copy.cells) {
            const point = coordinate(cell.address);
            cells.push({ ...cell, address: address({ row: point.row + rowOffset, column: point.column + columnOffset }) });
        }
        if (region.item.area.direction === "down")
            rowOffset += copy.height;
        else
            columnOffset += copy.width;
    }
    return { cells, height, width };
}
export function renderExcelTemplateGrid(prototype, context) {
    const validation = validateExcelTemplatePrototype(prototype);
    if (!validation.valid)
        throw new Error(validation.findings.map(({ message }) => message).join("\n"));
    const repeats = repeatAreas(prototype, []), roots = repeatTree(repeats), sourceCells = prototype.cells.map(cell => ({ ...cell, sourceAddress: cell.sourceAddress ?? cell.address })), renderable = { ...prototype, cells: sourceCells }, points = sourceCells.map(({ address: cellAddress }) => coordinate(cellAddress)), bottom = Math.max(1, ...points.map(({ row }) => row), ...roots.map(({ item }) => item.rectangle.bottom)), right = Math.max(1, ...points.map(({ column }) => column), ...roots.map(({ item }) => item.rectangle.right)), rendered = renderContainer(renderable, { top: 1, left: 1, bottom, right }, roots, context);
    if (rendered.height > 1_048_576 || rendered.width > 16_384)
        throw new Error("Template expansion exceeds the Excel worksheet limit.");
    const merges = prototype.merges.flatMap(merge => { const bounds = rectangle(merge), members = rendered.cells.filter(cell => pointInside(coordinate(cell.sourceAddress ?? cell.address), bounds)), deltas = new Map(); for (const cell of members) {
        const target = coordinate(cell.address), source = coordinate(cell.sourceAddress ?? cell.address), delta = { row: target.row - source.row, column: target.column - source.column };
        deltas.set(`${delta.row}:${delta.column}`, delta);
    } return [...deltas.values()].map(delta => `${address({ row: bounds.top + delta.row, column: bounds.left + delta.column })}:${address({ row: bounds.bottom + delta.row, column: bounds.right + delta.column })}`); });
    return { worksheetName: safeWorksheetName(String(templateValueAt(context, "section.name") ?? prototype.worksheetName)), cells: rendered.cells.sort((left, right) => coordinate(left.address).row - coordinate(right.address).row || coordinate(left.address).column - coordinate(right.address).column), merges };
}
//# sourceMappingURL=excel-template.js.map