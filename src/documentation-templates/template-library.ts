import {projectDocumentationSafeText,type ProjectDocumentationDraft,type ProjectDocumentationSectionKind,type ProjectDocumentationSet,type ProjectDocumentationTemplate} from "../data-layer-project-documentation-records.js";
import {templateDigest,type DocumentationTemplateFormat} from "./template-contract.js";
import {validateRichDocumentationTemplate,type RichDocumentationTemplate,type RichTemplateBlock} from "./rich-template.js";

export type DocumentationTemplateAssignment="builtin"|string;
type CreateTemplateInput=Omit<ProjectDocumentationTemplate,"contractVersion"|"digest">;
const clone=<T>(value:T):T=>structuredClone(value);
const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
const assignmentKey=(format:DocumentationTemplateFormat,kind:ProjectDocumentationSectionKind)=>`${format}:${kind}`;
const display=(format:DocumentationTemplateFormat,kind:ProjectDocumentationSectionKind)=>`${format==="excel"?"Excel":"Rich page"} ${kind==="profile"?"Site Profile":kind[0]!.toUpperCase()+kind.slice(1)}`;

export function createDocumentationTemplate(input:CreateTemplateInput):ProjectDocumentationTemplate{
  const value={...clone(input),id:projectDocumentationSafeText(input.id),name:projectDocumentationSafeText(input.name),contractVersion:(input.format==="excel"?(input.validation.contractVersion??2):1) as 1|2|3,digest:input.body?.digest??templateDigest("rich",input.richBlocks??[])};
  if(!value.id)throw new Error("Documentation template needs a stable identity.");if(!value.name)throw new Error("Documentation template needs a name.");if(input.format==="excel"&&(!input.body||input.richBlocks))throw new Error("An Excel template needs exactly one project-owned body.");if(input.format==="rich"&&(!input.richBlocks||input.body))throw new Error("A Rich page template needs exactly one semantic block tree.");
  if(input.format==="rich"){const validation=validateRichDocumentationTemplate({...value,blocks:input.richBlocks as unknown as readonly RichTemplateBlock[]} as unknown as RichDocumentationTemplate);if(!validation.valid)throw new Error(validation.findings.map(({blockId,message})=>`${blockId}: ${message}`).join("\n"));return{...value,validation};}
  return value;
}

export interface DocumentationTemplateBodyReference {digest:string;byteLength:number;kind:ProjectDocumentationSectionKind}
function invalidTemplateRecord(template:ProjectDocumentationTemplate):string|undefined{
  if(!["overview","flow","matrix","profile"].includes(template.kind))return`Documentation template ${template.id} uses an unsupported contract.`;
  if(template.format==="excel"){
    if(template.contractVersion!==2&&template.contractVersion!==3)return`Excel documentation template ${template.id} uses unsupported contract ${template.contractVersion}.`;
    if(!template.body)return`Excel documentation template ${template.id} has no saved body reference.`;
    if(template.richBlocks)return`Excel documentation template ${template.id} also contains Rich page content.`;
    if(!/^sha256:[0-9a-f]{64}$/u.test(template.body.digest))return`Excel documentation template ${template.id} has a malformed body digest.`;
    if(template.body.digest!==template.digest)return`Excel documentation template ${template.id} saved digest does not match its body reference digest.`;
    if(template.body.byteLength<1||template.body.byteLength>10*1024*1024)return`Excel documentation template ${template.id} has an out-of-range body byte length.`;
    if(!template.validation?.valid)return`Excel documentation template ${template.id} has no valid saved validation state.`;
    return undefined;
  }
  if(template.contractVersion!==1)return`Documentation template ${template.id} uses an unsupported contract.`;
  if(template.format!=="rich"||template.body||!template.richBlocks)return`Documentation template ${template.id} has an unsupported format.`;
  const blocks=template.richBlocks as unknown as readonly RichTemplateBlock[],validation=validateRichDocumentationTemplate({...template,blocks} as unknown as RichDocumentationTemplate),digest=templateDigest("rich",blocks);return!validation.valid||template.digest!==digest||!template.validation.valid?`Rich documentation template ${template.id} is invalid: ${validation.findings.map(({blockId,message})=>`${blockId}: ${message}`).join("; ")}`:undefined;
}

export interface DocumentationTemplateProblem {templateId:string;name:string;format:"Excel"|"Rich page";kind:string;invariant:string;assignments:{setId:string;setName:string;key:string}[]}
const invariantFor=(template:ProjectDocumentationTemplate):string|undefined=>{const problem=invalidTemplateRecord(template);if(!problem)return undefined;if(problem.includes("unsupported contract"))return`The saved contract version ${template.contractVersion} is unsupported.`;if(problem.includes("no saved body"))return"The saved template has no body reference.";if(problem.includes("Rich page content"))return"The Excel record also contains Rich page content.";if(problem.includes("malformed body digest"))return"The saved body digest is malformed.";if(problem.includes("does not match"))return"The saved digest does not match the body reference digest.";if(problem.includes("byte length"))return"The saved body byte length is outside the supported range.";if(problem.includes("validation state"))return"The saved validation state is not valid.";return problem;};
export const documentationTemplateUnavailableInvariant=(template:ProjectDocumentationTemplate):string|undefined=>invariantFor(template);
export function documentationTemplateProblems(documentation:ProjectDocumentationDraft|undefined):DocumentationTemplateProblem[]{if(!documentation)return[];return(documentation.templates??[]).flatMap(template=>{const invariant=invariantFor(template);if(!invariant)return[];const assignments=documentation.sets.flatMap(set=>Object.entries(set.templateAssignments??{}).flatMap(([key,value])=>value===template.id?[{setId:set.id,setName:set.name,key}]:[]));return[{templateId:template.id,name:template.name,format:template.format==="excel"?"Excel":"Rich page",kind:display(template.format,template.kind).replace(/^(?:Excel|Rich page) /u,""),invariant,assignments}];});}

export function repairDocumentationTemplateMetadata(documentation:ProjectDocumentationDraft,templateId:string,body:Blob,validation:ProjectDocumentationTemplate["validation"],bodyDigest:string):ProjectDocumentationDraft{
  if(!validation.valid)throw new Error("Revalidation must pass before repairing saved template metadata.");let found=false;const templates=(documentation.templates??[]).map(template=>{if(template.id!==templateId)return clone(template);found=true;if(template.format!=="excel"||!template.body)throw new Error("Only a saved Excel workbook body can be revalidated.");return{...clone(template),contractVersion:validation.contractVersion??2,digest:bodyDigest,body:{...clone(template.body),digest:bodyDigest,byteLength:body.size},validation:clone(validation)};});if(!found)throw new Error(`Unknown documentation template ${templateId}.`);return{...clone(documentation),templates};
}
function validateAssignments(documentation:ProjectDocumentationDraft,byId:ReadonlyMap<string,ProjectDocumentationTemplate>):void{
  for(const set of documentation.sets)for(const[key,value]of Object.entries(set.templateAssignments??{})){if(value==="builtin")continue;const match=/^(excel|rich):(overview|flow|matrix|profile)$/u.exec(key),template=byId.get(value);if(!match||!template||template.format!==match[1]||template.kind!==match[2])throw new DOMException(`Documentation Set ${set.id} has an incompatible template assignment at ${key}.`,"DataError");}
}
export function validateDocumentationTemplateRecords(documentation:ProjectDocumentationDraft|undefined):DocumentationTemplateBodyReference[]{
  if(!documentation)return[];const templates=documentation.templates??[],ids=new Set<string>(),byId=new Map<string,ProjectDocumentationTemplate>(),bodies:DocumentationTemplateBodyReference[]=[];
  for(const template of templates){
    if(!template.id||ids.has(template.id))throw new DOMException(`Documentation template identity ${template.id||"(missing)"} is invalid or duplicated.`,"DataError");ids.add(template.id);byId.set(template.id,template);const problem=invalidTemplateRecord(template);if(problem)throw new DOMException(problem,"DataError");if(template.format==="excel")bodies.push({digest:template.body!.digest,byteLength:template.body!.byteLength,kind:template.kind});
  }
  validateAssignments(documentation,byId);
  return bodies;
}

export function validateDocumentationTemplateTransition(stored:unknown,pending:ProjectDocumentationDraft|undefined):DocumentationTemplateBodyReference[]{
  if(!pending)return[];const before=(stored as ProjectDocumentationDraft|undefined)??{sets:[],themes:[],templates:[]},beforeById=new Map((before.templates??[]).map(template=>[template.id,template])),pendingById=new Map<string,ProjectDocumentationTemplate>(),ids=new Set<string>(),bodies:DocumentationTemplateBodyReference[]=[];
  for(const template of pending.templates??[]){
    if(!template.id||ids.has(template.id))throw new DOMException(`Documentation template identity ${template.id||"(missing)"} is invalid or duplicated.`,"DataError");ids.add(template.id);pendingById.set(template.id,template);const problem=invalidTemplateRecord(template);if(!problem){if(template.format==="excel")bodies.push({digest:template.body!.digest,byteLength:template.body!.byteLength,kind:template.kind});continue;}
    const prior=beforeById.get(template.id);if(!prior||!invalidTemplateRecord(prior)||!same(prior,template))throw new DOMException(problem,"DataError");
    for(const set of pending.sets){const value=set.templateAssignments?.[assignmentKey(template.format,template.kind)];if(value===template.id){const previous=before.sets.find(({id})=>id===set.id)?.templateAssignments?.[assignmentKey(template.format,template.kind)];if(previous!==template.id)throw new DOMException(problem,"DataError");}}
    for(const set of before.sets){const key=assignmentKey(template.format,template.kind);if(set.templateAssignments?.[key]!==template.id)continue;const next=pending.sets.find(({id})=>id===set.id)?.templateAssignments?.[key]??"builtin";if(next!==template.id&&next!=="builtin")throw new DOMException(`Assign Built-in before changing the invalid template assignment at ${key}.`,"DataError");}
  }
  validateAssignments(pending,pendingById);return bodies;
}

export function documentationTemplateAssignment(set:ProjectDocumentationSet,format:DocumentationTemplateFormat,kind:ProjectDocumentationSectionKind):DocumentationTemplateAssignment{return set.templateAssignments?.[assignmentKey(format,kind)]??"builtin";}

export function assignDocumentationTemplate(documentation:ProjectDocumentationDraft,setId:string,format:DocumentationTemplateFormat,kind:ProjectDocumentationSectionKind,templateId:DocumentationTemplateAssignment):ProjectDocumentationDraft{
  if(templateId!=="builtin"){const template=documentation.templates?.find(({id})=>id===templateId);if(!template||template.format!==format||template.kind!==kind||!template.validation.valid)throw new Error(`Choose a valid ${display(format,kind)} template.`);}
  let found=false;const sets=documentation.sets.map(set=>{if(set.id!==setId)return clone(set);found=true;return{...clone(set),templateAssignments:{...(set.templateAssignments??{}),[assignmentKey(format,kind)]:templateId}};});if(!found)throw new Error(`Unknown Documentation Set ${setId}.`);return{...clone(documentation),sets};
}

export function replaceDocumentationTemplate(documentation:ProjectDocumentationDraft,templateId:string,body:Blob,validation:ProjectDocumentationTemplate["validation"],bodyDigest:string):ProjectDocumentationDraft{
  return repairDocumentationTemplateMetadata(documentation,templateId,body,validation,bodyDigest);
}

export function removeDocumentationTemplate(documentation:ProjectDocumentationDraft,templateId:string):ProjectDocumentationDraft{
  const template=documentation.templates?.find(({id})=>id===templateId);if(!template)throw new Error(`Unknown documentation template ${templateId}.`);const references=documentation.sets.flatMap(set=>Object.entries(set.templateAssignments??{}).flatMap(([key,value])=>value===templateId?[`${set.name} and ${display(key.split(":")[0] as DocumentationTemplateFormat,key.split(":")[1] as ProjectDocumentationSectionKind)}`]:[]));if(references.length)throw new Error(`Assign Built-in or another template before removal; ${references.join(", ")} still uses ${template.name}.`);return{...clone(documentation),templates:(documentation.templates??[]).filter(({id})=>id!==templateId).map(clone)};
}

export function snapshotTemplateDigests(documentation:ProjectDocumentationDraft,set:ProjectDocumentationSet):Readonly<Record<string,string>>{
  const templates=new Map((documentation.templates??[]).map(template=>[template.id,template]));return Object.fromEntries((["excel","rich"] as const).flatMap(format=>(["overview","flow","matrix","profile"] as const).map(kind=>{const assigned=documentationTemplateAssignment(set,format,kind),template=assigned==="builtin"?undefined:templates.get(assigned);return[assignmentKey(format,kind),template?.digest??"builtin"];})));
}
