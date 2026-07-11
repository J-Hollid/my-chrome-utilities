export function findEventLibraryEditorElements(root = document) {
    return {
        search: root.querySelector("#event-template-search"),
        saveLatestButton: root.querySelector("#save-latest-template"),
        count: root.querySelector("#event-template-count"),
        list: root.querySelector("#event-template-list"),
        propertyEditor: root.querySelector("#event-property-editor"),
        editorTitle: root.querySelector("#event-template-editor-title"),
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
function actionButton(label, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
}
export function renderEventLibraryEditor(elements, templates, editor, actions) {
    if (elements.count)
        elements.count.textContent = `${templates.length} templates`;
    elements.list?.replaceChildren(...templates.map((template) => {
        const item = document.createElement("li");
        item.textContent = `${template.name}: ${template.eventName}, ${template.sourceName}, ${template.destination}, ${template.tags.join(", ") || "no tags"}, ${template.schemaId ?? "no schema"}, ${template.validation}, v${template.version}. `;
        item.append(actionButton("Edit", () => actions.edit(template)), actionButton("Duplicate", () => actions.duplicate(template)), actionButton("Push", () => actions.push(template)));
        return item;
    }));
    if (elements.propertyEditor)
        elements.propertyEditor.hidden = !editor;
    if (elements.editorTitle && editor)
        elements.editorTitle.textContent = `${editor.template.eventName} (${editor.template.originatingEventId}) · ${editor.template.originatingSessionId}`;
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
}
export function setEventLibraryResult(elements, message) {
    if (elements.result)
        elements.result.textContent = message;
}
export function setEventLibraryValidation(elements, message) {
    if (elements.validation)
        elements.validation.textContent = message;
}
export function setPushDestinationValidation(elements, message) {
    if (!elements.pushDestination)
        return;
    elements.pushDestination.setCustomValidity(message);
    elements.pushDestination.setAttribute("aria-invalid", String(Boolean(message)));
}
//# sourceMappingURL=data-layer-event-library-editor-ui.js.map