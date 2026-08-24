import { DEFECT_LIBRARY_STORAGE_KEY, cancelDefectDeletion, confirmDefectDeletion, editDefect, findDefectLibraryElements, renderDefectLibrary, requestDefectDeletion, restoreDefectLibrary, searchDefects, serializeDefectLibrary, updateDefectStatus, } from "../../utilities/data-layer/defect-reporting.js";
export function createDefectsInstalledController(ports) {
    const elements = findDefectLibraryElements(ports.root);
    const search = ports.root.querySelector("#defect-library-search");
    const status = ports.root.querySelector("#defect-library-status");
    const type = ports.root.querySelector("#defect-library-type");
    const event = ports.root.querySelector("#defect-library-event");
    const schema = ports.root.querySelector("#defect-library-schema");
    const path = ports.root.querySelector("#defect-library-path");
    let library = restoreDefectLibrary(ports.storage.getItem(DEFECT_LIBRARY_STORAGE_KEY));
    let selectedId;
    let mounted = false;
    const now = ports.now ?? (() => new Date().toISOString());
    const persist = () => {
        ports.storage.setItem(DEFECT_LIBRARY_STORAGE_KEY, serializeDefectLibrary(library));
    };
    const visible = () => searchDefects(library, {
        query: search?.value ?? "",
        status: (status?.value || "All"),
        type: (type?.value || "All"),
        eventName: event?.value ?? "",
        schema: schema?.value ?? "",
        path: path?.value ?? "",
    });
    const render = () => {
        if (!mounted)
            return;
        renderDefectLibrary(elements, visible(), selectedId, library.deletionConfirmationId, {
            open: (id) => { selectedId = id; render(); },
            close: () => { selectedId = undefined; render(); },
            save: (id, report, notes) => { library = editDefect(library, id, { report, notes }, now()); persist(); render(); },
            recopy: (id) => {
                const defect = library.defects.find((candidate) => candidate.id === id);
                return defect ? ports.recopy(defect) : "Defect unavailable";
            },
            updateStatus: (id, next) => { library = updateDefectStatus(library, id, next, now()); persist(); render(); },
            attachCurrentSession: ports.attachCurrentSession,
            openLinkedSession: ports.openLinkedSession,
            requestDelete: (id) => { library = requestDefectDeletion(library, id); render(); },
            cancelDelete: () => { library = cancelDefectDeletion(library); render(); },
            confirmDelete: () => { library = confirmDefectDeletion(library); persist(); selectedId = undefined; render(); },
        });
    };
    const controls = [search, status, type, event, schema, path].filter((control) => Boolean(control));
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            for (const control of controls) {
                control.addEventListener("input", render);
                control.addEventListener("change", render);
            }
            render();
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            for (const control of controls) {
                control.removeEventListener("input", render);
                control.removeEventListener("change", render);
            }
            elements.list?.replaceChildren();
            elements.detail?.replaceChildren();
            elements.confirmation?.replaceChildren();
        },
        library: () => structuredClone(library),
        replace(next) { library = structuredClone(next); persist(); render(); },
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "defects",
    capabilities: ["defect state", "presentation", "copy", "export"],
});
//# sourceMappingURL=index.js.map