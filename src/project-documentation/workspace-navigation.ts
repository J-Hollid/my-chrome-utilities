import type {ProjectDocumentationSelection} from "../data-layer-project-documentation-workspace.js";

export type DocumentationPrimaryTab="build"|"preview"|"export";

export function documentationTabAfterKey(current:DocumentationPrimaryTab,key:string):DocumentationPrimaryTab {
  const tabs:DocumentationPrimaryTab[]=["build","preview","export"],index=tabs.indexOf(current);
  if(key==="Home")return tabs[0]!;
  if(key==="End")return tabs.at(-1)!;
  if(key==="ArrowRight")return tabs[(index+1)%tabs.length]!;
  if(key==="ArrowLeft")return tabs[(index-1+tabs.length)%tabs.length]!;
  return current;
}

export function documentationPreviewSelection(sectionId:string):ProjectDocumentationSelection {
  return sectionId==="entire"?{scope:"complete"}:{scope:"current",currentSectionId:sectionId};
}
