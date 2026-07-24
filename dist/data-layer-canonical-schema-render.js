import { renderCanonicalNavigator } from "./data-layer-canonical-schema-render-navigator.js";
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function renderCanonicalSchemaEditor(context) {
    const { dom, options, document } = context;
    options.host.replaceChildren();
    options.host.setAttribute("aria-label", `${options.surface} canonical schema editor`);
    options.host.dataset.canonicalSchemaId = document.id;
    options.host.dataset.canonicalRevision = String(document.revision);
    options.host.dataset.canonicalEditorMode = "focused-property";
    const header = dom.createElement("header"), title = dom.createElement("h2"), status = dom.createElement("p"), undo = button(dom, "Undo", () => options.onUndo?.()), redo = button(dom, "Redo", () => options.onRedo?.());
    title.textContent = document.contributorName;
    status.setAttribute("aria-label", "Canonical Draft status");
    status.textContent = `Draft · ${document.source ? `source ${document.source.identity} revision ${document.source.revision}` : "no source revision"} · lineage ${document.source?.provenance ?? "project-created"} · Saved · Draft token ${document.revision}`;
    undo.disabled = !options.onUndo;
    redo.disabled = !options.onRedo;
    header.append(title, status, undo, redo);
    options.host.append(header, renderCanonicalNavigator(context));
    const node = context.selectedNode(document);
    if (node && context.activePropertyId === node.id) {
        context.ensureWorking(node);
        options.host.append(context.renderFocusedEditor(document, node));
        if (context.review)
            options.host.append(context.review);
    }
    const preview = dom.createElement("section"), previewHeading = dom.createElement("h3"), previewText = dom.createElement("p"), feedbackOutput = dom.createElement("output");
    preview.setAttribute("aria-label", "Effective documentation preview");
    previewHeading.textContent = "Effective documentation";
    previewText.textContent = node ? [node.documentation.displayText, node.documentation.description, node.documentation.comments].filter(Boolean).join(" · ") || "No documentation yet." : "Select a property.";
    preview.append(previewHeading, previewText);
    feedbackOutput.setAttribute("aria-label", "Canonical command result");
    feedbackOutput.textContent = context.feedback;
    options.host.append(preview, feedbackOutput);
}
//# sourceMappingURL=data-layer-canonical-schema-render.js.map