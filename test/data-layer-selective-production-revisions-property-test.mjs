import assert from "node:assert/strict";
import {createSpecificationProject,transactProject} from "../dist/data-layer-specification-project.js";
import {LEGACY_PROJECT_KEYS,createMemoryDurableProjectRepository,durableDraftCommand,migrateLegacyProjectStorage} from "../dist/data-layer-durable-project-repository.js";
import {developerProductionSchemaExport,publishableProductionSchemas} from "../dist/data-layer-production-specification.js";

const cleanRepository=createMemoryDurableProjectRepository();
cleanRepository.clearTrace();
assert.equal((await cleanRepository.compactLegacyDurableSchemaHistory()).entryCount,0);
assert.deepEqual(cleanRepository.trace().writes,[],"a current repository mount remains read-only when no compaction is required");
cleanRepository.clearTrace();
assert.equal((await cleanRepository.compactLegacyDurableSchemaHistory()).entryCount,0);
assert.deepEqual(cleanRepository.trace().writes,[],"a repeated current repository mount also remains read-only");

const release=(state,revision)=>transactProject(state,`Prepare release ${revision}`,project=>{const item={id:`release:${revision}`,name:`Release ${revision}`,revision,createdAt:`2026-08-01T00:00:${String(revision).padStart(2,"0")}.000Z`,snapshot:structuredClone(project.collections)};return{...project,releases:[...project.releases,item],currentRelease:item.id};});
for(let sample=0;sample<40;sample++){
  let token=0;
  const repository=createMemoryDurableProjectRepository({token:()=>`draft:${sample}:${++token}`,now:()=>"2026-08-01T00:00:00.000Z"});
  const state=createSpecificationProject({name:`Retail ${sample}`,site:"retail.example",id:kind=>`${kind}:${sample}`});
  await repository.putProject(state,{active:true});
  let base=await repository.loadProject(state.project.id),prepared=release(base.state,1);
  await repository.saveDraft(durableDraftCommand(base,prepared,{commandId:"prepare:1",label:"Prepare release 1"}));
  base=await repository.loadProject(state.project.id);
  const first=await repository.publish(state.project.id,base.draftToken,{publicationId:"release:1",schemas:[
    {schemaId:"schema:sitewide",effectiveSchema:{type:"object",properties:{shared:{type:"string"}}}},
    {schemaId:"schema:cart",effectiveSchema:{type:"object",properties:{shared:{type:"string"},cart:{type:"number"}}}},
    {schemaId:"schema:purchase",effectiveSchema:{type:"object",properties:{purchase:{type:"boolean"}}}},
  ]});
  assert.equal(first.status,"published");
  assert.deepEqual(Object.fromEntries(first.manifest.schemas.map(entry=>[entry.schemaId,entry.schemaRevision])),{"schema:sitewide":1,"schema:cart":1,"schema:purchase":1});

  base=await repository.loadProject(state.project.id);prepared=release(base.state,2);
  await repository.saveDraft(durableDraftCommand(base,prepared,{commandId:"prepare:2",label:"Prepare release 2"}));
  base=await repository.loadProject(state.project.id);
  const secondSchemas=[
    {schemaId:"schema:sitewide",effectiveSchema:{type:"object",properties:{shared:{type:"string"}}}},
    {schemaId:"schema:cart",effectiveSchema:{type:"object",properties:{shared:{type:"string"},cart:{type:"number",maximum:sample+1}}}},
    {schemaId:"schema:purchase",effectiveSchema:{type:"object",properties:{purchase:{type:"boolean"}}}},
  ];
  const second=await repository.publish(state.project.id,base.draftToken,{publicationId:"release:2",schemas:secondSchemas});
  assert.equal(second.status,"published");
  assert.deepEqual(Object.fromEntries(second.manifest.schemas.map(entry=>[entry.schemaId,entry.schemaRevision])),{"schema:sitewide":1,"schema:cart":2,"schema:purchase":1},"only a changed effective schema advances");
  const cartEvidence=await repository.productionSchemaEvidence(state.project.id,"schema:cart");
  assert.equal(cartEvidence.projectRevision,2);
  assert.equal(cartEvidence.schemaRevision,2);
  assert.deepEqual((await repository.loadProductionSchema(cartEvidence)).effectiveSchema,{type:"object",properties:{shared:{type:"string"},cart:{type:"number",maximum:sample+1}}});
  assert.deepEqual(publishableProductionSchemas({schemas:{cart:{schemaId:"schema:cart",document:secondSchemas[1].effectiveSchema},purchase:{schemaId:"schema:purchase",document:secondSchemas[2].effectiveSchema}},assignments:[]}).map(({schemaId})=>schemaId),["schema:cart","schema:purchase"]);
  const developerExport=await developerProductionSchemaExport(repository,state.project.id);assert.equal(developerExport.schemas.find(({evidence})=>evidence.schemaId==="schema:cart").evidence.schemaRevision,2);assert.deepEqual(developerExport.schemas.find(({evidence})=>evidence.schemaId==="schema:cart").effectiveSchema,secondSchemas[1].effectiveSchema);
  if(sample===0){const bundle=await repository.exportProject(state.project.id),serialized=JSON.stringify(bundle),sourceHash=await repository.hashProject(state.project.id);assert.equal(bundle.baseProjectRevision,2);assert.equal(bundle.productionManifest.schemas.length,3);assert.equal(bundle.schemaSnapshots.length,3,"ordinary export references only current schema snapshots");assert.equal(serialized.includes("draft:0:"),false);assert.equal(serialized.includes('"fieldVersions"'),false);assert.equal(serialized.includes('"sourceDraftToken"'),false);assert.equal(bundle.project.releases.length,1,"ordinary export excludes older production snapshots");const tampered=structuredClone(bundle);tampered.schemaSnapshots.find(({schemaId})=>schemaId==="schema:cart").effectiveSchema={type:"number"};await assert.rejects(()=>repository.importProject(tampered,{projectId:"project:tampered-copy",name:"Tampered copy"}),/fingerprint/i);assert.equal((await repository.listProjectMetadata()).some(({projectId})=>projectId==="project:tampered-copy"),false,"tampered schema bytes abort the whole import");await repository.importProject(bundle,{projectId:"project:selective-copy",name:"Selective copy"});const copiedEvidence=await repository.productionSchemaEvidence("project:selective-copy","schema:cart"),copiedSnapshot=await repository.loadProductionSchema(copiedEvidence);assert.equal(copiedEvidence.schemaRevision,2);assert.deepEqual(copiedSnapshot.effectiveSchema,secondSchemas[1].effectiveSchema);assert.equal(await repository.hashProject(state.project.id),sourceHash,"manifest import leaves the source unchanged");}

  repository.clearTrace();
  const noOp=await repository.publish(state.project.id,second.draftToken,{publicationId:"release:2",schemas:secondSchemas});
  assert.equal(noOp.status,"no-changes");
  assert.equal(repository.trace().writes.some(({store})=>store==="projectRevisions"||store==="productionManifests"||store==="schemaRevisions"),false,"a no-op writes no production identity");
  if(sample===0){const draftBase=await repository.loadProject(state.project.id),later=transactProject(draftBase.state,"Later unpublished schema edit",project=>({...project,notes:"unpublished"}));await repository.saveDraft(durableDraftCommand(draftBase,later,{commandId:"later-unpublished",label:"Later unpublished schema edit"}));const retained=await developerProductionSchemaExport(repository,state.project.id),cart=retained.schemas.find(({evidence})=>evidence.schemaId==="schema:cart");assert.equal(cart.evidence.schemaRevision,2);assert.deepEqual(cart.effectiveSchema,secondSchemas[1].effectiveSchema,"developer export remains pinned to immutable production after a later Draft");}
}

const legacySchema={id:"schema:legacy",name:"Legacy",revision:2847,changes:Array.from({length:2847},(_,index)=>({index})),document:{type:"object",properties:{latest:{type:"string"}}},productionSnapshots:[{document:{type:"object",properties:{first:{type:"string"}}}},{document:{type:"object",properties:{latest:{type:"string"}}}},{document:{type:"object",properties:{latest:{type:"string"}}}}]},neverPublished={id:"schema:new",name:"New",revision:19,changes:[{edit:true}],document:{type:"object"}},values=new Map([[LEGACY_PROJECT_KEYS.schemas,JSON.stringify([legacySchema,neverPublished])]]),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},migrationRepository=createMemoryDurableProjectRepository();
assert.equal((await migrateLegacyProjectStorage(migrationRepository,storage)).status,"migrated");
const migratedSchemas=await migrationRepository.savedSchemas(),migratedLegacy=migratedSchemas.find(({id})=>id==="schema:legacy"),migratedNew=migratedSchemas.find(({id})=>id==="schema:new");
assert.equal(migratedLegacy.schemaRevision,2,"legacy production identity derives from distinct immutable content");assert.equal(migratedNew.schemaRevision,0,"never-published schemas start at production revision zero");assert.equal("revision" in migratedLegacy||"changes" in migratedLegacy,false);assert.equal("revision" in migratedNew||"changes" in migratedNew,false);
const migrationArchive=await migrationRepository.exportRepositoryRecoveryBundle(),receipt=migrationArchive.migrationReceipts.find(({key})=>key==="legacy-v1").value;assert.equal(receipt.legacyEditCompactions.reduce((total,item)=>total+item.entryCount,0),2848);assert.equal(receipt.legacyEditCompactions.every(item=>item.beforeChecksum.length===64&&item.afterChecksum.length===64),true);
console.log("selective production revision properties: 40 generated cases passed");
