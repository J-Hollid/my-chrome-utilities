export function deleteEventTemplate(templates, id) {
    return templates.filter((template) => template.id !== id);
}
export function clearEventLibrary(_templates) {
    return [];
}
//# sourceMappingURL=data-layer-event-library-deletion.js.map