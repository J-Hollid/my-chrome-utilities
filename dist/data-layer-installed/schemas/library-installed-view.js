/** Owns optional installed DOM for Schema library transfer and deletion reviews. */
export function installSchemaLibraryElements(root) {
    const ownerDocument = root.ownerDocument
        ?? ("createElement" in root ? root : undefined);
    const owned = (selector, tag) => root.querySelector(selector) ?? ownerDocument?.createElement(tag) ?? null;
    const elements = {
        importButton: root.querySelector("#import-schema"),
        importFile: root.querySelector("#schema-library-import-file"),
        importReview: owned("#schema-import-review", "dialog"),
        importReviewSummary: owned("#schema-import-review-summary", "output"),
        replaceLibrary: owned("#replace-schema-library", "button"),
        appendLibrary: owned("#append-schema-library", "button"),
        cancelImport: owned("#cancel-schema-import", "button"),
        deleteReview: owned("#schema-delete-review", "dialog"),
        deleteReviewSummary: owned("#schema-delete-review-summary", "output"),
        confirmDelete: owned("#confirm-schema-delete", "button"),
        cancelDelete: owned("#cancel-schema-delete", "button"),
        exportButton: root.querySelector("#export-schema"),
        exportChoices: owned("#schema-export-choices", "dialog"),
        exportReview: owned("#schema-export-compatibility-review", "dialog"),
    };
    installReview(ownerDocument, elements.importReview, "schema-import-review", "Import Schema Library", elements.importReviewSummary, elements.replaceLibrary, elements.cancelImport);
    if (elements.importReview && elements.appendLibrary && !elements.appendLibrary.isConnected) {
        elements.appendLibrary.id = "append-schema-library";
        elements.appendLibrary.type = "button";
        elements.appendLibrary.textContent = "Append";
        elements.importReview.append(elements.appendLibrary);
    }
    installReview(ownerDocument, elements.deleteReview, "schema-delete-review", "Delete schema", elements.deleteReviewSummary, elements.confirmDelete, elements.cancelDelete);
    for (const [dialog, id] of [[elements.exportChoices, "schema-export-choices"],
        [elements.exportReview, "schema-export-compatibility-review"]]) {
        if (dialog && !dialog.isConnected) {
            dialog.id = id;
            ownerDocument?.body.append(dialog);
        }
    }
    return elements;
}
export function bindSchemaLibraryElements(lifecycle, elements, actions) {
    lifecycle.listen(elements.importButton, "click", () => actions.openImportFile());
    lifecycle.listen(elements.importFile, "change", () => { void actions.readImportFile(); });
    lifecycle.listen(elements.replaceLibrary, "click", () => actions.replaceImport());
    lifecycle.listen(elements.appendLibrary, "click", () => actions.appendImport());
    lifecycle.listen(elements.cancelImport, "click", () => actions.cancelImport());
    lifecycle.listen(elements.confirmDelete, "click", () => actions.confirmDeletion());
    lifecycle.listen(elements.cancelDelete, "click", () => actions.cancelDeletion());
    lifecycle.listen(elements.exportButton, "click", () => actions.requestExport());
}
function installReview(ownerDocument, dialog, id, heading, summary, confirm, cancel) {
    if (!dialog || dialog.isConnected)
        return;
    dialog.id = id;
    const title = ownerDocument?.createElement("h4");
    if (title) {
        title.textContent = heading;
        dialog.append(title);
    }
    if (summary) {
        summary.id = `${id}-summary`;
        dialog.append(summary);
    }
    if (confirm) {
        confirm.id = `confirm-${id.replace("-review", "")}`;
        confirm.type = "button";
        confirm.textContent = "Confirm";
        dialog.append(confirm);
    }
    if (cancel) {
        cancel.id = `cancel-${id.replace("-review", "")}`;
        cancel.type = "button";
        cancel.textContent = "Cancel";
        dialog.append(cancel);
    }
    ownerDocument?.body.append(dialog);
}
//# sourceMappingURL=library-installed-view.js.map