import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import ExcelJS from "exceljs";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {preferredProjectLibraryTransport,projectLibrary} from "../dist/data-layer-project-library.js";
import {createMemoryDurableProjectRepository} from "../dist/data-layer-durable-project-repository.js";
import {createDurableProjectRuntime} from "../dist/data-layer-durable-project-runtime.js";
import {createFlowVisualArchive} from "../dist/flow-visual-asset-portability.js";
import {createVersion2ProjectLibraryTransport,createVersion3ProjectLibraryTransport} from "../dist/durable-project/project-library-transport-v2.js";
import {createCompatibilityProjectLibraryTransport} from "../dist/configuration-portability/project-library-transport.js";
import {writeDocumentationTemplateStarter} from "../dist/documentation-templates/excel-renderer.js";

globalThis.ExcelJS=ExcelJS;

const state=createSpecificationProject({name:"Retail",site:"retail.example",id:kind=>kind==="project"?"project:retail":`${kind}:retail`}),library=projectLibrary([{state,revision:2,createdAt:"2026-08-16T00:00:00.000Z",lastModifiedAt:"2026-08-16T00:00:00.000Z"}],"project:retail"),bundle={format:"my-chrome-utilities.durable-project-bundle",version:2,sourceProjectId:"project:retail",sourceName:"Retail",publishedRevision:0,baseProjectRevision:0,project:state.project,transportFixture:"x".repeat(70*1024)},calls={exports:0,imports:0},repository={async exportProject(projectId){calls.exports+=1;assert.equal(projectId,"project:retail");return structuredClone(bundle);},async importProject(candidate,input){calls.imports+=1;assert.deepEqual(candidate,bundle);return{projectId:input.projectId,active:false,canonicalRepairCount:0};}};
const compatibilitySerialized=JSON.stringify({format:"my-chrome-utilities.project-bundle",version:1,sourceProjectId:"project:retail",sourceName:"Retail",draftRevision:2,project:state.project});let compatibilityImported;
const compatibility=createCompatibilityProjectLibraryTransport({exportProject:async()=>compatibilitySerialized,importProject:async(value,input)=>{compatibilityImported={value,input};},library:()=>library,id:kind=>`copy:${kind}`,now:()=>"2026-08-16T00:00:00.000Z"});
const compatibilityPrepared=await compatibility.prepareExport("project:retail"),compatibilityChunks=[];await compatibilityPrepared.write({write:async chunk=>compatibilityChunks.push(chunk)});assert.equal(new TextDecoder().decode(compatibilityChunks[0]),compatibilitySerialized);await assert.rejects(()=>compatibilityPrepared.write({write:async()=>{}}),/already started/u);compatibilityPrepared.release();
const compatibilityInspected=await compatibility.inspectImport(new Blob([compatibilitySerialized]));assert.equal(compatibilityImported,undefined,"inspection does not commit project data");await compatibilityInspected.commit({name:"Portable copy"});assert.equal(compatibilityImported.input.name,"Portable copy");await assert.rejects(()=>compatibilityInspected.commit({name:"Again"}),/already started/u);compatibilityInspected.release();
const transport=createVersion2ProjectLibraryTransport({repository,library:()=>library,id:oldId=>`copy:${oldId}`,now:()=>"2026-08-16T00:00:00.000Z"});

const prepared=await transport.prepareExport("project:retail");
assert.equal(calls.exports,1,"one export preparation reads the durable bundle once");
assert.deepEqual({formatVersion:prepared.formatVersion,mediaType:prepared.mediaType,extension:prepared.extension},{formatVersion:2,mediaType:"application/json",extension:"json"});
const chunks=[];await prepared.write({write:async chunk=>chunks.push(Uint8Array.from(chunk))});
assert.ok(chunks.length>1&&chunks.every(chunk=>chunk.byteLength<=64*1024),"the version 2 writer exposes bounded chunks");
assert.equal(JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))).sourceProjectId,"project:retail");
await assert.rejects(()=>prepared.write({write:async()=>{}}),/already started/i,"a prepared writer starts at most once");
prepared.release();prepared.release();

const cancelled=await transport.prepareExport("project:retail"),controller=new AbortController();controller.abort();
await assert.rejects(()=>cancelled.write({write:async()=>{}},{signal:controller.signal}),error=>error?.name==="AbortError");
cancelled.release();

let sourceReads=0;const source={name:"retail-project.json",size:JSON.stringify(bundle).length,async text(){sourceReads+=1;return JSON.stringify(bundle);}},inspected=await transport.inspectImport(source);
assert.equal(sourceReads,1,"one selected source is inspected once");
assert.equal(inspected.formatVersion,2);assert.equal(inspected.sourceName,"Retail");assert.equal(inspected.targetName,"Retail copy");assert.equal(inspected.referenceIntegrity,"valid");assert.equal(calls.imports,0,"inspection commits no durable project");
await inspected.commit({name:"Retail copy"});assert.equal(calls.imports,1);
await assert.rejects(()=>inspected.commit({name:"Retail copy again"}),/already started/i,"one inspection commits at most once");
inspected.release();inspected.release();

const released=await transport.inspectImport(source);released.release();
await assert.rejects(()=>released.commit({name:"Released"}),/released/i,"closing review releases staged resources and commits nothing");
assert.equal(calls.imports,1);

let fallbackCalls=0;const injected={prepareExport:async()=>{throw new Error("injected failure");},inspectImport:async()=>{throw new Error("injected failure");}},fallback={prepareExport:async()=>{fallbackCalls+=1;throw new Error("fallback");},inspectImport:async()=>{fallbackCalls+=1;throw new Error("fallback");}},selected=preferredProjectLibraryTransport({projectLibraryTransport:injected},fallback);
assert.equal(selected,injected,"the injected host port is preferred");
await assert.rejects(()=>selected.prepareExport("project:retail"),/injected failure/);assert.equal(fallbackCalls,0,"an installed-port failure never falls through to compatibility callbacks");
assert.equal(preferredProjectLibraryTransport({},fallback),fallback,"isolated hosts retain the compatibility path");

const templateBody=new Blob([await writeDocumentationTemplateStarter("flow")],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),templateDigest=`sha256:${Buffer.from(await crypto.subtle.digest("SHA-256",await templateBody.arrayBuffer())).toString("hex")}`,templateProject=structuredClone(state.project);templateProject.documentation={sets:[],themes:[],templates:[{id:"template:flow",name:"Flow workbook",format:"excel",kind:"flow",contractVersion:2,digest:templateDigest,validation:{valid:true,findings:[]},body:{assetId:"template-body:flow",digest:templateDigest,byteLength:templateBody.size}}]};
const version3Archive=await createFlowVisualArchive({project:templateProject,assets:[],templateBodies:[{digest:templateDigest,byteLength:templateBody.size,body:templateBody}]}),version3Calls={prepare:0,writes:0,imports:0,sourceReads:0};let version3Imported;
const version3Repository={
  async exportProject(){throw new Error("version 3 export must use archive preparation");},
  async prepareProjectArchive(projectId){version3Calls.prepare+=1;assert.equal(projectId,"project:retail");return{estimatedBytes:version3Archive.byteLength,async write(sink,{onProgress}={}){version3Calls.writes+=1;onProgress?.({phase:"write",entry:"manifest.json",completed:1,total:1});await sink.write(version3Archive);}};},
  async importProject(candidate,input,assets,templateBodies){version3Calls.imports+=1;version3Imported={candidate,input,assets,templateBodies};},
};
const version3=createVersion3ProjectLibraryTransport({repository:version3Repository,library:()=>library,id:oldId=>`archive:${oldId}`});
const version3Prepared=await version3.prepareExport("project:retail"),version3Chunks=[];
assert.deepEqual({formatVersion:version3Prepared.formatVersion,mediaType:version3Prepared.mediaType,extension:version3Prepared.extension},{formatVersion:3,mediaType:"application/zip",extension:"zip"});
await version3Prepared.write({write:async chunk=>version3Chunks.push(Uint8Array.from(chunk))});
assert.equal(version3Calls.prepare,1,"version 3 export preparation reads repository archive input once");assert.equal(version3Calls.writes,1,"one prepared version 3 export writes once");assert.deepEqual(Array.from(version3Chunks[0].slice(0,4)),[80,75,3,4]);
await assert.rejects(()=>version3Prepared.write({write:async()=>{}}),/already started/i);version3Prepared.release();
class TracedArchiveFile extends File{maxSlice=0;arrayBuffer(){throw new Error("ZIP inspection must not materialize the complete source");}slice(start=0,end=this.size,type){this.maxSlice=Math.max(this.maxSlice,Math.max(0,end-start));version3Calls.sourceReads+=1;return super.slice(start,end,type);}}
const version3Source=new TracedArchiveFile([version3Archive],"retail-project.zip"),version3Inspected=await version3.inspectImport(version3Source);
assert.ok(version3Calls.sourceReads>1&&version3Source.maxSlice<version3Archive.byteLength,"archive inspection reads bounded slices instead of one complete source buffer");assert.equal(version3Inspected.formatVersion,3);assert.equal(version3Inspected.sourceName,"Retail");assert.equal(version3Inspected.targetName,"Retail copy");assert.equal(version3Calls.imports,0,"version 3 inspection writes nothing");
await version3Inspected.commit({name:"Archive copy"});assert.equal(version3Calls.imports,1);assert.equal(version3Imported.input.name,"Archive copy");assert.deepEqual(version3Imported.assets,[]);assert.equal(version3Imported.templateBodies.length,1);assert.equal(version3Imported.templateBodies[0].digest,templateDigest,"version 3 project import retains the selected Excel template body");assert.deepEqual(new Uint8Array(await version3Imported.templateBodies[0].body.arrayBuffer()),new Uint8Array(await templateBody.arrayBuffer()));assert.equal(version3Imported.candidate.project.id,"archive:project");
await assert.rejects(()=>version3Inspected.commit({name:"Again"}),/already started/i);version3Inspected.release();
const studioJson=JSON.stringify({format:"my-chrome-utilities.specification-project-state",version:2,
  state:{project:state.project,history:{undo:[],redo:[]}}});
const studioInspected=await version3.inspectImport(new Blob([studioJson]));
assert.deepEqual(studioInspected.blockers,[],"Studio project JSON opens the Projects review");
await studioInspected.commit({name:"Studio copy"});
assert.equal(version3Imported.candidate.format,"my-chrome-utilities.durable-project-bundle");
assert.equal(version3Imported.input.projectId,"archive:project",
  "Studio JSON uses the same remapped project import path");
studioInspected.release();

const durableRepository=createMemoryDurableProjectRepository(),legacyValues=new Map(),legacy={getItem:key=>legacyValues.get(key)??null,setItem:(key,value)=>legacyValues.set(key,value),removeItem:key=>legacyValues.delete(key)},runtime=await createDurableProjectRuntime(durableRepository,legacy);
assert.ok(runtime.storage.projectLibraryTransport,"the durable runtime supplies the transport capability on the already injected storage host");
assert.deepEqual(await durableRepository.listProjectMetadata(),[],"runtime port installation writes no project merely by mounting");

const contractSource=await readFile(new URL("../src/data-layer-project-library.ts",import.meta.url),"utf8"),uiSource=await readFile(new URL("../src/data-layer-project-library-ui.ts",import.meta.url),"utf8");
assert.doesNotMatch(contractSource,/side-panel|indexedDB|globalThis|localStorage|querySelector/u,"the reusable transport contract has no shell, backend, global, or DOM access");
assert.match(uiSource,/preferredProjectLibraryTransport/u,"the Project Library UI resolves transport from its injected host");

console.log("project library transport port tests passed");
