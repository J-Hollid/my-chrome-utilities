import {
  createSchema,
  discardSchemaWorkingDraft,
  duplicateSchemaRevision,
  inspectSchemaRename,
  publishSchemaWorkingDraft,
  restoreSchemaRevisionDraft,
  schemaInheritanceConflict,
  schemaInheritanceError,
  schemaRevision,
  schemaRevisionChoices,
  updateSchemaWorkingDraft,
  setSchemaDescription,
  type SchemaDefinition,
} from "../../utilities/data-layer/schemas.js";
import type { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import type { SchemaLibraryController } from "./library-controller.js";

export interface SchemaLibraryEditorPorts {
  root:ParentNode;
  document:Document|undefined;
  library:SchemaLibraryController;
  canonical:SchemaCanonicalEditorController;
  active():SchemaDefinition;
  editorDraft(schema:SchemaDefinition):SchemaDefinition;
  replaceActive(schema:SchemaDefinition):void;
  persist():void;
  renderAll():void;
  renderProperty():void;
  renderInheritance(schema:SchemaDefinition):void;
  revisionVersion():number;
  openSpecification(schema:SchemaDefinition, surface:`published:${number}`|`historical:${number}`|"working-draft", trigger:HTMLButtonElement):void;
  listen(target:HTMLElement, type:string, listener:EventListener):void;
  proposeName(schema:SchemaDefinition, name:string):SchemaDefinition;
  persistIfStored():void;
  persistLibraries():void;
  closeCanonical():void;
  beginSettlement(schemaId:string):number;
  clearSettlement(schemaId:string, settlement?:number):void;
  settle?(schemaId:string):Promise<void>;
  mounted():boolean;
  renderCanonical():void;
  revalidate():number;
  rules():readonly { id:string }[];
  addPublishedRules(schema:SchemaDefinition):boolean;
  withParent(schema:SchemaDefinition, parentSchemaId:string|undefined):SchemaDefinition;
}

export class SchemaLibraryEditor {
  readonly #ports:SchemaLibraryEditorPorts;
  pendingRestoration:{ schemaId:string; version:number }|undefined;
  constructor(ports:SchemaLibraryEditorPorts) { this.#ports=ports; }
  render():void {
    const p=this.#ports, root=p.root, document=p.document, library=p.library, canonical=p.canonical,
      schema=library.activeSchemaId ? p.active() : library.draft, draft=schema?.workingDraft, presented=schema ? p.editorDraft(schema) : undefined,
      editor=root.querySelector<HTMLElement>("#schema-editor"), detail=root.querySelector<HTMLElement>("#schema-detail"), empty=root.querySelector<HTMLElement>("#schema-detail-empty"),
      name=root.querySelector<HTMLInputElement>("#schema-editor-name"), status=root.querySelector<HTMLElement>("#schema-editor-status"),
      description=root.querySelector<HTMLTextAreaElement>("#schema-editor-description"), descriptionOrigin=root.querySelector<HTMLElement>("#schema-description-origin"),
      target=root.querySelector<HTMLSelectElement>("#schema-editor-target"), onlyDeclared=root.querySelector<HTMLInputElement>("#schema-only-declared-properties"),
      parentSelect=root.querySelector<HTMLSelectElement>("#schema-editor-parent"), provenance=root.querySelector<HTMLElement>("#schema-inheritance-provenance"),
      overrides=root.querySelector<HTMLElement>("#schema-rule-overrides"), overrideList=root.querySelector<HTMLElement>("#schema-rule-override-list"),
      save=root.querySelector<HTMLButtonElement>("#save-schema"), saveReason=root.querySelector<HTMLElement>("#save-schema-reason"),
      build=root.querySelector<HTMLButtonElement>("#build-specification"), revisions=root.querySelector<HTMLSelectElement>("#schema-revision-selector"),
      duplicate=root.querySelector<HTMLButtonElement>("#duplicate-schema-revision"), restore=root.querySelector<HTMLButtonElement>("#restore-schema-revision"),
      buildHistorical=root.querySelector<HTMLButtonElement>("#build-historical-specification"), closeSummary=root.querySelector<HTMLElement>("#close-schema-editor-review-summary"),
      confirmRevision=root.querySelector<HTMLButtonElement>("#confirm-schema-revision"), comparison=root.querySelector<HTMLElement>("#schema-revision-comparison"),
      nameAssistance=root.querySelector<HTMLElement>("#schema-editor-name-assistance");
    if (editor) editor.hidden=!schema; if (detail) detail.hidden=false; if (empty) empty.hidden=Boolean(schema); if (name) name.value=draft?.name ?? schema?.name ?? "";
    if (status) { const pending=schema?.workingDraft?.pendingChanges.length ?? 0, lifecycle=schema?.published === false ? `Unpublished new schema draft · ${pending} pending changes`
      : schema?.workingDraft ? `Working draft based on revision ${schema.version} · ${pending} pending changes` : schema ? `Current revision ${schema.version} · no working draft` : "Unsaved new schema",
      revision=canonical.editor?.load().revision; status.textContent=canonical.editor && revision !== undefined ? `${lifecycle} · ${canonical.editor.label} · Schema revision ${revision}` : lifecycle; }
    if (description) description.value=draft?.documentation?.description ?? schema?.documentation?.description ?? "";
    if (descriptionOrigin) descriptionOrigin.textContent=draft?.documentation?.description ? "Working draft" : schema?.documentation?.description ? `Revision ${schema.version}` : "No description";
    if (target) target.value=draft?.assignments[0]?.target ?? schema?.assignments[0]?.target ?? "payload"; if (onlyDeclared && presented) onlyDeclared.checked=presented.document.additionalProperties === false;
    if (parentSelect && presented && document) { const none=document.createElement("option"); none.value=""; none.textContent="No parent"; parentSelect.replaceChildren(none,...library.schemas.filter(({ id }) => id !== presented.id).map((candidate) => {
      const option=document.createElement("option"); option.value=candidate.id; option.textContent=`${candidate.name} v${candidate.version}`; return option; })); parentSelect.value=presented.parentSchemaId ?? ""; }
    const parent=presented?.parentSchemaId ? library.schemas.find(({ id }) => id === presented.parentSchemaId) : undefined;
    if (provenance) provenance.textContent=parent ? `Inherited rules originate in ${parent.name} v${parent.version}. Local rules override only after conflicts are resolved.` : "Local schema only";
    if (overrides) overrides.hidden=!parent;
    if (overrideList && document) overrideList.replaceChildren(...Object.keys(parent?.document.properties ?? {}).map((property) => { const label=document.createElement("label"), select=document.createElement("select"); select.setAttribute("aria-label", `${property} inherited rule override`);
      select.replaceChildren(...(["inherit","enabled","disabled"] as const).map((state) => { const option=document.createElement("option"); option.value=state; option.textContent=state === "inherit" ? "Inherit" : state === "enabled" ? "Enabled in this schema" : "Disabled in this schema"; return option; }));
      select.value=presented?.inheritedRuleOverrides?.[property] ?? "inherit"; p.listen(select,"change",() => { if (!library.activeSchemaId) return; const current=p.active(), currentDraft=p.editorDraft(current); p.replaceActive(updateSchemaWorkingDraft(current,
        { inheritedRuleOverrides:{ ...(currentDraft.inheritedRuleOverrides ?? {}), [property]:select.value as "inherit"|"enabled"|"disabled" } }, `Change inherited rule override ${property}`)); p.persist(); p.renderAll(); }); label.append(`${property}: `,select); return label; }));
    if (presented) p.renderInheritance(presented);
    if (schema && presented) { const candidates=[...library.schemas.filter(({ id }) => id !== schema.id),presented], inheritance=schemaInheritanceError(presented,candidates) ?? schemaInheritanceConflict(presented,candidates), rename=inspectSchemaRename(schema,library.schemas,name?.value ?? presented.name), hasProperties=Object.keys(presented.document.properties ?? {}).length > 0, ready=rename.ready && hasProperties && !inheritance;
      if (save) { save.disabled=!ready; save.textContent=schema.published === false ? "Publish schema" : "Publish revision"; } if (saveReason) saveReason.textContent=!rename.ready ? rename.assistance : !hasProperties ? "Add at least one property" : inheritance ?? "Ready to save"; }
    else if (save) save.disabled=true;
    const pending=draft?.pendingChanges ?? []; if (build) { build.hidden=!draft; build.onclick=schema && draft ? () => p.openSpecification(schema,"working-draft",build) : null; }
    const history=schema ? schemaRevisionChoices(schema) : []; if (revisions && document) { const selected=Number(revisions.value); revisions.replaceChildren(...history.map((version) => { const option=document.createElement("option"); option.value=String(version); option.textContent=`Revision ${version}`; return option; })); revisions.value=String(history.includes(selected) ? selected : history[0] ?? ""); }
    if (duplicate) duplicate.disabled=!history.length; if (restore) restore.disabled=!history.length; if (buildHistorical) { buildHistorical.disabled=!history.length; buildHistorical.onclick=schema && history.length ? () => p.openSpecification(schema,`historical:${p.revisionVersion()}`,buildHistorical) : null; }
    if (closeSummary) closeSummary.textContent=draft ? `${pending.length} pending change${pending.length === 1 ? "" : "s"}` : "No pending changes";
    if (confirmRevision && schema) confirmRevision.textContent=schema.published === false ? "Publish revision 1" : `Publish revision ${schema.version + 1}`;
    if (comparison && schema) { const version=p.revisionVersion(), historical=schemaRevision(schema,version); comparison.textContent=`Revision ${version} compared with current revision ${schema.version}. ${Object.keys(historical?.document.properties ?? {}).length} historical properties; ${Object.keys(schema.document.properties ?? {}).length} current properties.`; }
    if (nameAssistance && schema) nameAssistance.textContent=inspectSchemaRename(schema,library.schemas,name?.value ?? draft?.name ?? schema.name).assistance; p.renderProperty();
  }
  persistDraft():void { const p=this.#ports, library=p.library; if (!library.draft && !library.activeSchemaId) return; const schema=p.active(), name=p.root.querySelector<HTMLInputElement>("#schema-editor-name");
    p.replaceActive(p.proposeName(schema,name?.value ?? schema.name)); p.persistIfStored(); this.#refreshSaveState(); }
  updateName():void { const p=this.#ports, library=p.library; if (!library.draft && !library.activeSchemaId) return; const schema=p.active(), name=p.root.querySelector<HTMLInputElement>("#schema-editor-name")?.value ?? schema.name;
    if (p.canonical.editor) { const projection={ ...p.editorDraft(schema), name }; library.draft=structuredClone(projection); this.#refreshSaveState(projection); void p.canonical.beginProjectionPersistence(p.canonical.editor,projection,"schema name"); return; } this.persistDraft(); }
  saveDescription():void { const p=this.#ports, schema=p.active(), input=p.root.querySelector<HTMLTextAreaElement>("#schema-editor-description"); if (!p.library.draft && !p.library.activeSchemaId) return;
    const documentation=setSchemaDescription(schema.workingDraft?.documentation ?? schema.documentation ?? {},input?.value ?? ""); p.replaceActive(updateSchemaWorkingDraft(schema,{ documentation },"Update schema description"));
    const tracks=Boolean(p.canonical.editor && p.settle), settlement=tracks ? p.beginSettlement(schema.id) : undefined; p.persistIfStored(); p.renderAll();
    if (tracks) void p.settle!(schema.id).then(() => { if (p.mounted()) { p.clearSettlement(schema.id,settlement); if (p.canonical.editor) p.renderCanonical(); } },() => {}); }
  updateTarget():void { const p=this.#ports, library=p.library; if (!library.draft && !library.activeSchemaId) return; const schema=p.active(), target:"raw input"|"payload"=p.root.querySelector<HTMLSelectElement>("#schema-editor-target")?.value === "raw input" ? "raw input" : "payload",
    assignments=(schema.workingDraft?.assignments ?? schema.assignments).map((assignment) => ({ ...assignment,target })); p.replaceActive(updateSchemaWorkingDraft(schema,{ assignments },"Update validation target")); p.persistIfStored(); p.renderAll(); }
  changeParent():void { const p=this.#ports, library=p.library; if (!library.draft && !library.activeSchemaId) return; const schema=p.active(), changed=p.withParent(p.editorDraft(schema),p.root.querySelector<HTMLSelectElement>("#schema-editor-parent")?.value || undefined);
    p.replaceActive(updateSchemaWorkingDraft(schema,{ parentSchemaId:changed.parentSchemaId },"Change parent schema")); p.persistIfStored(); p.renderAll(); }
  changeAdditionalProperties():void { const p=this.#ports, library=p.library; if (!library.draft && !library.activeSchemaId) return; const schema=p.active(), draft=p.editorDraft(schema), { additionalProperties:_old,...document }=draft.document,
    checked=p.root.querySelector<HTMLInputElement>("#schema-only-declared-properties")?.checked; p.replaceActive(updateSchemaWorkingDraft(schema,{ document:checked ? { ...document,additionalProperties:false } : document },"Change additional-property policy"));
    const tracks=Boolean(p.canonical.editor && p.settle), settlement=tracks ? p.beginSettlement(schema.id) : undefined; p.persistIfStored(); p.renderAll(); if (tracks) { const save=p.root.querySelector<HTMLButtonElement>("#save-schema"); if (save) save.disabled=true;
      void p.settle!(schema.id).then(() => { if (p.mounted()) { p.clearSettlement(schema.id,settlement); p.renderAll(); } },() => {}); } }
  openRevisionReview():void { const p=this.#ports, library=p.library; this.render(); const draft=library.draft ?? (library.activeSchemaId ? p.active() : undefined); if (!draft) return; const existing=library.schemas.find(({ id }) => id === draft.id), persisted=existing ? p.editorDraft(existing) : draft,
    pending=persisted.workingDraft?.pendingChanges.filter((change) => !change.startsWith("Rename schema from ")).join("; ") ?? "", proposed=persisted.workingDraft?.name ?? persisted.name,
    rename=existing && proposed !== existing.name ? ` Rename schema from ${existing.name} to ${proposed}.` : "", summary=p.root.querySelector<HTMLElement>("#schema-revision-review-summary"), dialog=p.root.querySelector<HTMLDialogElement>("#schema-revision-review");
    if (summary) summary.textContent=existing?.published === false ? `${draft.name} draft will be published as current revision 1.` : existing ? `${existing.name} working draft will be compared with current revision ${existing.version}; confirmation publishes revision ${existing.version + 1}.${rename}${pending ? ` Pending changes: ${pending}.` : ""}` : `${draft.name} will be published as current revision 1.`;
    if (dialog) dialog.hidden=false; dialog?.showModal(); }
  publish(closeEditor=false):SchemaDefinition { const p=this.#ports, library=p.library, transient=library.activeIndex()<0, current=p.active(), presented=p.editorDraft(current), publishable=transient ? { ...current,id:createSchema(presented.name.trim(),1,presented.document).id,published:false } : current,
    published=publishSchemaWorkingDraft(publishable); if (transient) { library.schemas=[...library.schemas,published]; library.activeSchemaId=published.id; library.draft=structuredClone(published); } else p.replaceActive(published);
    if (p.addPublishedRules(published)) p.persistLibraries(); else p.persist(); this.#closeRevisionDialog(); if (closeEditor) { p.closeCanonical(); library.activeSchemaId=undefined; library.draft=undefined; } p.renderAll(); const revalidated=p.revalidate();
    const result=p.root.querySelector<HTMLElement>("#schema-result"); if (result) result.textContent=`Published ${published.name} revision ${published.version}. Revalidated ${revalidated} current Live events.`; return published; }
  confirmRevision():void { const p=this.#ports; if (this.pendingRestoration) { const pending=this.pendingRestoration; this.pendingRestoration=undefined; if (p.active().id !== pending.schemaId) throw new Error("The schema selected for restoration is no longer active.");
      p.replaceActive(restoreSchemaRevisionDraft(p.active(),pending.version)); p.persist(); this.#closeRevisionDialog(); p.renderAll(); return; } this.publish(true); }
  cancelRevision():void { this.pendingRestoration=undefined; this.#closeRevisionDialog(); }
  discardTransient():void { const p=this.#ports; p.library.draft=undefined; p.library.activeSchemaId=undefined; this.#closeDialog("#close-schema-editor-review"); p.renderAll(); }
  keepEditing():void { this.#closeDialog("#close-schema-editor-review"); this.#ports.root.querySelector<HTMLInputElement>("#schema-editor-name")?.focus(); }
  closeEditor():void { const p=this.#ports; if (!p.library.draft && !p.library.activeSchemaId) return; p.library.activeSchemaId=undefined; p.library.draft=undefined; p.closeCanonical(); p.renderAll(); const result=p.root.querySelector<HTMLElement>("#schema-result"); if (result) result.textContent="Working draft retained without publishing."; }
  discardWorking():void { const p=this.#ports; if (p.library.activeIndex()>=0) { p.replaceActive(discardSchemaWorkingDraft(p.active())); p.persist(); } p.library.activeSchemaId=undefined; p.library.draft=undefined; this.#closeDialog("#close-schema-editor-review"); p.renderAll(); }
  duplicateRevision():void { const p=this.#ports, duplicate=duplicateSchemaRevision(p.active(),p.revisionVersion(),p.library.schemas); p.library.schemas=[...p.library.schemas,duplicate]; p.library.activeSchemaId=duplicate.id; p.library.draft=structuredClone(duplicate); p.persist(); p.renderAll(); }
  restoreRevision():void { const p=this.#ports, schema=p.active(), version=p.revisionVersion(); this.pendingRestoration={ schemaId:schema.id,version }; const summary=p.root.querySelector<HTMLElement>("#schema-revision-review-summary"), dialog=p.root.querySelector<HTMLDialogElement>("#schema-revision-review");
    if (summary) summary.textContent=`${schema.name} revision ${version} will replace ${schema.workingDraft?.pendingChanges.length ?? 0} pending draft changes and create a working draft. Current revision ${schema.version} remains active; publication will create revision ${schema.version + 1}.`; if (dialog) dialog.hidden=false; dialog?.showModal(); }
  #refreshSaveState(projection?:SchemaDefinition):void { const p=this.#ports, schema=p.active(), presented=projection ?? p.editorDraft(schema), candidate=p.library.schemas.find(({ id }) => id === presented.id) ?? presented,
    rename=inspectSchemaRename(candidate,p.library.schemas,presented.name), has=Object.keys(presented.document.properties ?? {}).length>0, inheritance=schemaInheritanceError(presented,p.library.schemas) ?? schemaInheritanceConflict(presented,p.library.schemas), assistance=p.root.querySelector<HTMLElement>("#schema-editor-name-assistance"), save=p.root.querySelector<HTMLButtonElement>("#save-schema"), reason=p.root.querySelector<HTMLElement>("#save-schema-reason");
    if (assistance) assistance.textContent=rename.assistance; if (save) save.disabled=!rename.ready || !has || Boolean(inheritance); if (reason) reason.textContent=!rename.ready ? rename.assistance : !has ? "Add at least one property" : inheritance ?? "Ready to save"; }
  #closeRevisionDialog():void { const dialog=this.#ports.root.querySelector<HTMLDialogElement>("#schema-revision-review"); dialog?.close(); if (dialog) dialog.hidden=true; }
  #closeDialog(selector:string):void { const dialog=this.#ports.root.querySelector<HTMLDialogElement>(selector); dialog?.close(); if (dialog) dialog.hidden=true; }
}
