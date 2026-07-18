import { transactProject } from "./data-layer-specification-project.js";
const supported = new Set(["string", "number", "boolean", "object", "array"]);
function flattenSchema(document, path = "") { const rows = []; for (const [name, property] of Object.entries(document?.properties ?? {})) {
    const child = `${path}/${name}`, required = (document.required ?? []).includes(name);
    if (property.type === "object" && property.properties)
        rows.push(...flattenSchema(property, child));
    else
        rows.push({ path: child, type: property.type ?? "string", required, ...(property.enum ? { allowedValues: property.enum } : {}), ...(property.description ? { description: property.description } : {}), ...(property.examples ? { examples: property.examples } : {}) });
} return rows; }
function delimited(source, delimiter) { const lines = source.split(/\r?\n/).filter(Boolean), header = lines[0]?.toLowerCase().includes("path") ? lines.shift().split(delimiter).map((field) => field.trim()) : ["path", "type", "required"]; return lines.map((line) => { const values = line.split(delimiter).map((value) => value.trim()), record = Object.fromEntries(header.map((field, index) => [field, values[index] ?? ""])); return { path: String(record.path ?? ""), type: String(record.type || "string"), required: /^(true|required|yes)$/i.test(String(record.required ?? "")), ...(record.allowedvalues ? { allowedValues: record.allowedvalues.split("|") } : {}) }; }); }
export function stageBulkRequirements(format, source) { let requirements = []; if (format === "json")
    requirements = JSON.parse(source);
else if (format === "json-schema")
    requirements = flattenSchema(JSON.parse(source));
else if (format === "csv")
    requirements = delimited(source, ",");
else if (format === "paste")
    requirements = delimited(source, "\t");
else
    requirements = Array.from({ length: 100 }, (_, index) => ({ path: `/property_${index + 1}`, type: "string" })); const rows = requirements.map((requirement, index) => ({ ...structuredClone(requirement), id: `staged:${index + 1}`, selected: false })), errors = rows.flatMap((row) => [...(!row.path.startsWith("/") ? [{ rowId: row.id, field: "path", message: "Use a canonical /path" }] : []), ...(!supported.has(row.type ?? "") ? [{ rowId: row.id, field: "type", message: "Choose a supported type" }] : [])]); return { format, rows, errors, source }; }
export function applyStagedBulkAction(staged, rowIds, update) { const selected = new Set(rowIds); return { ...staged, rows: staged.rows.map((row) => selected.has(row.id) ? { ...row, ...structuredClone(update), selected: true } : row) }; }
export function windowStagedBulkRows(staged, range) { return staged.rows.slice(Math.max(0, range.offset), Math.max(0, range.offset) + Math.max(0, range.limit)); }
export function commitStagedBulkRequirements(state, profileId, staged) { if (staged.errors.length)
    throw new Error(`Repair ${staged.errors.length} staged fields before commit.`); return transactProject(state, `Commit ${staged.rows.length} staged requirements`, (project) => ({ ...project, collections: { ...project.collections, profiles: project.collections.profiles.map((profile) => profile.id === profileId ? { ...profile, requirements: [...profile.requirements, ...staged.rows.map(({ id: selectedId, selected, ...requirement }) => requirement)] } : profile) } })); }
//# sourceMappingURL=data-layer-specification-bulk.js.map