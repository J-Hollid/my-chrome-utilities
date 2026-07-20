import assert from "node:assert/strict";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {subscribeProjectLibraryChanges} from "../dist/data-layer-project-library-ui.js";
import {
  activateProject,
  activeProjectContextChange,
  commitProjectImport,
  createProjectInLibrary,
  exportProjectBundle,
  migrateSingletonProject,
  projectLibrary,
  recordProjectNavigation,
  replaceActiveProjectState,
  resolveProjectNavigation,
  resolveProjectWrite,
  setProjectPendingWrite,
  stageProjectImport,
  updateProjectMetadata,
} from "../dist/data-layer-project-library.js";

const clock=(()=>{let tick=0;return()=>`2026-07-20T12:${String(tick++).padStart(2,"0")}:00.000Z`;})();
const state=(id,name,site)=>{
  const value=createSpecificationProject({name,site,id:(kind)=>kind==="project"?id:`${kind}:${id}`});
  value.project.owner="Data team";
  value.project.notes=`${name} notes`;
  value.project.collections.profiles.push({id:`profile:${id}`,name:"Sitewide",requirements:[],compiledTargets:["discard"],sourceLineage:{schemaId:"schema:global",revision:4}});
  value.project.collections.pageGroups.push({id:`group:${id}`,name:"Checkout",profileId:`profile:${id}`});
  value.project.collections.pages.push({id:`page:${id}`,name:"Cart",profileId:`profile:${id}`,pageGroupIds:[`group:${id}`]});
  value.project.collections.events.push({id:`event:${id}`,name:"Purchase",profileId:`profile:${id}`});
  value.project.collections.flows.push({id:`flow:${id}`,name:"Checkout journey"});
  value.project.collections.assignments.push({id:`assignment:${id}`,name:"Purchase assignment",eventId:`event:${id}`,schemaId:`profile:${id}`});
  value.project.documentationFlowGraphs={[`flow:${id}`]:{pageFrames:[{id:`frame:${id}`,name:"Cart step",pageId:`page:${id}`,pageGroupId:`group:${id}`}],occurrences:[{id:`occurrence:${id}`,name:"Purchase occurrence",pageFrameId:`frame:${id}`,pageId:`page:${id}`,eventId:`event:${id}`}],relationships:[]}};
  value.project.documentationSettings={columns:["name","type"]};
  value.history.undo.push({label:"Prior edit",project:structuredClone(value.project)});
  return value;
};

const retail=state("project-retail","Retail website","retail.example.com"),trade=state("project-trade","Trade portal","trade.example.com");
let library=projectLibrary([{state:retail,revision:14,createdAt:clock(),lastModifiedAt:clock()},{state:trade,revision:7,createdAt:clock(),lastModifiedAt:clock()}],"project-retail");
assert.equal(library.activeProjectId,"project-retail");
assert.deepEqual(Object.keys(library.projects),["project-retail","project-trade"]);

const legacyNavigation={kind:"pages",id:"page:project-retail"},migrated=migrateSingletonProject(undefined,{state:retail,revision:14,navigation:legacyNavigation},clock);
assert.equal(migrated.activeProjectId,"project-retail");
assert.deepEqual(migrated.projects["project-retail"].state,retail);
assert.deepEqual(migrated.projects["project-retail"].navigation,legacyNavigation);
assert.deepEqual(migrateSingletonProject(migrated,{state:trade,revision:7},clock),migrated,"singleton migration is idempotent");
const newerRetail=structuredClone(retail);newerRetail.project.description="Newer canonical singleton";
const reconciled=migrateSingletonProject(migrated,{state:newerRetail,revision:15},clock);
assert.equal(reconciled.projects["project-retail"].revision,15);
assert.equal(reconciled.projects["project-retail"].state.project.description,"Newer canonical singleton");
assert.deepEqual(reconciled.projects["project-retail"].navigation,legacyNavigation);

assert.throws(()=>createProjectInLibrary(library,{name:" retail WEBSITE ",purpose:"",website:"other.example",owner:"",notes:""},{id:()=>"project:collision",now:clock}),/unique/i);
const created=createProjectInLibrary(library,{name:"Agency platform",purpose:"Client implementation",website:"agency.example.com",owner:"Delivery team",notes:"Initial discovery"},{id:(kind)=>`${kind}:agency`,now:clock});
assert.equal(created.activeProjectId,"project:agency");
assert.equal(Object.keys(created.projects).length,3);
assert.deepEqual(Object.values(created.projects["project:agency"].state.project.collections).map((entries)=>entries.length),[0,0,0,0,0,0,0,0,0]);
assert.deepEqual(created.projects["project-retail"],library.projects["project-retail"]);

const entityBytes=JSON.stringify(retail.project.collections),renamed=updateProjectMetadata(library,"project-retail",{name:"Retail data layer",purpose:"Retail contracts",website:"data.retail.example",owner:"Analytics",notes:"Owned"},clock);
assert.equal(renamed.projects["project-retail"].state.project.id,"project-retail");
assert.equal(JSON.stringify(renamed.projects["project-retail"].state.project.collections),entityBytes);
assert.equal(renamed.projects["project-retail"].state.history.undo.at(-1).label,"Edit project metadata");

library=setProjectPendingWrite(library,"project-retail",{label:"Set /currency type",baseRevision:14,fields:["/currency"],command:{kind:"set-project-value",path:"/namingConventions/currency",value:"number"}});
assert.throws(()=>activateProject(library,"project-trade",clock),/pending.*Set \/currency type/i);
assert.equal(library.activeProjectId,"project-retail");
const rejected=resolveProjectWrite(library,"project-retail","reject",undefined,clock);
assert.equal(rejected.projects["project-retail"].revision,14);
assert.equal(rejected.projects["project-retail"].state.project.namingConventions.currency,undefined);
const merged=resolveProjectWrite(library,"project-retail","merge",{state:retail,revision:15},clock);
assert.equal(merged.projects["project-retail"].revision,15);
library=resolveProjectWrite(library,"project-retail","retry",undefined,clock);
assert.equal(library.projects["project-retail"].state.project.namingConventions.currency,"number");
assert.equal(library.projects["project-retail"].state.history.undo.at(-1).label,"Set /currency type");
assert.equal(library.projects["project-retail"].pendingWrite,undefined);
library=activateProject(library,"project-trade",clock);
assert.equal(library.activeProjectId,"project-trade");
assert.equal(library.projects["project-retail"].revision,15);

const externalLibrary=recordProjectNavigation(library,"project-trade",{kind:"flows",id:"flow:project-trade"}),externalSwitch=activeProjectContextChange(JSON.stringify(externalLibrary),"project-retail",15);
assert.equal(externalSwitch.changed,true,"an external active identity change invalidates the open Studio context");
assert.equal(externalSwitch.active?.state.project.id,"project-trade");
assert.deepEqual(externalSwitch.active?.navigation,{kind:"flows",id:"flow:project-trade"});
const unchangedContext=activeProjectContextChange(JSON.stringify(externalLibrary),"project-trade",7);
assert.equal(unchangedContext.changed,false,"the same active identity and revision do not rerender Studio");
const externallyEdited=structuredClone(library);externallyEdited.projects["project-trade"].revision=8;
assert.equal(activeProjectContextChange(JSON.stringify(externallyEdited),"project-trade",7).changed,true,"an external active revision refreshes an already-open Studio");
const noActive=structuredClone(library);delete noActive.activeProjectId;
assert.equal(activeProjectContextChange(JSON.stringify(noActive),"project-trade",7).active,undefined,"external deactivation clears project-bound Studio state");

const storageListeners=new Set(),storageTarget={addEventListener(type,listener){assert.equal(type,"storage");storageListeners.add(listener);},removeEventListener(type,listener){assert.equal(type,"storage");storageListeners.delete(listener);}},emit=(event)=>{for(const listener of storageListeners)listener(event);};let mountedLibrary=externalLibrary,synchronizations=0;
const unsubscribeLibrary=subscribeProjectLibraryChanges(storageTarget,()=>mountedLibrary,(next)=>{mountedLibrary=next;synchronizations+=1;});
emit({key:"unrelated",newValue:JSON.stringify(externallyEdited)});emit({key:"my-chrome-utilities.specification-project-library.v1",newValue:JSON.stringify(externalLibrary)});
assert.equal(synchronizations,0,"unrelated and byte-identical storage events do not echo into the mounted UI");
emit({key:"my-chrome-utilities.specification-project-library.v1",newValue:JSON.stringify(externallyEdited)});
assert.equal(synchronizations,1);assert.equal(mountedLibrary.projects["project-trade"].revision,8,"the mounted library consumes an external Studio revision");
unsubscribeLibrary();emit({key:"my-chrome-utilities.specification-project-library.v1",newValue:JSON.stringify(externalLibrary)});assert.equal(synchronizations,1,"disposed mounts stop consuming storage events");

const remappedState=structuredClone(library.projects["project-trade"].state);
remappedState.project.id="project-trade-imported";
const identityReplacement=replaceActiveProjectState(library,remappedState,8,clock);
assert.equal(identityReplacement.activeProjectId,"project-trade-imported");
assert.equal(identityReplacement.projects["project-trade"],undefined);
assert.equal(identityReplacement.projects["project-trade-imported"].state.project.id,"project-trade-imported");
assert.equal(identityReplacement.projects["project-retail"].revision,15);

library=recordProjectNavigation(library,"project-retail",{kind:"pages",id:"page:project-retail"});
library=recordProjectNavigation(library,"project-trade",{kind:"flows",id:"flow:project-trade"});
assert.deepEqual(resolveProjectNavigation(library,"project-retail"),{kind:"pages",id:"page:project-retail"});
assert.equal(resolveProjectNavigation(library,"project-retail",{kind:"events",id:"event:project-trade"}),undefined,"foreign project entities never resolve");

const beforeExport=structuredClone(library),bundle=JSON.parse(exportProjectBundle(library,"project-retail"));
assert.equal(bundle.format,"my-chrome-utilities.project-bundle");
assert.equal(bundle.version,1);
assert.equal(bundle.project.id,"project-retail");
assert.equal(bundle.draftRevision,15);
assert.equal(bundle.project.collections.profiles[0].compiledTargets,undefined);
assert.equal(bundle.history,undefined);
assert.equal(bundle.permissions,undefined);
assert.deepEqual(library,beforeExport,"export is read-only");

const staged=stageProjectImport(JSON.stringify(bundle),library,{id:(oldId)=>`copy:${oldId}`,now:clock});
assert.equal(staged.blockers.length,0);
assert.equal(staged.targetName,"Retail website copy");
assert.equal(staged.projectId,"copy:project-retail");
assert.equal(staged.state.project.collections.pages[0].id,"copy:page:project-retail");
assert.deepEqual(staged.state.project.collections.pages[0].pageGroupIds,["copy:group:project-retail"]);
assert.equal(staged.state.project.documentationFlowGraphs["copy:flow:project-retail"].occurrences[0].pageFrameId,"copy:frame:project-retail");
assert.deepEqual(staged.state.project.collections.profiles[0].sourceLineage,{schemaId:"schema:global",revision:4},"external lineage is not remapped");
const imported=commitProjectImport(library,staged,clock);
assert.equal(imported.activeProjectId,"project-trade","import stays inactive");
assert.equal(imported.projects["copy:project-retail"].state.project.name,"Retail website copy");
assert.deepEqual(imported.projects["project-retail"],library.projects["project-retail"]);

for(const [serialized,repair] of [
  ["{",/readable project bundle/i],
  [JSON.stringify({...bundle,version:99}),/supported version/i],
  [JSON.stringify({...bundle,project:{...bundle.project,collections:{...bundle.project.collections,pages:[]}}}),/missing Page/i],
]){
  const invalid=stageProjectImport(serialized,library,{id:(oldId)=>`invalid:${oldId}`,now:clock});
  assert.match(invalid.blockers[0].message,repair);
  assert.throws(()=>commitProjectImport(library,invalid,clock),/blocked/i);
  assert.deepEqual(library,beforeExport);
}

console.log("data-layer project library unit tests passed");
