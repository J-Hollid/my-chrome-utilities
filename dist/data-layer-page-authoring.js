import { transactProject } from "./data-layer-specification-project.js";
const obsoletePageDetailKeys = ["eventName", "pathname", "environment", "host", "query", "hash", "spa", "expectedEventIds", "applicabilitySetId"];
export function savePageDetails(state, pageId, input) {
    const name = input.name.trim(), description = input.description.trim();
    if (!name)
        throw new Error("Page name is required.");
    if (state.project.collections.pages.some(({ id, name: current }) => id !== pageId && current.toLowerCase() === name.toLowerCase()))
        throw new Error("Page name must be unique in this project.");
    return transactProject(state, `Save Page details for ${name}`, (project) => ({ ...project, collections: { ...project.collections, pages: project.collections.pages.map((page) => {
                if (page.id !== pageId)
                    return page;
                const saved = { ...page, name };
                if (description)
                    saved.description = description;
                else
                    delete saved.description;
                for (const key of obsoletePageDetailKeys)
                    delete saved[key];
                return saved;
            }) } }));
}
//# sourceMappingURL=data-layer-page-authoring.js.map