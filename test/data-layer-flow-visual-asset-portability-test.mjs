import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import ExcelJS from "exceljs";
import {
  createFlowVisualArchive,
  createMemoryFlowVisualAssetStore,
  importFlowVisualArchive,
  migrateVersion2VisualAssets,
} from "../dist/flow-visual-asset-portability.js";
import {flowVisualDigest,validateFlowVisualBody} from "../dist/flow-visual-asset-validation.js";
import {createMemoryDurableProjectRepository,createPageProjectHistory,durableDraftCommand} from "../dist/data-layer-durable-project-repository.js";
import {addProjectEntity,createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {flowDocumentationSnapshotFromState} from "../dist/data-layer-flow-documentation-snapshot.js";
import {zipDocumentationFiles} from "../dist/data-layer-flow-table-documentation-export.js";
import {templateDigest} from "../dist/documentation-templates/template-contract.js";
import {writeDocumentationTemplateStarter} from "../dist/documentation-templates/excel-renderer.js";
import {verificationDigest} from "../scripts/verification-evidence.mjs";

globalThis.ExcelJS=ExcelJS;

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
const documentationBodyIdentity={projectId:project.id,namespace:"documentation-template",digest:"abc123"};
const documentationBody=new Blob(["template-body"],{type:"application/octet-stream"});
await durable.storeProjectAssetBody(documentationBodyIdentity,documentationBody);
assert.equal(await (await durable.loadProjectAssetBody(documentationBodyIdentity)).text(),"template-body","the reusable repository seam stores namespaced project asset bodies");
await durable.storeDocumentationTemplateBody(project.id,"compat123",new Blob(["template-compat"]));
assert.equal(await (await durable.loadDocumentationTemplateBody(project.id,"compat123")).text(),"template-compat","the documentation compatibility seam uses the namespaced project asset body store");
await durable.replaceConceptVisualAssets(project.id,[{metadata,body:new Blob([png],{type:metadata.mediaType})}]);
assert.equal(await (await durable.loadProjectAssetBody(documentationBodyIdentity)).text(),"template-body","Flow visual cleanup preserves bodies owned by another namespace");
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
const durableCopy=(await durable.loadProject("project:durable-copy")).state.project;
assert.equal(durableCopy.documentationFlowGraphs["project:durable-copy:flow:checkout"].pageFrames[0].id,"project:durable-copy:frame:cart","durable archive import keeps the Flow graph addressable through its remapped owner and frame identities");

let portableSequence=0,portableState=createSpecificationProject({name:"Portable Flow",description:"Portable documentation",site:"portable.example",id:kind=>`${kind}:portable:${++portableSequence}`});
const addPortable=(kind,value)=>{portableState=addProjectEntity(portableState,kind,value,kind=>`${kind}:portable:${++portableSequence}`);return portableState.project.collections[kind].at(-1);},portablePage=addPortable("pages",{name:"Cart",eventName:"pageview"}),portableEvent=addPortable("events",{name:"Purchase",eventName:"purchase"}),portableFlow=addPortable("flows",{name:"Checkout journey"}),portableFrame={id:`frame:portable:${++portableSequence}`,nameInFlow:"Basket review",pageId:portablePage.id,position:{x:40,y:40}};
const portableOccurrence={id:`occurrence:portable:${++portableSequence}`,name:"Purchase",pageFrameId:portableFrame.id,pageId:portablePage.id,eventId:portableEvent.id,position:{x:20,y:70}},portableFrameContext=`context:frame:${portableFrame.id}`,portableOccurrenceContext=`context:${portableOccurrence.id}`;
portableState={...portableState,project:{...portableState.project,documentationFlowGraphs:{[portableFlow.id]:{pageFrames:[portableFrame],occurrences:[portableOccurrence],relationships:[]}},documentation:{sets:[{id:"set:portable",name:"Portable",themeId:"theme:portable",sections:[{id:"section:portable-flow",kind:"flow",name:"Checkout journey",targetId:portableFlow.id,selected:true,configuration:{contextIds:[portableFrameContext,portableOccurrenceContext],labels:{[portableFrameContext]:"1",[portableOccurrenceContext]:"1a"}}}]}],themes:[]}}};
const portableRepository=createMemoryDurableProjectRepository();await portableRepository.putProject(portableState);const portableArchive=await portableRepository.exportProjectArchive(portableState.project.id),portableProjectId="project:portable-copy";await portableRepository.importProjectArchive(portableArchive,{projectId:portableProjectId,name:"Portable Flow copy"});const portableLoaded=await portableRepository.loadProject(portableProjectId),portableImportedFlow=portableLoaded.state.project.collections.flows[0],portableSnapshot=flowDocumentationSnapshotFromState(portableLoaded.state,portableImportedFlow.id);
assert.equal(portableSnapshot.contexts[0].pageName,"Basket review","a durable archive remap preserves the Flow graph used by generated documentation");
const importedPortableSection=portableLoaded.state.project.documentation.sets[0].sections[0],importedFrame=portableLoaded.state.project.documentationFlowGraphs[portableImportedFlow.id].pageFrames[0],importedOccurrence=portableLoaded.state.project.documentationFlowGraphs[portableImportedFlow.id].occurrences[0];
assert.deepEqual(importedPortableSection.configuration.contextIds,[`context:frame:${importedFrame.id}`,`context:${importedOccurrence.id}`],"saved documentation context selections follow remapped Flow context identities");
assert.deepEqual(Object.keys(importedPortableSection.configuration.labels),[`context:frame:${importedFrame.id}`,`context:${importedOccurrence.id}`],"saved documentation labels follow remapped Flow context identities");

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

const workbookBytes=await writeDocumentationTemplateStarter("flow"),workbookBody=new Blob([workbookBytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),workbookDigest=`sha256:${Buffer.from(await crypto.subtle.digest("SHA-256",await workbookBody.arrayBuffer())).toString("hex")}`,templateProject={...structuredClone(project),documentation:{sets:[{id:"set:templates",name:"Templates",themeId:"theme:templates",sections:[],templateAssignments:{"excel:flow":"template:flow"}}],themes:[],templates:[{id:"template:flow",name:"Flow workbook",format:"excel",kind:"flow",contractVersion:2,digest:workbookDigest,validation:{valid:true,findings:[]},body:{assetId:"template-body:flow",digest:workbookDigest,byteLength:workbookBody.size}}]}};
const templateArchive=await createFlowVisualArchive({project:templateProject,assets:[{metadata,body:new Blob([png],{type:metadata.mediaType})}],templateBodies:[{digest:workbookDigest,byteLength:workbookBody.size,body:workbookBody}]});
const importedTemplate=await importFlowVisualArchive(templateArchive,{projectId:"project:template-copy",id:old=>`template:${old}`});
assert.equal(importedTemplate.templateBodies.length,1,"one digest-addressed Excel body is imported exactly once");
assert.equal(importedTemplate.templateBodies[0].digest,workbookDigest);
const durableTemplates=createMemoryDurableProjectRepository();await durableTemplates.importProjectArchive(templateArchive,{projectId:"project:template-durable",name:"Template durable"});
const importedBody=await durableTemplates.loadProjectAssetBody({projectId:"project:template-durable",namespace:"documentation-template",digest:workbookDigest});
assert.deepEqual(new Uint8Array(await importedBody.arrayBuffer()),new Uint8Array(await workbookBody.arrayBuffer()));
const durableTemplateProject=(await durableTemplates.loadProject("project:template-durable")).state.project,remappedTemplate=durableTemplateProject.documentation.templates[0];
assert.notEqual(remappedTemplate.id,"template:flow");
assert.equal(durableTemplateProject.documentation.sets[0].templateAssignments["excel:flow"],remappedTemplate.id,"template assignments follow remapped template identities");
const missingTemplateBodyArchive=await createFlowVisualArchive({project:templateProject,assets:[{metadata,body:new Blob([png],{type:metadata.mediaType})}]});
await assert.rejects(()=>importFlowVisualArchive(missingTemplateBodyArchive),/body set does not match|missing Excel template body/u,"archive import rejects metadata whose exact workbook body is absent");
const invalidWorkbookBody=new Blob([Uint8Array.from([80,75,3,4,1,2,3,4])],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),invalidWorkbookDigest=`sha256:${Buffer.from(await crypto.subtle.digest("SHA-256",await invalidWorkbookBody.arrayBuffer())).toString("hex")}`,invalidWorkbookProject=structuredClone(templateProject);invalidWorkbookProject.documentation.templates[0].digest=invalidWorkbookDigest;invalidWorkbookProject.documentation.templates[0].body={...invalidWorkbookProject.documentation.templates[0].body,digest:invalidWorkbookDigest,byteLength:invalidWorkbookBody.size};const invalidWorkbookArchive=await createFlowVisualArchive({project:invalidWorkbookProject,assets:[{metadata,body:new Blob([png],{type:metadata.mediaType})}],templateBodies:[{digest:invalidWorkbookDigest,byteLength:invalidWorkbookBody.size,body:invalidWorkbookBody}]});
await assert.rejects(()=>importFlowVisualArchive(invalidWorkbookArchive),/invalid|valid unencrypted/u,"archive import reparses workbook structure instead of trusting persisted validation state");
const invalidRichBlocks=[{id:"bad-rich-source",type:"data-table",source:"profile.rows"}],invalidRichProject=structuredClone(project);invalidRichProject.documentation={sets:[{id:"set:rich",name:"Rich",themeId:"theme:rich",sections:[],templateAssignments:{"rich:flow":"template:rich"}}],themes:[],templates:[{id:"template:rich",name:"Rich Flow",format:"rich",kind:"flow",contractVersion:1,digest:templateDigest("rich",invalidRichBlocks),validation:{valid:true,findings:[]},richBlocks:invalidRichBlocks}]};const invalidRichArchive=await createFlowVisualArchive({project:invalidRichProject,assets:[{metadata,body:new Blob([png],{type:metadata.mediaType})}]});
await assert.rejects(()=>importFlowVisualArchive(invalidRichArchive),/Rich documentation template.*invalid/u,"archive import validates semantic block scope independently of stored validation flags");

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
