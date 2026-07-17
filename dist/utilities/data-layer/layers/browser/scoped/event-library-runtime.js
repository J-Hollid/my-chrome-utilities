import { createEditableTemplate, eventLibraryExport, eventLibraryImport, EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, openPropertyEditor, replaceImportedTemplates, saveDraftRevision, serializeEventTemplateLibrary, updateDraftJson, } from "../../../event-library.js";
import { showScopedEditor } from "./runtime-support.js";
export function mountScopedEventLibraryWorkflow(root, storage, bind) {
    bind("#add-new-event", () => showScopedEditor(root, "#event-property-editor", "#event-template-name"));
    const original = createEditableTemplate({
        id: "scoped-event",
        sessionId: "scoped-session",
        sourceId: "event-history",
        sourceKind: "array",
        name: "checkout",
        captureTime: new Date(0).toISOString(),
        pageUrl: "https://shop.example/checkout",
        payload: { event: "checkout", step: 1 },
        rawInput: { event: "checkout", step: 1 },
        validation: "Not checked",
        provenance: "scoped-runtime",
    }, {
        name: "Checkout",
        destination: "dataLayer",
        sourceName: "Event history",
    });
    let templates = [original];
    const persist = () => {
        storage.setItem(EVENT_TEMPLATE_LIBRARY_STORAGE_KEY, serializeEventTemplateLibrary(templates));
    };
    persist();
    bind("#save-template-revision", () => {
        const editor = openPropertyEditor(templates[0] ?? original);
        const updated = updateDraftJson(editor, JSON.stringify({ event: "checkout", step: 2 }));
        templates = [saveDraftRevision(updated).template];
        persist();
        const result = root.querySelector("#event-template-result");
        if (result)
            result.textContent = `Revision ${templates[0]?.version ?? 0} saved`;
    });
    bind("#export-event-library", () => {
        const serialized = JSON.stringify(eventLibraryExport(templates));
        const imported = eventLibraryImport(serialized);
        templates = replaceImportedTemplates([], imported.templates);
        persist();
        const result = root.querySelector("#event-library-transfer-result");
        if (!result)
            return;
        result.dataset.transferTemplates = String(templates.length);
        result.dataset.transferBytes = String(serialized.length);
        const revisions = templates[0]?.revisionHistory?.length ?? 0;
        result.textContent = `${templates.length} template exported and imported with ${revisions} revisions`;
    });
}
//# sourceMappingURL=event-library-runtime.js.map