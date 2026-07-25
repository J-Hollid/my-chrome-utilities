import {focusedPropertySectionLabels,focusedPropertySections,type FocusedPropertySection} from "./data-layer-focused-schema-property-ui.js";

export interface FocusedPropertyMenuOptions {
  dom:Document;
  path:string;
  sectionSummary:(section:FocusedPropertySection)=>string;
  selectSection:(section:FocusedPropertySection)=>void;
  actions:readonly string[];
  runAction:(action:string)=>void;
  sectionsDisabled?:boolean;
}

const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};

/** The single menu boundary shared by canonical and composed focused-property editors. */
export function renderFocusedPropertyMenu(options:FocusedPropertyMenuOptions):HTMLElement {
  const {dom}=options,menu=dom.createElement("div");menu.className="focused-property-context-menu";menu.setAttribute("role","menu");menu.setAttribute("aria-label",`${options.path} property context menu`);menu.dataset.propertyContextMenu="true";
  for(const section of focusedPropertySections){const entry=dom.createElement("div"),choose=button(dom,focusedPropertySectionLabels[section],()=>options.selectSection(section)),summary=dom.createElement("span");entry.dataset.section=section;choose.disabled=Boolean(options.sectionsDisabled);choose.setAttribute("role","menuitem");summary.textContent=options.sectionSummary(section);entry.append(choose,summary);menu.append(entry);}
  const ownership=dom.createElement("div");ownership.className="focused-property-ownership-actions";for(const action of options.actions){const control=button(dom,action,()=>options.runAction(action));control.dataset.ownershipAction=action;ownership.append(control);}menu.append(ownership);return menu;
}
