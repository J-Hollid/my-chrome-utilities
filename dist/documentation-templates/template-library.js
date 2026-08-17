import { projectDocumentationSafeText } from "../data-layer-project-documentation-records.js";
import { templateDigest } from "./template-contract.js";
const clone = (value) => structuredClone(value);
const assignmentKey = (format, kind) => `${format}:${kind}`;
const display = (format, kind) => `${format === "excel" ? "Excel" : "Rich page"} ${kind === "profile" ? "Site Profile" : kind[0].toUpperCase() + kind.slice(1)}`;
export function createDocumentationTemplate(input) {
    const value = { ...clone(input), id: projectDocumentationSafeText(input.id), name: projectDocumentationSafeText(input.name), contractVersion: 1, digest: input.body?.digest ?? templateDigest("rich", input.richBlocks ?? []) };
    if (!value.id)
        throw new Error("Documentation template needs a stable identity.");
    if (!value.name)
        throw new Error("Documentation template needs a name.");
    if (input.format === "excel" && !input.body)
        throw new Error("An Excel template needs one project-owned body.");
    if (input.format === "rich" && !input.richBlocks)
        throw new Error("A Rich page template needs a semantic block tree.");
    return value;
}
export function documentationTemplateAssignment(set, format, kind) { return set.templateAssignments?.[assignmentKey(format, kind)] ?? "builtin"; }
export function assignDocumentationTemplate(documentation, setId, format, kind, templateId) {
    if (templateId !== "builtin") {
        const template = documentation.templates?.find(({ id }) => id === templateId);
        if (!template || template.format !== format || template.kind !== kind || !template.validation.valid)
            throw new Error(`Choose a valid ${display(format, kind)} template.`);
    }
    let found = false;
    const sets = documentation.sets.map(set => { if (set.id !== setId)
        return clone(set); found = true; return { ...clone(set), templateAssignments: { ...(set.templateAssignments ?? {}), [assignmentKey(format, kind)]: templateId } }; });
    if (!found)
        throw new Error(`Unknown Documentation Set ${setId}.`);
    return { ...clone(documentation), sets };
}
export function replaceDocumentationTemplate(documentation, templateId, body) {
    let found = false;
    const templates = (documentation.templates ?? []).map(template => { if (template.id !== templateId)
        return clone(template); found = true; if (template.format !== "excel")
        throw new Error("Only an Excel template has a replaceable workbook body."); return { ...clone(template), body: clone(body), digest: body.digest }; });
    if (!found)
        throw new Error(`Unknown documentation template ${templateId}.`);
    return { ...clone(documentation), templates };
}
export function removeDocumentationTemplate(documentation, templateId) {
    const template = documentation.templates?.find(({ id }) => id === templateId);
    if (!template)
        throw new Error(`Unknown documentation template ${templateId}.`);
    const references = documentation.sets.flatMap(set => Object.entries(set.templateAssignments ?? {}).flatMap(([key, value]) => value === templateId ? [`${set.name} and ${display(key.split(":")[0], key.split(":")[1])}`] : []));
    if (references.length)
        throw new Error(`Assign Built-in or another template before removal; ${references.join(", ")} still uses ${template.name}.`);
    return { ...clone(documentation), templates: (documentation.templates ?? []).filter(({ id }) => id !== templateId).map(clone) };
}
export function snapshotTemplateDigests(documentation, set) {
    const templates = new Map((documentation.templates ?? []).map(template => [template.id, template]));
    return Object.fromEntries(["excel", "rich"].flatMap(format => ["overview", "flow", "matrix", "profile"].map(kind => { const assigned = documentationTemplateAssignment(set, format, kind), template = assigned === "builtin" ? undefined : templates.get(assigned); return [assignmentKey(format, kind), template?.digest ?? "builtin"]; })));
}
//# sourceMappingURL=template-library.js.map