import assert from "node:assert/strict";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {projectLibrary} from "../dist/data-layer-project-library.js";
import {createCompatibilityProjectLibraryTransport} from "../dist/configuration-portability/project-library-transport.js";

const state=createSpecificationProject({name:"Retail",site:"retail.example",id:kind=>kind==="project"?"project:retail":`${kind}:retail`});
const library=projectLibrary([{state,revision:2,createdAt:"2026-09-13T00:00:00.000Z",lastModifiedAt:"2026-09-13T00:00:00.000Z"}],"project:retail");
const serialized=JSON.stringify({format:"my-chrome-utilities.project-bundle",version:1,sourceProjectId:"project:retail",sourceName:"Retail",draftRevision:2,project:state.project});
let imported;
const transport=createCompatibilityProjectLibraryTransport({
  exportProject:async projectId=>{assert.equal(projectId,"project:retail");return serialized;},
  importProject:async(value,input)=>{imported={value,input};},
  library:()=>library,
  id:kind=>`copy:${kind}`,
  now:()=>"2026-09-13T00:00:00.000Z",
});

const prepared=await transport.prepareExport("project:retail"),chunks=[];
assert.deepEqual({formatVersion:prepared.formatVersion,mediaType:prepared.mediaType,extension:prepared.extension},{formatVersion:2,mediaType:"application/json",extension:"json"});
await prepared.write({write:async chunk=>chunks.push(chunk)});
assert.equal(new TextDecoder().decode(chunks[0]),serialized);
await assert.rejects(()=>prepared.write({write:async()=>{}}),/already started/u);
prepared.release();

const inspected=await transport.inspectImport(new Blob([serialized]));
assert.equal(imported,undefined,"inspection does not commit project data");
assert.deepEqual({formatVersion:inspected.formatVersion,sourceName:inspected.sourceName,targetName:inspected.targetName,referenceIntegrity:inspected.referenceIntegrity},{formatVersion:1,sourceName:"Retail",targetName:"Retail copy",referenceIntegrity:"valid"});
await inspected.commit({name:"Portable copy"});
assert.deepEqual(imported,{value:serialized,input:{projectId:"copy:import:project",name:"Portable copy"}});
await assert.rejects(()=>inspected.commit({name:"Again"}),/already started/u);
inspected.release();

const cancelled=await transport.prepareExport("project:retail"),controller=new AbortController();controller.abort();
await assert.rejects(()=>cancelled.write({write:async()=>{}},{signal:controller.signal}),error=>error?.name==="AbortError");
cancelled.release();

console.log("configuration portability project-library transport tests passed");
