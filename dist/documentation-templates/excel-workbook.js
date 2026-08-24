import { safeFlowVisualArchivePath } from "../flow-visual-zip.js";
import { imageLayoutInArea, parseExcelAreaProperties, validateExcelTemplatePrototype } from "./excel-template.js";
const decoder = new TextDecoder();
const u16 = (bytes, offset) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(offset, true);
const u32 = (bytes, offset) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, true);
const xmlText = (value) => value.replace(/<[^>]*>/gu, "").replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
async function directory(source) {
    const tailOffset = Math.max(0, source.size - 65_557), tail = new Uint8Array(await source.slice(tailOffset).arrayBuffer());
    let end = -1;
    for (let index = tail.length - 22; index >= 0; index -= 1)
        if (u32(tail, index) === 0x06054b50) {
            end = index;
            break;
        }
    if (end < 0)
        throw new DOMException("Choose a valid unencrypted .xlsx.", "DataError");
    const count = u16(tail, end + 10), directorySize = u32(tail, end + 12), directoryOffset = u32(tail, end + 16);
    if (count > 2_000)
        throw new DOMException("The workbook has too many parts.", "QuotaExceededError");
    if (directoryOffset + directorySize > source.size)
        throw new DOMException("The workbook package is unsafe.", "DataError");
    const bytes = new Uint8Array(await source.slice(directoryOffset, directoryOffset + directorySize).arrayBuffer()), entries = [], names = new Set();
    let cursor = 0, total = 0;
    while (cursor < bytes.length) {
        if (cursor + 46 > bytes.length || u32(bytes, cursor) !== 0x02014b50)
            throw new DOMException("Choose a valid unencrypted .xlsx.", "DataError");
        const flags = u16(bytes, cursor + 8), method = u16(bytes, cursor + 10), compressed = u32(bytes, cursor + 20), size = u32(bytes, cursor + 24), nameLength = u16(bytes, cursor + 28), extraLength = u16(bytes, cursor + 30), commentLength = u16(bytes, cursor + 32), offset = u32(bytes, cursor + 42), name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength)), safeName = name.endsWith("/") ? name.slice(0, -1) : name;
        if (!safeName || !safeFlowVisualArchivePath(safeName) || names.has(name))
            throw new DOMException("The workbook package is unsafe.", "DataError");
        if (flags & 1)
            throw new DOMException("Choose a valid unencrypted .xlsx.", "DataError");
        if (method !== 0 && method !== 8)
            throw new DOMException(`Unsupported workbook compression in ${name}.`, "NotSupportedError");
        names.add(name);
        total += size;
        if (total > 50 * 1024 * 1024)
            throw new DOMException("The workbook expands beyond 50 MiB.", "QuotaExceededError");
        entries.push({ name, method, compressed, size, offset, flags });
        cursor += 46 + nameLength + extraLength + commentLength;
    }
    if (entries.length !== count)
        throw new DOMException("Choose a valid unencrypted .xlsx.", "DataError");
    return entries;
}
async function entryBody(source, entry) { const header = new Uint8Array(await source.slice(entry.offset, entry.offset + 30).arrayBuffer()); if (header.length !== 30 || u32(header, 0) !== 0x04034b50)
    throw new DOMException(`Workbook part ${entry.name} is broken.`, "DataError"); if ((u16(header, 6) & 1) !== 0)
    throw new DOMException("Choose a valid unencrypted .xlsx.", "DataError"); const start = entry.offset + 30 + u16(header, 26) + u16(header, 28), compressed = source.slice(start, start + entry.compressed); if (start + entry.compressed > source.size)
    throw new DOMException(`Workbook part ${entry.name} is broken.`, "DataError"); if (entry.method === 0) {
    const bytes = new Uint8Array(await compressed.arrayBuffer());
    if (bytes.length !== entry.size)
        throw new DOMException(`Workbook part ${entry.name} has an invalid declared size.`, "DataError");
    return bytes;
} const Constructor = DecompressionStream, reader = compressed.stream().pipeThrough(new Constructor("deflate-raw")).getReader(), chunks = []; let length = 0; for (;;) {
    const { done, value } = await reader.read();
    if (done)
        break;
    length += value.byteLength;
    if (length > entry.size || length > 50 * 1024 * 1024) {
        await reader.cancel();
        throw new DOMException(`Workbook part ${entry.name} exceeds its declared size.`, "DataError");
    }
    chunks.push(value);
} if (length !== entry.size)
    throw new DOMException(`Workbook part ${entry.name} has an invalid declared size.`, "DataError"); const bytes = new Uint8Array(length); let cursor = 0; for (const chunk of chunks) {
    bytes.set(chunk, cursor);
    cursor += chunk.length;
} return bytes; }
const attributes = (source) => Object.fromEntries([...source.matchAll(/([A-Za-z:]+)=["']([^"']*)["']/gu)].map(([, key, value]) => [key, value]));
const relationshipOwner = (name) => name === "_rels/.rels" ? "" : name.replace(/(^|\/)_rels\/([^/]+)\.rels$/u, "$1$2");
const internalTarget = (relationshipName, target) => { if (target.startsWith("/"))
    return target.slice(1); const owner = relationshipOwner(relationshipName), base = owner.includes("/") ? owner.slice(0, owner.lastIndexOf("/") + 1) : "", segments = `${base}${target}`.split("/"), normal = []; for (const segment of segments) {
    if (!segment || segment === ".")
        continue;
    if (segment === "..") {
        if (!normal.length)
            return undefined;
        normal.pop();
    }
    else
        normal.push(segment);
} const value = normal.join("/"); return safeFlowVisualArchivePath(value) ? value : undefined; };
const printerSettingsContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.printerSettings";
const printerSettingsRelationshipType = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/printerSettings";
const packageRelationships = (texts) => [...texts].flatMap(([part, text]) => part.endsWith(".rels") ? [...text.matchAll(/<Relationship\b([^>]*)\/?>(?:<\/Relationship>)?/gu)].map((match) => { const value = attributes(match[1]), external = value.TargetMode?.toLowerCase() === "external"; return { part, id: value.Id, type: value.Type, target: value.Target, targetPart: !external && value.Target ? internalTarget(part, value.Target) : undefined, external }; }) : []);
const packageContentTypes = (text) => { const defaults = new Map(), overrides = new Map(); for (const match of text.matchAll(/<(Default|Override)\b([^>]*)\/?>(?:<\/(?:Default|Override)>)?/gu)) {
    const value = attributes(match[2]);
    if (match[1] === "Default" && value.Extension && value.ContentType)
        defaults.set(value.Extension.toLowerCase(), value.ContentType);
    if (match[1] === "Override" && value.PartName && value.ContentType)
        overrides.set(value.PartName.replace(/^\//u, ""), value.ContentType);
} return { defaults, overrides }; };
const contentTypeFor = (name, contentTypes) => contentTypes.overrides.get(name) ?? contentTypes.defaults.get(name.split(".").at(-1)?.toLowerCase() ?? "");
const validPrinterSettingsParts = (entries, texts, sheetNames) => {
    const contentTypes = packageContentTypes(texts.get("[Content_Types].xml") ?? ""), relationships = packageRelationships(texts), valid = new Set();
    for (const { name } of entries) {
        if (!/^xl\/printerSettings\/printerSettings\d+\.bin$/u.test(name) || contentTypeFor(name, contentTypes) !== printerSettingsContentType)
            continue;
        const inbound = relationships.filter(({ external, targetPart }) => !external && targetPart === name), printerRelationships = inbound.filter(({ type }) => type === printerSettingsRelationshipType);
        if (inbound.length === 1 && printerRelationships.length === 1 && ["Template", "Template Guide"].includes(sheetNames.get(relationshipOwner(printerRelationships[0].part)) ?? ""))
            valid.add(name);
    }
    return valid;
};
const activeContentRule = "Guided templates cannot contain formulas or external workbook connections.";
const activeContentRepair = "Replace formulas with literal text and remove active or external workbook content.";
const sheetNamesByPart = (texts) => { const result = new Map(), workbook = texts.get("xl/workbook.xml") ?? "", relationships = texts.get("xl/_rels/workbook.xml.rels") ?? "", targets = new Map(); for (const match of relationships.matchAll(/<Relationship\b([^>]*)\/?>(?:<\/Relationship>)?/gu)) {
    const value = attributes(match[1]);
    if (value.Id && value.Target) {
        const target = internalTarget("xl/_rels/workbook.xml.rels", value.Target);
        if (target)
            targets.set(value.Id, target);
    }
} for (const match of workbook.matchAll(/<sheet\b([^>]*)\/?>(?:<\/sheet>)?/gu)) {
    const value = attributes(match[1]), target = value["r:id"] && targets.get(value["r:id"]);
    if (target && value.name)
        result.set(target, xmlText(value.name));
} return result; };
const formulaCells = (text) => [...text.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/gu)].filter(([, , body]) => /<f(?:\s|>)/u.test(body ?? "")).map(([, raw]) => attributes(raw).r).filter((value) => Boolean(value));
const excelJs = () => { const value = globalThis.ExcelJS; if (!value)
    throw new Error("The packaged Excel template parser is unavailable."); return value; };
const cellValue = (value) => typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : value == null ? "" : String(value);
const tableRows = (sheet, name, columns) => { let table; try {
    table = sheet.getTable(name);
}
catch {
    throw new Error(`Template Guide must contain Excel table ${name}.`);
} const actual = table.table.columns.map(({ name: column }) => column); if (JSON.stringify(actual) !== JSON.stringify(columns))
    throw new Error(`${name} must have columns ${columns.join(", ")}.`); if (table.table.rows)
    return table.table.rows; const ref = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/u.exec(table.table.tableRef ?? ""); if (!ref)
    return []; const columnNumber = (letters) => [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0), left = columnNumber(ref[1]), right = columnNumber(ref[3]), top = Number(ref[2]), bottom = Number(ref[4]), rows = []; for (let row = top + 1; row <= bottom; row += 1)
    rows.push(Array.from({ length: right - left + 1 }, (_, offset) => sheet.getCell(row, left + offset).value)); return rows; };
const normalizeRange = (raw) => { const match = /^'?Template'?!(\$?[A-Z]+\$?[1-9]\d*(?::\$?[A-Z]+\$?[1-9]\d*)?)$/u.exec(raw); return match?.[1]?.replaceAll("$", ""); };
const workbookPrototype = (workbook, expectedKind) => {
    const findings = [], template = workbook.worksheets.find(({ name }) => name === "Template"), guide = workbook.worksheets.find(({ name }) => name === "Template Guide");
    if (!template)
        findings.push({ location: "workbook", message: "Template worksheet cannot be found. Download guided starter." });
    if (!guide)
        findings.push({ location: "workbook", message: "Template Guide worksheet cannot be found. Download guided starter." });
    if (!template || !guide)
        return { findings };
    if (guide.state === "hidden" || guide.state === "veryHidden")
        findings.push({ location: "Template Guide", message: "Template Guide must remain visible." });
    let settings = [], areaRows = [];
    try {
        settings = tableRows(guide, "TemplateSettings", ["Setting", "Value"]);
    }
    catch (error) {
        findings.push({ location: "Template Guide", message: error.message });
    }
    const values = new Map(settings.map(row => [String(row[0] ?? "").trim(), String(row[1] ?? "").trim()])), contract = values.get("Contract"), kind = values.get("Kind");
    if (contract !== "2" && contract !== "3")
        findings.push({ location: "TemplateSettings", message: "Contract must be 2 or 3. Download guided starter." });
    try {
        areaRows = tableRows(guide, "TemplateAreas", contract === "3" ? ["Area", "Type", "Source", "Direction", "Properties"] : ["Area", "Type", "Source", "Direction"]);
    }
    catch (error) {
        findings.push({ location: "Template Guide", message: error.message });
    }
    if (!kind || !["overview", "flow", "matrix", "profile"].includes(kind))
        findings.push({ location: "TemplateSettings", message: "Kind must be overview, flow, matrix, or profile." });
    if (kind && expectedKind && kind !== expectedKind)
        findings.push({ location: "TemplateSettings", message: `The workbook declares ${kind}, not ${expectedKind}.` });
    const names = new Map((workbook.definedNames.model ?? []).map(item => [item.name.toLocaleLowerCase("en-US"), item.ranges.map(normalizeRange).filter((range) => Boolean(range))]));
    const areas = [];
    for (const row of areaRows) {
        const name = String(row[0] ?? "").trim(), type = String(row[1] ?? "").trim().toLowerCase(), source = String(row[2] ?? "").trim(), direction = String(row[3] ?? "").trim().toLowerCase(), rawProperties = contract === "3" ? String(row[4] ?? "") : "", ranges = names.get(name.toLocaleLowerCase("en-US")) ?? [];
        if (!name)
            continue;
        if (ranges.length !== 1) {
            findings.push({ location: `named area ${name}`, message: `${type === "output" ? "Output" : "Repeat"} area ${name} cannot be found. Select the intended Template cells and define the named area ${name}.` });
            continue;
        }
        try {
            if (type === "repeat" && (direction === "across" || direction === "down")) {
                const parsed = parseExcelAreaProperties("repeat", rawProperties), separatorName = parsed.separatorAreaName, separatorRanges = separatorName ? names.get(separatorName.toLocaleLowerCase("en-US")) ?? [] : [];
                if (separatorName && separatorRanges.length !== 1)
                    throw new Error(`separator area ${separatorName} cannot be found. Define ${separatorName} or correct the Properties value.`);
                areas.push({ name, type: "repeat", source, direction, range: ranges[0], ...(separatorName ? { properties: { separatorArea: { name: separatorName, range: separatorRanges[0] } } } : {}) });
            }
            else if (type === "image" && (source === "theme.logo" || source === "page.visual.image") && !direction)
                areas.push({ name, type: "image", source, range: ranges[0], ...(contract === "3" ? { properties: parseExcelAreaProperties("image", rawProperties) } : {}) });
            else if (type === "output" && contract === "3") {
                if (source || direction)
                    throw new Error("Output Source and Direction must be blank. Clear Source and Direction.");
                areas.push({ name, type: "output", source: "", range: ranges[0], properties: parseExcelAreaProperties("output", rawProperties) });
            }
            else
                findings.push({ location: `TemplateAreas ${name}`, message: type === "repeat" ? `${name} needs Direction Across or Down.` : `${name} must use supported Type Repeat, Image, or Output.` });
        }
        catch (error) {
            findings.push({ location: type === "output" && /Source and Direction/u.test(String(error)) ? `TemplateAreas ${name}` : `TemplateAreas ${name} Properties`, message: `${name} ${error instanceof Error ? error.message : String(error)}` });
        }
    }
    const cells = [];
    template.eachRow({ includeEmpty: true }, row => row.eachCell({ includeEmpty: true }, cell => { if (cell.value !== null && cell.value !== undefined || Object.keys(cell.style).length)
        cells.push({ address: cell.address, value: cellValue(cell.value), style: structuredClone(cell.style) }); }));
    if (!kind || contract !== "2" && contract !== "3")
        return { findings };
    const prototype = { kind, contractVersion: Number(contract), worksheetName: "Template", cells, areas, merges: [...(template.model?.merges ?? [])] }, geometry = validateExcelTemplatePrototype(prototype);
    for (const finding of geometry.findings)
        findings.push({ location: finding.cell ? `Template ${finding.cell}` : `TemplateAreas ${finding.area ?? "setup"} Properties`, message: finding.message, rule: "Bindings, merges, named areas, and Properties must remain within a compatible template scope.", ...(finding.repair ? { repair: finding.repair } : {}), technical: JSON.stringify(finding) });
    const imageStart = (point) => ({ row: Math.floor(point.nativeRow ?? point.row ?? 0) + 1, column: Math.floor(point.nativeCol ?? point.col ?? 0) + 1 }), exclusiveEnd = (native, offset, fallback) => native === undefined ? Math.max(1, Math.ceil(fallback ?? 0)) : Math.max(1, native + ((offset ?? 0) > 0 ? 1 : 0)), imageEnd = (point) => ({ row: exclusiveEnd(point.nativeRow, point.nativeRowOff, point.row), column: exclusiveEnd(point.nativeCol, point.nativeColOff, point.col) }), output = areas.find((area) => area.type === "output"), outputBounds = output ? bounds(output.range) : undefined;
    for (const image of template.getImages?.() ?? []) {
        const start = imageStart(image.range.tl), end = image.range.br ? imageEnd(image.range.br) : start;
        if (output && outputBounds && !(start.row >= outputBounds.top && start.column >= outputBounds.left && end.row <= outputBounds.bottom && end.column <= outputBounds.right))
            findings.push({ location: `TemplateAreas ${output.name} Properties`, message: `${output.name} does not contain all generated output.`, repair: `Resize ${output.name} to contain the Template drawing.` });
    }
    for (const area of areas) {
        if (area.type === "image" && area.properties) {
            const range = bounds(area.range);
            let width = 0, height = 0;
            for (let column = range.left; column <= range.right; column += 1)
                width += (template.getColumn(column).width ?? 8.43) * 7;
            for (let row = range.top; row <= range.bottom; row += 1)
                height += (template.getRow(row).height ?? 15) * 4 / 3;
            try {
                imageLayoutInArea({ width, height }, { width: 1, height: 1 }, area.properties);
            }
            catch {
                findings.push({ location: `TemplateAreas ${area.name} Properties`, message: `${area.name} padding leaves no room for its image.`, repair: `Reduce padding or enlarge ${area.name}.` });
            }
        }
        if (area.type === "repeat" && area.properties?.separatorArea) {
            const separator = bounds(area.properties.separatorArea.range), containsDrawing = (template.getImages?.() ?? []).some(({ range }) => { const start = imageStart(range.tl), end = range.br ? imageEnd(range.br) : start; return start.row <= separator.bottom && end.row >= separator.top && start.column <= separator.right && end.column >= separator.left; });
            if (containsDrawing)
                findings.push({ location: `TemplateAreas ${area.name} Properties`, message: `${area.properties.separatorArea.name} contains unsupported template behavior.`, repair: "Keep only literal cells and presentation in the separator." });
        }
    }
    return { prototype, findings };
};
const itemPrefix = (source) => source.endsWith(".pages") ? "page" : source.endsWith(".events") ? "event" : source.endsWith(".cells") ? "cell" : source.endsWith(".concepts") ? "concept" : source.endsWith(".fields") ? "field" : "row";
const inspection = (prototype) => { if (!prototype)
    return { bindings: [], areas: [] }; const bindings = prototype.cells.flatMap(cell => [...String(cell.value).matchAll(/\{\{\s*([a-z][a-zA-Z0-9.]*)\s*\}\}/gu)].map(([, path]) => ({ cell: cell.address, path: path }))), areas = prototype.areas.map(area => { const parent = prototype.areas.filter(candidate => candidate.type === "repeat" && candidate.name !== area.name && containsRange(candidate.range, area.range)).sort((left, right) => rangeSize(left.range) - rangeSize(right.range))[0], properties = area.type === "image" ? (area.properties ? `fit: ${area.properties.fit}; position: ${area.properties.position.horizontal} ${area.properties.position.vertical}; padding: ${area.properties.padding.top}px ${area.properties.padding.right}px ${area.properties.padding.bottom}px ${area.properties.padding.left}px` : "implicit fit: scale-down; position: left top; padding: 0px") : area.type === "output" ? `background-fill: ${area.properties.backgroundFill}` : (area.properties?.separatorArea ? `separator-area: ${area.properties.separatorArea.name}` : prototype.contractVersion === 2 ? "implicit complete repeat area" : ""); return { name: area.name, type: area.type, source: area.source, ...(area.type === "repeat" ? { direction: area.direction, itemPrefix: itemPrefix(area.source) } : {}), range: area.range, properties, ...(parent ? { parent: parent.name } : {}) }; }); return { kind: prototype.kind, contractVersion: prototype.contractVersion, bindings, areas }; };
const bounds = (range) => { const points = range.split(":").map(value => { const match = /^([A-Z]+)(\d+)$/u.exec(value); let column = 0; for (const letter of match[1])
    column = column * 26 + letter.charCodeAt(0) - 64; return { row: Number(match[2]), column }; }); return { top: points[0].row, left: points[0].column, bottom: (points[1] ?? points[0]).row, right: (points[1] ?? points[0]).column }; };
const containsRange = (outer, inner) => { const left = bounds(outer), right = bounds(inner); return left.top <= right.top && left.left <= right.left && left.bottom >= right.bottom && left.right >= right.right; };
const rangeSize = (range) => { const value = bounds(range); return (value.bottom - value.top + 1) * (value.right - value.left + 1); };
export async function validateExcelTemplateWorkbook(source, expectedKind) {
    const findings = [];
    if (source.size > 10 * 1024 * 1024)
        return { valid: false, findings: [{ location: "workbook", message: "The Excel template is too large." }], entryCount: 0, unpackedBytes: 0, inspection: { bindings: [], areas: [] } };
    let entries;
    try {
        entries = await directory(source);
    }
    catch (error) {
        return { valid: false, findings: [{ location: "workbook", message: error instanceof Error ? error.message : String(error) }], entryCount: 0, unpackedBytes: 0, inspection: { bindings: [], areas: [] } };
    }
    const byName = new Map(entries.map(entry => [entry.name, entry])), required = ["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml"];
    for (const name of required)
        if (!byName.has(name))
            findings.push({ location: name, message: `The workbook is missing ${name}.` });
    const readable = entries.filter(({ name }) => /\.(?:xml|rels)$/u.test(name)), texts = new Map();
    for (const entry of readable)
        try {
            texts.set(entry.name, decoder.decode(await entryBody(source, entry)));
        }
        catch (error) {
            findings.push({ location: entry.name, message: error instanceof Error ? error.message : String(error) });
        }
    const sheetNames = sheetNamesByPart(texts), acceptedPrinterSettings = validPrinterSettingsParts(entries, texts, sheetNames), unsupported = /^(?:xl\/(?:externalLinks|connections|embeddings|charts|pivotTables|pivotCache|slicers|activeX|ctrlProps)|customXml|word|ppt)\//u;
    for (const { name } of entries)
        if (unsupported.test(name) || /vbaProject|activeX|oleObject|signature/iu.test(name) || /\.bin$/iu.test(name) && !acceptedPrinterSettings.has(name))
            findings.push({ location: name, message: "Use inert macro-free workbook content." });
    for (const [name, text] of texts) {
        for (const cell of formulaCells(text))
            findings.push({ location: `${sheetNames.get(name) ?? name} ${cell}`, message: `${cell} contains a formula or active workbook content. Remove workbook formulas.`, rule: activeContentRule, repair: activeContentRepair, technical: JSON.stringify({ part: name, cell }) });
        if (name.endsWith(".rels")) {
            for (const match of text.matchAll(/<Relationship\b([^>]*)\/?>(?:<\/Relationship>)?/gu)) {
                const attrs = attributes(match[1]), external = attrs.TargetMode?.toLowerCase() === "external";
                if (external) {
                    findings.push({ location: `${name} relationship ${attrs.Id ?? "(unnamed)"}`, message: "External workbook content cannot be used.", rule: activeContentRule, repair: activeContentRepair, technical: JSON.stringify({ part: name, relationship: attrs.Id ?? null, target: attrs.Target ?? null, type: attrs.Type ?? null }) });
                    continue;
                }
                const target = attrs.Target && internalTarget(name, attrs.Target);
                if (!target || !byName.has(target))
                    findings.push({ location: name, message: `Relationship ${attrs.Id ?? "(unnamed)"} has a broken target ${attrs.Target ?? ""}.` });
                if (attrs.Type === printerSettingsRelationshipType && (!target || !acceptedPrinterSettings.has(target)) || /(?:chart|pivot|slicer|connection|oleObject|control|externalLink)/iu.test(attrs.Type ?? "") || /\/package$/iu.test(attrs.Type ?? ""))
                    findings.push({ location: name, message: `Relationship ${attrs.Id ?? "(unnamed)"} uses unsupported workbook content.` });
            }
        }
        if (/xl\/drawings\/drawing\d*\.xml$/u.test(name) && /<xdr:(?:graphicFrame|sp|cxnSp|contentPart)\b/u.test(text))
            findings.push({ location: name, message: "Use only embedded PNG, JPEG, or GIF worksheet images." });
    }
    const contentTypes = texts.get("[Content_Types].xml") ?? "";
    if (/macroEnabled|vbaProject|activeX|oleObject|embeddedPackage|chart|pivot|slicer|addin/iu.test(contentTypes))
        findings.push({ location: "[Content_Types].xml", message: "Use inert macro-free workbook content." });
    for (const match of contentTypes.matchAll(/<(?:Default|Override)\b([^>]*)\/?>(?:<\/(?:Default|Override)>)?/gu)) {
        const attrs = attributes(match[1]);
        if (attrs.Extension && ["png", "jpg", "jpeg", "gif", "xml", "rels"].includes(attrs.Extension.toLowerCase()))
            continue;
        if (attrs.ContentType?.startsWith("image/") && !/[+\/]?(?:png|jpeg|gif)$/iu.test(attrs.ContentType))
            findings.push({ location: "[Content_Types].xml", message: `Unsupported embedded image content type ${attrs.ContentType}.` });
    }
    let prototype;
    if (findings.length === 0)
        try {
            const workbook = new (excelJs().Workbook)();
            await workbook.xlsx.load(await source.arrayBuffer());
            const parsed = workbookPrototype(workbook, expectedKind);
            prototype = parsed.prototype;
            findings.push(...parsed.findings);
        }
        catch (error) {
            findings.push({ location: "workbook", message: error instanceof Error ? error.message : String(error) });
        }
    const inspected = inspection(prototype);
    return { valid: findings.length === 0, ...(inspected.kind ? { kind: inspected.kind, contractVersion: inspected.contractVersion } : {}), findings, entryCount: entries.length, unpackedBytes: entries.reduce((sum, { size }) => sum + size, 0), inspection: inspected };
}
//# sourceMappingURL=excel-workbook.js.map