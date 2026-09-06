import type { ProjectMetadata } from "../data-layer-project-library.js";
import { dialogButton, errorMessage } from "./controls.js";
import { showProjectDialog } from "./focus.js";
import { metadataFields, readMetadata, writeMetadata } from "./metadata.js";

interface EditProjectDialog {
  projectId: string;
  name: string;
  metadata: ProjectMetadata;
  save(values: ProjectMetadata): string;
  undo(): Promise<ProjectMetadata>;
  restoreFocus(): void;
}

export function openEditProjectDialog(options: EditProjectDialog): void {
  const dialog = document.createElement("dialog");
  const heading = document.createElement("h4");
  const form = document.createElement("form");
  const fields = metadataFields(form, options.metadata);
  let undoPending = false;
  const save = dialogButton("Save project details", `Save details for ${options.name}`, () => {
    try {
      heading.textContent = options.save(readMetadata(fields));
      undo.hidden = false;
    } catch (error) { heading.textContent = errorMessage(error); }
  });
  const undo = dialogButton("Undo metadata edit", `Undo metadata edit for ${options.name}`, () => {
    if (undoPending) return;
    undoPending = true;
    undo.disabled = true;
    void options.undo().then(values => {
      writeMetadata(fields, values);
      heading.textContent = `Restored prior metadata for ${options.projectId} through a token-checked Saved Draft.`;
      undo.hidden = true;
    }, error => {
      heading.textContent = `Undo was not applied. ${errorMessage(error)}`;
    }).finally(() => {
      undoPending = false;
      undo.disabled = false;
    });
  });
  const cancel = dialogButton("Close", "Close project details", () => dialog.close());
  heading.textContent = `Edit ${options.name} details`;
  undo.hidden = true;
  form.addEventListener("submit", event => event.preventDefault());
  form.append(save, undo, cancel);
  dialog.append(heading, form);
  showProjectDialog(dialog, fields.name, options.restoreFocus);
}
