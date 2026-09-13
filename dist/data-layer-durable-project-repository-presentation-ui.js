const q = (root, selector) => { const element = root.querySelector(selector); if (!element)
    throw new Error(`Missing durable repository control ${selector}.`); return element; };
const humanBytes = (value) => value < 1024 ? `${value} B` : `${(value / 1024).toFixed(1)} KiB`;
export function durableStorageDiagnosticsDisplay(input) {
    return { lastSavedAt: input.lastSavedAt, publishedRevision: String(input.publishedRevision),
        unsavedCommand: input.unsavedCommand ?? "None", projectSize: humanBytes(input.projectEntityBytes),
        releaseSize: humanBytes(input.releaseBytes), fixtureSize: humanBytes(input.fixtureBytes),
        migrationBackupSize: humanBytes(input.migrationBackupBytes), browserEstimate: input.browserEstimate
            ? `${humanBytes(input.browserEstimate.usage)} used of ${humanBytes(input.browserEstimate.quota)}`
            : "Browser estimate unavailable", explanation: input.explanation };
}
export function createDurableRepositoryPresentation(root, callbacks) {
    const ownerDocument = root.ownerDocument, dialog = root.querySelector("#durable-storage-recovery") ?? ownerDocument?.querySelector("#durable-storage-recovery");
    if (!dialog)
        throw new Error("Missing durable repository control #durable-storage-recovery.");
    const status = q(root, "#durable-repository-status"), open = q(root, "#open-storage-recovery"), close = q(dialog, "#close-storage-recovery"), retry = q(dialog, "#retry-durable-save"), reject = q(dialog, "#reject-durable-save"), exportUnsaved = q(dialog, "#export-unsaved-draft"), exportBackup = q(dialog, "#export-repository-backup"), diagnose = q(dialog, "#open-storage-diagnostics"), reviewDeleteBackup = q(dialog, "#review-delete-migration-backup"), deleteBackupReview = q(dialog, "#delete-migration-backup-review"), cancelDeleteBackup = q(dialog, "#cancel-delete-migration-backup"), confirmDeleteBackup = q(dialog, "#confirm-delete-migration-backup"), result = q(dialog, "#durable-recovery-result");
    let returnFocus;
    open.addEventListener("click", () => void callbacks.open(open));
    close.addEventListener("click", () => callbacks.close());
    diagnose.addEventListener("click", () => void callbacks.diagnose());
    retry.addEventListener("click", () => void callbacks.retry());
    reject.addEventListener("click", () => void callbacks.reject());
    exportUnsaved.addEventListener("click", () => callbacks.exportUnsaved());
    exportBackup.addEventListener("click", () => void callbacks.exportBackup());
    reviewDeleteBackup.addEventListener("click", () => callbacks.reviewDeleteBackup());
    cancelDeleteBackup.addEventListener("click", () => callbacks.cancelDeleteBackup());
    confirmDeleteBackup.addEventListener("click", () => void callbacks.confirmDeleteBackup());
    return { status(message) { status.textContent = message; }, result(message, focus = false) { result.textContent = message; if (focus)
            result.focus(); },
        recoveryControls(input) { retry.disabled = !input.retry; reject.disabled = !input.reject; exportUnsaved.disabled = !input.exportUnsaved; },
        recoveryAvailable(available) { open.disabled = !available; }, backupAvailable(available) { reviewDeleteBackup.disabled = !available; },
        diagnostics(input) { const display = durableStorageDiagnosticsDisplay(input); q(dialog, "#durable-last-saved").textContent = display.lastSavedAt; q(dialog, "#durable-published-revision").textContent = display.publishedRevision; q(dialog, "#durable-unsaved-command").textContent = display.unsavedCommand; q(dialog, "#durable-project-size").textContent = display.projectSize; q(dialog, "#durable-release-size").textContent = display.releaseSize; q(dialog, "#durable-fixture-size").textContent = display.fixtureSize; q(dialog, "#durable-migration-backup-size").textContent = display.migrationBackupSize; q(dialog, "#durable-browser-estimate").textContent = display.browserEstimate; q(dialog, "#durable-storage-explanation").textContent = display.explanation; },
        show(origin) { returnFocus = origin; dialog.showModal(); q(dialog, "#durable-storage-recovery-title").focus(); },
        close() { dialog.close(); returnFocus?.focus(); }, showDeleteReview() { deleteBackupReview.hidden = false; q(deleteBackupReview, "#delete-migration-backup-title").focus(); }, hideDeleteReview() { deleteBackupReview.hidden = true; } };
}
export function installDurableRepositoryStartupFailurePresentation(root, message) {
    const projects = q(root, "#data-layer-panel-projects"), status = q(root, "#durable-repository-status"), libraryStatus = q(root, "#project-library-status"), open = q(root, "#open-storage-recovery"), dialog = q(root, "#durable-storage-recovery"), close = q(root, "#close-storage-recovery"), result = q(root, "#durable-recovery-result"), explanation = q(root, "#durable-storage-explanation");
    (root.querySelector("#workspace-panel-data-layer") ?? root).querySelectorAll('[role="tabpanel"]').forEach((panel) => { panel.hidden = panel !== projects; });
    const tab = root.querySelector("#data-layer-view-projects");
    if (tab) {
        tab.setAttribute("aria-selected", "true");
        tab.tabIndex = 0;
    }
    projects.querySelectorAll("button,input,select,textarea").forEach((control) => { control.disabled = true; });
    status.textContent = message;
    libraryStatus.textContent = `Projects are unavailable. ${message}`;
    explanation.textContent = `${message}. No project was loaded and Web Storage was not used as canonical fallback.`;
    result.textContent = message;
    open.disabled = false;
    close.disabled = false;
    open.addEventListener("click", () => { dialog.showModal(); q(dialog, "#durable-storage-recovery-title").focus(); });
    close.addEventListener("click", () => { dialog.close(); open.focus(); });
}
//# sourceMappingURL=data-layer-durable-project-repository-presentation-ui.js.map