import {installProjectDocumentationWorkspaceUi} from "../data-layer-project-documentation-workspace-ui.js";
import type {ProjectAssetBodyStore} from "../project-asset-body-contribution.js";

const TEMPLATE_BODY_NAMESPACE="documentation-template";
const STYLE_ID="documentation-template-workspace-style";
const EXCEL_SCRIPT_ID="documentation-template-exceljs";

const installDocumentationTemplateAssets=():void=>{
  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement("style");style.id=STYLE_ID;style.textContent=`
.documentation-context-header{grid-template-columns:minmax(12rem,1fr) auto auto auto}
.documentation-template-panel{min-width:0;padding:.75rem;margin-block:.75rem;background:#fff;border:1px solid var(--border);border-radius:.5rem;overflow-x:hidden}
.documentation-template-library-grid{display:grid;grid-template-columns:minmax(18rem,1fr) minmax(18rem,1fr);gap:1rem;align-items:start}
.documentation-template-library [aria-label="Template list"]{display:grid;gap:.75rem}
.documentation-template-library [aria-label="Template list"]>section{padding:.65rem;border:1px solid var(--border);border-radius:.4rem}
@media(max-width:700px){.documentation-context-header{grid-template-columns:minmax(0,1fr)}.documentation-template-library-grid{grid-template-columns:minmax(0,1fr)}.documentation-template-library-grid>[data-mobile-surface="inactive"]{display:none}.documentation-template-panel{padding:.55rem;max-width:100%}}
`;document.head.append(style);
  }
  if(!document.getElementById(EXCEL_SCRIPT_ID)){
    const script=document.createElement("script");script.id=EXCEL_SCRIPT_ID;script.src="vendor/exceljs.min.js";document.head.append(script);
  }
};

export type ProjectDocumentationWorkspaceContributionOptions=Parameters<typeof installProjectDocumentationWorkspaceUi>[0]&{
  assetBodies:ProjectAssetBodyStore;
};
export type ProjectDocumentationWorkspaceContribution=ReturnType<typeof installProjectDocumentationWorkspaceUi>;

export const installProjectDocumentationWorkspaceContribution = (
  {assetBodies,...options}:ProjectDocumentationWorkspaceContributionOptions,
):ProjectDocumentationWorkspaceContribution => {
  installDocumentationTemplateAssets();
  return installProjectDocumentationWorkspaceUi({
    ...options,
    storeTemplateBody:(projectId,digest,body)=>assetBodies.storeProjectAssetBody({projectId,namespace:TEMPLATE_BODY_NAMESPACE,digest},body),
    loadTemplateBody:(projectId,digest)=>assetBodies.loadProjectAssetBody({projectId,namespace:TEMPLATE_BODY_NAMESPACE,digest}),
    ...(assetBodies.deleteProjectAssetBody?{discardTemplateBody:(projectId:string,digest:string)=>assetBodies.deleteProjectAssetBody!({projectId,namespace:TEMPLATE_BODY_NAMESPACE,digest})}:{}),
  });
};
