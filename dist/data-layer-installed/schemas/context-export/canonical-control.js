import { appendContextExportControl } from "../../../schema-context-export/preview.js";
import { hasUnconfirmedSchemaEdits } from "../../../schema-context-export/edit-state.js";
import { savedSchemaFromCanonical } from "../../../data-layer-saved-schema-canonical.js";
function findContext(nodes, key) {
    const matches = [];
    const visit = (node) => { if (node.targetKey === key || node.key === key)
        matches.push(node); node.children.forEach(visit); };
    nodes.forEach(visit);
    return matches.find(node => node.key.startsWith("flow:")) ?? matches[0];
}
export function installedCanonicalExportSource(ports) {
    const c = ports.controller, editor = c.editorState, canonical = c.editorDocument();
    if (!editor || !canonical)
        throw new Error("The schema context changed.");
    const tree = ports.exportRelationships?.(), context = tree && findContext(tree.nodes, editor.key);
    const role = context?.role ?? (editor.key.startsWith("saved:") ? "Saved Schema" : editor.label.match(/Role ([^·]+)/)?.[1]?.trim() ?? "Schema");
    const saved = editor.key.startsWith("saved:") ? ports.schemas().find(schema => schema.id === editor.key.slice(6)) : undefined;
    return { key: `${tree?.projectId ?? ""}/${editor.key}`, name: canonical.contributorName, role, context: context?.relationshipPath ?? "", version: "Draft", canonical,
        ...(saved ? { schema: savedSchemaFromCanonical(ports.editorDraft(saved), canonical), schemas: ports.schemas() } : {}),
        pending: c.semanticUnresolved(), unconfirmed: hasUnconfirmedSchemaEdits(ports.elements.editor), errors: editor.migration ? ["Complete the canonical migration before export."] : [] };
}
export function appendInstalledCanonicalExport(host, ports) {
    appendContextExportControl(host, () => installedCanonicalExportSource(ports));
}
//# sourceMappingURL=canonical-control.js.map