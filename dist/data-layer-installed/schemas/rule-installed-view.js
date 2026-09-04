/** Owns installed DOM and lifecycle bindings for reusable Schema rules. */
export function installSchemaRuleElements(root) {
    const document = root.ownerDocument ?? ("createElement" in root ? root : undefined), owned = (selector, tag) => root.querySelector(selector) ?? document?.createElement(tag) ?? null, createRule = root.querySelector("#create-schema-rule"), editor = root.querySelector("#schema-rule-editor"), name = root.querySelector("#schema-rule-name"), parameters = root.querySelector("#schema-rule-parameters"), types = root.querySelector("#schema-rule-types"), operator = root.querySelector("#schema-rule-operator"), severity = root.querySelector("#schema-rule-severity"), message = root.querySelector("#schema-rule-message"), examples = root.querySelector("#schema-rule-examples"), save = root.querySelector("#save-schema-rule"), list = root.querySelector("#schema-rule-list"), search = root.querySelector("#schema-rule-search"), attachments = root.querySelector("#schema-rule-attachments"), updateAttachments = root.querySelector("#update-schema-rule-attachments"), exportRules = root.querySelector("#export-schema-rules"), revisionReview = owned("#schema-rule-revision-review", "dialog"), revisionSummary = owned("#schema-rule-revision-review-summary", "output"), confirmRevision = owned("#confirm-schema-rule-revision-review", "button"), cancelRevision = owned("#cancel-schema-rule-revision", "button"), upgradeReview = owned("#schema-rule-upgrade-review", "dialog"), upgradeSummary = owned("#schema-rule-upgrade-review-summary", "output"), confirmUpgrade = owned("#confirm-schema-rule-upgrade", "button"), cancelUpgrade = owned("#cancel-schema-rule-upgrade", "button"), syncReview = owned("#schema-rule-sync-review", "dialog"), syncSummary = owned("#schema-rule-sync-review-summary", "output"), confirmSync = owned("#confirm-schema-rule-sync", "button"), cancelSync = owned("#cancel-schema-rule-sync", "button"), deleteReview = owned("#schema-rule-delete-review", "dialog"), deleteSummary = owned("#schema-rule-delete-review-summary", "output"), confirmDelete = owned("#confirm-schema-rule-delete", "button"), cancelDelete = owned("#cancel-schema-rule-delete", "button"), result = root.querySelector("#schema-result");
    if (types?.ownerDocument)
        types.replaceChildren(...[["string", "String"], ["number", "Number"], ["boolean", "Boolean"], ["object", "Object"], ["array", "Array"]].map(([value, label]) => { const option = types.ownerDocument.createElement("option"); option.value = value; option.textContent = label; return option; }));
    const install = (dialog, id, heading, summary, confirm, cancel, confirmId = `confirm-${id.replace("-review", "")}`) => {
        if (!dialog || dialog.isConnected)
            return;
        dialog.id = id;
        const title = document?.createElement("h4");
        if (title) {
            title.textContent = heading;
            dialog.append(title);
        }
        if (summary) {
            summary.id = `${id}-summary`;
            dialog.append(summary);
        }
        if (confirm) {
            confirm.id = confirmId;
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
        document?.body.append(dialog);
    };
    install(revisionReview, "schema-rule-revision-review", "Review rule revision", revisionSummary, confirmRevision, cancelRevision, "confirm-schema-rule-revision-review");
    install(upgradeReview, "schema-rule-upgrade-review", "Update pinned rule attachments", upgradeSummary, confirmUpgrade, cancelUpgrade);
    install(syncReview, "schema-rule-sync-review", "Sync attached schemas and publish revisions", syncSummary, confirmSync, cancelSync);
    install(deleteReview, "schema-rule-delete-review", "Delete reusable rule", deleteSummary, confirmDelete, cancelDelete);
    return { createRule, save, exportRules, cancelRevision, cancelDelete, elements: { list, search, editor, name, parameters, types, operator, severity, message, examples, attachments, updateAttachments, result,
            revisionReview, revisionSummary, confirmRevision, upgradeReview, upgradeSummary, confirmUpgrade, cancelUpgrade, syncReview, syncSummary, confirmSync, cancelSync, deleteReview, deleteSummary, confirmDelete, document } };
}
export function bindSchemaRuleElements(lifecycle, installed, controller, updatePreview) {
    const { createRule, save, exportRules, cancelRevision, cancelDelete, elements } = installed;
    lifecycle.listen(createRule, "click", () => controller.beginNew());
    lifecycle.listen(save, "click", () => controller.save());
    lifecycle.listen(save, "pointerdown", () => controller.captureSnapshot());
    lifecycle.listen(elements.editor, "input", updatePreview);
    lifecycle.listen(elements.editor, "click", (event) => { if (event.target?.id === "schema-rule-save")
        controller.captureSnapshot(); });
    lifecycle.listen(elements.search, "input", () => controller.render());
    lifecycle.listen(elements.updateAttachments, "change", () => controller.updateAttachmentPreview());
    lifecycle.listen(elements.confirmRevision, "click", () => controller.confirmRevision());
    lifecycle.listen(cancelRevision, "click", () => controller.cancelRevision());
    lifecycle.listen(elements.confirmUpgrade, "click", () => controller.confirmUpgrade());
    lifecycle.listen(elements.cancelUpgrade, "click", () => controller.cancelUpgrade());
    lifecycle.listen(elements.confirmSync, "click", () => controller.confirmSync());
    lifecycle.listen(elements.cancelSync, "click", () => controller.cancelSync());
    lifecycle.listen(elements.confirmDelete, "click", () => controller.confirmDeletion());
    lifecycle.listen(cancelDelete, "click", () => controller.cancelDeletion());
    lifecycle.listen(exportRules, "click", () => controller.exportRules());
}
//# sourceMappingURL=rule-installed-view.js.map