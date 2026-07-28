import { renderCanonicalNavigator } from "./data-layer-canonical-schema-render-navigator.js";
import { clearSchemaTableOverlay } from "./data-layer-schema-table.js";
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function renderCanonicalSchemaEditor(context) {
    const { dom, options, document } = context, priorScroll = options.host.querySelector("[data-schema-editor-scroll-region]"), retainedScroll = priorScroll ? { top: priorScroll.scrollTop, left: priorScroll.scrollLeft } : undefined, retainedTable = document.view === "table" ? options.host.querySelector('table[data-canonical-view="table"]') : null;
    if (retainedTable)
        context.tableElement = retainedTable;
    else
        delete context.tableElement;
    clearSchemaTableOverlay(options.host);
    options.host.replaceChildren();
    options.host.setAttribute("aria-label", `${options.surface} canonical schema editor`);
    options.host.dataset.canonicalSchemaId = document.id;
    options.host.dataset.canonicalRevision = String(document.revision);
    options.host.dataset.canonicalEditorMode = "focused-property";
    const header = dom.createElement("header"), title = dom.createElement("h2"), status = dom.createElement("p"), undo = button(dom, "Undo", () => options.onUndo?.()), redo = button(dom, "Redo", () => options.onRedo?.()), policy = dom.createElement("input"), policyLabel = dom.createElement("label");
    title.textContent = document.contributorName;
    status.setAttribute("aria-label", "Canonical Draft status");
    status.textContent = `Draft · ${document.source ? `source ${document.source.identity} revision ${document.source.revision}` : "no source revision"} · lineage ${document.source?.provenance ?? "project-created"} · Saved · Draft token ${document.revision}`;
    undo.disabled = !options.onUndo;
    redo.disabled = !options.onRedo;
    policy.type = "checkbox";
    policy.checked = document.onlyDefinedFields === true;
    policy.setAttribute("aria-label", "Only defined fields");
    policy.addEventListener("change", () => context.command({ kind: "policy", baseRevision: document.revision, onlyDefinedFields: policy.checked }));
    policyLabel.append(policy, "Only defined fields");
    header.append(title, status);
    if (options.showOnlyDefinedFields !== false)
        header.append(policyLabel);
    header.append(undo, redo);
    options.host.append(header, renderCanonicalNavigator(context));
    if (document.view === "table" && context.review && !context.focusedPropertyId)
        options.host.append(context.review);
    const node = context.selectedNode(document);
    const preview = dom.createElement("section"), previewHeading = dom.createElement("h3"), previewText = dom.createElement("p"), feedbackOutput = dom.createElement("output");
    preview.setAttribute("aria-label", "Effective documentation preview");
    previewHeading.textContent = "Effective documentation";
    previewText.textContent = node ? [node.documentation.displayText, node.documentation.description, node.documentation.comments].filter(Boolean).join(" · ") || "No documentation yet." : "Select a property.";
    preview.append(previewHeading, previewText);
    feedbackOutput.setAttribute("aria-label", "Canonical command result");
    feedbackOutput.textContent = context.feedback;
    options.host.append(preview, feedbackOutput);
    if (retainedScroll) {
        const next = options.host.querySelector("[data-schema-editor-scroll-region]");
        if (next) {
            next.scrollTop = retainedScroll.top;
            next.scrollLeft = retainedScroll.left;
        }
    }
}
//# sourceMappingURL=data-layer-canonical-schema-render.js.map