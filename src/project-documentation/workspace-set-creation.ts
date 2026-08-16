import {createProjectDocumentationSet,createProjectDocumentationTheme,type ProjectDocumentationDraft,type ProjectDocumentationSet,type ProjectDocumentationTheme} from "../data-layer-project-documentation-records.js";

export interface DocumentationSetCreationInput {setId:string;themeId:string;setName:string;themeName:string}
export interface DocumentationSetCreation {records:ProjectDocumentationDraft;set:ProjectDocumentationSet;theme:ProjectDocumentationTheme}

export function createDefaultProjectDocumentationTheme(id:string,name:string):ProjectDocumentationTheme {
  return createProjectDocumentationTheme({id,name:name.trim()||"Project theme",clientName:"",logo:"",colors:{heading:"#222222",accent:"#336699",stripe:"#f4f4f4"},typography:{family:"Arial",headingSize:16,bodySize:11},density:"comfortable",borders:true,striping:true,highlightedHeadings:true,columnWidths:{Property:28,Description:48},headerText:"",footerText:""});
}

export function appendProjectDocumentationSet(records:ProjectDocumentationDraft,input:DocumentationSetCreationInput):DocumentationSetCreation {
  const theme=createDefaultProjectDocumentationTheme(input.themeId,input.themeName),set=createProjectDocumentationSet({id:input.setId,name:input.setName.trim()||"Client specification",themeId:theme.id,sections:[{id:`${input.setId}:overview`,kind:"overview",name:"Overview",selected:true},{id:`${input.setId}:matrix`,kind:"matrix",name:"Data capture matrix",selected:true,configuration:{contextIds:[]}}]});
  return{records:{sets:[...records.sets,set],themes:[...records.themes,theme]},set,theme};
}
