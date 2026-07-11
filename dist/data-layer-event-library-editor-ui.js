import { templateActionHierarchy } from "./side-panel-action-hierarchy.js";
import { applyActionTreatment } from "./side-panel-action-hierarchy-ui.js";
export function findEventLibraryEditorElements(root = document) {
    return {
        search: root.querySelector("#event-template-search"),
        saveLatestButton: root.querySelector("#save-latest-template"),
        count: root.querySelector("#event-template-count"),
        list: root.querySelector("#event-template-list"),
        propertyEditor: root.querySelector("#event-property-editor"),
        editorTitle: root.querySelector("#event-template-editor-title"),
        editorSummary: root.querySelector("#event-template-editor-summary"),
        properties: root.querySelector("#event-template-properties"),
        json: root.querySelector("#event-template-json"),
        pushDestination: root.querySelector("#push-destination-path"),
        validation: root.querySelector("#event-template-validation"),
        saveRevisionButton: root.querySelector("#save-template-revision"),
        saveCopyButton: root.querySelector("#save-template-copy"),
        pushDraftButton: root.querySelector("#push-template-draft"),
        discardDraftButton: root.querySelector("#discard-template-draft"),
        closeEditorButton: root.querySelector("#close-template-editor"),
        backToCapturedEventButton: root.querySelector("#back-to-captured-event"),
        result: root.querySelector("#event-template-result"),
    };
}
function draftProperties(value, path = "") {
    if (value === null || typeof value !== "object") {
        const item = document.createElement("li");
        item.textContent = `${path || "/"}: ${String(value)} (${typeof value})`;
        return [item];
    }
    return Object.entries(value).flatMap(([key, child]) => draftProperties(child, `${path}/${key}`));
}
function actionButton(label, action, variant = "secondary", templateId) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.actionVariant = variant;
    if (templateId)
        button.dataset.templateId = templateId;
    button.addEventListener("click", action);
    return button;
}
export function renderEventLibraryEditor(elements, templates, editor, actions) {
    if (elements.count)
        elements.count.textContent = `${templates.length} templates`;
    elements.list?.replaceChildren(...templates.map((template) => {
        const item = document.createElement("li");
        item.className = "event-template-row";
        const identity = document.createElement("div");
        identity.className = "event-template-identity";
        identity.textContent = `${template.name} · ${template.eventName}`;
        const routing = document.createElement("div");
        routing.className = "event-template-routing";
        routing.textContent = `${template.sourceName} → ${template.destination}`;
        const attributes = document.createElement("dl");
        attributes.className = "event-template-attributes";
        const attributesToRender = [
            ["Version", String(template.version)],
            ["Validation", template.validation],
            ["Schema", template.schemaId ?? "None"],
            ["Tags", template.tags.join(", ") || "none"],
        ];
        for (const [label, value] of attributesToRender) {
            const term = document.createElement("dt");
            const description = document.createElement("dd");
            term.textContent = label;
            description.textContent = value;
            attributes.append(term, description);
        }
        const actionsRow = document.createElement("div");
        actionsRow.className = "event-template-actions";
        actionsRow.append(actionButton("Edit", () => actions.edit(template), "quiet", template.id), actionButton("Duplicate", () => actions.duplicate(template)), actionButton("Push", () => actions.push(template)));
        item.append(identity, routing, attributes, actionsRow);
        return item;
    }));
    if (elements.propertyEditor)
        elements.propertyEditor.hidden = !editor;
    if (elements.editorTitle && editor)
        elements.editorTitle.textContent = `${editor.template.name} editor`;
    if (elements.editorSummary) {
        elements.editorSummary.replaceChildren(...(editor ? [
            ["Template", editor.template.name], ["Version", String(editor.template.version)],
            ["Draft", editor.dirty ? "Unsaved changes" : "Saved"], ["Provenance", editor.template.provenance],
        ].flatMap(([label, value]) => { const term = document.createElement("dt"); const description = document.createElement("dd"); term.textContent = String(label); description.textContent = String(value); return [term, description]; }) : []));
    }
    if (elements.json && editor)
        elements.json.value = editor.jsonDraft;
    if (elements.pushDestination && editor) {
        elements.pushDestination.value = editor.template.destination;
    }
    if (elements.validation) {
        elements.validation.textContent =
            editor?.jsonError ?? "Properties, JSON, and Validation edit the same draft.";
    }
    elements.properties?.replaceChildren(...(editor ? draftProperties(editor.draft) : []));
    if (editor) {
        const hierarchy = templateActionHierarchy(editor);
        applyActionTreatment(elements.saveRevisionButton, hierarchy.saveRevision, "save-template-revision-reason");
        applyActionTreatment(elements.pushDraftButton, hierarchy.pushDraft, "push-template-draft-reason");
        applyActionTreatment(elements.discardDraftButton, hierarchy.discardDraft);
    }
}
export function focusTemplateEditAction(elements, templateId) {
    const escaped = typeof CSS !== "undefined" && CSS.escape
        ? CSS.escape(templateId)
        : templateId.replace(/["\\]/g, "\\$&");
    elements.list?.querySelector(`button[data-template-id="${escaped}"]`)?.focus({ preventScroll: true });
}
export function setEventLibraryResult(elements, message) {
    if (elements.result)
        elements.result.textContent = message;
}
export function setEventLibraryValidation(elements, message) {
    if (elements.validation) {
        const blocking = /invalid|correct|select|error|unavailable|must/i.test(message);
        elements.validation.setAttribute("aria-live", blocking ? "assertive" : "polite");
        elements.validation.setAttribute("role", blocking ? "alert" : "status");
        elements.validation.textContent = message;
    }
}
export function setPushDestinationValidation(elements, message) {
    if (!elements.pushDestination)
        return;
    elements.pushDestination.setCustomValidity(message);
    elements.pushDestination.setAttribute("aria-invalid", String(Boolean(message)));
    if (message)
        elements.pushDestination.setAttribute("aria-describedby", "event-template-validation");
}
//# sourceMappingURL=data-layer-event-library-editor-ui.js.map