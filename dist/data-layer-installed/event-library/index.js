export function createEventLibraryInstalledController(ports) {
    let mounted = false;
    let templates = ports.loadTemplates().map((template) => ({ ...template }));
    let selectedId;
    let draftId;
    return {
        mount() { mounted = true; },
        dispose() { mounted = false; },
        select(id) {
            if (!templates.some((template) => template.id === id))
                throw new Error(`Unknown template ${id}`);
            selectedId = id;
        },
        beginDraft(id) {
            if (!templates.some((template) => template.id === id))
                throw new Error(`Unknown template ${id}`);
            draftId = id;
        },
        async replace(next) {
            templates = next.map((template) => ({ ...template }));
            await ports.persistTemplates(templates);
        },
        reviewTransfer: ports.reviewTransfer,
        pushSelectedTemplate: ports.pushSelectedTemplate,
        state: () => ({ ...(selectedId ? { selectedId } : {}), ...(draftId ? { draftId } : {}),
            templateCount: templates.length }),
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "event-library",
    capabilities: ["templates", "reviews", "transfer", "deletion", "push"],
});
//# sourceMappingURL=index.js.map