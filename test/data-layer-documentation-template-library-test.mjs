import assert from "node:assert/strict";

import {
  assignDocumentationTemplate,
  createDocumentationTemplate,
  documentationTemplateAssignment,
  removeDocumentationTemplate,
  replaceDocumentationTemplate,
  snapshotTemplateDigests,
} from "../dist/documentation-templates/template-library.js";
import {DOCUMENTATION_TEMPLATE_XLSX_TYPE} from "../dist/documentation-templates/template-body.js";
import {excelTemplateGuideFor} from "../dist/documentation-templates/excel-template.js";
import {createMemoryDurableProjectRepository,durableDraftCommand} from "../dist/data-layer-durable-project-repository.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";

let documentation={sets:[{id:"set:client",name:"Client specification",themeId:"theme:client",sections:[]}],themes:[],templates:[]};
const flowGuide=excelTemplateGuideFor("flow");
assert.ok(flowGuide.values.every(entry=>entry.placeholder===`{{${entry.path}}}`&&entry.meaning&&entry.example&&entry.available));
assert.deepEqual(flowGuide.collections.find(({path})=>path==="flow.pages"),{path:"flow.pages",meaning:"Flow Page contexts",itemPrefix:"page",fields:["page.stepLabel","page.pageName","page.sourcePageName","page.eventName","page.heading","page.rows","page.events"],nestedCollections:["page.events","page.rows"],directions:["Across","Down"],emptyResult:"No copy",copyBehavior:"The complete named repeat area is copied for every item."});
assert.ok(flowGuide.collections.some(({path,nestedCollections})=>path==="page.events"&&nestedCollections.includes("event.rows")));
const template=createDocumentationTemplate({id:"template:flow",name:"Acme flow workbook",format:"excel",kind:"flow",body:{assetId:"body:first",digest:"sha256:first",byteLength:12},validation:{valid:true,findings:[]}});
documentation={...documentation,templates:[template]};
documentation=assignDocumentationTemplate(documentation,"set:client","excel","flow",template.id);
assert.equal(documentationTemplateAssignment(documentation.sets[0],"excel","flow"),template.id);
assert.throws(()=>removeDocumentationTemplate(documentation,template.id),/Client specification.*Excel Flow/u);

const firstSnapshot=snapshotTemplateDigests(documentation,documentation.sets[0]);
const replacement=replaceDocumentationTemplate(documentation,template.id,{assetId:"body:second",digest:"sha256:second",byteLength:13});
assert.equal(replacement.templates[0].id,template.id);
assert.equal(replacement.templates[0].body.digest,"sha256:second");
assert.notDeepEqual(snapshotTemplateDigests(replacement,replacement.sets[0]),firstSnapshot);

documentation=assignDocumentationTemplate(documentation,"set:client","excel","flow","builtin");
documentation=removeDocumentationTemplate(documentation,template.id);
assert.equal(documentation.templates.length,0);
assert.equal(documentationTemplateAssignment(documentation.sets[0],"excel","flow"),"builtin");

const atomicRepository=createMemoryDurableProjectRepository({now:()=>"2026-08-17T00:00:00.000Z",token:()=>`token:${crypto.randomUUID()}`}),atomicState=createSpecificationProject({name:"Atomic templates",site:"atomic.example",id:kind=>`${kind}:atomic`});atomicState.project.documentation={sets:[{id:"set:atomic",name:"Atomic",themeId:"theme:atomic",sections:[]}],themes:[],templates:[]};await atomicRepository.putProject(atomicState,{draftToken:"token:base",draftSequence:1,active:true});const atomicBase=await atomicRepository.loadProject(atomicState.project.id),body=new Blob([new Uint8Array([1,2,3,4]).buffer],{type:DOCUMENTATION_TEMPLATE_XLSX_TYPE}),bodyDigest=`sha256:${Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await body.arrayBuffer())),byte=>byte.toString(16).padStart(2,"0")).join("")}`,atomicTemplate=createDocumentationTemplate({id:"template:atomic",name:"Atomic workbook",format:"excel",kind:"flow",body:{assetId:"asset:atomic",digest:bodyDigest,byteLength:body.size},validation:{valid:true,findings:[]}}),atomicNext=structuredClone(atomicBase.state);atomicNext.project.documentation.templates=[atomicTemplate];const atomicCommand={...durableDraftCommand(atomicBase,atomicNext,{commandId:"command:atomic",label:"Save atomic template"}),assetBodyOperationId:"operation:atomic",assetBodies:[{identity:{projectId:atomicState.project.id,namespace:"documentation-template",digest:bodyDigest},body,stagingToken:"staging:atomic",operationId:"operation:atomic"}]};atomicRepository.injectFailure("transaction aborted");await assert.rejects(()=>atomicRepository.saveDraft(atomicCommand));atomicRepository.clearFailure();assert.equal((await atomicRepository.loadProject(atomicState.project.id)).state.project.documentation.templates.length,0,"failed metadata save leaves no template record");await assert.rejects(()=>atomicRepository.loadDocumentationTemplateBody(atomicState.project.id,bodyDigest),({name})=>name==="NotFoundError","failed metadata save leaves no template body");await atomicRepository.saveDraft(atomicCommand);assert.equal((await atomicRepository.loadProject(atomicState.project.id)).state.project.documentation.templates[0].digest,bodyDigest);assert.deepEqual(new Uint8Array(await (await atomicRepository.loadDocumentationTemplateBody(atomicState.project.id,bodyDigest)).arrayBuffer()),new Uint8Array([1,2,3,4]),"one Draft transaction commits metadata and exact body bytes");

console.log("documentation template library unit test passed");
