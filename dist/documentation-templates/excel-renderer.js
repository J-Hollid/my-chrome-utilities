import { selectProjectDocumentationTables } from "../data-layer-project-documentation-workspace.js";
import { fitProjectDocumentationLogo } from "../data-layer-project-documentation-records.js";
import { documentationTemplateAssignment } from "./template-library.js";
import { prepareDocumentationTemplateContext } from "./template-context.js";
import { parseExcelTemplateDirective, renderExcelTemplateGrid } from "./excel-template.js";
import { validateExcelTemplateWorkbook } from "./excel-workbook.js";
import { safeWorksheetName } from "./template-contract.js";
const excelJs = () => { const value = globalThis.ExcelJS; if (!value)
    throw new Error("The packaged Excel template renderer is unavailable."); return value; };
const noteText = (note) => typeof note === "string" ? note : note && typeof note === "object" && Array.isArray(note.texts) ? note.texts.map(({ text }) => String(text ?? "")).join("") : "";
const literalCellValue = (value) => typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : value == null ? "" : String(value);
const starterPrototype = (kind) => {
    const template = { cell: "A1", text: `tw:template(kind="${kind}" contract="1")` };
    if (kind === "overview")
        return { kind, contractVersion: 1, worksheetName: "Overview prototype", cells: [{ address: "A1", value: "{{section.name}}" }, { address: "A3", value: "{{field.label}}" }, { address: "B3", value: "{{field.value}}" }], directives: [template, { cell: "A3", text: 'tw:each(items="overview.fields" var="field" direction="down" lastCell="B3")' }], merges: [] };
    if (kind === "flow")
        return { kind, contractVersion: 1, worksheetName: "Flow prototype", cells: [{ address: "A1", value: "{{section.name}}" }, { address: "A3", value: "{{page.stepLabel}}" }, { address: "B3", value: "{{page.pageName}}" }, { address: "A5", value: "{{event.eventName}}" }], directives: [template, { cell: "A3", text: 'tw:each(items="flow.pages" var="page" direction="right" lastCell="D8")' }, { cell: "A5", text: 'tw:each(items="page.events" var="event" direction="down" lastCell="B5")' }], merges: [] };
    if (kind === "matrix")
        return { kind, contractVersion: 1, worksheetName: "Matrix prototype", cells: [{ address: "A1", value: "{{section.name}}" }, { address: "A3", value: "{{row.property}}" }, { address: "B3", value: "{{cell.value}}" }], directives: [template, { cell: "A3", text: 'tw:each(items="matrix.rows" var="row" direction="down" lastCell="C4")' }, { cell: "B3", text: 'tw:each(items="row.cells" var="cell" direction="right" lastCell="C3")' }], merges: [] };
    return { kind, contractVersion: 1, worksheetName: "Profile prototype", cells: [{ address: "A1", value: "{{section.name}}" }, { address: "A3", value: "{{concept.name}}" }, { address: "A4", value: "{{row.property}}" }, { address: "B4", value: "{{cell.value}}" }], directives: [template, { cell: "A3", text: 'tw:each(items="profile.concepts" var="concept" direction="down" lastCell="D6")' }, { cell: "A4", text: 'tw:each(items="concept.rows" var="row" direction="down" lastCell="D4")' }, { cell: "B4", text: 'tw:each(items="row.cells" var="cell" direction="right" lastCell="C4")' }], merges: [] };
};
export async function writeDocumentationTemplateStarter(kind) { const workbook = new (excelJs().Workbook)(), prototype = starterPrototype(kind), worksheet = workbook.addWorksheet(prototype.worksheetName); for (const cell of prototype.cells) {
    worksheet.getCell(cell.address).value = cell.value;
    worksheet.getCell(cell.address).style = { font: { name: "Arial", size: 11 }, alignment: { vertical: "top", wrapText: true } };
} for (const source of prototype.directives)
    worksheet.getCell(source.cell).note = source.text; worksheet.getColumn(1).width = 28; worksheet.getColumn(2).width = 34; return new Uint8Array(await workbook.xlsx.writeBuffer()); }
function prototypeFromWorksheet(worksheet, kind) {
    const cells = new Map(), directives = [];
    worksheet.eachRow({ includeEmpty: true }, row => row.eachCell({ includeEmpty: true }, cell => { const note = noteText(cell.note), directive = note.startsWith("tw:"); if (directive)
        directives.push({ cell: cell.address, text: note }); if (cell.value !== null && cell.value !== undefined || directive || Object.keys(cell.style).length)
        cells.set(cell.address, { address: cell.address, sourceAddress: cell.address, value: literalCellValue(cell.value), style: structuredClone(cell.style), ...(!directive && cell.note ? { note: structuredClone(cell.note) } : {}) }); }));
    const ensure = (address) => { if (!cells.has(address))
        cells.set(address, { address, sourceAddress: address, value: "", style: {} }); };
    for (const merge of worksheet.model?.merges ?? []) {
        const [start, end = start] = merge.split(":");
        ensure(start);
        ensure(end);
    }
    for (const image of worksheet.getImages?.() ?? []) {
        const start = rangePoint(image.range.tl), end = image.range.br ? rangePoint(image.range.br) : start;
        ensure(cellAddress(start.row, start.column));
        ensure(cellAddress(end.row, end.column));
    }
    return { kind, contractVersion: 1, worksheetName: worksheet.name, cells: [...cells.values()], directives, merges: [...(worksheet.model?.merges ?? [])] };
}
function fillBuiltIn(worksheet, table) { worksheet.getCell("A1").value = table.title; table.headings.forEach((value, index) => worksheet.getCell(`${String.fromCharCode(65 + index)}2`).value = value); table.rows.forEach((row, rowIndex) => row.forEach((value, columnIndex) => worksheet.getCell(`${String.fromCharCode(65 + columnIndex)}${rowIndex + 3}`).value = value)); }
const cellPoint = (address) => { const match = /^([A-Z]+)([1-9]\d*)$/u.exec(address); let column = 0; for (const value of match?.[1] ?? "")
    column = column * 26 + value.charCodeAt(0) - 64; return { row: Number(match?.[2] ?? 1), column }; };
const cellAddress = (row, column) => { let letters = "", value = column; while (value > 0) {
    value -= 1;
    letters = String.fromCharCode(65 + value % 26) + letters;
    value = Math.floor(value / 26);
} return `${letters}${row}`; };
const rangePoint = (value) => ({ row: (value.nativeRow ?? value.row ?? 0) + 1, column: (value.nativeCol ?? value.col ?? 0) + 1 });
const logoImage = (logo) => { if (typeof logo !== "string")
    return undefined; const match = /^data:image\/(png|jpeg|gif);base64,/iu.exec(logo); return match ? { base64: logo, extension: match[1].toLowerCase() } : undefined; };
const logoDimensions = (logo) => { const encoded = logo.slice(logo.indexOf(",") + 1), bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0)); if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes.length >= 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
} if (bytes[0] === 0x47 && bytes.length >= 10) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
} if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    for (let offset = 2; offset + 8 < bytes.length;) {
        if (bytes[offset] !== 0xff) {
            offset += 1;
            continue;
        }
        const marker = bytes[offset + 1], length = (bytes[offset + 2] << 8) + bytes[offset + 3];
        if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf))
            return { height: (bytes[offset + 5] << 8) + bytes[offset + 6], width: (bytes[offset + 7] << 8) + bytes[offset + 8] };
        if (length < 2)
            break;
        offset += 2 + length;
    }
} return undefined; };
const rectanglePixels = (sheet, start, end) => { let width = 0, height = 0; for (let column = start.column; column <= end.column; column += 1)
    width += (sheet.getColumn(column).width ?? 8.43) * 7; for (let row = start.row; row <= end.row; row += 1)
    height += (sheet.getRow(row).height ?? 15) * 4 / 3; return { width, height }; };
function copyImages(source, sourceSheet, targetBook, targetSheet, rendered, prototype, context) {
    if (!targetBook.addImage || !targetSheet.addImage)
        return;
    for (const image of sourceSheet.getImages?.() ?? []) {
        const data = source.getImage?.(image.imageId);
        if (!data)
            continue;
        const start = rangePoint(image.range.tl), end = image.range.br ? rangePoint(image.range.br) : start, members = rendered.cells.filter(cell => { const point = cellPoint(cell.sourceAddress ?? cell.address); return point.row >= start.row && point.row <= end.row && point.column >= start.column && point.column <= end.column; }), deltas = new Map();
        for (const cell of members) {
            const from = cellPoint(cell.sourceAddress ?? cell.address), to = cellPoint(cell.address), delta = { row: to.row - from.row, column: to.column - from.column };
            deltas.set(`${delta.row}:${delta.column}`, delta);
        }
        for (const delta of deltas.values())
            targetSheet.addImage(targetBook.addImage(data), { tl: { row: start.row - 1 + delta.row, col: start.column - 1 + delta.column }, br: { row: end.row + delta.row, col: end.column + delta.column }, editAs: "oneCell" });
    }
    const logoValue = context.theme?.logo, logo = logoImage(logoValue);
    if (!logo || typeof logoValue !== "string")
        return;
    const intrinsic = logoDimensions(logoValue);
    if (!intrinsic)
        return;
    const logoId = targetBook.addImage(logo);
    for (const sourceDirective of prototype.directives) {
        const directive = parseExcelTemplateDirective(sourceDirective.text);
        if (directive.kind !== "image")
            continue;
        const start = cellPoint(sourceDirective.cell), end = cellPoint(directive.lastCell), bounds = rectanglePixels(sourceSheet, start, end), fitted = fitProjectDocumentationLogo(intrinsic.width, intrinsic.height, bounds.width, bounds.height);
        for (const cell of rendered.cells.filter(item => item.sourceAddress === sourceDirective.cell)) {
            const target = cellPoint(cell.address);
            targetSheet.addImage(logoId, { tl: { row: target.row - 1, col: target.column - 1 }, ext: fitted, editAs: "oneCell" });
        }
    }
}
async function renderCustomInto(output, body, snapshot, table, worksheetName) { const section = snapshot.set.sections.find(({ id }) => id === table.id); const validation = await validateExcelTemplateWorkbook(body, section.kind); if (!validation.valid)
    throw new Error(validation.findings.map(({ location, message }) => `${location}: ${message}`).join("\n")); const source = new (excelJs().Workbook)(); await source.xlsx.load(await body.arrayBuffer()); const worksheet = source.worksheets[0], prototype = prototypeFromWorksheet(worksheet, section.kind), context = prepareDocumentationTemplateContext(snapshot, table.id), rendered = renderExcelTemplateGrid(prototype, context), target = output.addWorksheet(worksheetName); for (const cell of rendered.cells) {
    const destination = target.getCell(cell.address), sourcePoint = cellPoint(cell.sourceAddress ?? cell.address), targetPoint = cellPoint(cell.address);
    destination.value = cell.value;
    destination.style = structuredClone(cell.style ?? {});
    if (cell.note)
        destination.note = structuredClone(cell.note);
    const sourceRow = worksheet.getRow(sourcePoint.row);
    if (sourceRow.height !== undefined)
        target.getRow(targetPoint.row).height = sourceRow.height;
    const sourceColumn = worksheet.getColumn(sourcePoint.column), targetColumn = target.getColumn(targetPoint.column);
    if (sourceColumn.width !== undefined)
        targetColumn.width = sourceColumn.width;
    if (sourceColumn.hidden !== undefined)
        targetColumn.hidden = sourceColumn.hidden;
    if (sourceColumn.outlineLevel !== undefined)
        targetColumn.outlineLevel = sourceColumn.outlineLevel;
} for (const merge of rendered.merges)
    target.mergeCells(merge); target.pageSetup = structuredClone(worksheet.pageSetup); target.headerFooter = structuredClone(worksheet.headerFooter); copyImages(source, worksheet, output, target, rendered, prototype, context); }
const uniqueWorksheetName = (raw, used) => { const base = safeWorksheetName(raw); let value = base, sequence = 1; while (used.has(value.toLocaleLowerCase())) {
    sequence += 1;
    const suffix = ` (${sequence})`;
    value = `${base.slice(0, 31 - suffix.length)}${suffix}`;
} used.add(value.toLocaleLowerCase()); return value; };
export async function writeProjectDocumentationWorkbookWithTemplates(snapshot, selection, readBody) {
    if (snapshot.incomplete && !selection.confirmIncomplete)
        throw new Error("Confirm incomplete documentation before export.");
    const tables = selectProjectDocumentationTables(snapshot, selection);
    if (!tables.length)
        throw new Error("Choose at least one documentation section.");
    const templates = new Map((snapshot.templates ?? []).map(template => [template.id, template])), output = new (excelJs().Workbook)(), usedNames = new Set();
    for (const table of tables) {
        const section = snapshot.set.sections.find(({ id }) => id === table.id), assigned = documentationTemplateAssignment(snapshot.set, "excel", section.kind), worksheetName = uniqueWorksheetName(section.name, usedNames);
        if (assigned === "builtin") {
            fillBuiltIn(output.addWorksheet(worksheetName), table);
            continue;
        }
        const template = templates.get(assigned);
        if (!template || template.format !== "excel" || template.kind !== section.kind || !template.validation.valid || !template.body)
            throw new Error(`${section.name} Excel template is unavailable or invalid. Open Templates to repair it.`);
        await renderCustomInto(output, await readBody(template.body.digest), snapshot, table, worksheetName);
    }
    return new Uint8Array(await output.xlsx.writeBuffer());
}
//# sourceMappingURL=excel-renderer.js.map