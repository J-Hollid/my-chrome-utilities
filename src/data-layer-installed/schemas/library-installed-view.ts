export interface SchemaLibraryElements {
  importButton:HTMLButtonElement | null;
  importFile:HTMLInputElement | null;
  importReview:HTMLDialogElement | null;
  importReviewSummary:HTMLOutputElement | null;
  replaceLibrary:HTMLButtonElement | null;
  appendLibrary:HTMLButtonElement | null;
  cancelImport:HTMLButtonElement | null;
  deleteReview:HTMLDialogElement | null;
  deleteReviewSummary:HTMLOutputElement | null;
  confirmDelete:HTMLButtonElement | null;
  cancelDelete:HTMLButtonElement | null;
  exportButton:HTMLButtonElement | null;
  exportChoices:HTMLDialogElement | null;
  exportReview:HTMLDialogElement | null;
}

/** Owns optional installed DOM for Schema library transfer and deletion reviews. */
export function installSchemaLibraryElements(root:ParentNode):SchemaLibraryElements {
  const ownerDocument = (root as ParentNode & { ownerDocument?:Document }).ownerDocument
    ?? ("createElement" in root ? root as Document : undefined);
  const owned = <K extends keyof HTMLElementTagNameMap>(selector:string, tag:K):HTMLElementTagNameMap[K] | null =>
    root.querySelector<HTMLElementTagNameMap[K]>(selector) ?? ownerDocument?.createElement(tag) ?? null;
  const elements:SchemaLibraryElements = {
    importButton:root.querySelector<HTMLButtonElement>("#import-schema"),
    importFile:root.querySelector<HTMLInputElement>("#schema-library-import-file"),
    importReview:owned("#schema-import-review", "dialog"),
    importReviewSummary:owned("#schema-import-review-summary", "output"),
    replaceLibrary:owned("#replace-schema-library", "button"),
    appendLibrary:owned("#append-schema-library", "button"),
    cancelImport:owned("#cancel-schema-import", "button"),
    deleteReview:owned("#schema-delete-review", "dialog"),
    deleteReviewSummary:owned("#schema-delete-review-summary", "output"),
    confirmDelete:owned("#confirm-schema-delete", "button"),
    cancelDelete:owned("#cancel-schema-delete", "button"),
    exportButton:root.querySelector<HTMLButtonElement>("#export-schema"),
    exportChoices:owned("#schema-export-choices", "dialog"),
    exportReview:owned("#schema-export-compatibility-review", "dialog"),
  };
  installReview(ownerDocument, elements.importReview, "schema-import-review", "Import Schema Library",
    elements.importReviewSummary, elements.replaceLibrary, elements.cancelImport);
  if (elements.importReview && elements.appendLibrary && !elements.appendLibrary.isConnected) {
    elements.appendLibrary.id = "append-schema-library";
    elements.appendLibrary.type = "button";
    elements.appendLibrary.textContent = "Append";
    elements.importReview.append(elements.appendLibrary);
  }
  installReview(ownerDocument, elements.deleteReview, "schema-delete-review", "Delete schema",
    elements.deleteReviewSummary, elements.confirmDelete, elements.cancelDelete);
  for (const [dialog, id] of [[elements.exportChoices, "schema-export-choices"],
    [elements.exportReview, "schema-export-compatibility-review"]] as const) {
    if (dialog && !dialog.isConnected) { dialog.id = id; ownerDocument?.body.append(dialog); }
  }
  return elements;
}

export interface SchemaLibraryActions {
  openImportFile():void; readImportFile():Promise<void>; replaceImport():void; appendImport():void;
  cancelImport():void; confirmDeletion():void; cancelDeletion():void; requestExport():void;
}

export function bindSchemaLibraryElements(lifecycle:{ listen(target:EventTarget|null|undefined, type:string,
  listener:(event:Event)=>void):void }, elements:SchemaLibraryElements, actions:SchemaLibraryActions):void {
  lifecycle.listen(elements.importButton, "click", () => actions.openImportFile());
  lifecycle.listen(elements.importFile, "change", () => { void actions.readImportFile(); });
  lifecycle.listen(elements.replaceLibrary, "click", () => actions.replaceImport());
  lifecycle.listen(elements.appendLibrary, "click", () => actions.appendImport());
  lifecycle.listen(elements.cancelImport, "click", () => actions.cancelImport());
  lifecycle.listen(elements.confirmDelete, "click", () => actions.confirmDeletion());
  lifecycle.listen(elements.cancelDelete, "click", () => actions.cancelDeletion());
  lifecycle.listen(elements.exportButton, "click", () => actions.requestExport());
}

function installReview(ownerDocument:Document|undefined, dialog:HTMLDialogElement|null, id:string, heading:string,
  summary:HTMLOutputElement|null, confirm:HTMLButtonElement|null, cancel:HTMLButtonElement|null):void {
  if (!dialog || dialog.isConnected) return;
  dialog.id = id;
  const title = ownerDocument?.createElement("h4");
  if (title) { title.textContent = heading; dialog.append(title); }
  if (summary) { summary.id = `${id}-summary`; dialog.append(summary); }
  if (confirm) { confirm.id = `confirm-${id.replace("-review", "")}`; confirm.type = "button";
    confirm.textContent = "Confirm"; dialog.append(confirm); }
  if (cancel) { cancel.id = `cancel-${id.replace("-review", "")}`; cancel.type = "button";
    cancel.textContent = "Cancel"; dialog.append(cancel); }
  ownerDocument?.body.append(dialog);
}
