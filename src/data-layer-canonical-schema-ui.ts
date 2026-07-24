import {canonicalCommandOutcome,canonicalPropertyPath,type CanonicalCommand,type CanonicalCommandResult,type CanonicalPresenceMode,type CanonicalPropertyNode,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import {focusedPropertySectionLabels,type FocusedPropertySection} from "./data-layer-focused-schema-property-ui.js";
import {renderCanonicalFocusedSection} from "./data-layer-canonical-schema-focused-sections.js";
import {renderCanonicalFocusedMenu} from "./data-layer-canonical-schema-focused-menu.js";
import {renderCanonicalFocusedEditor} from "./data-layer-canonical-schema-focused-editor.js";
import {renderCanonicalSchemaEditor} from "./data-layer-canonical-schema-render.js";
import {focusedPropertyPatch,focusedStagedChanges,focusedSourceState,type CanonicalFocusedPatch} from "./data-layer-canonical-schema-focused-drafts.js";

export interface CanonicalSchemaEditorOptions {
  host:HTMLElement;surface:"Builder"|"Side panel"|"Flow workspace";load:()=>CanonicalSchemaDocument;
  dispatch:(command:CanonicalCommand)=>CanonicalCommandResult;id:(kind:string)=>string;onUndo?:()=>void;onRedo?:()=>void;initialFeedback?:string;
  renderAfterDispatch?:boolean;
}

const clone=<T>(value:T):T=>structuredClone(value);
const provenanceText=(node:CanonicalPropertyNode):string=>node.provenance.map(({source,contributorName,scope,state})=>contributorName?`${scope??"source"} ${contributorName}${state?` ${state}`:""}`:source).join(" → ")||"created";
const presenceText=(mode:CanonicalPresenceMode):string=>({optional:"Optional",required:"Required","required-when":"Required when",forbidden:"Forbidden","forbidden-when":"Forbidden when"})[mode];
const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
const sectionLabel=(section:FocusedPropertySection):string=>focusedPropertySectionLabels[section];

export function bindCanonicalPropertySearch(control:Pick<HTMLInputElement,"value"|"addEventListener">,update:(query:string)=>void):void{control.addEventListener("input",()=>update(control.value));}
export function canonicalDispatchRequiresLocalRender(result:CanonicalCommandResult,renderAfterDispatch:boolean|undefined):boolean{return renderAfterDispatch!==false||result.status==="confirmation-required";}

/**
 * Mount the one shared schema property workspace.  Property rows are intentionally
 * compact: forms live only in the focused section editor, never in every row.
 */
export function mountCanonicalSchemaEditor(options:CanonicalSchemaEditorOptions):{render():void}{
  const dom=options.host.ownerDocument??globalThis.document;
  let query="",feedback=options.initialFeedback??"",activePropertyId:string|undefined,activeSection:FocusedPropertySection="definition",working:CanonicalPropertyNode|undefined,originFocus:HTMLElement|undefined,originPath:string|undefined,menuPropertyId:string|undefined,removedRuleIds=new Set<string>();
  let review:HTMLElement|undefined;

  const current=():CanonicalSchemaDocument=>options.load();
  const selectedNode=(document:CanonicalSchemaDocument):CanonicalPropertyNode|undefined=>activePropertyId?document.nodes[activePropertyId]:document.selectedPropertyId?document.nodes[document.selectedPropertyId]:undefined;
  const ensureWorking=(node:CanonicalPropertyNode):void=>{if(!working||working.id!==node.id)working=clone(node);};
  const command=(next:CanonicalCommand):CanonicalCommandResult=>{
    const prior=current(),result=options.dispatch(next);
    if(result.status==="conflict")feedback=result.message;
    else if(result.status==="applied"||result.status==="rebased")feedback=canonicalCommandOutcome(next,result,prior);
    if((canonicalDispatchRequiresLocalRender(result,options.renderAfterDispatch)||next.kind==="add"||next.kind==="select")&&options.host.isConnected)render();
    return result;
  };
  const patchFor=(node:CanonicalPropertyNode,original:CanonicalPropertyNode):CanonicalFocusedPatch=>focusedPropertyPatch(node,original,removedRuleIds);

  const closeFocused=():void=>{
    const restorePath=originPath;working=undefined;removedRuleIds=new Set();menuPropertyId=undefined;activePropertyId=undefined;review=undefined;
    render();
    const target=originFocus?.isConnected?originFocus:restorePath?options.host.querySelector<HTMLElement>(`[data-property-actions-path="${CSS.escape(restorePath)}"]`):undefined;originFocus=undefined;originPath=undefined;if(target)queueMicrotask(()=>target.focus({preventScroll:true}));
  };
  const openProperty=(node:CanonicalPropertyNode,focus?:HTMLElement,section:FocusedPropertySection="definition"):void=>{
    const document=current();activePropertyId=node.id;activeSection=section;menuPropertyId=node.id;removedRuleIds=new Set();ensureWorking(node);if(focus){originFocus=focus;originPath=canonicalPropertyPath(document,node.id);}
    if(options.dispatch){
      const result=options.dispatch({kind:"select",baseRevision:document.revision,propertyId:node.id});
      if(result.status!=="applied"&&result.status!=="rebased")feedback=result.status==="conflict"?result.message:feedback;
    }
    render();
  };
  const saveFocused=():void=>{
    const document=current(),node=working&&document.nodes[working.id],original=node?clone(node):undefined;
    if(!working||!original){closeFocused();return;}
    const patch=patchFor(working,original);
    if(!Object.keys(patch).length){closeFocused();return;}
    const result=command({kind:"set",baseRevision:document.revision,propertyId:working.id,patch});
    if(result.status==="applied"||result.status==="rebased"){working=undefined;removedRuleIds=new Set();menuPropertyId=undefined;activePropertyId=undefined;review=undefined;render();}
  };
  const showReview=():void=>{
    if(!working)return;
    const document=current(),original=document.nodes[working.id];if(!original)return;
    const changes=focusedStagedChanges(working,original,removedRuleIds,canonicalPropertyPath(current(),working.id));if(!changes.length){feedback="No staged changes to review.";render();return;}
    const panel=dom.createElement("section"),heading=dom.createElement("h3"),list=dom.createElement("ul"),prospective=dom.createElement("p"),actions=dom.createElement("div"),cancel=button(dom,"Cancel review",()=>{review=undefined;render();}),confirm=button(dom,"Confirm changes",()=>saveFocused());
    panel.setAttribute("aria-label","Review changes");heading.textContent="Review changes";changes.forEach(({label,detail})=>{const item=dom.createElement("li");item.textContent=`${label} · ${detail}`;list.append(item);});prospective.textContent=`Prospective effective result: ${working.type} · ${working.presence.mode} · ${working.rules.length} rules · affected consumers follow ${provenanceText(original)}.`;actions.append(cancel,confirm);panel.append(heading,list,prospective,actions);review=panel;render();
  };
  const render=():void=>renderCanonicalSchemaEditor({dom,options,document:current(),query,feedback,activePropertyId,activeSection,menuPropertyId,working,review,current,setQuery:(value)=>{query=value;},setFeedback:(value)=>{feedback=value;},setMenuPropertyId:(value)=>{menuPropertyId=value;},ensureWorking,selectedNode,openProperty,command,render,renderMenu:(node)=>renderCanonicalFocusedMenu(node,{dom,current,sourceState:focusedSourceState,ensureWorking,getWorking:()=>working,activeSection,setActiveSection:(value)=>{activeSection=value;},setMenuPropertyId:(value)=>{menuPropertyId=value;},render,feedback:(message)=>{feedback=message;},provenanceText}),renderFocusedEditor:(document,node)=>renderCanonicalFocusedEditor(document,node,{dom,activeSection,sectionLabel,canonicalPropertyPath,provenanceText,presenceText,renderSection:(host,value)=>renderCanonicalFocusedSection(host,{dom,current,node:value,getWorking:()=>working,setWorking:(next)=>{working=next;},activeSection,setActiveSection:(section)=>{activeSection=section;},removedRuleIds,id:options.id,render,patchFor,command,select:(id)=>{activePropertyId=id;},feedback:(message)=>{feedback=message;}}),close:closeFocused,review:showReview,save:saveFocused})});
  options.host.addEventListener("keydown",(event)=>{if(event.key==="Escape"&&working){event.preventDefault();closeFocused();}});
  render();return{render};
}
