import { transactProject } from "./data-layer-specification-project.js";
const obsoletePageDetailKeys = ["environment", "host", "query", "hash", "spa", "expectedEventIds", "applicabilitySetId"];
export function savePageDetails(state, pageId, input) {
    const name = input.name.trim(), description = input.description.trim(), eventName = input.eventName.trim(), pathname = input.pathname.trim();
    if (!name)
        throw new Error("Page name is required.");
    if (!eventName)
        throw new Error("Page-view event name is required for a Page.");
    if (state.project.collections.pages.some(({ id, name: current }) => id !== pageId && current.toLowerCase() === name.toLowerCase()))
        throw new Error("Page name must be unique in this project.");
    return transactProject(state, `Save Page details for ${name}`, (project) => ({ ...project, collections: { ...project.collections, pages: project.collections.pages.map((page) => {
                if (page.id !== pageId)
                    return page;
                const saved = { ...page, name, eventName };
                if (description)
                    saved.description = description;
                else
                    delete saved.description;
                if (pathname)
                    saved.pathname = pathname;
                else
                    delete saved.pathname;
                for (const key of obsoletePageDetailKeys)
                    delete saved[key];
                return saved;
            }) } }));
}
export function testPageRecognition(pathname, candidate) {
    let url;
    try {
        url = new URL(candidate);
    }
    catch {
        return "Enter a full URL";
    }
    if (url.protocol !== "http:" && url.protocol !== "https:")
        return "Enter a full URL";
    const exact = pathname?.trim();
    if (!exact)
        return "No Exact URL path configured";
    return url.pathname === exact ? `matches exact pathname ${exact}` : `does not match ${exact}`;
}
//# sourceMappingURL=data-layer-page-authoring.js.map