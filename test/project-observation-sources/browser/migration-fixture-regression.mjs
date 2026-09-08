import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as projects from '../../../dist/data-layer-specification-project.js';
import {createMemoryDurableProjectRepository} from '../../../dist/data-layer-durable-project-repository.js';
import {createInstalledTransportPersistence} from '../../../dist/data-layer-installed/project-event-transport/persistence.js';

export async function verifyMigrationFixtureRegression(context) {
  const source=await readFile(new URL('../../support/durable-project-targets.mjs',import.meta.url),'utf8');
  const declaration=source.split('\n').find(line=>line.trim().startsWith('const makeProject='));
  const make=new Function('projects',declaration+'return makeProject;')(projects);
  async function sequence(legacy) {
    let state=make('fixture','Storage fixture');
    if(legacy)delete state.project.eventTransport.observationSources;
    const repository=createMemoryDurableProjectRepository();
    await repository.putProject(state,{draftSequence:3,active:true});
    const controller=createInstalledTransportPersistence({currentProject:()=>state,
      storage:{getItem:()=>null,setItem:()=>{}},capture:()=>{},
      durable:{repository,settled:async()=>{},ensureProject:async()=>{},
        refreshProject:async()=>{state=(await repository.loadProject('fixture')).state;}}});
    await controller.sources.load();
    return {draftSequence:(await repository.loadProject('fixture')).draftSequence};
  }
  const before=await sequence(true),after=await sequence(false);
  const expectedPreRepairFailure={draftSequence:4},expectedRepairResult={draftSequence:3};
  assert.deepEqual(before,expectedPreRepairFailure);assert.deepEqual(after,expectedRepairResult);
  const normalize=value=>Array.isArray(value)?value.map(normalize):value&&typeof value==='object'
    ?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,normalize(item)])):value;
  const digest=value=>createHash('sha256').update(JSON.stringify(normalize(value))).digest('hex');
  const fixture={id:'durable-fixture-source-migration-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{initialDraftSequence:3},
    expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,preRepairResult:{status:'failed',fixtureDigest,observed:before},
    repairResult:{status:'passed',fixtureDigest,observed:after}}}));
}
