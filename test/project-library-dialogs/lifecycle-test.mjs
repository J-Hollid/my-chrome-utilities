import assert from "node:assert/strict";
import { createSchemaLibraryFakeDocument } from "../support/schema-library-fake-dom.mjs";
import { showProjectDialog } from "../../dist/project-library-dialogs/focus.js";
import { openEditProjectDialog } from "../../dist/project-library-dialogs/edit.js";
import { openCreateProjectDialog } from "../../dist/project-library-dialogs/create.js";
import { openSwitchProjectDialog } from "../../dist/project-library-dialogs/switch.js";
import { openImportProjectDialog } from "../../dist/project-library-dialogs/import.js";

// This bounded adapter checks callback contracts. Installed Chrome checks native focus.
const fake = createSchemaLibraryFakeDocument();
globalThis.document = fake.document;
document.body = fake.element();
const control = (dialog, text) => {
  const result = dialog.querySelectorAll("button").find(item => item.textContent === text);
  assert.ok(result, `Missing ${text}`);
  return result;
};
const current = () => document.body.children.at(-1);
const close = dialog => { dialog.close(); dialog.dispatch("close"); };
const tick = () => new Promise(resolve => setImmediate(resolve));
const metadata = { name: "Retail", purpose: "Purpose", website: "example.test", owner: "Team", notes: "Notes" };

for (const completion of ["close control", "native close", "Escape"]) {
  const dialog = document.createElement("dialog"), initial = fake.element();
  let released = 0, focused = 0;
  showProjectDialog(dialog, initial, () => { focused++; }, () => { released++; });
  if (completion === "Escape") dialog.dispatch("cancel");
  close(dialog);
  dialog.dispatch("close");
  assert.equal(released, 1, `${completion} releases once`);
  assert.equal(focused, 1, `${completion} restores focus once`);
  assert.equal(dialog.isConnected, false);
  assert.equal(initial.focused, true);
}

let saved = [], undone = 0;
openEditProjectDialog({ projectId: "retail", name: "Retail", metadata,
  save: values => { saved.push(values); return "Saved retail"; },
  undo: async () => { undone++; return { ...metadata, notes: "Restored" }; },
  restoreFocus() {} });
let dialog = current();
const fields = dialog.find(item => item.name === "notes");
fields.value = "Changed";
control(dialog, "Save project details").click();
assert.deepEqual(saved, [{ ...metadata, notes: "Changed" }]);
control(dialog, "Undo metadata edit").click();
control(dialog, "Undo metadata edit").click();
await tick();
assert.equal(undone, 1, "one pending Undo invokes the coordinator once");
assert.equal(fields.value, "Restored");
close(dialog);

let reviewed = [], created = [], opened = 0;
openCreateProjectDialog({ review: values => { reviewed.push(values); if (!values.name.trim()) throw Error("Blank name"); return "Impact"; },
  create: values => { created.push(values); return "Created"; },
  openStudio: () => { opened++; }, restoreFocus() {} });
dialog = current();
control(dialog, "Review create project").click();
assert.equal(control(dialog, "Confirm create project").disabled, true);
dialog.find(item => item.name === "name").value = "New";
control(dialog, "Review create project").click();
control(dialog, "Confirm create project").click();
assert.equal(reviewed.length, 2);
assert.equal(created[0].name, "New");
assert.equal(control(dialog, "Confirm create project").disabled, true);
control(dialog, "Open in Specification Studio").click();
assert.equal(opened, 1);
close(dialog);

let switched = 0, resolved = [];
openSwitchProjectDialog({ name: "Trade", summary: "Pending", blocked: () => false, pendingLabel: "Edit",
  confirm: () => { switched++; }, resolve: choice => { resolved.push(choice); return "Resolved"; },
  restoreFocus() {}, focusSelection() {} });
dialog = current();
assert.equal(control(dialog, "Switch to Trade").disabled, true);
control(dialog, "Merge Edit").click();
assert.deepEqual(resolved, ["merge"]);
assert.equal(control(dialog, "Switch to Trade").disabled, false);
control(dialog, "Switch to Trade").click();
assert.equal(switched, 1);
close(dialog);

let commits = [], cancelled = 0, disposed = 0, settle;
openImportProjectDialog({ targetName: "Copy", summary: "Valid", blocked: false,
  commit: (name, progress) => { commits.push(name); progress("Working"); return new Promise(resolve => { settle = resolve; }); },
  cancel: () => { cancelled++; }, dispose: () => { disposed++; }, restoreFocus() {} });
dialog = current();
control(dialog, "Import as new project").click();
control(dialog, "Import as new project").click();
assert.deepEqual(commits, ["Copy"], "one pending import invokes the coordinator once");
control(dialog, "Cancel import").click();
assert.equal(cancelled, 1);
close(dialog);
dialog.dispatch("close");
assert.equal(disposed, 1);
settle("Imported");
await tick();
console.log("Project Library dialog callback and lifecycle tests passed");
