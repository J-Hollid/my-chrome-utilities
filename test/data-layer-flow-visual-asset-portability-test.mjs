import assert from "node:assert/strict";
import {
  createFlowVisualArchive,
  createMemoryFlowVisualAssetStore,
  importFlowVisualArchive,
  migrateVersion2VisualAssets,
} from "../dist/flow-visual-asset-portability.js";
import {createMemoryDurableProjectRepository,createPageProjectHistory,durableDraftCommand} from "../dist/data-layer-durable-project-repository.js";

const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const digest=`sha256:${Buffer.from(await crypto.subtle.digest("SHA-256",png)).toString("hex")}`;
const metadata={id:"asset:cart",mediaType:"image/png",width:1,height:1,byteLength:png.byteLength,digest};
const project={id:"project:retail",name:"Retail",collections:{},documentationFlowGraphs:{"flow:checkout":{pageFrames:[{id:"frame:cart",conceptVisual:{id:"attachment:cart",assetId:metadata.id,description:"Cart"}}],occurrences:[],relationships:[]}},conceptVisualAssets:[metadata],releases:[]};

const store=createMemoryFlowVisualAssetStore();
await store.replaceProjectAssets(project.id,[{metadata,body:new Blob([png],{type:metadata.mediaType})}]);
store.clearTrace();
assert.deepEqual(await store.listMetadata(project.id),[metadata]);
assert.equal(store.trace().bodyReads,0,"metadata routes do not hydrate original bodies");
assert.equal((await store.readBody(project.id,metadata.id)).size,png.byteLength);
assert.equal(store.trace().bodyReads,1,"a viewer hydrates only the selected body");

store.clearTrace();
await store.replaceProjectAssets(project.id,[{metadata,body:new Blob([png],{type:metadata.mediaType})}]);
assert.equal(store.trace().bodyWrites,0,"an unchanged digest does not rewrite its body");

const durable=createMemoryDurableProjectRepository();
await durable.putProject({project,history:{undo:[],redo:[]}});
await durable.replaceConceptVisualAssets(project.id,[{metadata,body:new Blob([png],{type:metadata.mediaType})}]);
durable.clearTrace();
assert.deepEqual(await durable.listConceptVisualAssetMetadata(project.id),[metadata]);
assert.equal(durable.trace().reads.some(({store})=>store==="visualAssetBodies"),false,"IndexedDB metadata lookup does not touch body records");
assert.equal((await durable.loadConceptVisualAssetBody(project.id,metadata.id)).size,png.length);
durable.clearTrace();
await durable.replaceConceptVisualAssets(project.id,[{metadata,body:new Blob([png],{type:metadata.mediaType})}]);
assert.equal(durable.trace().writes.some(({store})=>store==="visualAssetBodies"),false,"durable unchanged saves do not put Blob bodies");
const visualHistory=createPageProjectHistory(),visualBefore=await durable.loadProject(project.id),nextAsset={...metadata,id:"asset:payment",bytes:`data:image/png;base64,${Buffer.from(png).toString("base64")}`},visualAfter={...visualBefore.state,project:{...visualBefore.state.project,conceptVisualAssets:[...visualBefore.state.project.conceptVisualAssets,nextAsset]}};
const visualCommand=durableDraftCommand(visualBefore,visualAfter,{commandId:"visual:add",label:"Add visual"});
visualHistory.push(visualCommand);await durable.saveDraft(visualCommand);
const visualUndo=visualHistory.undo(await durable.loadProject(project.id));assert.ok(visualUndo,"metadata-only loads can undo a visual body write");await durable.saveDraft(visualUndo);
const visualRedo=visualHistory.redo(await durable.loadProject(project.id));assert.ok(visualRedo,"metadata-only loads can redo a visual body write");await durable.saveDraft(visualRedo);
assert.equal((await durable.loadConceptVisualAssetBody(project.id,nextAsset.id)).size,png.length,"redo restores the separate visual body");
await durable.replaceConceptVisualAssets(project.id,[{metadata,body:new Blob([png],{type:metadata.mediaType})}]);
const durableArchive=await durable.exportProjectArchive(project.id);
await durable.importProjectArchive(durableArchive,{projectId:"project:durable-copy",name:"Retail copy"});
assert.deepEqual((await durable.listConceptVisualAssetMetadata("project:durable-copy")).map(({id})=>id),["project:durable-copy:asset:cart"]);

const archive=await createFlowVisualArchive({project,publishedProject:structuredClone(project),assets:[{metadata,body:new Blob([png],{type:metadata.mediaType})}]});
assert.deepEqual(Array.from(archive.slice(0,4)),[80,75,3,4],"normal export is ZIP-compatible");
assert.equal(new TextDecoder().decode(archive).includes("data:image/"),false);
const imported=await importFlowVisualArchive(archive,{projectId:"project:copy",id:(old)=>`copy:${old}`});
assert.equal(imported.formatVersion,3);
assert.equal(imported.assets.length,1);
assert.equal(imported.assets[0].metadata.digest,digest);
assert.deepEqual(new Uint8Array(await imported.assets[0].body.arrayBuffer()),png);
assert.equal(imported.project.id,"project:copy");
assert.equal(imported.project.documentationFlowGraphs["copy:flow:checkout"].pageFrames[0].conceptVisual.assetId,"copy:asset:cart");
assert.equal(imported.publishedProject.documentationFlowGraphs["copy:flow:checkout"].pageFrames[0].conceptVisual.assetId,"copy:asset:cart");

const tampered=archive.slice();tampered[tampered.indexOf(137)]=136;
await assert.rejects(()=>importFlowVisualArchive(tampered,{projectId:"project:bad",id:(old)=>`bad:${old}`}),/digest|CRC/i);

const legacyAsset={...metadata,bytes:`data:image/png;base64,${Buffer.from(png).toString("base64")}`},legacy={format:"my-chrome-utilities.durable-project-bundle",version:2,project:{...project,conceptVisualAssets:[legacyAsset]},publishedProject:{...project,conceptVisualAssets:[legacyAsset]}};
const migrated=await migrateVersion2VisualAssets(legacy,{projectId:"project:legacy-copy",id:(old)=>`legacy:${old}`});
assert.equal(migrated.assets.length,1);
assert.equal(JSON.stringify(migrated.project).includes("base64"),false);
assert.equal(migrated.migrations.includes("Embedded concept visuals moved to separate original Blob bodies"),true);

console.log("flow visual asset portability unit tests passed");
