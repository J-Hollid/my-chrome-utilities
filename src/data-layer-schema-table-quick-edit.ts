export const schemaTableEditableFacets=["type","presence","description","expected-or-allowed","example"] as const;
export type SchemaTableEditableFacet=typeof schemaTableEditableFacets[number];

export interface SchemaTableQuickEditCell {path:string;facet:SchemaTableEditableFacet;}
export type SchemaTableQuickEditIntent={kind:"commit";direction?:1|-1}|{kind:"cancel"};
export type SchemaTableQuickEditResult={status:"committed"|"unchanged"}|{status:"invalid";diagnostic:string};

export function schemaTableQuickEditIntent(key:string,shiftKey:boolean):SchemaTableQuickEditIntent|undefined {
  if(key==="Escape")return{kind:"cancel"};
  if(key==="Enter")return{kind:"commit"};
  if(key==="Tab")return{kind:"commit",direction:shiftKey?-1:1};
  return undefined;
}

export function schemaTableQuickEditCommitsOnChange(control:Pick<Element,"tagName">):boolean {
  return control.tagName.toUpperCase()==="SELECT";
}

export function schemaTableQuickEditDestination(
  cells:readonly SchemaTableQuickEditCell[],
  origin:SchemaTableQuickEditCell,
  direction:1|-1,
):SchemaTableQuickEditCell|undefined {
  const index=cells.findIndex(({path,facet})=>path===origin.path&&facet===origin.facet);
  return index<0?undefined:cells[index+direction];
}

export interface SchemaTableQuickEditBinding {
  root:()=>ParentNode;
  scope:string;
  path:string;
  facet:SchemaTableEditableFacet;
  savedValue:string;
  commit:(value:string)=>SchemaTableQuickEditResult;
  cancel:()=>void;
  diagnostic:(message:string)=>void;
}

type SchemaTableQuickEditControl=HTMLInputElement|HTMLSelectElement;
const quickEditControls=(root:ParentNode):SchemaTableQuickEditControl[]=>Array.from(root.querySelectorAll<SchemaTableQuickEditControl>("input[data-inline-schema-facet][data-inline-schema-path],select[data-inline-schema-facet][data-inline-schema-path]"));
const quickEditCell=(control:SchemaTableQuickEditControl):SchemaTableQuickEditCell=>({path:control.dataset.inlineSchemaPath!,facet:control.dataset.inlineSchemaFacet as SchemaTableEditableFacet});
const quickEditFocusGeneration=new WeakMap<Document,number>();
const pendingQuickEditFocus=new WeakMap<Document,{scope:string;cell:SchemaTableQuickEditCell;expires:number}>();
const focusQuickEditCell=(binding:SchemaTableQuickEditBinding,cell:SchemaTableQuickEditCell):void=>{
  const target=quickEditControls(binding.root()).find((control)=>control.dataset.inlineSchemaPath===cell.path&&control.dataset.inlineSchemaFacet===cell.facet);
  target?.focus({preventScroll:true});
};
const quickEditDocument=(binding:SchemaTableQuickEditBinding):Document=>{
  const root=binding.root();
  return root instanceof Document?root:root.ownerDocument!;
};
const rememberQuickEditFocus=(binding:SchemaTableQuickEditBinding,cell:SchemaTableQuickEditCell):void=>{pendingQuickEditFocus.set(quickEditDocument(binding),{scope:binding.scope,cell,expires:Date.now()+5000});};
const restoreQuickEditFocus=(binding:SchemaTableQuickEditBinding,cell:SchemaTableQuickEditCell):void=>{
  const document=quickEditDocument(binding),generation=(quickEditFocusGeneration.get(document)??0)+1;quickEditFocusGeneration.set(document,generation);rememberQuickEditFocus(binding,cell);
  const restore=()=>{if(quickEditFocusGeneration.get(document)===generation)focusQuickEditCell(binding,cell);};
  queueMicrotask(restore);
  for(const delay of [0,25,75,150,300,600])setTimeout(restore,delay);
};

export function bindSchemaTableQuickEdit(control:SchemaTableQuickEditControl,binding:SchemaTableQuickEditBinding):void {
  const origin={path:binding.path,facet:binding.facet},destination=(direction:1|-1):SchemaTableQuickEditCell|undefined=>schemaTableQuickEditDestination(quickEditControls(control.closest("table")??binding.root()).map(quickEditCell),origin,direction);
  let settled=false;
  const pending=pendingQuickEditFocus.get(control.ownerDocument);
  if(pending&&pending.expires>=Date.now()&&pending.scope===binding.scope&&pending.cell.path===origin.path&&pending.cell.facet===origin.facet)queueMicrotask(()=>{if(control.isConnected)control.focus({preventScroll:true});});
  const commit=(target?:SchemaTableQuickEditCell):void=>{
    if(settled)return;
    if(control.value===binding.savedValue){
      settled=true;binding.diagnostic("");
      if(target)restoreQuickEditFocus(binding,target);
      return;
    }
    if(target)rememberQuickEditFocus(binding,target);
    settled=true;
    const result=binding.commit(control.value);
    if(result.status==="invalid"){
      settled=false;binding.diagnostic(result.diagnostic);
      restoreQuickEditFocus(binding,origin);
      return;
    }
    binding.diagnostic("");
    if(target)restoreQuickEditFocus(binding,target);
  };
  control.addEventListener("input",()=>{settled=false;});
  if(schemaTableQuickEditCommitsOnChange(control))control.addEventListener("change",()=>commit());
  control.addEventListener("focus",()=>{const document=control.ownerDocument,current=pendingQuickEditFocus.get(document);quickEditFocusGeneration.set(document,(quickEditFocusGeneration.get(document)??0)+1);if(current&&(current.scope!==binding.scope||current.cell.path!==origin.path||current.cell.facet!==origin.facet))pendingQuickEditFocus.delete(document);});
  control.addEventListener("keydown",(rawEvent)=>{
    const event=rawEvent as KeyboardEvent;
    const intent=schemaTableQuickEditIntent(event.key,event.shiftKey);if(!intent)return;
    event.preventDefault();
    if(intent.kind==="cancel"){
      event.stopPropagation();settled=true;control.value=binding.savedValue;binding.diagnostic("");binding.cancel();restoreQuickEditFocus(binding,origin);return;
    }
    commit(intent.direction?destination(intent.direction):undefined);
  });
  control.addEventListener("blur",()=>commit());
}
