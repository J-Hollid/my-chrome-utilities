import { dialogButton, errorMessage } from "./controls.js";
import { showProjectDialog } from "./focus.js";
export function openImportProjectDialog(options) {
    const dialog = document.createElement("dialog");
    const heading = document.createElement("h4");
    const summary = document.createElement("p");
    const name = document.createElement("input");
    const commit = dialogButton("Import as new project", "Import as new project", () => {
        if (commit.disabled)
            return;
        commit.disabled = true;
        cancelCommit.hidden = false;
        void options.commit(name.value.trim(), message => { summary.textContent = message; }).then(message => {
            summary.textContent = message;
        }, error => {
            summary.textContent = `Import was not committed. ${errorMessage(error)}`;
        }).finally(() => { cancelCommit.hidden = true; });
    });
    const cancelCommit = dialogButton("Cancel import", "Cancel project import", options.cancel);
    const cancel = dialogButton("Close import review", "Close import review", () => dialog.close());
    cancelCommit.hidden = true;
    heading.textContent = "Review project import";
    heading.tabIndex = -1;
    name.value = options.targetName;
    name.setAttribute("aria-label", "Unique target project name");
    summary.textContent = options.summary;
    commit.disabled = options.blocked;
    dialog.append(heading, summary, name, commit, cancelCommit, cancel);
    showProjectDialog(dialog, heading, options.restoreFocus, options.dispose);
}
export function openImportErrorDialog(error, restoreFocus) {
    const dialog = document.createElement("dialog");
    const heading = document.createElement("h4");
    const summary = document.createElement("p");
    const commit = dialogButton("Import as new project", "Import invalid project", () => { });
    const close = dialogButton("Close import review", "Close import review", () => dialog.close());
    heading.textContent = "Review project import";
    heading.tabIndex = -1;
    summary.textContent = `Import was not committed. ${errorMessage(error)} Choose a readable version 2 JSON bundle or version 3 ZIP archive and review it again.`;
    commit.disabled = true;
    dialog.append(heading, summary, commit, close);
    showProjectDialog(dialog, heading, restoreFocus);
}
//# sourceMappingURL=import.js.map