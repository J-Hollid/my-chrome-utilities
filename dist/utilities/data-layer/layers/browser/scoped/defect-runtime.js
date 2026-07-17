import { addDefect, createMissingEventDefect, DEFECT_LIBRARY_STORAGE_KEY, restoreDefectLibrary, serializeDefectLibrary, } from "../../../defect-reporting.js";
async function copyText(text) {
    try {
        if (typeof navigator.clipboard?.writeText !== "function")
            return false;
        await navigator.clipboard.writeText(text);
        return true;
    }
    catch {
        return false;
    }
}
export function mountScopedDefectWorkflow(root, storage, cleanups) {
    const panel = root.querySelector("#defect-library-master");
    const ownerDocument = panel?.ownerDocument;
    if (!panel || !ownerDocument)
        return;
    const save = ownerDocument.createElement("button");
    const copy = ownerDocument.createElement("button");
    const status = ownerDocument.createElement("output");
    save.id = "scoped-save-defect";
    save.textContent = "Save defect";
    copy.id = "scoped-copy-defect";
    copy.textContent = "Copy for Jira";
    status.id = "scoped-defect-status";
    panel.append(save, copy, status);
    const report = {
        summary: "Missing checkout event",
        description: "The checkout event was not observed.",
        expectedEvent: "checkout",
    };
    const defect = createMissingEventDefect({
        id: "scoped-defect",
        now: new Date(0).toISOString(),
        report,
    });
    const onSave = () => {
        const library = restoreDefectLibrary(storage.getItem(DEFECT_LIBRARY_STORAGE_KEY));
        const saved = addDefect(library, defect, true);
        storage.setItem(DEFECT_LIBRARY_STORAGE_KEY, serializeDefectLibrary(saved.library));
        status.dataset.saveStatus = "saved";
        status.textContent = "Defect saved";
    };
    const onCopy = async () => {
        const text = `${report.summary}\n\n${report.description}\nExpected: ${report.expectedEvent}`;
        const copied = await copyText(text);
        status.dataset.copyStatus = copied ? "copied" : "failed";
        status.textContent = copied ? "Defect report copied for Jira" : "Copy failed";
    };
    save.addEventListener("click", onSave);
    copy.addEventListener("click", onCopy);
    cleanups.push(() => {
        save.removeEventListener("click", onSave);
        copy.removeEventListener("click", onCopy);
        save.remove();
        copy.remove();
        status.remove();
    });
}
//# sourceMappingURL=defect-runtime.js.map