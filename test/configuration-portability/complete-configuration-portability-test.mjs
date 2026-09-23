import assert from "node:assert/strict";

import {
  createCompleteConfigurationArchive,
  inspectCompleteConfigurationArchive,
} from "../../dist/configuration-portability/archive-format.js";
import {
  COMPLETE_CONFIGURATION_DOMAINS,
  configurationRecordKey,
} from "../../dist/configuration-portability/domain-inventory.js";
import {
  stageCompleteConfigurationSetup,
} from "../../dist/configuration-portability/configuration-repository.js";
import {createInstalledCompleteConfigurationPort} from
  "../../dist/configuration-portability/installed-repository.js";
import {inspectConfigurationImportRoute} from
  "../../dist/configuration-portability/format-router.js";
import {inspectLegacyRepositoryRecovery} from
  "../../dist/configuration-portability/legacy-recovery.js";
import {createDurableProjectConfigurationRepository} from
  "../../dist/configuration-portability/durable-project-adapter.js";
import {createMemoryDurableProjectRepository} from
  "../../dist/data-layer-durable-project-repository.js";
import {createSpecificationProject} from
  "../../dist/data-layer-specification-project.js";
import {assertKnownConfigurationStorage} from
  "../../dist/configuration-portability/storage-inventory.js";
import {readStoredZip,writeStoredZip} from "../../dist/flow-visual-zip.js";
import {splitProjectArchive,rebuildSharedProjectArchive} from
  "../../dist/configuration-portability/shared-project-archive.js";

const source = {
  activeProjectId:"project:retail",
  sections:Object.fromEntries(COMPLETE_CONFIGURATION_DOMAINS.map((domain) => [domain, []])),
  bodies:[
    {digest:"image-digest",mediaType:"image/png",bytes:new Uint8Array([1,2,3])},
    {digest:"template-digest",mediaType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",bytes:new Uint8Array([4,5,6])},
  ],
};
source.sections.projects = [
  {id:"project:retail",value:{name:"Retail",assetDigest:"image-digest"}},
  {id:"project:wholesale",value:{name:"Wholesale"}},
];
source.sections.savedSchemas = [
  {id:"schema:money",value:{title:"Money"}},
];
source.sections.reusableRules=[{id:"rule:total",value:{name:"Total",operator:"greater-than",limit:0}}];
source.sections.eventLibraries=[{id:"event:checkout",value:{name:"Checkout",eventName:"purchase"}}];
source.sections.savedSessions=[{id:"session:checkout",value:{id:"session:checkout",name:"Checkout"}}];
source.sections.defects=[{id:"defect:checkout",value:{id:"defect:checkout",name:"Missing purchase"}}];
source.sections.documentationTemplates = [
  {id:"template:orders",value:{name:"Orders",bodyDigest:"template-digest"},
    dependencies:[{domain:"savedSchemas",id:"schema:money"}]},
];
source.sections.hotkeys = [{id:"open-projects",value:{key:"P",modifiers:["Alt"]}}];
source.sections.portablePreferences=[{id:"my-chrome-utilities.saved-event-feed-filters.v1",
  value:{eventNames:["purchase"]}}];

const archive = await createCompleteConfigurationArchive(source, {
  buildIdentity:"test-build",createdAt:"2026-09-13T00:00:00.000Z",
});
assert.deepEqual(Array.from(new Uint8Array(await archive.slice(0,4).arrayBuffer())),[80,75,3,4],
  "complete configuration is one ZIP");
const inspected = await inspectCompleteConfigurationArchive(archive);
assert.equal(inspected.manifest.format,"my-chrome-utilities.complete-configuration");
assert.equal(inspected.manifest.version,2);
assert.deepEqual(inspected.manifest.domainVersions,
  Object.fromEntries(COMPLETE_CONFIGURATION_DOMAINS.map((domain)=>[domain,1])));
assert.deepEqual(inspected.manifest.exclusions.map(({id})=>id).sort(),[
  "active-browser-context","legacy-project-projections","live-runtime-state","live-validation-history",
  "temporary-and-recovery-data","undo-redo-history","working-view-state",
]);
assert.deepEqual(inspected.manifest.counts,
  Object.fromEntries(COMPLETE_CONFIGURATION_DOMAINS.map((domain)=>[domain,source.sections[domain].length])));
assert.deepEqual(inspected.snapshot,source,"all sections and binary bodies round-trip");

const contentIdentitySource=structuredClone(source);
contentIdentitySource.sections.projects=[{id:"project:retail",value:{name:"Retail",archiveDigest:"project-archive:project:retail",archiveContentDigest:"content-a"}}];
contentIdentitySource.bodies=[{digest:"project-archive:project:retail",mediaType:"application/zip",bytes:new Uint8Array([1])}];
const contentIdentityTarget=structuredClone(contentIdentitySource);
contentIdentityTarget.sections.projects[0].value.archiveContentDigest="content-b";
const contentIdentityStage=await stageCompleteConfigurationSetup({manifest:inspected.manifest,snapshot:contentIdentitySource},{
  async read(){return structuredClone(contentIdentityTarget);},async commit(){},
});
assert.deepEqual(contentIdentityStage.conflicts.map(configurationRecordKey),["projects/project:retail"],
  "the same project identity with different archive bytes is a conflict");
const replacingBodySource=structuredClone(contentIdentitySource);
replacingBodySource.bodies[0].bytes=new Uint8Array([2]);
const replacingBodyTarget=structuredClone(contentIdentityTarget);
replacingBodyTarget.bodies[0].bytes=new Uint8Array([1]);
const replacedBodies=[];
const replacingBodyStage=await stageCompleteConfigurationSetup({snapshot:replacingBodySource},{
  async read(){return structuredClone(replacingBodyTarget);},
  async commit(next){replacedBodies.push(next);},
});
await replacingBodyStage.commit("replace-all");
assert.deepEqual([...replacedBodies[0].bodies[0].bytes],[2],
  "replacing a reviewed project can replace its archive body");
const retainedBodyTarget=structuredClone(replacingBodyTarget);
retainedBodyTarget.sections.projects.push({id:"project:other",value:{name:"Other",
  archiveDigest:"project-archive:project:retail"}});
const protectedBody=await stageCompleteConfigurationSetup({snapshot:replacingBodySource},{
  async read(){return structuredClone(retainedBodyTarget);},async commit(){throw new Error("must not commit");},
});
await assert.rejects(()=>protectedBody.commit("replace-all"),/body.*different content/u,
  "a retained project blocks replacement of a body it still uses");

const duplicateBodySource=structuredClone(source);
duplicateBodySource.bodies.push({...duplicateBodySource.bodies[0],bytes:new Uint8Array([1,2,3])});
const deduplicated=await inspectCompleteConfigurationArchive(new Blob([
  await createCompleteConfigurationArchive(duplicateBodySource,{buildIdentity:"test-build"}),
]));
assert.equal(deduplicated.snapshot.bodies.length,2,"identical body identities are content-deduplicated");
const sharedContentSource=structuredClone(source);
sharedContentSource.bodies.push({digest:"same-image-different-id",mediaType:"image/png",
  bytes:new Uint8Array([1,2,3])});
const sharedArchive=await createCompleteConfigurationArchive(sharedContentSource,{buildIdentity:"test-build"}),
  sharedInspection=await inspectCompleteConfigurationArchive(sharedArchive);
assert.equal(sharedInspection.snapshot.bodies.length,3,
  "every logical body identity remains available after import");
assert.equal(sharedInspection.manifest.bodies[0].entry,
  sharedInspection.manifest.bodies[2].entry,
  "identical content uses one physical ZIP body across different identities");
assert.equal([...await readStoredZip(sharedArchive)].filter(([name])=>name.startsWith("bodies/")).length,2);
const makeProjectZip=async(name)=>{
  const chunks=[];
  await writeStoredZip([
    {name:"manifest.json",body:new Blob([JSON.stringify({name})])},
    {name:"draft.json",body:new Blob([JSON.stringify({name})])},
    {name:"assets/shared.bin",body:new Blob([new Uint8Array([7,8,9,10])])},
  ],{write:async chunk=>chunks.push(chunk)});
  return new Uint8Array(await new Blob(chunks).arrayBuffer());
};
const firstParts=await splitProjectArchive("project:first",await makeProjectZip("First")),
  secondParts=await splitProjectArchive("project:second",await makeProjectZip("Second"));
const firstDescriptor=JSON.parse(new TextDecoder().decode(firstParts.archiveBody.bytes)),
  secondDescriptor=JSON.parse(new TextDecoder().decode(secondParts.archiveBody.bytes));
assert.equal(firstDescriptor.parts[2].bodyDigest,secondDescriptor.parts[2].bodyDigest,
  "equal image bytes in different project ZIPs have one shared body identity");
const sharedPartsSource={activeProjectId:null,
  sections:Object.fromEntries(COMPLETE_CONFIGURATION_DOMAINS.map((domain)=>[domain,[]])),
  bodies:[firstParts.archiveBody,...firstParts.parts,secondParts.archiveBody,...secondParts.parts]};
const sharedPartsArchive=await createCompleteConfigurationArchive(sharedPartsSource,{buildIdentity:"test-build"}),
  sharedPartsInspection=await inspectCompleteConfigurationArchive(sharedPartsArchive),
  sharedPartDescriptors=sharedPartsInspection.manifest.bodies.filter(({digest})=>
    digest===firstDescriptor.parts[2].bodyDigest);
assert.equal(sharedPartDescriptors.length,1,"shared image body is listed once in the complete archive");
const rebuilt=await rebuildSharedProjectArchive(secondParts.archiveBody,
  new Map(sharedPartsInspection.snapshot.bodies.map((body)=>[body.digest,body])));
assert.deepEqual([...new Uint8Array(await (await readStoredZip(rebuilt)).get("assets/shared.bin").arrayBuffer())],
  [7,8,9,10],"project ZIP rebuilt for import retains the shared image bytes");
await assert.rejects(()=>createCompleteConfigurationArchive(source,{buildIdentity:"test-build",maximumBytes:2}),
  /size limit/i,"archive creation enforces its stated size limit");
const stoppedExport=new AbortController();stoppedExport.abort();
await assert.rejects(()=>createCompleteConfigurationArchive(source,{buildIdentity:"test-build",
  signal:stoppedExport.signal}),({name})=>name==="AbortError",
"a cancelled export does not produce a file");

const tampered=new Uint8Array(await archive.arrayBuffer());tampered[40]^=1;
await assert.rejects(()=>inspectCompleteConfigurationArchive(new Blob([tampered])),
  /CRC|digest|archive/i,"altered archive bytes fail before setup");

const nestedMissingBody=structuredClone(source);
nestedMissingBody.sections.eventLibraries=[{id:"library:nested",value:{templates:[{
  fixture:{assets:[{bodyDigest:"missing-nested-body"}]},
}]}}];
const nestedMissingBodyArchive=await createCompleteConfigurationArchive(
  nestedMissingBody,{buildIdentity:"test-build"});
await assert.rejects(()=>inspectCompleteConfigurationArchive(new Blob([
  nestedMissingBodyArchive,
])),/missing body missing-nested-body/u,"nested body references are validated before setup");

const entries=await readStoredZip(archive),manifest=JSON.parse(await entries.get("manifest.json").text());
const legacyVersionEntries=new Map(entries);
legacyVersionEntries.set("manifest.json",new Blob([JSON.stringify({...manifest,version:1})]));
const legacyVersionChunks=[];
await writeStoredZip([...legacyVersionEntries].map(([name,body])=>({name,body})),
  {write:async chunk=>legacyVersionChunks.push(chunk)});
assert.equal((await inspectCompleteConfigurationArchive(new Blob(legacyVersionChunks))).manifest.version,1,
  "version 1 complete archives remain readable");
const extraEntries=new Map(entries);extraEntries.set("sections/future-domain.json",new Blob(["[]"]));
const extraChunks=[];await writeStoredZip([...extraEntries].map(([name,body])=>({name,body})),
  {write:async chunk=>extraChunks.push(chunk)});
await assert.rejects(()=>inspectCompleteConfigurationArchive(new Blob(extraChunks)),
  /unlisted or missing entries: sections\/future-domain.json/u,
  "a future saved domain cannot be silently omitted from import");
const futureSection=structuredClone(manifest);futureSection.domainVersions.savedSchemas=2;
const futureEntries=new Map(entries);futureEntries.set("manifest.json",new Blob([JSON.stringify(futureSection)]));
const futureChunks=[];await writeStoredZip([...futureEntries].map(([name,body])=>({name,body})),
  {write:async chunk=>futureChunks.push(chunk)});
await assert.rejects(()=>inspectCompleteConfigurationArchive(new Blob(futureChunks)),
  /savedSchemas section version is unsupported/u);
manifest.counts.unknownSavedDomain=1;entries.set("manifest.json",new Blob([JSON.stringify(manifest)]));
const chunks=[];await writeStoredZip([...entries].map(([name,body])=>({name,body})),{write:async chunk=>chunks.push(chunk)});
await assert.rejects(()=>inspectCompleteConfigurationArchive(new Blob(chunks)),/counts has unknown domains/u,
  "unknown saved domains cannot disappear during setup");

const existing={activeProjectId:"project:local",
  sections:Object.fromEntries(COMPLETE_CONFIGURATION_DOMAINS.map((domain)=>[domain,[]])),bodies:[]};
existing.sections.projects=[
  {id:"project:retail",value:{name:"Local retail"}},
  {id:"project:local",value:{name:"Local"},dependencies:[{domain:"savedSchemas",id:"schema:money"}]},
];
existing.sections.savedSchemas=[{id:"schema:money",value:{title:"Local money"}}];
const commits=[];
const repository={
  async read(){return structuredClone(existing);},
  async commit(next){commits.push(structuredClone(next));},
};
const staged=await stageCompleteConfigurationSetup(inspected,repository);
assert.equal(commits.length,0,"inspection does not write configuration");
assert.deepEqual(staged.conflicts.map(configurationRecordKey).sort(),[
  "projects/project:retail","savedSchemas/schema:money",
]);
assert.deepEqual(staged.skippedRecords.sort(),[
  "documentationTemplates/template:orders","projects/project:retail","savedSchemas/schema:money",
],"review lists skipped records and their dependent items");
await staged.commit("cancel");
assert.equal(commits.length,0,"Cancel writes nothing");

const nonConflicting=await stageCompleteConfigurationSetup(inspected,repository);
await nonConflicting.commit("non-conflicting");
assert.equal(commits.length,1,"setup uses one atomic repository commit");
assert.equal(commits[0].sections.projects.some(({id})=>id==="project:wholesale"),true);
assert.equal(commits[0].sections.documentationTemplates.length,0,
  "a record with a skipped dependency is also skipped");
assert.equal(commits[0].activeProjectId,"project:local","an existing valid active project is retained");

const replace=await stageCompleteConfigurationSetup(inspected,repository);
await assert.rejects(()=>replace.commit("replace-all"),/retained recipient content.*schema:money/i,
  "replacement blocks before it can silently rebind retained local content");

const nameCollisionSource=structuredClone(source);
nameCollisionSource.activeProjectId="project:new";
nameCollisionSource.sections.projects=[{id:"project:new",value:{name:"Local"}}];
const nameCollision=await stageCompleteConfigurationSetup(
  {manifest:inspected.manifest,snapshot:nameCollisionSource},repository);
assert.deepEqual(nameCollision.conflicts.filter(({reason})=>reason==="name")
  .map(({id,recipientId})=>[id,recipientId]),[["project:new","project:local"]],
"a same-name project with a different identity is a visible conflict");
await nameCollision.commit("replace-all");
assert.equal(commits.at(-1).sections.projects.some(({id})=>id==="project:local"),false,
  "name replacement removes the reviewed recipient project");
assert.equal(commits.at(-1).activeProjectId,"project:new");

const retryRepository={async read(){return structuredClone(existing);},async commit(){throw new Error("quota failure");}};
const retry=await stageCompleteConfigurationSetup(inspected,retryRepository);
await assert.rejects(()=>retry.commit("non-conflicting"),/quota failure/);
await assert.rejects(()=>retry.commit("non-conflicting"),/quota failure/,
  "a failed commit remains retryable instead of becoming finished");

const identicalCommits=[];
const identical=await stageCompleteConfigurationSetup(inspected,{async read(){return structuredClone(source);},async commit(value){identicalCommits.push(value);}});
assert.equal(await identical.commit("replace-all"),"no-change");
assert.equal(identicalCommits.length,0,"an identical import does not write");

const freshCommits=[];
const freshRepository={
  async read(){return {activeProjectId:null,
    sections:Object.fromEntries(COMPLETE_CONFIGURATION_DOMAINS.map((domain)=>[domain,[]])),bodies:[]};},
  async commit(next){freshCommits.push(structuredClone(next));},
};
const fresh=await stageCompleteConfigurationSetup(inspected,freshRepository);
await fresh.commit("replace-all");
assert.equal(freshCommits.length,1);
assert.equal(freshCommits[0].activeProjectId,"project:retail");
assert.deepEqual(freshCommits[0],source,"fresh setup restores the complete configuration");
const freshNonConflicting=await stageCompleteConfigurationSetup(inspected,freshRepository);
await freshNonConflicting.commit("non-conflicting");
assert.equal(freshCommits[1].activeProjectId,"project:retail",
  "non-conflicting setup also restores the active project in a fresh profile");

const storage=(initial={})=>{const values=new Map(Object.entries(initial));return{
  getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key),values,
};};
const projectStorage=storage({"my-chrome-utilities.specification-project-library.v1":JSON.stringify({
  format:"my-chrome-utilities.project-library",version:1,singletonMigrated:true,
  projects:{},
})});
const dataLayerStorage=storage({
  "my-chrome-utilities.schema-library.v1":JSON.stringify([{id:"schema:money",title:"Money"}]),
  "my-chrome-utilities.saved-session-library.v1":JSON.stringify({sessions:[
    {id:"session:one",name:"One"},{id:"session:two",name:"Two"},
  ]}),
  "my-chrome-utilities.defect-library.v1":JSON.stringify({defects:[
    {id:"defect:one",notes:"Keep this report"},
  ],deletionConfirmationId:"defect:one"}),
});
const hotkeyStorage=storage({"my-chrome-utilities.hotkey-keymap.v1":JSON.stringify({schemaVersion:1,bindings:{projects:"Alt P"}})});
const installed=createInstalledCompleteConfigurationPort({projectStorage,dataLayerStorage,hotkeyStorage,
  buildIdentity:"installed-test",durableRepository:{async read(){return structuredClone(source);},async commit(){}}});
const installedSnapshot=await installed.read();
assert.equal(installedSnapshot.activeProjectId,"project:retail");
assert.equal(installedSnapshot.sections.projects.length,2,"installed export reads durable projects");
assert.equal(installedSnapshot.bodies.length,2,"installed export reads durable binary bodies");
assert.equal(installedSnapshot.sections.savedSchemas[0].id,"schema:money");
assert.deepEqual(installedSnapshot.sections.savedSessions.map(({id})=>id),["session:one","session:two"],
  "saved sessions retain separate identities for conflict review");
assert.deepEqual(installedSnapshot.sections.defects.map(({id})=>id),["defect:one"],
  "saved defect reports travel without the temporary deletion prompt");
assert.equal(installedSnapshot.sections.hotkeys[0].id,"my-chrome-utilities.hotkey-keymap.v1");
assert.throws(()=>assertKnownConfigurationStorage({length:1,
  key:()=>"my-chrome-utilities.future-saved-domain.v1",
  getItem:()=>"saved user data"},[]),/has no export rule/u,
"new saved domains stop complete export until the inventory is updated");
const recipientProjectStorage=storage(),recipientDataStorage=storage(),recipientHotkeys=storage();
await createInstalledCompleteConfigurationPort({projectStorage:recipientProjectStorage,
  dataLayerStorage:recipientDataStorage,hotkeyStorage:recipientHotkeys,buildIdentity:"installed-test"})
  .commit(installedSnapshot);
assert.deepEqual(JSON.parse(recipientDataStorage.getItem("my-chrome-utilities.saved-session-library.v1"))
  .sessions.map(({id})=>id),["session:one","session:two"]);
assert.deepEqual(JSON.parse(recipientDataStorage.getItem("my-chrome-utilities.defect-library.v1")),
  {defects:[{id:"defect:one",notes:"Keep this report"}]},
  "setup restores saved defects without temporary deletion state");
const beforeProject=projectStorage.getItem("my-chrome-utilities.specification-project-library.v1");
const rejecting=createInstalledCompleteConfigurationPort({projectStorage,dataLayerStorage,hotkeyStorage,
  buildIdentity:"installed-test",settle:async()=>{throw new Error("storage rejected");}});
await assert.rejects(()=>rejecting.commit(installedSnapshot),/storage rejected/);
assert.equal(projectStorage.getItem("my-chrome-utilities.specification-project-library.v1"),beforeProject,
  "a failed installed commit restores the prior visible configuration");
const changingData=storage(),guarded=createInstalledCompleteConfigurationPort({projectStorage:storage(),
  dataLayerStorage:changingData,hotkeyStorage:storage(),buildIdentity:"stale-review-test"});
const staleReview=await stageCompleteConfigurationSetup(inspected,guarded);
changingData.setItem("my-chrome-utilities.saved-session-library.v1",JSON.stringify({sessions:[
  {id:"changed-after-review",name:"Changed after review"}]}));
await assert.rejects(()=>staleReview.commit("replace-all"),/changed after review/u,
  "setup cannot apply an old conflict review after recipient data changes");

assert.equal((await inspectConfigurationImportRoute(new Blob([archive]))).route,"complete-configuration");
for(const [document,route] of [
  [{format:"my-chrome-utilities.specification-project-state",version:2,state:{}},"project"],
  [{format:"my-chrome-utilities.durable-project-bundle",version:2,project:{}},"project"],
  [{format:"my-chrome-utilities.durable-repository-recovery-bundle",version:2,projects:[],savedSchemas:[]},"repository-recovery"],
  [{format:"my-chrome-utilities.schema-library",version:1,schemas:[],rules:[]},"schema-library"],
])assert.equal((await inspectConfigurationImportRoute(new Blob([JSON.stringify(document)]))).route,route);
const incompleteRecovery=await inspectConfigurationImportRoute(new Blob([JSON.stringify({
  format:"my-chrome-utilities.durable-repository-recovery-bundle",version:2,
  projects:[{project:{conceptVisualAssets:[{id:"asset:missing",digest:"missing-digest"}]}}],
})]));
assert.match(incompleteRecovery.blockers[0],/complete configuration ZIP/u);
const completeRecovery=await inspectConfigurationImportRoute(new Blob([JSON.stringify({
  format:"my-chrome-utilities.durable-repository-recovery-bundle",version:2,
  projects:[{project:{conceptVisualAssets:[{id:"asset:present",digest:"body-1"}]}}],
  bodies:[{digest:"body-1"}],
})]));
assert.match(completeRecovery.blockers[0],/does not carry the required image or Excel bodies/u,
  "asset metadata alone does not restore a missing binary body");
const legacySource=createMemoryDurableProjectRepository(),legacyRecipient=createMemoryDurableProjectRepository();
await legacySource.putProject(createSpecificationProject({name:"Legacy",site:"legacy.example",
  id:kind=>kind==="project"?"project:legacy":`${kind}:legacy`}),{active:true});
const legacySnapshot=await inspectLegacyRepositoryRecovery(
  await legacySource.exportRepositoryRecoveryBundle());
await createDurableProjectConfigurationRepository(legacyRecipient).commit(legacySnapshot);
assert.equal((await legacyRecipient.loadProject("project:legacy")).state.project.name,"Legacy",
  "a complete legacy recovery JSON imports its available project through one staged commit");
const unsupported=await createCompleteConfigurationArchive(source,{buildIdentity:"test",requiredFeatures:["future-feature"]});
await assert.rejects(()=>inspectCompleteConfigurationArchive(new Blob([unsupported])),/unsupported features: future-feature/u);

console.log("complete configuration portability tests passed");
