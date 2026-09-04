import type { SchemaRuleController } from "./rule-controller.js";

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
