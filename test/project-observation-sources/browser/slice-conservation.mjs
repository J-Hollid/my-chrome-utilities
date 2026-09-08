import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const observationSliceAdditions={
  capture:{prefixes:[],tasks:['page-hook','coordinator','activation-order','subscription','project-switch','session-start','feed','saved-evidence']
    .map(name=>`unit:test/project-observation-sources/${name}-test.mjs`)},
  'project-event-transport':{prefixes:['test/project-observation-sources/browser/'],tasks:[
    ...['settings','editor-state','context-boundary','persistence'].map(name=>`unit:test/project-observation-sources/${name}-test.mjs`),
    'browser:test/project-observation-sources-browser-test.mjs','unit:test/project-observation-sources/fixture-api-test.mjs',
  ]},
};

export function emitObservationSliceRegression(packs,context){
  const expectedPreRepairFailure={unaccountedTasks:14},expectedRepairResult={unaccountedTasks:0};
  const current=Object.entries(observationSliceAdditions).flatMap(([id,{tasks}])=>{
    const pack=packs.find(pack=>pack.id===(id==='capture'?'capture':'project_event_transport'));
    const slice=pack.verificationSlices.find(slice=>slice.id===(id==='capture'?'capture_installed_side_panel':'project_event_transport_installed_side_panel'));
    assert.deepEqual(slice.tasks.slice(1),tasks);return slice.tasks.slice(1);
  });
  const declared=Object.values(observationSliceAdditions).flatMap(({tasks})=>tasks);
  const before={unaccountedTasks:current.length},after={unaccountedTasks:current.filter(key=>!declared.includes(key)).length};
  assert.deepEqual(before,expectedPreRepairFailure);assert.deepEqual(after,expectedRepairResult);
  const normalized=value=>Array.isArray(value)?value.map(normalized):value&&typeof value==='object'
    ?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,normalized(item)])):value;
  const digest=value=>createHash('sha256').update(JSON.stringify(normalized(value))).digest('hex');
  const fixture={id:'observation-source-installed-slice-conservation-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{addedTasks:declared},expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,preRepairResult:{status:'failed',fixtureDigest,observed:before},
    repairResult:{status:'passed',fixtureDigest,observed:after}}}));
}
