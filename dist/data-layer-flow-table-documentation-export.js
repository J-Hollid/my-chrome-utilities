const deepFreeze = (value) => { if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value))
        deepFreeze(child);
} return value; };
const contextName = (context) => `${context.pageName} / ${context.eventName}`;
const displayPath = (path) => path.split("/").filter(Boolean).join(".").replaceAll(".*", "[]");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
export function compileFlowDocumentationSnapshot(input) {
    const copy = structuredClone(input), diagnostics = copy.contexts.flatMap((context) => [...(context.unresolved ?? []).map(({ path, issue, repair }) => ({ contextId: context.id, contextName: contextName(context), path, issue, repair })), ...context.compiled.conflicts.map((conflict) => ({ contextId: context.id, contextName: contextName(context), path: conflict.path, issue: conflict.message, repair: `Open effective property ${conflict.path} for ${contextName(context)}` }))]);
    const incomplete = diagnostics.length > 0, source = incomplete ? "Draft — incomplete" : copy.sourceState === "draft" ? "Draft" : "Published";
    return deepFreeze({ ...copy, title: `${copy.flowName} · ${source}`, incomplete, diagnostics });
}
function conditionText(condition) {
    if (condition.kind === "predicate") {
        const operator = String(condition.operator ?? "Equals"), renderedOperator = operator.toLowerCase() === "exists" ? "exists" : operator;
        return `${String(condition.field ?? condition.propertyId ?? "property")} ${renderedOperator} ${String(condition.value ?? "")}`.trim();
    }
    const children = condition.children ?? [], join = condition.kind === "any" ? " or " : " and ";
    return children.map(conditionText).join(join);
}
function expectedText(property) {
    if (property.presence === "forbidden")
        return "Not expected";
    const exact = property.expectedValue !== undefined ? String(property.expectedValue) : property.allowedValues?.length ? property.allowedValues.map(String).join(" or ") : property.presence === "required" ? (property.condition ? "Required" : "Required value not specified") : "";
    return property.condition ? `${exact || property.presence || "Expected"} when ${conditionText(property.condition)}` : exact;
}
const conflictAt = (context, path) => context.compiled.conflicts.find((conflict) => conflict.path === path);
const paths = (snapshot) => [...new Set(snapshot.contexts.flatMap((context) => [...Object.keys(context.compiled.properties), ...context.compiled.conflicts.map(({ path }) => path), ...(context.unresolved ?? []).map(({ path }) => path)]))];
export const flowDocumentationPropertyPaths = (snapshot) => paths(snapshot);
const headings = (snapshot) => [snapshot.flowName, ...snapshot.contexts.map((context) => `Step ${context.stepLabel} ${contextName(context)}`)];
export function flowValueMapTable(snapshot) {
    return { title: snapshot.title, headings: headings(snapshot), rows: paths(snapshot).map((path) => [displayPath(path), ...snapshot.contexts.map((context) => conflictAt(context, path) ? "Blocked conflicting definitions" : context.compiled.properties[path] ? expectedText(context.compiled.properties[path]) : context.unresolved?.some((item) => item.path === path) ? "Incomplete" : "")]) };
}
function matrixMark(context, path) {
    if (conflictAt(context, path))
        return "!";
    if (context.unresolved?.some((item) => item.path === path))
        return "Incomplete";
    const property = context.compiled.properties[path];
    if (!property)
        return "—";
    if (property.presence === "forbidden")
        return "N";
    if (property.condition)
        return "C";
    if (property.presence === "required")
        return "M";
    return "O";
}
export function captureMatrixTable(snapshot) {
    return { title: snapshot.title, headings: headings(snapshot), rows: paths(snapshot).map((path) => [displayPath(path), ...snapshot.contexts.map((context) => matrixMark(context, path))]), legend: "M Mandatory · O Optional · C Conditional · N Not expected · — Not defined · ! Blocked" };
}
export function configureFlowDocumentationSnapshot(snapshot, configuration) {
    const byId = new Map(snapshot.contexts.map((context) => [context.id, context])), ordered = configuration.contextOrder ? configuration.contextOrder.flatMap((id) => byId.has(id) ? [byId.get(id)] : []) : snapshot.contexts;
    return deepFreeze({ ...structuredClone(snapshot), contexts: ordered.map((context) => ({ ...structuredClone(context), stepLabel: configuration.stepLabels?.[context.id]?.trim() || context.stepLabel })) });
}
export function orderFlowDocumentationOccurrenceIds(occurrences, relationships, pageGroupIds) {
    const occurrenceIds = new Set(occurrences.map(({ id }) => id)), parallelBySource = new Map(), mergeByTarget = new Map();
    for (const relationship of relationships) {
        const source = String(relationship.sourceNodeId ?? ""), target = String(relationship.targetNodeId ?? "");
        if (!occurrenceIds.has(source) || !occurrenceIds.has(target) || source === target)
            continue;
        const index = relationship.kind === "parallel" ? parallelBySource : relationship.kind === "merge" ? mergeByTarget : undefined;
        if (index)
            index.set(relationship.kind === "parallel" ? source : target, [...(index.get(relationship.kind === "parallel" ? source : target) ?? []), relationship.kind === "parallel" ? target : source]);
    }
    const candidates = [...parallelBySource].flatMap(([source, rawBranches]) => { const branches = [...new Set(rawBranches)]; if (branches.length !== 2)
        return []; return [...mergeByTarget].flatMap(([target, rawSources]) => { const sources = [...new Set(rawSources)]; return sources.length === 2 && branches.every((id) => sources.includes(id)) && source !== target ? [{ source, target, branches }] : []; }); });
    if (candidates.length !== 1)
        return { ids: occurrences.map(({ id }) => id), labels: {} };
    const { source, target, branches } = candidates[0], byId = new Map(occurrences.map((occurrence) => [occurrence.id, occurrence])), laneIndex = (id) => { const groupId = String(byId.get(id)?.pageGroupId ?? ""); const index = pageGroupIds.indexOf(groupId); return index < 0 ? Number.MAX_SAFE_INTEGER : index; }, orderedBranches = [...branches].sort((left, right) => laneIndex(left) - laneIndex(right) || left.localeCompare(right)), fork = [source, ...orderedBranches, target], remaining = occurrences.map(({ id }) => id).filter((id) => !fork.includes(id));
    return { ids: [...fork, ...remaining], labels: { [source]: "1", [orderedBranches[0]]: "2a", [orderedBranches[1]]: "2b", [target]: "3" } };
}
const metadataLabels = { description: "Description", type: "Type", allowedValues: "Allowed values", example: "Documented example", comments: "Comments", provenance: "Provenance" };
function metadataValue(snapshot, path, metadata) {
    const property = snapshot.contexts.map((context) => context.compiled.properties[path]).find(Boolean);
    if (!property)
        return "";
    if (metadata === "type")
        return property.type ?? "";
    if (metadata === "allowedValues")
        return property.allowedValues?.map(String).join(" or ") ?? "";
    if (metadata === "example")
        return property.examples?.map(String).join(" or ") ?? "";
    if (metadata === "provenance")
        return property.origins.map(({ contributorName, scope }) => `${contributorName} (${scope})`).join("; ");
    if (metadata === "description")
        return property.documentation ?? "";
    return String(property.comments ?? "");
}
export function configureFlowDocumentationTable(snapshot, kind, configuration = {}) {
    const source = kind === "values" ? flowValueMapTable(snapshot) : captureMatrixTable(snapshot), selected = configuration.selectedPaths ?? paths(snapshot), rowsByPath = new Map(source.rows.map((row) => [row[0], row])), metadata = configuration.metadata ?? [];
    const rows = selected.flatMap((path) => { const sourceRow = rowsByPath.get(displayPath(path)); if (!sourceRow)
        return []; return [[configuration.pathDisplay === "canonical" ? path : sourceRow[0], ...metadata.map((column) => metadataValue(snapshot, path, column)), ...sourceRow.slice(1)]]; });
    const contextHeadings = configuration.headingParts ? snapshot.contexts.map((context) => { const pageEvent = [configuration.headingParts.page ? context.pageName : "", configuration.headingParts.event ? context.eventName : ""].filter(Boolean).join(" / "), parts = [...(configuration.headingParts.step ? [`Step ${context.stepLabel}`] : []), ...(pageEvent ? [pageEvent] : [])]; return parts.join(" ") || "Context"; }) : source.headings.slice(1);
    return { ...source, headings: [source.headings[0], ...metadata.map((column) => metadataLabels[column]), ...contextHeadings], rows };
}
export function flowDocumentationCellDetail(snapshot, contextId, path) {
    const context = snapshot.contexts.find(({ id }) => id === contextId);
    if (!context)
        throw new Error(`Unknown documentation context ${contextId}`);
    const property = context.compiled.properties[path], conflict = conflictAt(context, path), unresolved = context.unresolved?.find((item) => item.path === path), origins = property?.origins ?? [];
    const propertyRule = property?.presence === "required" && property.expectedValue === undefined && !property.allowedValues?.length && !property.condition ? `${expectedText(property)} — missing documentation value` : property?.presence === "forbidden" ? `${expectedText(property)} — forbidden rule` : property ? expectedText(property) : undefined;
    return { summary: `${contextName(context)} · ${displayPath(path)}`, rule: conflict ? `Blocked — ${conflict.message}` : unresolved ? `Incomplete — ${unresolved.issue}` : propertyRule ?? "Incomplete — property is not resolved for this context", revision: `Effective revision ${context.effectiveRevision}`, provenance: conflict ? conflict.contributors.join("; ") : origins.map(({ contributorName, scope }) => `${contributorName} (${scope})`).join("; ") || "No contributing definition", repairs: conflict ? [`Open effective property ${path}`, ...conflict.contributors.map((name) => `Open contributing schema ${name}`)] : unresolved ? [unresolved.repair, `Open effective property ${path}`] : [`Open effective property ${path}`, ...origins.map(({ contributorName }) => `Open contributing schema ${contributorName}`)] };
}
const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("\n", "<br>");
const plainCell = (value) => { const safe = String(value ?? "").replace(/[\t\r\n]+/gu, " "); return /^[=+\-@]/u.test(safe) ? `'${safe}` : safe; };
export function renderFlowDocumentationClipboard(table, options = {}) {
    const include = options.includeHeadings !== false, titleRow = options.documentTitle ? [options.documentTitle, ...Array(Math.max(0, table.headings.length - 1)).fill("")] : undefined, rows = [...(titleRow ? [titleRow] : []), ...(include ? [table.headings] : []), ...table.rows, ...(table.legend ? [["Legend", table.legend, ...Array(Math.max(0, table.headings.length - 2)).fill("")]] : [])], cellStyle = options.style && options.style !== "plain" ? ' style="border:1px solid #666;padding:4px"' : "", headingStyle = options.style === "highlighted" ? ' style="border:1px solid #666;padding:4px;font-weight:bold;background:#eee"' : cellStyle;
    const html = `<table${options.style && options.style !== "plain" ? ' style="border-collapse:collapse"' : ""}>${options.documentTitle ? `<caption>${escapeHtml(options.documentTitle)}</caption>` : ""}${include ? `<thead><tr>${table.headings.map((value) => `<th${headingStyle}>${escapeHtml(value)}</th>`).join("")}</tr></thead>` : ""}<tbody>${[...table.rows, ...(table.legend ? [["Legend", table.legend, ...Array(Math.max(0, table.headings.length - 2)).fill("")]] : [])].map((row) => `<tr>${row.map((value) => `<td${cellStyle}>${escapeHtml(value)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    return { plain: rows.map((row) => row.map(plainCell).join("\t")).join("\n"), html };
}
export function flowDocumentationSnapshotStale(snapshot, current) {
    const changedContexts = snapshot.contexts.filter((context) => current.contextRevisions[context.id] !== context.effectiveRevision).map(contextName), graphChanged = current.graphRevision !== snapshot.graphRevision;
    return { stale: graphChanged || changedContexts.length > 0, changedContexts, graphChanged };
}
const xml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const columnName = (index) => { let value = ""; for (let current = index + 1; current; current = Math.floor((current - 1) / 26))
    value = String.fromCharCode(65 + (current - 1) % 26) + value; return value; };
function worksheet(table) { const rows = [[table.title, ...Array(Math.max(0, table.headings.length - 1)).fill("")], table.headings, ...table.rows], body = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => `<c r="${columnName(columnIndex)}${rowIndex + 1}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join("")}</row>`).join(""); return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`; }
const u16 = (value) => { const out = new Uint8Array(2); new DataView(out.buffer).setUint16(0, value, true); return out; }, u32 = (value) => { const out = new Uint8Array(4); new DataView(out.buffer).setUint32(0, value, true); return out; }, concat = (...parts) => { const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0)); let offset = 0; for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
} return out; };
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1)
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (bytes) => { let crc = 0xffffffff; for (const byte of bytes)
    crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0; };
function zip(files) { const encoder = new TextEncoder(), locals = [], centrals = []; let offset = 0; for (const file of files) {
    const name = encoder.encode(file.name), data = encoder.encode(file.content), crc = crc32(data), local = concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name), central = concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name);
    locals.push(local, data);
    centrals.push(central);
    offset += local.length + data.length;
} const directory = concat(...centrals); return concat(...locals, directory, u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(directory.length), u32(offset), u16(0)); }
export function writeFlowDocumentationWorkbook(snapshot, input) {
    const legend = { title: snapshot.title, headings: ["Symbol or context", "Meaning or provenance"], rows: [["M", "Mandatory"], ["O", "Optional"], ["C", "Conditional"], ["N", "Not expected"], ["—", "Not defined"], ["!", "Blocked"], ...snapshot.contexts.map((context) => [contextName(context), `effective revision ${context.effectiveRevision}; ${context.compiled.provenance.map(({ contributorName }) => contributorName).join(", ")}`])] }, diagnostics = { title: snapshot.title, headings: ["Source state", "Context", "Property", "Issue", "Repair", "Generated"], rows: snapshot.diagnostics.length ? snapshot.diagnostics.map((item) => [snapshot.incomplete ? "Draft — incomplete" : snapshot.sourceState, item.contextName, item.path, item.issue, item.repair, snapshot.generatedAt]) : [[snapshot.incomplete ? "Draft — incomplete" : snapshot.sourceState, "All selected contexts", "", "No export blockers", "", snapshot.generatedAt]] }, names = ["Flow values", "Capture matrix", "Legend and provenance", "Export diagnostics"], tables = [input.valueTable, input.matrixTable, legend, diagnostics];
    const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((name, index) => `<sheet name="${xml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets></workbook>`, relationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("")}</Relationships>`, rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`, types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${names.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`;
    return zip([{ name: "[Content_Types].xml", content: types }, { name: "_rels/.rels", content: rootRels }, { name: "xl/workbook.xml", content: workbook }, { name: "xl/_rels/workbook.xml.rels", content: relationships }, ...tables.map((table, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, content: worksheet(table) }))]);
}
//# sourceMappingURL=data-layer-flow-table-documentation-export.js.map