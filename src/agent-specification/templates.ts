import {transactProject,type ProjectState} from "../data-layer-specification-project.js";
import {createDocumentationTemplate} from "../documentation-templates/template-library.js";
import {validateExcelTemplateWorkbook} from "../documentation-templates/excel-workbook.js";
import {compileProjectDocumentation} from "../data-layer-project-documentation-compiler.js";
import {prepareDocumentationTemplateContext} from "../documentation-templates/template-context.js";
import {createProjectDocumentationTheme,type ProjectDocumentationDraft} from "../data-layer-project-documentation-records.js";
import type {ProjectAssetBodyStore} from "../project-asset-body-contribution.js";
import type {TemplatePlan} from "./types.js";

export function templatePreviewContext(state:ProjectState, plan:TemplatePlan, revision:number) {
  const documentation=state.project.documentation as ProjectDocumentationDraft | undefined;
  const section=documentation?.sets.flatMap(set=>set.sections).find(section=>section.kind===plan.kind) ?? {
    id:"agent-preview",kind:plan.kind,name:plan.name,selected:true,
    ...(plan.kind==="flow" ? {targetId:state.project.collections.flows[0]?.id ?? ""} : plan.kind==="profile" ? {targetId:state.project.collections.profiles[0]?.id ?? ""} : {})};
  const theme=documentation?.themes[0] ?? createProjectDocumentationTheme({id:"agent-preview",name:"Project",clientName:"",logo:"",colors:{heading:"#222222",accent:"#666666",stripe:"#f4f4f4"},typography:{family:"Arial",headingSize:16,bodySize:11},density:"comfortable",borders:true,striping:true,highlightedHeadings:true,columnWidths:{},headerText:"",footerText:""});
  return prepareDocumentationTemplateContext(compileProjectDocumentation({state,revision,generatedAt:new Date().toISOString(),theme,set:{id:"agent-preview",name:"Agent preview",themeId:theme.id,sections:[{...section,selected:true}]}}),section.id);
}
export async function stageTemplate(state:ProjectState, plan:TemplatePlan, blob:Blob, bodies:ProjectAssetBodyStore):Promise<ProjectState> {
  const validation=await validateExcelTemplateWorkbook(blob,plan.kind);
  if (!validation.valid) throw new Error(validation.findings.map(item=>item.message).join("\n"));
  const digest="sha256:"+[...new Uint8Array(await crypto.subtle.digest("SHA-256",await blob.arrayBuffer()))].map(byte=>byte.toString(16).padStart(2,"0")).join("");
  const documentation=(state.project.documentation as ProjectDocumentationDraft | undefined) ?? {sets:[],themes:[]};
  if (documentation.templates?.some(template=>template.digest===digest)) throw new Error("This template is already in the project library.");
  const template=createDocumentationTemplate({id:`agent-template:${crypto.randomUUID()}`,name:plan.name,format:"excel",kind:plan.kind,validation:{valid:true,findings:validation.findings,contractVersion:3},body:{assetId:digest,digest,byteLength:blob.size}});
  const next=transactProject(state,"Save agent export template",project=>({...project,documentation:{...documentation,templates:[...(documentation.templates??[]),template]}}));
  await bodies.storeProjectAssetBody({projectId:state.project.id,namespace:"documentation-template",digest},blob);
  return next;
}
