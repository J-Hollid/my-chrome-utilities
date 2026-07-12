import { newEventValidation, templateIdentityValidation } from "./data-layer-event-library-editor.js";
import { templateActionHierarchy } from "./side-panel-action-hierarchy.js";
import { applyActionTreatment } from "./side-panel-action-hierarchy-ui.js";
export function findEventLibraryEditorElements(root = document) {
    return {
        search: root.querySelector("#event-template-search"),
        addNewButton: root.querySelector("#add-new-event"),
        count: root.querySelector("#event-template-count"),
        list: root.querySelector("#event-template-list"),
        propertyEditor: root.querySelector("#event-property-editor"),
        editorTitle: root.querySelector("#event-template-editor-title"),
        templateName: root.querySelector("#event-template-name"),
        eventName: root.querySelector("#event-template-event-name"),
        source: root.querySelector("#event-template-source"),
        editorSummary: root.querySelector("#event-template-editor-summary"),
        revisionHistory: root.querySelector("#event-template-revision-history"),
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
function actionButton(label, action, variant = "secondary", templateId, accessibleName) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.actionVariant = variant;
    if (templateId)
        button.dataset.templateId = templateId;
    if (accessibleName)
        button.setAttribute("aria-label", accessibleName);
    button.addEventListener("click", action);
    return button;
}
export function renderEventLibraryEditor(elements, templates, editor, actions) {
    if (elements.count)
        elements.count.textContent = `${templates.length} templates`;
    if (elements.addNewButton)
        elements.addNewButton.hidden = Boolean(editor?.isNew);
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
        actionsRow.append(actionButton("Edit", () => actions.edit(template), "quiet", template.id), actionButton("Delete", () => actions.delete(template), "destructive", template.id, `Delete ${template.name}`), actionButton("Duplicate", () => actions.duplicate(template)), ...(actions.createSchema ? [actionButton("Create schema", () => actions.createSchema?.(template))] : []), actionButton("Push", () => actions.push(template)));
        item.append(identity, routing, attributes, actionsRow);
        return item;
    }));
    if (elements.propertyEditor)
        elements.propertyEditor.hidden = !editor;
    if (elements.editorTitle && editor)
        elements.editorTitle.textContent = editor.isNew ? "New event" : `${editor.template.name} editor`;
    for (const field of [elements.templateName, elements.eventName])
        if (field)
            field.disabled = !editor;
    if (elements.source)
        elements.source.disabled = !editor?.isNew;
    if (elements.templateName)
        elements.templateName.value = editor?.template.name ?? "";
    if (elements.eventName)
        elements.eventName.value = editor?.template.eventName ?? "";
    if (elements.source)
        elements.source.value = editor?.template.sourceId ?? "";
    const newErrors = editor?.isNew ? newEventValidation(editor) : (editor ? templateIdentityValidation(editor) : {});
    const validationFields = [
        [elements.templateName, newErrors.name],
        [elements.eventName, newErrors.eventName],
        [elements.source, editor?.isNew ? newEventValidation(editor).source : undefined],
    ];
    for (const [field, error] of validationFields) {
        if (!field)
            continue;
        field.setAttribute("aria-invalid", String(Boolean(error)));
        if (error)
            field.setAttribute("aria-describedby", "event-template-validation");
        else
            field.removeAttribute("aria-describedby");
    }
    if (elements.editorSummary) {
        elements.editorSummary.replaceChildren(...(editor ? [
            ["Template", editor.template.name], ["Version", String(editor.template.version)],
            ["Draft", editor.dirty ? "Unsaved changes" : "Saved"], ["Provenance", editor.template.provenance],
        ].flatMap(([label, value]) => { const term = document.createElement("dt"); const description = document.createElement("dd"); term.textContent = String(label); description.textContent = String(value); return [term, description]; }) : []));
    }
    elements.revisionHistory?.replaceChildren(...(editor
        ? editor.revisions.map((revision) => {
            const item = document.createElement("li");
            item.textContent = `Version ${revision.version}: ${revision.name} · ${revision.eventName}`;
            return item;
        })
        : []));
    const revisionSummary = elements.revisionHistory?.parentElement?.querySelector("summary");
    if (revisionSummary)
        revisionSummary.textContent = `Revision history (${editor ? editor.revisions.length + 1 : 0} saved revisions)`;
    const propertiesSummary = elements.properties?.parentElement?.querySelector("summary");
    if (propertiesSummary)
        propertiesSummary.textContent = `Properties (${editor ? "draft properties available" : "no draft properties"})`;
    if (elements.json) {
        elements.json.value = editor?.jsonDraft ?? "";
        const error = editor?.jsonError ?? "";
        elements.json.setCustomValidity(error);
        elements.json.setAttribute("aria-invalid", String(Boolean(error)));
    }
    if (elements.pushDestination && editor) {
        elements.pushDestination.value = editor.template.destination;
    }
    if (elements.validation) {
        const error = editor?.jsonError ?? Object.values(newErrors)[0];
        elements.validation.textContent = error ?? "Properties, JSON, and Validation edit the same draft.";
        elements.validation.setAttribute("aria-live", error ? "assertive" : "polite");
        elements.validation.setAttribute("role", error ? "alert" : "status");
    }
    elements.properties?.replaceChildren(...(editor ? draftProperties(editor.draft) : []));
    if (editor) {
        const hierarchy = templateActionHierarchy(editor);
        if (elements.saveRevisionButton)
            elements.saveRevisionButton.textContent = editor.isNew ? "Save new event" : "Save revision";
        const error = Object.values(newErrors)[0];
        applyActionTreatment(elements.saveRevisionButton, error
            ? { variant: "primary", disabled: true, disabledReason: error }
            : hierarchy.saveRevision, "save-template-revision-reason");
        applyActionTreatment(elements.pushDraftButton, error
            ? { variant: "secondary", disabled: true, disabledReason: error }
            : hierarchy.pushDraft, "push-template-draft-reason");
        applyActionTreatment(elements.discardDraftButton, hierarchy.discardDraft);
    }
}
export function focusTemplateEditAction(elements, templateId) {
    const escaped = typeof CSS !== "undefined" && CSS.escape
        ? CSS.escape(templateId)
        : templateId.replace(/["\\]/g, "\\$&");
    elements.list?.querySelector(`button[data-template-id="${escaped}"]`)?.focus({ preventScroll: true });
}
export function focusTemplateRenameAction(elements, templateId) {
    const escaped = typeof CSS !== "undefined" && CSS.escape
        ? CSS.escape(templateId)
        : templateId.replace(/["\\]/g, "\\$&");
    elements.list?.querySelector(`button[data-template-id="${escaped}"][aria-label^="Rename "]`)?.focus({ preventScroll: true });
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