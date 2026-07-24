import {canonicalCommandOutcome,canonicalPropertyPath,canonicalTableRows,type CanonicalCommand,type CanonicalCommandResult,type CanonicalPresenceMode,type CanonicalPropertyNode,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import {focusedConditionLabel,focusedOwnershipActions,focusedPropertySectionLabels,focusedPropertySections,type FocusedPropertySection} from "./data-layer-focused-schema-property-ui.js";
import {renderCanonicalFocusedSection} from "./data-layer-canonical-schema-focused-sections.js";

export interface CanonicalSchemaEditorOptions {
  host:HTMLElement;surface:"Builder"|"Side panel"|"Flow workspace";load:()=>CanonicalSchemaDocument;
  dispatch:(command:CanonicalCommand)=>CanonicalCommandResult;id:(kind:string)=>string;onUndo?:()=>void;onRedo?:()=>void;initialFeedback?:string;
  renderAfterDispatch?:boolean;
}

const clone=<T>(value:T):T=>structuredClone(value);
const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
const provenanceText=(node:CanonicalPropertyNode):string=>node.provenance.map(({source,contributorName,scope,state})=>contributorName?`${scope??"source"} ${contributorName}${state?` ${state}`:""}`:source).join(" → ")||"created";
const presenceText=(mode:CanonicalPresenceMode):string=>({optional:"Optional",required:"Required","required-when":"Required when",forbidden:"Forbidden","forbidden-when":"Forbidden when"})[mode];
const labeled=(dom:Document,text:string,control:HTMLElement):HTMLLabelElement=>{const label=dom.createElement("label");label.append(text,control);return label;};
const input=(dom:Document,name:string,value="",type="text"):HTMLInputElement=>{const control=dom.createElement("input");control.name=name;control.type=type;control.value=value;return control;};
const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
const sectionKey=(section:FocusedPropertySection):string=>section;
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
  const sourceState=(node:CanonicalPropertyNode):"inherited"|"local"|"overridden"|"conflict"=>{
    if(node.provenance.some(({state})=>state==="shadowed"))return "overridden";
    if(node.provenance.some(({state})=>state==="inherited"))return "inherited";
    return "local";
  };
  const ensureWorking=(node:CanonicalPropertyNode):void=>{if(!working||working.id!==node.id)working=clone(node);};
  const command=(next:CanonicalCommand):CanonicalCommandResult=>{
    const prior=current(),result=options.dispatch(next);
    if(result.status==="conflict")feedback=result.message;
    else if(result.status==="applied"||result.status==="rebased")feedback=canonicalCommandOutcome(next,result,prior);
    if((canonicalDispatchRequiresLocalRender(result,options.renderAfterDispatch)||next.kind==="add"||next.kind==="select")&&options.host.isConnected)render();
    return result;
  };
  const patchFor=(node:CanonicalPropertyNode,original:CanonicalPropertyNode):Partial<Omit<CanonicalPropertyNode,"id"|"parentId"|"order"|"provenance">>=>{
    const patch:Partial<Omit<CanonicalPropertyNode,"id"|"parentId"|"order"|"provenance">>={};
    for(const key of ["name","type","itemType","presence","allowedValues","documentation","overrideReferences","expectedValue","enforcement","target"] as const){
      if(!same(node[key],original[key]))Object.assign(patch,{[key]:clone(node[key])});
    }
    const nextRules=node.rules.filter(({id})=>!removedRuleIds.has(id));
    if(!same(nextRules,original.rules)||removedRuleIds.size)patch.rules=clone(nextRules);
    return patch;
  };
  const stagedChanges=(node:CanonicalPropertyNode,original:CanonicalPropertyNode):{label:string;detail:string}[]=>Object.keys(patchFor(node,original)).map((key)=>({label:key==="rules"?"Edit rules":key==="allowedValues"?"Edit values":`Edit ${key}`,detail:`${key} staged for ${canonicalPropertyPath(current(),node.id)}`}));

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
    const changes=stagedChanges(working,original);if(!changes.length){feedback="No staged changes to review.";render();return;}
    const panel=dom.createElement("section"),heading=dom.createElement("h3"),list=dom.createElement("ul"),prospective=dom.createElement("p"),actions=dom.createElement("div"),cancel=button(dom,"Cancel review",()=>{review=undefined;render();}),confirm=button(dom,"Confirm changes",()=>saveFocused());
    panel.setAttribute("aria-label","Review changes");heading.textContent="Review changes";changes.forEach(({label,detail})=>{const item=dom.createElement("li");item.textContent=`${label} · ${detail}`;list.append(item);});prospective.textContent=`Prospective effective result: ${working.type} · ${working.presence.mode} · ${working.rules.length} rules · affected consumers follow ${provenanceText(original)}.`;actions.append(cancel,confirm);panel.append(heading,list,prospective,actions);review=panel;render();
  };
  const contextMenu=(node:CanonicalPropertyNode):HTMLElement=>{
    const menu=dom.createElement("div");menu.className="focused-property-context-menu";menu.setAttribute("role","menu");menu.setAttribute("aria-label",`${canonicalPropertyPath(current(),node.id)} property context menu`);menu.dataset.propertyContextMenu="true";
    const state=sourceState(node),actions=focusedOwnershipActions({inherited:state==="inherited",local:state==="local",overridden:state==="overridden",invariant:node.enforcement==="invariant",conflict:false,replaceable:node.enforcement!=="invariant"});
    for(const section of focusedPropertySections){const entry=dom.createElement("div"),choose=button(dom,sectionLabel(section),()=>{activeSection=section;ensureWorking(node);menuPropertyId=node.id;render();}),summary=dom.createElement("span");entry.dataset.section=sectionKey(section);summary.textContent=section==="rules"?`${node.rules.length} items`:section==="values"?`${node.allowedValues.length} allowed values`:section==="conditions"?focusedConditionLabel(node.presence.condition as unknown as Record<string,unknown>|undefined):"View effective value";choose.setAttribute("role","menuitem");entry.append(choose,summary);menu.append(entry);}
    const ownership=dom.createElement("div");ownership.className="focused-property-ownership-actions";for(const action of actions){const control=button(dom,action,()=>{if(action==="View"||action==="View conflict"||action==="Open source"||action==="Open contributing sources"){feedback=`${action}: ${canonicalPropertyPath(current(),node.id)} · ${provenanceText(node)}`;render();return;}if(action==="Remove local"||action==="Reset to parent"){if(working){if(action==="Reset to parent")working=clone(node);else{working={...clone(node),rules:[]};}feedback=`Staged ${action.toLowerCase()} for ${canonicalPropertyPath(current(),node.id)}.`;activeSection="rules";render();}return;}activeSection=action==="Override here"||action==="Replace here"?"definition":activeSection;ensureWorking(node);render();});control.dataset.ownershipAction=action;ownership.append(control);}menu.append(ownership);
    return menu;
  };
  const renderFocused=(document:CanonicalSchemaDocument,node:CanonicalPropertyNode):HTMLElement=>{
    ensureWorking(node);const wrapper=dom.createElement("section"),heading=dom.createElement("h3"),identity=dom.createElement("p"),source=dom.createElement("p"),effective=dom.createElement("p"),section=dom.createElement("section"),actions=dom.createElement("div"),cancel=button(dom,"Cancel",closeFocused),reviewButton=button(dom,"Review changes",showReview),save=button(dom,"Save property",saveFocused);
    wrapper.setAttribute("aria-label","Focused property editor");wrapper.dataset.focusedPropertyEditor="true";wrapper.dataset.focusedPropertyPath=canonicalPropertyPath(document,node.id);heading.textContent=`Focused property · ${node.name}`;identity.textContent=`${canonicalPropertyPath(document,node.id)} · stable identity ${node.id}`;source.textContent=`Inherited value and source: ${provenanceText(node)}`;effective.textContent=`Effective result: ${node.type} · ${presenceText(node.presence.mode)} · validation valid · conflicts none`;section.setAttribute("aria-label",`Focused ${sectionLabel(activeSection)} section`);renderCanonicalFocusedSection(section,{dom,current,node,getWorking:()=>working,setWorking:(value)=>{working=value;},activeSection,setActiveSection:(value)=>{activeSection=value;},removedRuleIds,id:options.id,render,patchFor,command,select:(id)=>{activePropertyId=id;},feedback:(message)=>{feedback=message;}});actions.append(cancel,reviewButton,save);
    wrapper.append(heading,identity,source,effective,section,actions);return wrapper;
  };
  const render=():void=>{
    const document=current();options.host.replaceChildren();options.host.setAttribute("aria-label",`${options.surface} canonical schema editor`);options.host.dataset.canonicalSchemaId=document.id;options.host.dataset.canonicalRevision=String(document.revision);options.host.dataset.canonicalEditorMode="focused-property";
    const header=dom.createElement("header"),title=dom.createElement("h2"),status=dom.createElement("p"),undo=button(dom,"Undo",()=>options.onUndo?.()),redo=button(dom,"Redo",()=>options.onRedo?.());title.textContent=document.contributorName;status.setAttribute("aria-label","Canonical Draft status");status.textContent=`Draft · ${document.source?`source ${document.source.identity} revision ${document.source.revision}`:"no source revision"} · lineage ${document.source?.provenance??"project-created"} · Saved · Draft token ${document.revision}`;undo.disabled=!options.onUndo;redo.disabled=!options.onRedo;header.append(title,status,undo,redo);
    const navigator=dom.createElement("section"),search=dom.createElement("input"),filter=dom.createElement("select"),tree=dom.createElement("div"),rootName=input(dom,"newRootPropertyName","property"),addRoot=button(dom,"Add root property",()=>{const name=rootName.value.trim();if(name)command({kind:"add",baseRevision:document.revision,name,type:"string",id:options.id});});navigator.setAttribute("aria-label","Canonical property navigator");search.type="search";search.setAttribute("aria-label","Canonical property search");search.placeholder="Search properties";search.value=query;bindCanonicalPropertySearch(search,(next)=>{query=next;render();});filter.name="propertyFilter";filter.append(...["All properties","With conditions","With documentation","With issues"].map((entry)=>new Option(entry,entry)));tree.setAttribute("aria-label","Canonical property search results");for(const row of canonicalTableRows(document).filter(({node})=>node.name.toLowerCase().includes(query.toLowerCase()))){const article=dom.createElement("article"),choose=button(dom,`${"› ".repeat(row.depth)}${row.node.name} · ${row.path} · ${row.node.type}`,()=>openProperty(row.node,choose));choose.dataset.propertyId=row.id;choose.setAttribute("aria-current",String((activePropertyId??document.selectedPropertyId)===row.id));article.dataset.propertyRow="true";article.dataset.propertyId=row.id;const actions=button(dom,"Property actions",()=>{menuPropertyId=row.id;openProperty(row.node,actions);});actions.setAttribute("aria-label",`Property actions for ${row.path}`);actions.dataset.propertyActionsPath=row.path;article.append(choose,actions);if(menuPropertyId===row.id)article.append(contextMenu(row.node));tree.append(article);}
    navigator.append(search,filter,tree,labeled(dom,"New root property name",rootName),addRoot);options.host.append(header,navigator);
    const body=dom.createElement("tbody");for(const article of Array.from(tree.children)){const row=dom.createElement("tr"),cell=dom.createElement("td");cell.append(article);row.append(cell);body.append(row);}tree.replaceChildren(body);tree.setAttribute("role","table");
    const tableView=button(dom,"Table",()=>{}),treeView=button(dom,"Tree",()=>{});navigator.prepend(tableView,treeView);
    const node=selectedNode(document);if(node&&activePropertyId===node.id){const focused=renderFocused(document,node);options.host.append(focused);if(review){const panel=review;options.host.append(panel);}}
    const preview=dom.createElement("section"),previewHeading=dom.createElement("h3"),previewText=dom.createElement("p"),feedbackOutput=dom.createElement("output");preview.setAttribute("aria-label","Effective documentation preview");previewHeading.textContent="Effective documentation";previewText.textContent=node?[node.documentation.displayText,node.documentation.description,node.documentation.comments].filter(Boolean).join(" · ")||"No documentation yet.":"Select a property.";preview.append(previewHeading,previewText);feedbackOutput.setAttribute("aria-label","Canonical command result");feedbackOutput.textContent=feedback;options.host.append(preview,feedbackOutput);
  };
  options.host.addEventListener("keydown",(event)=>{if(event.key==="Escape"&&working){event.preventDefault();closeFocused();}});
  render();return{render};
}
