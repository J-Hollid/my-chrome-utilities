import { DEFECT_LIBRARY_STORAGE_KEY, addDefect, cancelDefectDeletion, confirmDefectDeletion, editDefect, eventContainsDefectIssue, eventMatchesOccurrenceDefect, findDefectLibraryElements, renderDefectLibrary, requestDefectDeletion, restoreDefectLibrary, searchDefects, serializeDefectLibrary, presentedEventTriage, missingEventVisits, createMissingEventDefect, updateDefectStatus, } from "../../utilities/data-layer/defect-reporting.js";
export function createDefectsInstalledController(ports) {
    const defectLibraryElements = findDefectLibraryElements(ports.root);
    const defectLibrarySearch = ports.root.querySelector("#defect-library-search");
    const defectLibraryStatus = ports.root.querySelector("#defect-library-status");
    const defectLibraryType = ports.root.querySelector("#defect-library-type");
    const defectLibraryEvent = ports.root.querySelector("#defect-library-event");
    const defectLibrarySchema = ports.root.querySelector("#defect-library-schema");
    const defectLibraryPath = ports.root.querySelector("#defect-library-path");
    let defectLibrary = restoreDefectLibrary(ports.storage.getItem(DEFECT_LIBRARY_STORAGE_KEY));
    let selectedDefectId;
    let defectReturn;
    let defectListScrollTop = 0;
    let mounted = false;
    let missingEventBuilderController;
    const now = ports.now ?? (() => new Date().toISOString());
    const persistDefectLibrary = () => {
        ports.storage.setItem(DEFECT_LIBRARY_STORAGE_KEY, serializeDefectLibrary(defectLibrary));
    };
    const filteredDefectLibrary = () => searchDefects(defectLibrary, {
        query: defectLibrarySearch?.value ?? "",
        status: (defectLibraryStatus?.value || "All"),
        type: (defectLibraryType?.value || "All"),
        eventName: defectLibraryEvent?.value ?? "",
        schema: defectLibrarySchema?.value ?? "",
        path: defectLibraryPath?.value ?? "",
    });
    const matchingEventForDefect = (defect) => {
        const events = ports.liveEvents();
        if (defect.occurrenceMatch) {
            const capturedId = String(defect.report?.actual?.id ?? "");
            return events.find((candidate) => candidate.id === capturedId && eventMatchesOccurrenceDefect(candidate, defect))
                ?? events.find((candidate) => eventMatchesOccurrenceDefect(candidate, defect));
        }
        return events.find((candidate) => eventContainsDefectIssue(candidate, defect));
    };
    const openDefect = (id, options = {}) => {
        selectedDefectId = id;
        if (options.returnPosition)
            defectReturn = { ...options.returnPosition };
        if (!defectReturn) {
            defectListScrollTop = ports.root.querySelector("#defect-library-master")?.scrollTop ?? 0;
        }
        ports.showDefectsView();
        renderDefects();
        if (options.trigger)
            options.trigger.dataset.openedDefect = id;
    };
    const closeDefect = () => {
        const returning = defectReturn;
        selectedDefectId = undefined;
        defectReturn = undefined;
        if (returning) {
            ports.returnToLive(returning);
            return;
        }
        renderDefects();
        const master = ports.root.querySelector("#defect-library-master");
        if (master)
            master.scrollTop = defectListScrollTop;
    };
    const triagedEvent = (candidate) => ({ ...candidate,
        defectTriage: presentedEventTriage(candidate, defectLibrary) });
    function currentMissingEventVisits() {
        const context = ports.missingEventContext(), visits = missingEventVisits(context.events, context.pageUrl, Boolean(context.archived));
        return context.archived ? visits.map((visit) => ({ ...visit, startedAt: context.archived.startedAt,
            ...(context.archived.endedAt ? { endedAt: context.archived.endedAt } : {}), immutable: true })) : visits;
    }
    function openMissingEventBuilder(entryPoint, initialSchemaId) {
        missingEventBuilderController?.close();
        missingEventBuilderController = ports.mountMissingEventBuilder({ entryPoint, ...(initialSchemaId ? { initialSchemaId } : {}),
            visits: currentMissingEventVisits(), save: (report) => {
                const defect = createMissingEventDefect({ id: `defect:${now()}`, now: now(), report });
                const result = addDefect(defectLibrary, defect);
                if (result.added) {
                    defectLibrary = result.library;
                    persistDefectLibrary();
                    renderDefects();
                    ports.renderLive();
                }
            } });
    }
    const recopyDefect = async (id) => {
        const defect = defectLibrary.defects.find((candidate) => candidate.id === id);
        return defect ? ports.recopy(defect) : "Defect unavailable";
    };
    function renderDefects() {
        if (!mounted)
            return;
        const filtered = filteredDefectLibrary();
        const selected = selectedDefectId ? defectLibrary.defects.find(({ id }) => id === selectedDefectId) : undefined;
        const presented = selected && !filtered.some(({ id }) => id === selected.id) ? [...filtered, selected] : filtered;
        renderDefectLibrary(defectLibraryElements, presented, selectedDefectId, defectLibrary.deletionConfirmationId, {
            open: (id, trigger) => openDefect(id, { trigger }), close: closeDefect,
            save: (id, report, notes) => { defectLibrary = editDefect(defectLibrary, id, { report, notes }, now()); persistDefectLibrary(); renderDefects(); },
            recopy: recopyDefect,
            updateStatus: (id, next) => { defectLibrary = updateDefectStatus(defectLibrary, id, next, now()); persistDefectLibrary(); renderDefects(); ports.renderLive(); },
            attachCurrentSession: ports.attachCurrentSession,
            openLinkedSession: ports.openLinkedSession,
            requestDelete: (id) => { defectLibrary = requestDefectDeletion(defectLibrary, id); renderDefects(); },
            cancelDelete: () => { defectLibrary = cancelDefectDeletion(defectLibrary); renderDefects(); },
            confirmDelete: () => {
                const deleted = defectLibrary.deletionConfirmationId;
                defectLibrary = confirmDefectDeletion(defectLibrary);
                if (selectedDefectId === deleted)
                    selectedDefectId = undefined;
                persistDefectLibrary();
                renderDefects();
                ports.renderLive();
            },
        });
    }
    const controls = [defectLibrarySearch, defectLibraryStatus, defectLibraryType, defectLibraryEvent,
        defectLibrarySchema, defectLibraryPath].filter((filter) => Boolean(filter));
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            for (const filter of controls) {
                filter?.addEventListener("input", renderDefects);
                filter?.addEventListener("change", renderDefects);
            }
            renderDefects();
        },
        dispose() {
            missingEventBuilderController?.close();
            missingEventBuilderController = undefined;
            if (!mounted)
                return;
            mounted = false;
            for (const filter of controls) {
                filter?.removeEventListener("input", renderDefects);
                filter?.removeEventListener("change", renderDefects);
            }
            defectLibraryElements.list?.replaceChildren();
            defectLibraryElements.detail?.replaceChildren();
            defectLibraryElements.confirmation?.replaceChildren();
        },
        library: () => structuredClone(defectLibrary),
        replace(next) { defectLibrary = structuredClone(next); persistDefectLibrary(); renderDefects(); },
        add(defect, saveSeparately = false) {
            const result = addDefect(defectLibrary, defect, saveSeparately);
            if (result.added) {
                defectLibrary = result.library;
                persistDefectLibrary();
                renderDefects();
                ports.renderLive();
            }
            return result;
        },
        edit(id, changes) { defectLibrary = editDefect(defectLibrary, id, changes, now()); persistDefectLibrary(); renderDefects(); },
        open: openDefect, close: closeDefect, render: renderDefects, triage: triagedEvent,
        matchingEvent: matchingEventForDefect,
        selectedId: () => selectedDefectId,
        currentMissingEventVisits,
        openMissingEventBuilder,
    };
}
export const installedControllerDefinition = Object.freeze({
    id: "defects",
    capabilities: ["defect state", "presentation", "copy", "export"],
});
//# sourceMappingURL=index.js.map