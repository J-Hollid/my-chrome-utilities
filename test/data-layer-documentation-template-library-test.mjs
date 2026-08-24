import assert from "node:assert/strict";

import {
  assignDocumentationTemplate,
  createDocumentationTemplate,
  documentationTemplateAssignment,
  documentationTemplateProblems,
  repairDocumentationTemplateMetadata,
  removeDocumentationTemplate,
  replaceDocumentationTemplate,
  snapshotTemplateDigests,
  validateDocumentationTemplateTransition,
} from "../dist/documentation-templates/template-library.js";
import {DOCUMENTATION_TEMPLATE_XLSX_TYPE} from "../dist/documentation-templates/template-body.js";
import {excelTemplateGuideFor} from "../dist/documentation-templates/excel-template.js";
import {createMemoryDurableProjectRepository,durableDraftCommand} from "../dist/data-layer-durable-project-repository.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";

let documentation={sets:[{id:"set:client",name:"Client specification",themeId:"theme:client",sections:[]}],themes:[],templates:[]};
const flowGuide=excelTemplateGuideFor("flow");
assert.ok(flowGuide.values.every(entry=>entry.placeholder===`{{${entry.path}}}`&&entry.meaning&&entry.example&&entry.available));
assert.equal(flowGuide.values.find(({path})=>path==="project.name").available,"Template root and every repeat area");
assert.equal(flowGuide.values.find(({path})=>path==="page.pageName").available,"Inside repeats of flow.pages");
assert.equal(flowGuide.values.find(({path})=>path==="event.eventName").available,"Inside repeats of page.events");
assert.deepEqual(flowGuide.collections.find(({path})=>path==="flow.pages"),{path:"flow.pages",meaning:"Flow Page contexts",itemPrefix:"page",fields:["page.stepLabel","page.pageName","page.sourcePageName","page.eventName","page.heading","page.visual.description","page.visual.caption","page.visual.sourceReference","page.rows","page.concepts","page.events"],nestedCollections:["page.events","page.rows","page.concepts"],directions:["Across","Down"],emptyResult:"No copy",copyBehavior:"The complete named repeat area is copied for every item.",example:"PageCard | Repeat | flow.pages | Across | named range A3:D8"});
assert.ok(flowGuide.collections.some(({path,nestedCollections})=>path==="page.events"&&nestedCollections.includes("event.rows")));
assert.deepEqual(flowGuide.areaExamples,[{area:"PageCard",type:"Repeat",source:"flow.pages",direction:"Across",range:"A3:D8"},{area:"EventRow",type:"Repeat",source:"page.events",direction:"Down",range:"A5:B5",parent:"PageCard"},{area:"PageVisual",type:"Image",source:"page.visual.image",direction:"",range:"C5:D7",parent:"PageCard"},{area:"ThemeLogo",type:"Image",source:"theme.logo",direction:"",range:"C1:D2"}],"Flow guidance exposes workbook-aligned copyable area rows");
const template=createDocumentationTemplate({id:"template:flow",name:"Acme flow workbook",format:"excel",kind:"flow",body:{assetId:"body:first",digest:"sha256:first",byteLength:12},validation:{valid:true,findings:[]}});
const contract3Template=createDocumentationTemplate({id:"template:flow-3",name:"Area properties",format:"excel",kind:"flow",body:{assetId:"body:third",digest:"sha256:third",byteLength:13},validation:{valid:true,findings:[],contractVersion:3}});assert.equal(contract3Template.contractVersion,3,"a validated Contract 3 workbook retains its version in project metadata");
documentation={...documentation,templates:[template]};
documentation=assignDocumentationTemplate(documentation,"set:client","excel","flow",template.id);
assert.equal(documentationTemplateAssignment(documentation.sets[0],"excel","flow"),template.id);
assert.throws(()=>removeDocumentationTemplate(documentation,template.id),/Client specification.*Excel Flow/u);

const firstSnapshot=snapshotTemplateDigests(documentation,documentation.sets[0]);
const replacement=replaceDocumentationTemplate(documentation,template.id,new Blob([new Uint8Array(13)]),{valid:true,findings:[]},"sha256:second");
assert.equal(replacement.templates[0].id,template.id);
assert.equal(replacement.templates[0].body.digest,"sha256:second");
assert.notDeepEqual(snapshotTemplateDigests(replacement,replacement.sets[0]),firstSnapshot);

documentation=assignDocumentationTemplate(documentation,"set:client","excel","flow","builtin");
documentation=removeDocumentationTemplate(documentation,template.id);
assert.equal(documentation.templates.length,0);
assert.equal(documentationTemplateAssignment(documentation.sets[0],"excel","flow"),"builtin");

const validDigest=`sha256:${"a".repeat(64)}`,invalidStored=createDocumentationTemplate({id:"template:invalid",name:"Legacy workbook",format:"excel",kind:"flow",body:{assetId:"body:invalid",digest:validDigest,byteLength:12},validation:{valid:true,findings:[]}}),invalidDocumentation={sets:[{id:"set:legacy",name:"Legacy set",themeId:"theme:legacy",sections:[],templateAssignments:{"excel:flow":invalidStored.id}}],themes:[],templates:[{...invalidStored,digest:`sha256:${"b".repeat(64)}`}]};
const unrelatedCarry=structuredClone(invalidDocumentation);unrelatedCarry.sets[0].name="Renamed set";
assert.deepEqual(validateDocumentationTemplateTransition(invalidDocumentation,unrelatedCarry),[],"an unchanged invalid stored template does not trap an unrelated Draft save");
const builtInRecovery=assignDocumentationTemplate(invalidDocumentation,"set:legacy","excel","flow","builtin");
assert.deepEqual(validateDocumentationTemplateTransition(invalidDocumentation,builtInRecovery),[],"Assign Built-in remains an explicit recovery even while the invalid record remains");
const removableInvalid=removeDocumentationTemplate(builtInRecovery,invalidStored.id);
assert.deepEqual(validateDocumentationTemplateTransition(invalidDocumentation,removableInvalid),[],"an invalid template may be removed once no assignment references it");
const changedInvalid=structuredClone(invalidDocumentation);changedInvalid.templates[0].name="Changed invalid workbook";
assert.throws(()=>validateDocumentationTemplateTransition(invalidDocumentation,changedInvalid),/digest does not match/u,"changing an invalid record remains fail closed");
const newInvalid=structuredClone(documentation);newInvalid.templates=[{...invalidStored,digest:`sha256:${"b".repeat(64)}`}];
assert.throws(()=>validateDocumentationTemplateTransition(documentation,newInvalid),/digest does not match/u,"new invalid state remains fail closed");
const [problem]=documentationTemplateProblems(invalidDocumentation);
assert.deepEqual({name:problem.name,format:problem.format,kind:problem.kind,affected:problem.assignments.map(({setName})=>setName),invariant:problem.invariant},{name:"Legacy workbook",format:"Excel",kind:"Flow",affected:["Legacy set"],invariant:"The saved digest does not match the body reference digest."});
for(const [change,invariant]of[[{contractVersion:1},"contract version 1 is unsupported"],[{body:undefined},"no body reference"],[{body:{...invalidStored.body,digest:"broken"}},"body digest is malformed"],[{body:{...invalidStored.body,byteLength:0}},"byte length is outside"],[{richBlocks:[]},"also contains Rich page content"],[{validation:undefined},"validation state is not valid"]]){const candidate={...invalidStored,...change},records={...invalidDocumentation,templates:[candidate]},reported=documentationTemplateProblems(records)[0];assert.match(reported.invariant,new RegExp(invariant,"u"),`the unavailable status exposes ${invariant}`);assert.deepEqual(validateDocumentationTemplateTransition(records,structuredClone(records)),[],"every unchanged legacy invariant remains transition-scoped");}
const repaired=repairDocumentationTemplateMetadata(invalidDocumentation,invalidStored.id,new Blob([new Uint8Array(12)]),{valid:true,findings:[]},validDigest);
assert.equal(repaired.templates[0].id,invalidStored.id);assert.equal(repaired.templates[0].name,invalidStored.name);assert.equal(repaired.templates[0].body.assetId,invalidStored.body.assetId);assert.equal(repaired.templates[0].body.byteLength,12);assert.equal(repaired.templates[0].digest,validDigest);assert.deepEqual(repaired.sets,invalidDocumentation.sets,"revalidation preserves every assignment");
const upgraded=replaceDocumentationTemplate({sets:documentation.sets,themes:[],templates:[template]},template.id,new Blob([new Uint8Array(14)]),{valid:true,findings:[],contractVersion:3},validDigest);
assert.equal(upgraded.templates[0].contractVersion,3,"replacing a Contract 2 workbook with a validated Contract 3 body upgrades saved metadata");assert.equal(upgraded.templates[0].validation.contractVersion,3);assert.equal(upgraded.templates[0].body.assetId,template.body.assetId,"replacement preserves project-owned body identity");

const atomicRepository=createMemoryDurableProjectRepository({now:()=>"2026-08-17T00:00:00.000Z",token:()=>`token:${crypto.randomUUID()}`}),atomicState=createSpecificationProject({name:"Atomic templates",site:"atomic.example",id:kind=>`${kind}:atomic`});atomicState.project.documentation={sets:[{id:"set:atomic",name:"Atomic",themeId:"theme:atomic",sections:[]}],themes:[],templates:[]};await atomicRepository.putProject(atomicState,{draftToken:"token:base",draftSequence:1,active:true});const atomicBase=await atomicRepository.loadProject(atomicState.project.id),body=new Blob([new Uint8Array([1,2,3,4]).buffer],{type:DOCUMENTATION_TEMPLATE_XLSX_TYPE}),bodyDigest=`sha256:${Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await body.arrayBuffer())),byte=>byte.toString(16).padStart(2,"0")).join("")}`,atomicTemplate=createDocumentationTemplate({id:"template:atomic",name:"Atomic workbook",format:"excel",kind:"flow",body:{assetId:"asset:atomic",digest:bodyDigest,byteLength:body.size},validation:{valid:true,findings:[]}}),atomicNext=structuredClone(atomicBase.state);atomicNext.project.documentation.templates=[atomicTemplate];const atomicCommand={...durableDraftCommand(atomicBase,atomicNext,{commandId:"command:atomic",label:"Save atomic template"}),assetBodyOperationId:"operation:atomic",assetBodies:[{identity:{projectId:atomicState.project.id,namespace:"documentation-template",digest:bodyDigest},body,stagingToken:"staging:atomic",operationId:"operation:atomic"}]};atomicRepository.injectFailure("transaction aborted");await assert.rejects(()=>atomicRepository.saveDraft(atomicCommand));atomicRepository.clearFailure();assert.equal((await atomicRepository.loadProject(atomicState.project.id)).state.project.documentation.templates.length,0,"failed metadata save leaves no template record");await assert.rejects(()=>atomicRepository.loadDocumentationTemplateBody(atomicState.project.id,bodyDigest),({name})=>name==="NotFoundError","failed metadata save leaves no template body");await atomicRepository.saveDraft(atomicCommand);assert.equal((await atomicRepository.loadProject(atomicState.project.id)).state.project.documentation.templates[0].digest,bodyDigest);assert.deepEqual(new Uint8Array(await (await atomicRepository.loadDocumentationTemplateBody(atomicState.project.id,bodyDigest)).arrayBuffer()),new Uint8Array([1,2,3,4]),"one Draft transaction commits metadata and exact body bytes");

console.log("documentation template library unit test passed");
