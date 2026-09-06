import type { ProjectMetadata } from "../data-layer-project-library.js";
import { dialogButton, errorMessage } from "./controls.js";
import { showProjectDialog } from "./focus.js";
import { metadataFields, readMetadata } from "./metadata.js";

interface CreateProjectDialog {
  review(values: ProjectMetadata): string;
  create(values: ProjectMetadata): string;
  openStudio(): void;
  restoreFocus(): void;
}

export function openCreateProjectDialog(options: CreateProjectDialog): void {
  const dialog = document.createElement("dialog");
  const heading = document.createElement("h4");
  const form = document.createElement("form");
  const fields = metadataFields(form, { name: "", purpose: "", website: "", owner: "", notes: "" });
  const review = document.createElement("p");
  const confirm = dialogButton("Confirm create project", "Confirm create project", () => {
    if (confirm.disabled) return;
    try {
      review.textContent = options.create(readMetadata(fields));
      confirm.disabled = true;
    } catch (error) { review.textContent = errorMessage(error); }
  });
  const prepare = dialogButton("Review create project", "Review create project", () => {
    try {
      review.textContent = options.review(readMetadata(fields));
      confirm.disabled = false;
      confirm.focus();
    } catch (error) {
      review.textContent = errorMessage(error);
      confirm.disabled = true;
    }
  });
  const openStudio = dialogButton("Open in Specification Studio", "Open new project in Specification Studio", options.openStudio);
  const cancel = dialogButton("Close", "Close create project", () => dialog.close());
  heading.textContent = "Create project";
  confirm.disabled = true;
  form.addEventListener("submit", event => event.preventDefault());
  form.append(prepare, review, confirm, openStudio, cancel);
  dialog.append(heading, form);
  showProjectDialog(dialog, fields.name, options.restoreFocus);
}
