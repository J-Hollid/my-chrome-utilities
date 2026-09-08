import assert from "node:assert/strict";
import {createSpecificationProject} from "../../dist/data-layer-specification-project.js";
import {createMemoryDurableProjectRepository} from "../../dist/data-layer-durable-project-repository.js";
import {createInstalledTransportPersistence} from "../../dist/data-layer-installed/project-event-transport/persistence.js";
const repository=createMemoryDurableProjectRepository();
let state=createSpecificationProject({name:"Retail",site:"retail.test",id:kind=>kind+":durable"});
await repository.putProject(state,{active:true});
const storage={getItem:()=>null,setItem:()=>{throw new Error("source saves must not publish an optimistic mirror");}};
const controller=createInstalledTransportPersistence({currentProject:()=>state,storage,
  durable:{repository,settled:async()=>{},ensureProject:async()=>{},refreshProject:async()=>{state=(await repository.loadProject(state.project.id)).state;}},capture:next=>{state=next;}});
const first=await controller.sources.load();
assert.equal(first.sources.length,1);assert.equal(first.sources[0].id,"event-history");
assert.equal((await repository.loadProject(state.project.id)).state.project.eventTransport.observationSources.length,1);
assert.deepEqual(await controller.sources.load(),first);
const save=repository.saveDraft.bind(repository);repository.saveDraft=async()=>{throw new Error("Disk full");};
const next=[...first.sources,{id:"app",name:"Application",path:"event.history",enabled:true}];
await assert.rejects(()=>controller.sources.save(state.project.id,next),/Disk full/);
assert.equal((await controller.sources.load()).sources.length,1);
repository.saveDraft=save;
await controller.sources.save(state.project.id,next);
assert.equal((await controller.sources.load()).sources.length,2);
assert.deepEqual((await repository.loadProject(state.project.id)).state.project.releases,[]);
console.log("Observation source durable migration and failure tests passed");

if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION)await (await import("./browser/migration-fixture-regression.mjs")).verifyMigrationFixtureRegression(JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION));
