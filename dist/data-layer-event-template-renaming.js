export function beginTemplateRename(template) {
    return { templateName: template.name, eventName: template.eventName };
}
export function renameValidation(draft) {
    return {
        ...(draft.templateName.trim() ? {} : { templateName: "Enter a template name" }),
        ...(draft.eventName.trim() ? {} : { eventName: "Enter an event name" }),
    };
}
export function saveTemplateRename(state, draft) {
    const errors = renameValidation(draft);
    const error = errors.templateName ?? errors.eventName;
    if (error)
        throw new Error(error);
    const previous = structuredClone(state.template);
    delete previous.revisionHistory;
    const revisions = [...state.revisions, previous];
    const template = {
        ...state.template,
        name: draft.templateName.trim(),
        eventName: draft.eventName.trim(),
        version: previous.version + 1,
        revisionHistory: revisions,
    };
    return {
        ...state,
        template,
        revisions,
        dirty: false,
    };
}
//# sourceMappingURL=data-layer-event-template-renaming.js.map