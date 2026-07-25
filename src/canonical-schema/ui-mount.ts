import {canonicalPropertyPath,type CanonicalCommand,type CanonicalCommandResult,type CanonicalPropertyNode,type CanonicalSchemaDocument,type CanonicalStructuralOperation} from "../data-layer-canonical-schema.js";
import {type FocusedPropertySection} from "../data-layer-focused-schema-property-ui.js";
import {renderCanonicalFocusedSection} from "../data-layer-canonical-schema-focused-sections.js";
import {renderCanonicalFocusedMenu} from "../data-layer-canonical-schema-focused-menu.js";
import {renderCanonicalFocusedEditor} from "../data-layer-canonical-schema-focused-editor.js";
import {renderCanonicalSchemaEditor} from "../data-layer-canonical-schema-render.js";
import {focusedPropertyPatch,focusedStagedChanges,focusedSourceState,type CanonicalFocusedPatch} from "../data-layer-canonical-schema-focused-drafts.js";
import {dispatchFocusedCanonicalCommand} from "../data-layer-canonical-schema-focused-command.js";
import {button,clone,presenceText,provenanceText,sectionLabel} from "./ui-mount-helpers.js";

export interface CanonicalSchemaEditorOptions {
  host:HTMLElement;surface:"Builder"|"Side panel"|"Flow workspace";load:()=>CanonicalSchemaDocument;
  dispatch:(command:CanonicalCommand)=>CanonicalCommandResult;id:(kind:string)=>string;onUndo?:()=>void;onRedo?:()=>void;initialFeedback?:string;
  renderAfterDispatch?:boolean;
}


export function bindCanonicalPropertySearch(control:Pick<HTMLInputElement,"value"|"addEventListener">,update:(query:string)=>void):void{control.addEventListener("input",()=>update(control.value));}
export function canonicalDispatchRequiresLocalRender(result:CanonicalCommandResult,renderAfterDispatch:boolean|undefined):boolean{return renderAfterDispatch!==false||result.status==="confirmation-required";}

/**
 * Mount the one shared schema property workspace.  Property rows are intentionally
 * compact: forms live only in the focused section editor, never in every row.
 */
export function mountCanonicalSchemaEditor(options:CanonicalSchemaEditorOptions):{render():void}{
  const dom=options.host.ownerDocument??globalThis.document;
  const initialDocument=options.load();
  let query="",feedback=options.initialFeedback??"",activePropertyId:string|undefined=initialDocument.selectedPropertyId,activeSection:FocusedPropertySection="definition",working:CanonicalPropertyNode|undefined,originFocus:HTMLElement|undefined,originPath:string|undefined,menuPropertyId:string|undefined=initialDocument.selectedPropertyId,removedRuleIds=new Set<string>(),removedValueIds=new Set<string>(),stagedOperations:CanonicalStructuralOperation[]=[],transientView:CanonicalSchemaDocument["view"]|undefined;
  let review:HTMLElement|undefined;

  const current=():CanonicalSchemaDocument=>{const document=options.load();return transientView?{...document,view:transientView}:document;};
  const selectedNode=(document:CanonicalSchemaDocument):CanonicalPropertyNode|undefined=>activePropertyId?document.nodes[activePropertyId]:document.selectedPropertyId?document.nodes[document.selectedPropertyId]:undefined;
  const ensureWorking=(node:CanonicalPropertyNode):void=>{if(!working||working.id!==node.id)working=clone(node);};
  const command=(next:CanonicalCommand):CanonicalCommandResult=>{if(next.kind==="view"){transientView=next.view;feedback=`Viewing ${next.view} projection; no Saved Draft write.`;render();return{status:"applied",document:{...current(),view:next.view}};}if(next.kind==="select"){activePropertyId=next.propertyId;menuPropertyId=next.propertyId;feedback=`Selected ${next.propertyId}; no Saved Draft write.`;render();return{status:"applied",document:{...current(),selectedPropertyId:next.propertyId}};}return dispatchFocusedCanonicalCommand(next,{current,dispatch:options.dispatch,renderAfterDispatch:options.renderAfterDispatch,host:options.host,setFeedback:(message)=>{feedback=message;},render});};
  const patchFor=(node:CanonicalPropertyNode,original:CanonicalPropertyNode):CanonicalFocusedPatch=>focusedPropertyPatch(node,original,removedRuleIds,removedValueIds);

  const closeFocused=():void=>{
    const restorePath=originPath;working=undefined;removedRuleIds=new Set();removedValueIds=new Set();stagedOperations=[];menuPropertyId=undefined;activePropertyId=undefined;review=undefined;
    render();
    const target=originFocus?.isConnected?originFocus:restorePath?options.host.querySelector<HTMLElement>(`[data-property-actions-path="${CSS.escape(restorePath)}"]`):undefined;originFocus=undefined;originPath=undefined;if(target)queueMicrotask(()=>target.focus({preventScroll:true}));
  };
  const openProperty=(node:CanonicalPropertyNode,focus?:HTMLElement,section:FocusedPropertySection="definition"):void=>{
    const document=current();activePropertyId=node.id;activeSection=section;menuPropertyId=node.id;removedRuleIds=new Set();removedValueIds=new Set();stagedOperations=[];ensureWorking(node);if(focus){originFocus=focus;originPath=canonicalPropertyPath(document,node.id);}
    render();
  };
  const finishFocusedSave=():void=>{working=undefined;removedRuleIds=new Set();removedValueIds=new Set();stagedOperations=[];menuPropertyId=undefined;activePropertyId=undefined;review=undefined;render();};
  const showImpactReview=(impact:string,onConfirm:()=>void):void=>{const panel=dom.createElement("section"),heading=dom.createElement("h3"),summary=dom.createElement("p"),actions=dom.createElement("div"),cancel=button(dom,"Cancel impact review",()=>{review=undefined;render();}),confirm=button(dom,"Confirm impact",onConfirm);panel.setAttribute("aria-label","Property impact review");heading.textContent="Property impact review";summary.textContent=impact;actions.append(cancel,confirm);panel.append(heading,summary,actions);review=panel;render();};
  const saveFocused=(confirmedType=false):void=>{
    const document=current(),node=working&&document.nodes[working.id],original=node?clone(node):undefined;
    if(!working||!original){closeFocused();return;}
    const patch=patchFor(working,original);
    if(!Object.keys(patch).length&&!stagedOperations.length){finishFocusedSave();return;}
    const result=command({kind:"set",baseRevision:document.revision,propertyId:working.id,patch,operations:stagedOperations,...(confirmedType?{confirmed:true}: {})});
    if(result.status==="confirmation-required"){showImpactReview(result.impact,()=>saveFocused(true));return;}
    if(result.status==="applied"||result.status==="rebased")finishFocusedSave();
  };
  const showReview=():void=>{
    if(!working)return;
    const document=current(),original=document.nodes[working.id];if(!original)return;
    const propertyId=working.id;const changes=focusedStagedChanges(working,original,removedRuleIds,canonicalPropertyPath(current(),propertyId),removedValueIds);if(stagedOperations.length)changes.push(...stagedOperations.map((operation)=>({label:`Structure · ${operation.kind}`,detail:`${"propertyId" in operation?operation.propertyId:propertyId} staged for review`})));if(!changes.length){feedback="No staged changes to review.";render();return;}
    const panel=dom.createElement("section"),heading=dom.createElement("h3"),list=dom.createElement("ul"),prospective=dom.createElement("p"),impact=dom.createElement("p"),actions=dom.createElement("div"),cancel=button(dom,"Cancel review",()=>{review=undefined;render();}),confirm=button(dom,"Confirm changes",()=>saveFocused());
    panel.setAttribute("aria-label","Review changes");heading.textContent="Review changes";changes.forEach(({label,detail})=>{const item=dom.createElement("li");item.textContent=`${label} · ${detail}`;list.append(item);});prospective.textContent=`Prospective effective result: ${working.type} · ${working.presence.mode} · ${working.rules.length} rules · affected consumers follow ${provenanceText(original)}.`;impact.textContent=`Impact review: ${working.type!==original.type?`type ${original.type} → ${working.type}; `:""}${working.documentation!==original.documentation?"documentation and example consumers may change; ":""}${working.rules.length!==original.rules.length?`rules ${original.rules.length} → ${working.rules.length}; `:""}Draft status and one page-scoped Undo are retained.`;actions.append(cancel,confirm);panel.append(heading,list,prospective,impact,actions);review=panel;render();
  };
  const stageStructure=(operation:CanonicalStructuralOperation):void=>{stagedOperations=[...stagedOperations,operation];feedback=`Staged ${operation.kind} for review.`;render();};
  const render=():void=>renderCanonicalSchemaEditor({dom,options,document:current(),query,feedback,activePropertyId,activeSection,menuPropertyId,working,review,current,setQuery:(value)=>{query=value;},setFeedback:(value)=>{feedback=value;},setMenuPropertyId:(value)=>{menuPropertyId=value;},ensureWorking,selectedNode,openProperty,command,render,renderMenu:(node)=>renderCanonicalFocusedMenu(node,{dom,current,sourceState:focusedSourceState,ensureWorking,getWorking:()=>working,activeSection,setActiveSection:(value)=>{activeSection=value;},setMenuPropertyId:(value)=>{menuPropertyId=value;},render,feedback:(message)=>{feedback=message;},provenanceText}),renderFocusedEditor:(document,node)=>renderCanonicalFocusedEditor(document,node,{dom,activeSection,sectionLabel,canonicalPropertyPath,provenanceText,presenceText,renderSection:(host,value)=>renderCanonicalFocusedSection(host,{dom,current,node:value,getWorking:()=>working,setWorking:(next)=>{working=next;},activeSection,setActiveSection:(section)=>{activeSection=section;},removedRuleIds,removedValueIds,id:options.id,stageStructure,render,patchFor,command,select:(id)=>{activePropertyId=id;},feedback:(message)=>{feedback=message;}}),close:closeFocused,review:showReview,save:saveFocused})});
  options.host.addEventListener("keydown",(event)=>{if(event.key==="Escape"&&working){event.preventDefault();closeFocused();}});
  render();return{render};
}
