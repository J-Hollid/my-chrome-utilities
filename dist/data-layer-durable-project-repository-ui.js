import { openIndexedDbProjectRepository } from "./data-layer-durable-project-repository.js";
const q = (root, selector) => { const element = root.querySelector(selector); if (!element)
    throw new Error(`Missing durable repository control ${selector}.`); return element; };
const text = (error) => error instanceof Error ? error.message : String(error);
const humanBytes = (value) => value < 1024 ? `${value} B` : `${(value / 1024).toFixed(1)} KiB`;
export function installDurableRepositoryStartupFailure(root, error) {
    const message = `Durable project storage unavailable: ${text(error)}`;
    const projects = q(root, "#data-layer-panel-projects"), status = q(root, "#durable-repository-status"), libraryStatus = q(root, "#project-library-status"), open = q(root, "#open-storage-recovery"), dialog = q(root, "#durable-storage-recovery"), close = q(root, "#close-storage-recovery"), result = q(root, "#durable-recovery-result"), explanation = q(root, "#durable-storage-explanation");
    root.querySelectorAll('[role="tabpanel"]').forEach((panel) => { panel.hidden = panel !== projects; });
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
function renderDiagnostics(root, diagnostics) {
    q(root, "#durable-last-saved").textContent = diagnostics.lastSavedAt;
    q(root, "#durable-published-revision").textContent = String(diagnostics.publishedRevision);
    q(root, "#durable-unsaved-command").textContent = diagnostics.unsavedCommand ?? "None";
    q(root, "#durable-project-size").textContent = humanBytes(diagnostics.projectEntityBytes);
    q(root, "#durable-release-size").textContent = humanBytes(diagnostics.releaseBytes);
    q(root, "#durable-fixture-size").textContent = humanBytes(diagnostics.fixtureBytes);
    q(root, "#durable-migration-backup-size").textContent = humanBytes(diagnostics.migrationBackupBytes);
    q(root, "#durable-browser-estimate").textContent = diagnostics.browserEstimate ? `${humanBytes(diagnostics.browserEstimate.usage)} used of ${humanBytes(diagnostics.browserEstimate.quota)}` : "Browser estimate unavailable";
    q(root, "#durable-storage-explanation").textContent = diagnostics.explanation;
}
export async function mountDurableProjectRepositoryUi(root, factory = globalThis.indexedDB, existing) {
    const repository = existing ?? await openIndexedDbProjectRepository(factory), status = q(root, "#durable-repository-status"), open = q(root, "#open-storage-recovery"), dialog = q(root, "#durable-storage-recovery"), close = q(root, "#close-storage-recovery"), retry = q(root, "#retry-durable-save"), reject = q(root, "#reject-durable-save"), exportUnsaved = q(root, "#export-unsaved-draft"), exportBackup = q(root, "#export-repository-backup"), diagnose = q(root, "#open-storage-diagnostics"), reviewDeleteBackup = q(root, "#review-delete-migration-backup"), deleteBackupReview = q(root, "#delete-migration-backup-review"), cancelDeleteBackup = q(root, "#cancel-delete-migration-backup"), confirmDeleteBackup = q(root, "#confirm-delete-migration-backup"), result = q(root, "#durable-recovery-result");
    let failure, returnFocus;
    const estimate = async () => { const value = await navigator.storage?.estimate?.(); return typeof value?.usage === "number" && typeof value?.quota === "number" ? { usage: value.usage, quota: value.quota } : undefined; };
    const refresh = async (includeDiagnostics = false) => { const projects = await repository.listProjectMetadata(), active = projects.find(({ active }) => active), backup = includeDiagnostics ? await repository.migrationBackup() : undefined; if (!failure)
        status.textContent = `Durable project storage ready · ${projects.length} project${projects.length === 1 ? "" : "s"}${active ? ` · Active ${active.name}` : ""}`; open.disabled = !active && !failure; reviewDeleteBackup.disabled = backup ? backup.sources.length === 0 : false; if (active && includeDiagnostics)
        renderDiagnostics(root, await repository.storageDiagnostics(active.projectId, await estimate(), failure?.command.label)); };
    const show = async (origin) => { returnFocus = origin; await refresh(true); dialog.showModal(); q(dialog, "#durable-storage-recovery-title").focus(); };
    open.addEventListener("click", () => void show(open));
    close.addEventListener("click", () => { dialog.close(); returnFocus?.focus(); });
    diagnose.addEventListener("click", async () => { await refresh(true); result.textContent = "Storage diagnostics refreshed without deleting project data."; result.focus(); });
    retry.addEventListener("click", async () => { const activeFailure = failure; if (!activeFailure)
        return; try {
        await activeFailure.retry();
        result.textContent = activeFailure.kind === "saved-schema" ? `${activeFailure.command.label} committed to the Saved Schema Library.` : `${activeFailure.command.label} saved. Project switching and publication are available.`;
        failure = undefined;
        retry.disabled = true;
        reject.disabled = true;
        exportUnsaved.disabled = true;
        await refresh(true);
    }
    catch (error) {
        result.textContent = activeFailure.kind === "saved-schema" ? `Retry was not committed; the durable Saved Schema Library remains unchanged. ${text(error)}` : `Retry was not committed; the last Saved Draft remains unchanged. ${text(error)}`;
    } result.focus(); });
    reject.addEventListener("click", async () => { const activeFailure = failure; if (!activeFailure?.reject)
        return; try {
        await activeFailure.reject();
        result.textContent = `Rejected ${activeFailure.command.label}. The last Saved Draft was restored and the unsaved command was discarded.`;
        failure = undefined;
        retry.disabled = true;
        reject.disabled = true;
        exportUnsaved.disabled = true;
        await refresh(true);
    }
    catch (error) {
        result.textContent = `Reject could not restore the last Saved Draft. The unsaved command remains available. ${text(error)}`;
    } result.focus(); });
    exportUnsaved.addEventListener("click", () => { failure?.exportUnsaved(); result.textContent = failure ? failure.kind === "saved-schema" ? `Exported the exact unsaved schema batch for ${failure.projectName}.` : `Exported unsaved Draft for ${failure.projectName}.` : "There is no unsaved operation to export."; result.focus(); });
    exportBackup.addEventListener("click", async () => { const bundle = await repository.exportRepositoryRecoveryBundle(), serialized = JSON.stringify(bundle), link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([serialized], { type: "application/json" })); link.download = "durable-repository-recovery.json"; link.click(); URL.revokeObjectURL(link.href); result.textContent = `Exported parseable recovery data for ${bundle.projects instanceof Array ? bundle.projects.length : 0} projects, all saved schemas, immutable revisions, fixtures, releases, and migration sources.`; result.focus(); });
    reviewDeleteBackup.addEventListener("click", () => { deleteBackupReview.hidden = false; q(deleteBackupReview, "#delete-migration-backup-title").focus(); });
    cancelDeleteBackup.addEventListener("click", () => { deleteBackupReview.hidden = true; result.textContent = "Cancelled. The retained legacy migration backup remains available; current projects are unchanged."; result.focus(); });
    confirmDeleteBackup.addEventListener("click", async () => { try {
        const deleted = await repository.deleteMigrationBackup({ backupId: "legacy-v1", label: "Delete retained legacy migration backup" });
        deleteBackupReview.hidden = true;
        result.textContent = deleted ? "Deleted only the retained legacy migration backup. Current projects, saved schemas, fixtures, releases, and Published revisions are unchanged." : "No retained legacy migration backup was present; current projects are unchanged.";
        await refresh(true);
    }
    catch (error) {
        deleteBackupReview.hidden = false;
        result.textContent = `Migration backup deletion was not committed. The retained backup and current projects remain unchanged. ${text(error)}`;
    } result.focus(); });
    const ui = { repository, refresh, async reportSaveFailure(input, error) { failure = input; const schema = input.kind === "saved-schema"; status.textContent = schema ? `Save failed for ${input.projectName}: ${input.command.label}. The durable Saved Schema Library is unchanged. ${text(error)}` : `Save failed for ${input.projectName}: ${input.command.label}. Last Saved Draft is unchanged. ${text(error)}`; retry.disabled = false; reject.disabled = !input.reject; exportUnsaved.disabled = false; if (input.projectId)
            renderDiagnostics(root, await repository.storageDiagnostics(input.projectId, await estimate(), input.command.label)); await show(input.originControl ?? status); q(dialog, "#durable-recovery-result").textContent = schema ? `${input.command.label} was not committed. Retry the exact batch or export it for recovery.` : `${input.command.label} was not committed. Retry, reject, or export the unsaved Draft.`; } };
    repository.subscribe(() => { void refresh(); });
    repository.subscribeProjectMetadata(() => { void refresh(); });
    repository.subscribeActiveContext(() => { void refresh(); });
    await refresh();
    return ui;
}
//# sourceMappingURL=data-layer-durable-project-repository-ui.js.map