import type { SchemaDefinition } from "../../data-layer-schema-verification.js";
import { createLiveSchemaBulkDraft, reviewLiveSchemaBulk, type LiveSchemaBulkReview } from "./live-schema-bulk-model.js";
import { ownLivePropertyDeclarationDialog } from "./live-property-declaration-dialog-lifecycle.js";

export interface LiveSchemaBulkDestination {
  schema:SchemaDefinition;
  review:LiveSchemaBulkReview;
  original:string|null;
  isNew:boolean;
}

interface Input {
  host:HTMLElement;document:Document;payload:unknown;schemas:readonly SchemaDefinition[];suggestedId?:string;trigger:HTMLButtonElement;
  confirm(destination:LiveSchemaBulkDestination):Promise<void>;result(message:string):void;
}

export function openLiveSchemaBulkReview(input:Input):()=>void {
  const dialog=input.document.createElement("dialog"),heading=input.document.createElement("h5"),form=input.document.createElement("div"),
    destination=input.document.createElement("select"),name=input.document.createElement("input"),summary=input.document.createElement("div"),
    feedback=input.document.createElement("output"),confirm=input.document.createElement("button"),cancel=input.document.createElement("button");
  dialog.className="live-schema-bulk-review";dialog.setAttribute("aria-labelledby","live-schema-bulk-heading");heading.id="live-schema-bulk-heading";heading.tabIndex=-1;
  heading.textContent="Review Add all to schema";destination.id="live-schema-bulk-destination";destination.setAttribute("aria-label","Schema destination");
  destination.append(Object.assign(input.document.createElement("option"),{value:"new",textContent:"New schema"}),...input.schemas.map((schema)=>Object.assign(
    input.document.createElement("option"),{value:schema.id,textContent:`${schema.name} draft`})));destination.value=input.suggestedId&&input.schemas.some(({id})=>id===input.suggestedId)?input.suggestedId:"new";
  name.id="live-schema-bulk-name";name.placeholder="Schema name";name.setAttribute("aria-label","New schema name");confirm.type=cancel.type="button";confirm.textContent="Add observed properties";cancel.textContent="Cancel";
  let current:LiveSchemaBulkDestination|undefined;
  const render=():void=>{const existing=input.schemas.find(({id})=>id===destination.value),isNew=!existing;name.hidden=!isNew;
    try{const schema=existing??createLiveSchemaBulkDraft(name.value||"New schema","pending-new-schema"),review=reviewLiveSchemaBulk(input.payload,schema,input.schemas);current={schema,review,original:existing?JSON.stringify(existing):null,isNew};
      summary.replaceChildren(...review.rows.map((row)=>Object.assign(input.document.createElement("p"),{textContent:`${row.state}: ${row.path} · ${row.type??"type unspecified"}${"example" in row?` · example ${JSON.stringify(row.example)}`:""}${row.reason?` · ${row.reason}`:""}`})));
      confirm.disabled=!review.added.length||(isNew&&!name.value.trim());feedback.textContent=review.added.length?`${review.added.length} add, ${review.preserved.length} preserved, ${review.blocked.length} blocked.`:"Every observed path is already preserved; no write is needed.";
    }catch(error){current=undefined;confirm.disabled=true;feedback.textContent=error instanceof Error?error.message:"The review is unavailable.";}};
  const close=():void=>{dispose();input.trigger.focus({preventScroll:true});};
  const onConfirm=async():Promise<void>=>{
    if(!current)return;confirm.disabled=true;
    try{
      const selected=current.isNew?{...current,schema:createLiveSchemaBulkDraft(name.value)}:current;
      await input.confirm(selected);
      input.result(`${selected.review.added.length} observed properties were added to ${selected.schema.name}.`);
      dispose();input.trigger.focus({preventScroll:true});
    }catch(error){
      feedback.textContent=error instanceof Error?error.message:"The properties could not be saved.";
      confirm.disabled=false;
    }
  };
  const confirmSelection=():void=>{void onConfirm();};
  destination.addEventListener("change",render);name.addEventListener("input",render);confirm.addEventListener("click",confirmSelection);cancel.addEventListener("click",close);
  form.append(destination,name);dialog.append(heading,form,summary,feedback,confirm,cancel);input.host.replaceChildren(dialog);
  const lifecycle=ownLivePropertyDeclarationDialog({host:input.host,dialog,cancel:close});let disposed=false;
  const dispose=():void=>{if(disposed)return;disposed=true;destination.removeEventListener("change",render);name.removeEventListener("input",render);confirm.removeEventListener("click",confirmSelection);cancel.removeEventListener("click",close);lifecycle();};
  render();dialog.showModal();heading.focus({preventScroll:true});return dispose;
}
