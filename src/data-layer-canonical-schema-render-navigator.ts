import type {CanonicalPropertyNode} from "./data-layer-canonical-schema.js";
import type {CanonicalSchemaRenderContext} from "./data-layer-canonical-schema-render.js";
import {applyNavigatorView,renderNavigatorRows} from "./canonical-schema-focused/navigator-rows.js";

const input=(dom:Document,name:string,value="",type="text"):HTMLInputElement=>{const control=dom.createElement("input");control.name=name;control.type=type;control.value=value;return control;};
const labeled=(dom:Document,text:string,control:HTMLElement):HTMLLabelElement=>{const label=dom.createElement("label");label.append(text,control);return label;};
const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};

export function renderCanonicalNavigator(context:CanonicalSchemaRenderContext):HTMLElement {
  const {dom,document}=context,navigator=dom.createElement("section"),search=dom.createElement("input"),filter=dom.createElement("select"),tree=dom.createElement("div"),rootName=input(dom,"newRootPropertyName","property"),addRoot=button(dom,"Add root property",()=>{const name=rootName.value.trim();if(name)context.command({kind:"add",baseRevision:document.revision,name,type:"string",id:context.options.id});});navigator.setAttribute("aria-label","Canonical property navigator");search.type="search";search.setAttribute("aria-label","Canonical property search");search.placeholder="Search properties";search.value=context.query;search.addEventListener("input",()=>{context.setQuery(search.value);context.render();});filter.name="propertyFilter";filter.append(...["All properties","With conditions","With documentation","With issues"].map((entry)=>new Option(entry,entry)));tree.setAttribute("aria-label","Canonical property search results");
  renderNavigatorRows(tree,context);applyNavigatorView(tree,dom,document.view);
  navigator.append(search,filter,tree,labeled(dom,"New root property name",rootName),addRoot);navigator.prepend(button(dom,"Table",()=>{context.command({kind:"view",baseRevision:document.revision,view:"table"});context.render();}),button(dom,"Tree",()=>{context.command({kind:"view",baseRevision:document.revision,view:"tree"});context.render();}));return navigator;
}
