import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
  createFlowVisualArchive,
  createMemoryFlowVisualAssetStore,
  importFlowVisualArchive,
  migrateVersion2VisualAssets,
} from "../dist/flow-visual-asset-portability.js";
import {flowVisualDigest,validateFlowVisualBody} from "../dist/flow-visual-asset-validation.js";
import {createMemoryDurableProjectRepository,createPageProjectHistory,durableDraftCommand} from "../dist/data-layer-durable-project-repository.js";
import {verificationDigest} from "../scripts/verification-evidence.mjs";

const png=Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64"));
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
const cachedThumbnail=new Blob([png.slice(0,32)],{type:"image/webp"});await durable.storeConceptVisualAssetThumbnail(project.id,metadata.id,cachedThumbnail);assert.equal((await durable.loadConceptVisualAssetThumbnail(project.id,metadata.id)).size,cachedThumbnail.size);assert.equal(await durable.conceptVisualThumbnailCacheBytes(project.id),cachedThumbnail.size,"the disposable derivative cache reports real bytes");
durable.clearTrace();
await durable.replaceConceptVisualAssets(project.id,[{metadata,body:new Blob([png],{type:metadata.mediaType})}]);
assert.equal(durable.trace().writes.some(({store})=>store==="visualAssetBodies"),false,"durable unchanged saves do not put Blob bodies");
durable.clearTrace();const lazyArchive=await durable.prepareProjectArchive(project.id);assert.equal(durable.trace().reads.some(({store})=>store==="visualAssetBodies"),false,"archive preparation and size estimation retain metadata but no original bodies");await lazyArchive.write({write:async()=>{}});assert.equal(durable.trace().reads.filter(({store})=>store==="visualAssetBodies").length,1,"archive writing hydrates one original at a time");
const retained=createMemoryDurableProjectRepository(),release={id:"release:visual",name:"Visual release",revision:1,createdAt:"2026-08-15T00:00:00.000Z",snapshot:project.collections},publishedProject={...structuredClone(project),releases:[],currentRelease:"release:visual"},releasedProject={...structuredClone(project),releases:[release],currentRelease:release.id};publishedProject.releases=[release];
await retained.putProjectMetadataOnly({project:releasedProject,history:{undo:[],redo:[]}},{publishedRevision:1,publishedProject,visualAssets:[{metadata,body:new Blob([png],{type:metadata.mediaType})}]});
await retained.replaceConceptVisualAssets(project.id,[]);
assert.equal((await retained.loadConceptVisualAssetBody(project.id,metadata.id)).size,png.length,"removing a Draft reference retains a body required by a Published revision");
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
const duplicateDirectory=archive.slice(),directoryView=new DataView(duplicateDirectory.buffer,duplicateDirectory.byteOffset,duplicateDirectory.byteLength),directoryDecoder=new TextDecoder();
for(let offset=0;offset+46<=duplicateDirectory.length;offset+=1)if(directoryView.getUint32(offset,true)===0x02014b50){const nameLength=directoryView.getUint16(offset+28,true),name=directoryDecoder.decode(duplicateDirectory.subarray(offset+46,offset+46+nameLength));if(name==="published.json"){directoryView.setUint16(offset+28,"manifest.json".length,true);directoryView.setUint16(offset+30,1,true);duplicateDirectory.set(new TextEncoder().encode("manifest.json"),offset+46);break;}}
await assert.rejects(()=>importFlowVisualArchive(duplicateDirectory),/duplicate entry manifest\.json/i,"the central directory cannot duplicate one local entry while omitting another");

const legacyAsset={...metadata,bytes:`data:image/png;base64,${Buffer.from(png).toString("base64")}`},legacy={format:"my-chrome-utilities.durable-project-bundle",version:2,project:{...project,conceptVisualAssets:[legacyAsset]},publishedProject:{...project,conceptVisualAssets:[legacyAsset]}};
const migrated=await migrateVersion2VisualAssets(legacy,{projectId:"project:legacy-copy",id:(old)=>`legacy:${old}`});
assert.equal(migrated.assets.length,1);
assert.equal(JSON.stringify(migrated.project).includes("base64"),false);
assert.equal(migrated.migrations.includes("Embedded concept visuals moved to separate original Blob bodies"),true);

const duplicateMetadata={...metadata,id:"asset:cart-copy"},deduplicatedProject=structuredClone(project);
deduplicatedProject.conceptVisualAssets=[metadata,duplicateMetadata];
deduplicatedProject.documentationFlowGraphs["flow:checkout"].occurrences=[{id:"occurrence:cart",conceptVisual:{id:"attachment:cart-copy",assetId:duplicateMetadata.id,description:"Same original"}}];
const deduplicatedArchive=await createFlowVisualArchive({project:deduplicatedProject,assets:[{metadata,body:new Blob([png],{type:metadata.mediaType})},{metadata:duplicateMetadata,body:new Blob([png],{type:metadata.mediaType})}]});
const entryName=`assets/${digest.slice(7)}.png`,archiveText=new TextDecoder().decode(deduplicatedArchive),entryOccurrences=archiveText.split(entryName).length-1;
assert.equal(entryOccurrences,4,"two manifest declarations share one local ZIP entry and one central-directory entry");
const deduplicatedImport=await importFlowVisualArchive(deduplicatedArchive,{projectId:"project:deduplicated",id:old=>`deduplicated:${old}`});
assert.equal(deduplicatedImport.assets.length,2,"distinct asset identities may share one validated original body");
assert.equal(deduplicatedImport.project.documentationFlowGraphs["deduplicated:flow:checkout"].occurrences[0].conceptVisual.assetId,"deduplicated:asset:cart-copy");
await assert.rejects(()=>createFlowVisualArchive({project:deduplicatedProject,assets:[{metadata,body:new Blob([png],{type:metadata.mediaType})},{metadata:{...duplicateMetadata,width:2},body:new Blob([png],{type:metadata.mediaType})}]}),/inconsistent metadata/i,"shared digest entries reject conflicting dimensions before producing a self-invalid archive");

await assert.rejects(()=>createFlowVisualArchive({project,assets:[{metadata:{...metadata,width:2},body:new Blob([png],{type:metadata.mediaType})}]}),/dimensions/i);
const disguised=new Blob([Uint8Array.from(png,(_,index)=>index===0?0:png[index])],{type:"image/png"});
await assert.rejects(()=>store.replaceProjectAssets(project.id,[{metadata,body:disguised}]),/valid PNG/i);
const truncatedPng=png.slice(0,24),truncatedDigest=await flowVisualDigest(truncatedPng);await assert.rejects(()=>validateFlowVisualBody({...metadata,byteLength:truncatedPng.length,digest:truncatedDigest},new Blob([truncatedPng],{type:"image/png"})),/complete/i,"a signature and IHDR without complete image data is rejected");
class BoundedDigestBlob extends Blob{arrayBuffer(){throw new Error("digest must not materialize the complete Blob");}}
assert.equal(await flowVisualDigest(new BoundedDigestBlob([png])),digest,"digest hashing reads bounded Blob slices");
const cancelled=new AbortController();cancelled.abort();
await assert.rejects(()=>importFlowVisualArchive(archive,{signal:cancelled.signal}),error=>error?.name==="AbortError");

const atomic=createMemoryDurableProjectRepository();atomic.injectFailure("quota exceeded");
await assert.rejects(()=>atomic.importProjectArchive(archive,{projectId:"project:atomic",name:"Atomic"}),error=>error?.name==="QuotaExceededError");
assert.deepEqual(await atomic.listProjectMetadata(),[],"a failed import leaves neither project metadata nor visual assets");

const legacyDurable=createMemoryDurableProjectRepository();
const {publishedProject:ignoredPublished,...legacyDraftOnly}=legacy;
await legacyDurable.importProject(legacyDraftOnly,{projectId:"project:legacy-durable",name:"Legacy durable"});
assert.equal((await legacyDurable.loadConceptVisualAssetBody("project:legacy-durable","project:legacy-durable:asset:cart")).size,png.length,"the installed v2 JSON path validates and migrates embedded originals");

if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  assert.equal(context.version,1);
  assert.equal(context.causalCategory,"other:acceptance evidence registry conservation");
  const [projectHandlerSource,packs]=await Promise.all([
    readFile(new URL("../acceptance/src/acceptance/steps/project_management.clj",import.meta.url),"utf8"),
    readFile(new URL("../verification/packs.json",import.meta.url),"utf8").then(JSON.parse),
  ]),flowPack=packs.find(({id})=>id==="flow_graph"),flowRegistry=JSON.stringify(flowPack.browserEvidencePartitions);
  const expectedPreRepairFailure={projectInstalledPortabilityRegistered:false,flowStorageDiagnosticsRegistered:false};
  const expectedRepairResult={projectInstalledPortabilityRegistered:true,flowStorageDiagnosticsRegistered:true};
  const observed={
    projectInstalledPortabilityRegistered:projectHandlerSource.includes(":installedPortability"),
    flowStorageDiagnosticsRegistered:["flowGraph.runtime035.boundedHydration","flowGraph.runtime036.aggregateLimitRemoved","flowGraph.runtime036.storageAwareDiagnostic"].every((leaf)=>flowRegistry.includes(leaf)),
  };
  assert.deepEqual(observed,expectedRepairResult);
  const fixture={id:"acceptance-evidence-registry-conservation-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{packs:["project_management","flow_graph"],boundary:"affirmative runtime evidence"},
    expectedPreRepairFailure,expectedRepairResult},fixtureDigest=verificationDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed}}}));
}

console.log("flow visual asset portability unit tests passed");
