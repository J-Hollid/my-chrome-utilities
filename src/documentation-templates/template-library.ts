import {projectDocumentationSafeText,type ProjectDocumentationDraft,type ProjectDocumentationSectionKind,type ProjectDocumentationSet,type ProjectDocumentationTemplate} from "../data-layer-project-documentation-records.js";
import {templateDigest,type DocumentationTemplateFormat} from "./template-contract.js";
import {validateRichDocumentationTemplate,type RichDocumentationTemplate,type RichTemplateBlock} from "./rich-template.js";

export type DocumentationTemplateAssignment="builtin"|string;
type CreateTemplateInput=Omit<ProjectDocumentationTemplate,"contractVersion"|"digest">;
const clone=<T>(value:T):T=>structuredClone(value);
const assignmentKey=(format:DocumentationTemplateFormat,kind:ProjectDocumentationSectionKind)=>`${format}:${kind}`;
const display=(format:DocumentationTemplateFormat,kind:ProjectDocumentationSectionKind)=>`${format==="excel"?"Excel":"Rich page"} ${kind==="profile"?"Site Profile":kind[0]!.toUpperCase()+kind.slice(1)}`;

export function createDocumentationTemplate(input:CreateTemplateInput):ProjectDocumentationTemplate{
  const value={...clone(input),id:projectDocumentationSafeText(input.id),name:projectDocumentationSafeText(input.name),contractVersion:1 as const,digest:input.body?.digest??templateDigest("rich",input.richBlocks??[])};
  if(!value.id)throw new Error("Documentation template needs a stable identity.");if(!value.name)throw new Error("Documentation template needs a name.");if(input.format==="excel"&&(!input.body||input.richBlocks))throw new Error("An Excel template needs exactly one project-owned body.");if(input.format==="rich"&&(!input.richBlocks||input.body))throw new Error("A Rich page template needs exactly one semantic block tree.");
  if(input.format==="rich"){const validation=validateRichDocumentationTemplate({...value,blocks:input.richBlocks as unknown as readonly RichTemplateBlock[]} as unknown as RichDocumentationTemplate);if(!validation.valid)throw new Error(validation.findings.map(({blockId,message})=>`${blockId}: ${message}`).join("\n"));return{...value,validation};}
  return value;
}

export interface DocumentationTemplateBodyReference {digest:string;byteLength:number;kind:ProjectDocumentationSectionKind}
export function validateDocumentationTemplateRecords(documentation:ProjectDocumentationDraft|undefined):DocumentationTemplateBodyReference[]{
  if(!documentation)return[];const templates=documentation.templates??[],ids=new Set<string>(),byId=new Map<string,ProjectDocumentationTemplate>(),bodies:DocumentationTemplateBodyReference[]=[];
  for(const template of templates){
    if(!template.id||ids.has(template.id))throw new DOMException(`Documentation template identity ${template.id||"(missing)"} is invalid or duplicated.`,"DataError");ids.add(template.id);byId.set(template.id,template);if(template.contractVersion!==1||!["overview","flow","matrix","profile"].includes(template.kind))throw new DOMException(`Documentation template ${template.id} uses an unsupported contract.`,"DataError");
    if(template.format==="excel"){if(!template.body||template.richBlocks||!/^sha256:[0-9a-f]{64}$/u.test(template.body.digest)||template.body.digest!==template.digest||template.body.byteLength<1||template.body.byteLength>10*1024*1024||!template.validation.valid)throw new DOMException(`Excel documentation template ${template.id} has invalid body metadata.`,"DataError");bodies.push({digest:template.body.digest,byteLength:template.body.byteLength,kind:template.kind});continue;}
    if(template.format!=="rich"||template.body||!template.richBlocks)throw new DOMException(`Documentation template ${template.id} has an unsupported format.`,"DataError");const blocks=template.richBlocks as unknown as readonly RichTemplateBlock[],validation=validateRichDocumentationTemplate({...template,blocks} as unknown as RichDocumentationTemplate),digest=templateDigest("rich",blocks);if(!validation.valid||template.digest!==digest||!template.validation.valid)throw new DOMException(`Rich documentation template ${template.id} is invalid: ${validation.findings.map(({blockId,message})=>`${blockId}: ${message}`).join("; ")}`,"DataError");
  }
  for(const set of documentation.sets)for(const[key,value]of Object.entries(set.templateAssignments??{})){if(value==="builtin")continue;const match=/^(excel|rich):(overview|flow|matrix|profile)$/u.exec(key),template=byId.get(value);if(!match||!template||template.format!==match[1]||template.kind!==match[2])throw new DOMException(`Documentation Set ${set.id} has an incompatible template assignment at ${key}.`,"DataError");}
  return bodies;
}

export function documentationTemplateAssignment(set:ProjectDocumentationSet,format:DocumentationTemplateFormat,kind:ProjectDocumentationSectionKind):DocumentationTemplateAssignment{return set.templateAssignments?.[assignmentKey(format,kind)]??"builtin";}

export function assignDocumentationTemplate(documentation:ProjectDocumentationDraft,setId:string,format:DocumentationTemplateFormat,kind:ProjectDocumentationSectionKind,templateId:DocumentationTemplateAssignment):ProjectDocumentationDraft{
  if(templateId!=="builtin"){const template=documentation.templates?.find(({id})=>id===templateId);if(!template||template.format!==format||template.kind!==kind||!template.validation.valid)throw new Error(`Choose a valid ${display(format,kind)} template.`);}
  let found=false;const sets=documentation.sets.map(set=>{if(set.id!==setId)return clone(set);found=true;return{...clone(set),templateAssignments:{...(set.templateAssignments??{}),[assignmentKey(format,kind)]:templateId}};});if(!found)throw new Error(`Unknown Documentation Set ${setId}.`);return{...clone(documentation),sets};
}

export function replaceDocumentationTemplate(documentation:ProjectDocumentationDraft,templateId:string,body:NonNullable<ProjectDocumentationTemplate["body"]>):ProjectDocumentationDraft{
  let found=false;const templates=(documentation.templates??[]).map(template=>{if(template.id!==templateId)return clone(template);found=true;if(template.format!=="excel")throw new Error("Only an Excel template has a replaceable workbook body.");return{...clone(template),body:clone(body),digest:body.digest};});if(!found)throw new Error(`Unknown documentation template ${templateId}.`);return{...clone(documentation),templates};
}

export function removeDocumentationTemplate(documentation:ProjectDocumentationDraft,templateId:string):ProjectDocumentationDraft{
  const template=documentation.templates?.find(({id})=>id===templateId);if(!template)throw new Error(`Unknown documentation template ${templateId}.`);const references=documentation.sets.flatMap(set=>Object.entries(set.templateAssignments??{}).flatMap(([key,value])=>value===templateId?[`${set.name} and ${display(key.split(":")[0] as DocumentationTemplateFormat,key.split(":")[1] as ProjectDocumentationSectionKind)}`]:[]));if(references.length)throw new Error(`Assign Built-in or another template before removal; ${references.join(", ")} still uses ${template.name}.`);return{...clone(documentation),templates:(documentation.templates??[]).filter(({id})=>id!==templateId).map(clone)};
}

export function snapshotTemplateDigests(documentation:ProjectDocumentationDraft,set:ProjectDocumentationSet):Readonly<Record<string,string>>{
  const templates=new Map((documentation.templates??[]).map(template=>[template.id,template]));return Object.fromEntries((["excel","rich"] as const).flatMap(format=>(["overview","flow","matrix","profile"] as const).map(kind=>{const assigned=documentationTemplateAssignment(set,format,kind),template=assigned==="builtin"?undefined:templates.get(assigned);return[assignmentKey(format,kind),template?.digest??"builtin"];})));
}
