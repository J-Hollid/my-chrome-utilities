import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {preferredProjectLibraryTransport,projectLibrary} from "../dist/data-layer-project-library.js";
import {createMemoryDurableProjectRepository} from "../dist/data-layer-durable-project-repository.js";
import {createDurableProjectRuntime} from "../dist/data-layer-durable-project-runtime.js";
import {createFlowVisualArchive} from "../dist/flow-visual-asset-portability.js";
import {createVersion2ProjectLibraryTransport,createVersion3ProjectLibraryTransport} from "../dist/durable-project/project-library-transport-v2.js";

const state=createSpecificationProject({name:"Retail",site:"retail.example",id:kind=>kind==="project"?"project:retail":`${kind}:retail`}),library=projectLibrary([{state,revision:2,createdAt:"2026-08-16T00:00:00.000Z",lastModifiedAt:"2026-08-16T00:00:00.000Z"}],"project:retail"),bundle={format:"my-chrome-utilities.durable-project-bundle",version:2,sourceProjectId:"project:retail",sourceName:"Retail",publishedRevision:0,baseProjectRevision:0,project:state.project,transportFixture:"x".repeat(70*1024)},calls={exports:0,imports:0},repository={async exportProject(projectId){calls.exports+=1;assert.equal(projectId,"project:retail");return structuredClone(bundle);},async importProject(candidate,input){calls.imports+=1;assert.deepEqual(candidate,bundle);return{projectId:input.projectId,active:false,canonicalRepairCount:0};}};
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

const version3Archive=await createFlowVisualArchive({project:state.project,assets:[]}),version3Calls={prepare:0,writes:0,imports:0,sourceReads:0};let version3Imported;
const version3Repository={
  async exportProject(){throw new Error("version 3 export must use archive preparation");},
  async prepareProjectArchive(projectId){version3Calls.prepare+=1;assert.equal(projectId,"project:retail");return{estimatedBytes:version3Archive.byteLength,async write(sink,{onProgress}={}){version3Calls.writes+=1;onProgress?.({phase:"write",entry:"manifest.json",completed:1,total:1});await sink.write(version3Archive);}};},
  async importProject(candidate,input,assets){version3Calls.imports+=1;version3Imported={candidate,input,assets};},
};
const version3=createVersion3ProjectLibraryTransport({repository:version3Repository,library:()=>library,id:oldId=>`archive:${oldId}`});
const version3Prepared=await version3.prepareExport("project:retail"),version3Chunks=[];
assert.deepEqual({formatVersion:version3Prepared.formatVersion,mediaType:version3Prepared.mediaType,extension:version3Prepared.extension},{formatVersion:3,mediaType:"application/zip",extension:"zip"});
await version3Prepared.write({write:async chunk=>version3Chunks.push(Uint8Array.from(chunk))});
assert.equal(version3Calls.prepare,1,"version 3 export preparation reads repository archive input once");assert.equal(version3Calls.writes,1,"one prepared version 3 export writes once");assert.deepEqual(Array.from(version3Chunks[0].slice(0,4)),[80,75,3,4]);
await assert.rejects(()=>version3Prepared.write({write:async()=>{}}),/already started/i);version3Prepared.release();
const version3Inspected=await version3.inspectImport({name:"retail-project.zip",size:version3Archive.byteLength,async text(){throw new Error("ZIP inspection must not decode through text");},async arrayBuffer(){version3Calls.sourceReads+=1;return version3Archive.slice().buffer;}});
assert.equal(version3Calls.sourceReads,1,"one selected archive source is read once");assert.equal(version3Inspected.formatVersion,3);assert.equal(version3Inspected.sourceName,"Retail");assert.equal(version3Inspected.targetName,"Retail copy");assert.equal(version3Calls.imports,0,"version 3 inspection writes nothing");
await version3Inspected.commit({name:"Archive copy"});assert.equal(version3Calls.imports,1);assert.equal(version3Imported.input.name,"Archive copy");assert.deepEqual(version3Imported.assets,[]);assert.equal(version3Imported.candidate.project.id,"archive:project");
await assert.rejects(()=>version3Inspected.commit({name:"Again"}),/already started/i);version3Inspected.release();

const durableRepository=createMemoryDurableProjectRepository(),legacyValues=new Map(),legacy={getItem:key=>legacyValues.get(key)??null,setItem:(key,value)=>legacyValues.set(key,value),removeItem:key=>legacyValues.delete(key)},runtime=await createDurableProjectRuntime(durableRepository,legacy);
assert.ok(runtime.storage.projectLibraryTransport,"the durable runtime supplies the transport capability on the already injected storage host");
assert.deepEqual(await durableRepository.listProjectMetadata(),[],"runtime port installation writes no project merely by mounting");

const contractSource=await readFile(new URL("../src/data-layer-project-library.ts",import.meta.url),"utf8"),uiSource=await readFile(new URL("../src/data-layer-project-library-ui.ts",import.meta.url),"utf8");
assert.doesNotMatch(contractSource,/side-panel|indexedDB|globalThis|localStorage|querySelector/u,"the reusable transport contract has no shell, backend, global, or DOM access");
assert.match(uiSource,/preferredProjectLibraryTransport/u,"the Project Library UI resolves transport from its injected host");

console.log("project library transport port tests passed");
