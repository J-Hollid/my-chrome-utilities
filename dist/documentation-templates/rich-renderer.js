import { renderProjectDocumentationClipboard, selectProjectDocumentationTables } from "../data-layer-project-documentation-workspace.js";
import { documentationTemplateAssignment } from "./template-library.js";
import { prepareDocumentationTemplateContext } from "./template-context.js";
import { renderRichDocumentationTemplate } from "./rich-template.js";
const html = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const themed = (source, snapshot) => source.replace(/<table>/gu, `<table data-documentation-template-table="true" style="font-family:${html(snapshot.theme.typography.family)};font-size:${snapshot.theme.typography.bodySize}pt;border-collapse:collapse">`);
export function renderProjectDocumentationRichWithTemplates(snapshot, selection) {
    if (snapshot.incomplete && !selection.confirmIncomplete)
        throw new Error("Confirm incomplete documentation before export.");
    const tables = selectProjectDocumentationTables(snapshot, selection);
    if (!tables.length)
        throw new Error("Choose at least one documentation section.");
    const templates = new Map((snapshot.templates ?? []).map(template => [template.id, template])), parts = [];
    for (const table of tables) {
        const section = snapshot.set.sections.find(item => item.id === table.id), assigned = documentationTemplateAssignment(snapshot.set, "rich", section.kind);
        if (assigned === "builtin") {
            parts.push(renderProjectDocumentationClipboard(snapshot, { scope: "current", currentSectionId: table.id, confirmIncomplete: true }));
            continue;
        }
        const record = templates.get(assigned);
        if (!record || record.format !== "rich" || record.kind !== section.kind || !record.validation.valid || !record.richBlocks)
            throw new Error(`${section.name} Rich page template is unavailable or invalid. Open Templates to repair it.`);
        const template = { ...record, blocks: record.richBlocks }, rendered = renderRichDocumentationTemplate(template, prepareDocumentationTemplateContext(snapshot, table.id));
        parts.push({ html: themed(rendered.html, snapshot), plain: rendered.plain });
    }
    return { html: parts.map(part => part.html).join(""), plain: parts.map(part => part.plain).join("\n") };
}
//# sourceMappingURL=rich-renderer.js.map