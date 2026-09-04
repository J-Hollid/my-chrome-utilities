import type { SchemaRuleController } from "./rule-controller.js";
import { reusableRuleMetadata, type SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { ReusableRuleSyncReview } from "../../data-layer-reusable-rule-sync.js";
import type { ReusableSchemaRule } from "./contracts.js";

export interface RuleElements {
  list:HTMLElement|null; search:HTMLInputElement|null; editor:HTMLElement|null; name:HTMLInputElement|null;
  parameters:HTMLInputElement|null; types:HTMLSelectElement|null; operator:HTMLSelectElement|null;
  severity:HTMLSelectElement|null; message:HTMLInputElement|null; examples:HTMLInputElement|null;
  attachments:HTMLSelectElement|null; updateAttachments:HTMLInputElement|null; result:HTMLElement|null;
  revisionReview:HTMLDialogElement|null; revisionSummary:HTMLElement|null; confirmRevision:HTMLButtonElement|null;
  upgradeReview:HTMLDialogElement|null; upgradeSummary:HTMLElement|null; confirmUpgrade:HTMLButtonElement|null; cancelUpgrade:HTMLButtonElement|null;
  syncReview:HTMLDialogElement|null; syncSummary:HTMLElement|null; confirmSync:HTMLButtonElement|null; cancelSync:HTMLButtonElement|null;
  deleteReview:HTMLDialogElement|null; deleteSummary:HTMLElement|null; confirmDelete:HTMLButtonElement|null;
  document:Document|undefined;
}

/** Owns installed DOM and lifecycle bindings for reusable Schema rules. */
export function installSchemaRuleElements(root:ParentNode) {
  const document=(root as ParentNode & { ownerDocument?:Document }).ownerDocument ?? ("createElement" in root ? root as Document : undefined),
    owned=<K extends keyof HTMLElementTagNameMap>(selector:string,tag:K) => root.querySelector<HTMLElementTagNameMap[K]>(selector) ?? document?.createElement(tag) ?? null,
    createRule=root.querySelector<HTMLButtonElement>("#create-schema-rule"), editor=root.querySelector<HTMLElement>("#schema-rule-editor"), name=root.querySelector<HTMLInputElement>("#schema-rule-name"),
    parameters=root.querySelector<HTMLInputElement>("#schema-rule-parameters"), types=root.querySelector<HTMLSelectElement>("#schema-rule-types"), operator=root.querySelector<HTMLSelectElement>("#schema-rule-operator"),
    severity=root.querySelector<HTMLSelectElement>("#schema-rule-severity"), message=root.querySelector<HTMLInputElement>("#schema-rule-message"), examples=root.querySelector<HTMLInputElement>("#schema-rule-examples"),
    save=root.querySelector<HTMLButtonElement>("#save-schema-rule"), list=root.querySelector<HTMLElement>("#schema-rule-list"), search=root.querySelector<HTMLInputElement>("#schema-rule-search"),
    attachments=root.querySelector<HTMLSelectElement>("#schema-rule-attachments"), updateAttachments=root.querySelector<HTMLInputElement>("#update-schema-rule-attachments"), exportRules=root.querySelector<HTMLButtonElement>("#export-schema-rules"),
    revisionReview=owned("#schema-rule-revision-review","dialog"), revisionSummary=owned("#schema-rule-revision-review-summary","output"), confirmRevision=owned("#confirm-schema-rule-revision-review","button"), cancelRevision=owned("#cancel-schema-rule-revision","button"),
    upgradeReview=owned("#schema-rule-upgrade-review","dialog"), upgradeSummary=owned("#schema-rule-upgrade-review-summary","output"), confirmUpgrade=owned("#confirm-schema-rule-upgrade","button"), cancelUpgrade=owned("#cancel-schema-rule-upgrade","button"),
    syncReview=owned("#schema-rule-sync-review","dialog"), syncSummary=owned("#schema-rule-sync-review-summary","output"), confirmSync=owned("#confirm-schema-rule-sync","button"), cancelSync=owned("#cancel-schema-rule-sync","button"),
    deleteReview=owned("#schema-rule-delete-review","dialog"), deleteSummary=owned("#schema-rule-delete-review-summary","output"), confirmDelete=owned("#confirm-schema-rule-delete","button"), cancelDelete=owned("#cancel-schema-rule-delete","button"), result=root.querySelector<HTMLElement>("#schema-result");
  if (types?.ownerDocument) types.replaceChildren(...([["string","String"],["number","Number"],["boolean","Boolean"],["object","Object"],["array","Array"]] as const).map(([value,label]) => { const option=types.ownerDocument.createElement("option"); option.value=value; option.textContent=label; return option; }));
  const install=(dialog:HTMLDialogElement|null,id:string,heading:string,summary:HTMLElement|null,confirm:HTMLButtonElement|null,cancel:HTMLButtonElement|null,confirmId=`confirm-${id.replace("-review","")}`):void => {
    if (!dialog || dialog.isConnected) return; dialog.id=id; const title=document?.createElement("h4"); if (title) { title.textContent=heading; dialog.append(title); } if (summary) { summary.id=`${id}-summary`; dialog.append(summary); }
    if (confirm) { confirm.id=confirmId; confirm.type="button"; confirm.textContent="Confirm"; dialog.append(confirm); } if (cancel) { cancel.id=`cancel-${id.replace("-review","")}`; cancel.type="button"; cancel.textContent="Cancel"; dialog.append(cancel); } document?.body.append(dialog); };
  install(revisionReview,"schema-rule-revision-review","Review rule revision",revisionSummary,confirmRevision,cancelRevision,"confirm-schema-rule-revision-review");
  install(upgradeReview,"schema-rule-upgrade-review","Update pinned rule attachments",upgradeSummary,confirmUpgrade,cancelUpgrade);
  install(syncReview,"schema-rule-sync-review","Sync attached schemas and publish revisions",syncSummary,confirmSync,cancelSync);
  install(deleteReview,"schema-rule-delete-review","Delete reusable rule",deleteSummary,confirmDelete,cancelDelete);
  return { createRule, save, exportRules, cancelRevision, cancelDelete, elements:{ list,search,editor,name,parameters,types,operator,severity,message,examples,attachments,updateAttachments,result,
    revisionReview,revisionSummary,confirmRevision,upgradeReview,upgradeSummary,confirmUpgrade,cancelUpgrade,syncReview,syncSummary,confirmSync,cancelSync,deleteReview,deleteSummary,confirmDelete,document } };
}

export function bindSchemaRuleElements(lifecycle:{ listen(target:EventTarget|null|undefined,type:string,
  listener:(event:Event)=>void):void },installed:ReturnType<typeof installSchemaRuleElements>,
  controller:SchemaRuleController,updatePreview:()=>void):void {
  const {createRule,save,exportRules,cancelRevision,cancelDelete,elements}=installed;
  lifecycle.listen(createRule,"click",()=>controller.beginNew()); lifecycle.listen(save,"click",()=>controller.save());
  lifecycle.listen(save,"pointerdown",()=>controller.captureSnapshot()); lifecycle.listen(elements.editor,"input",updatePreview);
  lifecycle.listen(elements.editor,"click",(event)=>{if((event.target as HTMLElement)?.id==="schema-rule-save")controller.captureSnapshot();});
  lifecycle.listen(elements.search,"input",()=>controller.render()); lifecycle.listen(elements.updateAttachments,"change",()=>controller.updateAttachmentPreview());
  lifecycle.listen(elements.confirmRevision,"click",()=>controller.confirmRevision()); lifecycle.listen(cancelRevision,"click",()=>controller.cancelRevision());
  lifecycle.listen(elements.confirmUpgrade,"click",()=>controller.confirmUpgrade()); lifecycle.listen(elements.cancelUpgrade,"click",()=>controller.cancelUpgrade());
  lifecycle.listen(elements.confirmSync,"click",()=>controller.confirmSync()); lifecycle.listen(elements.cancelSync,"click",()=>controller.cancelSync());
  lifecycle.listen(elements.confirmDelete,"click",()=>controller.confirmDeletion()); lifecycle.listen(cancelDelete,"click",()=>controller.cancelDeletion());
  lifecycle.listen(exportRules,"click",()=>controller.exportRules());
}

/** Owns installed reusable-rule rows, forms, and review-dialog presentation. */
export class SchemaRuleInstalledPresentation {
  readonly #elements:RuleElements;
  readonly #controller:SchemaRuleController;
  readonly #schemas:()=>readonly SchemaDefinition[];
  readonly #disposers:Array<() => void>=[];
  constructor(controller:SchemaRuleController,elements:RuleElements,schemas:()=>readonly SchemaDefinition[]) {
    this.#controller=controller;this.#elements=elements;this.#schemas=schemas;
  }
  ownRow(dispose:()=>void):void { this.#disposers.push(dispose); }
  render():void {
    const controller=this.#controller,{list,search}=this.#elements,summaryFor=(rule:ReusableSchemaRule):string => `${rule.name} v${rule.version} · ${reusableRuleMetadata(rule,rule.applicableType ?? "string")}`;
    const query=search?.value.trim().toLowerCase() ?? "",visible=controller.rules.filter((rule) => summaryFor(rule).toLowerCase().includes(query));this.clearRows();
    if (!list?.ownerDocument) { if (list) list.textContent=visible.map(summaryFor).join("\n");return; }
    list.replaceChildren(...visible.map((rule) => { const item=list.ownerDocument!.createElement("li"),summary=list.ownerDocument!.createElement("span");item.dataset.ruleId=rule.id;summary.textContent=summaryFor(rule);item.append(summary);
      const action=(label:string,run:()=>void):void => { const button=list.ownerDocument!.createElement("button"),listener=():void => run();button.type="button";button.textContent=label;button.addEventListener("click",listener);this.#disposers.push(() => button.removeEventListener("click",listener));item.append(button); };
      action("Edit",() => { controller.edit(rule.id); });if (controller.syncReview(rule).schemaCount) action("Sync attached schemas and publish revisions",() => { controller.requestSync(rule.id); });
      action("Duplicate",() => controller.duplicate(rule.id));action("Export",() => controller.exportRule(rule.id));action(rule.enabled ? "Disable" : "Enable",() => controller.toggle(rule.id));action("Delete",() => { controller.requestDeletion(rule.id); });return item;
    }));
  }
  openEditor():void { const e=this.#elements;if (e.editor)e.editor.hidden=false;if(e.name)e.name.value="";if(e.parameters)e.parameters.value="";if(e.message)e.message.value="";if(e.examples)e.examples.value="";if(e.types)e.types.value="string";if(e.severity)e.severity.value="error";
    if(e.attachments?.ownerDocument)e.attachments.replaceChildren(...this.#schemas().map((schema) => { const option=e.attachments!.ownerDocument.createElement("option");option.value=schema.id;option.textContent=`${schema.name} v${schema.version}`;return option; }));e.name?.focus(); }
  populate(rule:ReusableSchemaRule):void { const e=this.#elements;if(e.name)e.name.value=rule.name;if(e.parameters)e.parameters.value=rule.parameters ?? "";if(e.types)e.types.value=rule.applicableType ?? "string";if(e.operator)e.operator.value=rule.operator ?? "required";if(e.severity)e.severity.value=rule.severity ?? "error";if(e.message)e.message.value=rule.message ?? "";if(e.examples)e.examples.value=rule.examples ?? ""; }
  showRevision(previous:ReusableSchemaRule,changes:Partial<ReusableSchemaRule>):void { const e=this.#elements,previousParameters=previous.allowedValues?.map(String).join(",") ?? previous.parameters ?? "none";
    if(e.revisionSummary)e.revisionSummary.textContent=`${previous.name} v${previous.version} will become ${changes.name ?? previous.name} v${previous.version+1}; parameters ${previousParameters} → ${changes.parameters ?? previous.parameters ?? "none"}; examples ${previous.examples ?? "none"} → ${changes.examples ?? previous.examples ?? "none"}.`;e.revisionReview?.showModal();e.confirmRevision?.focus(); }
  showUpgrade(rule:ReusableSchemaRule,affected:readonly SchemaDefinition[]):void { const e=this.#elements;if(e.upgradeSummary)e.upgradeSummary.textContent=affected.length ? `Update pinned attachments for ${rule.name} v${rule.version}: ${affected.map(({name}) => name).join(", ")}.` : `No pinned attachments for ${rule.name} are selected.`;if(e.confirmUpgrade)e.confirmUpgrade.disabled=affected.length===0;e.upgradeReview?.showModal();(affected.length ? e.confirmUpgrade:e.cancelUpgrade)?.focus(); }
  showSync(review:ReusableRuleSyncReview):void { const e=this.#elements,changes=review.schemas.map((schema) => `${schema.schemaName} revision ${schema.currentVersion} to ${schema.nextVersion}`).join("; ");if(e.syncSummary)e.syncSummary.textContent=review.blocked.length ? `${review.schemaCount} schemas and ${review.attachmentCount} attachments. ${review.blocked.map(({assistance}) => assistance).join(". ")}.` : `${review.schemaCount} schemas and ${review.attachmentCount} attachments: ${changes || "no pinned revisions"}. No changes occur before confirmation.`;if(e.confirmSync)e.confirmSync.disabled=!review.ready;e.syncReview?.showModal();(review.ready ? e.confirmSync:e.cancelSync)?.focus(); }
  showDeletion(rule:ReusableSchemaRule):void { const e=this.#elements;if(e.deleteSummary)e.deleteSummary.textContent=`${rule.name} v${rule.version} will be removed.`;e.deleteReview?.showModal();e.confirmDelete?.focus(); }
  close(kind:"editor"|"revision"|"upgrade"|"sync"|"delete"):void { const e=this.#elements;if(kind==="editor"&&e.editor)e.editor.hidden=true;else if(kind==="revision")e.revisionReview?.close();else if(kind==="upgrade")e.upgradeReview?.close();else if(kind==="sync")e.syncReview?.close();else if(kind==="delete")e.deleteReview?.close(); }
  updateAttachmentPreview():void { const e=this.#elements;if(e.result)e.result.textContent=e.updateAttachments?.checked ? "Pinned attachments will be updated" : "Existing pinned attachments remain unchanged"; }
  clearRows():void { for(const dispose of this.#disposers.splice(0))dispose(); }
  dispose():void { this.clearRows(); }
}
