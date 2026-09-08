import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';

const execute=promisify(execFile);
const groups=['core','projects','portability','transitions','disposal','aliases','activation',
  'unavailable','settings','edits','filter','keyboard','evidence','push'];
async function run(group) {
  const env={...process.env,OBSERVATION_SOURCE_CASE:group==='keyboard'?'keyboard-matrix':group};
  delete env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION;
  return execute(process.execPath,[process.argv[1]],{env,maxBuffer:4*1024*1024});
}

export async function runObservationBrowserGroups() {
  const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
    ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
  let before;
  if(context?.causalCategory==='other:observation browser process isolation') {
    try {await run('legacy-all');before={moduleLoadFailed:false};}
    catch(error) {before={moduleLoadFailed:/net::ERR_FAILED/.test(error.stderr)&&/Timed out: installed runtime/.test(error.stderr)};}
    assert.deepEqual(before,{moduleLoadFailed:true});
  }
  const contracts={};
  for(const group of groups) {
    let stdout;
    try {({stdout}=await run(group));}
    catch(error) {process.stderr.write(error.stderr??'');throw error;}
    for(const line of stdout.split('\n').filter(Boolean)) {
      const value=JSON.parse(line);
      if(value.projectObservationContracts)Object.assign(contracts,value.projectObservationContracts);
      else console.log(line);
    }
    console.log(JSON.stringify({observationBrowserGroup:{group,status:'passed'}}));
  }
  for(const group of groups.filter(group=>group!=='core'))assert.ok(contracts[group],group);
  console.log(JSON.stringify({projectObservationContracts:contracts}));
  if(before)emitRegression(context,before,{moduleLoadFailed:false});
}

function emitRegression(context,before,after) {
  const normalized=value=>Array.isArray(value)?value.map(normalized):value&&typeof value==='object'
    ?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,normalized(item)])):value;
  const digest=value=>createHash('sha256').update(JSON.stringify(normalized(value))).digest('hex');
  const fixture={id:'observation-browser-process-isolation-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{groups},
    expectedPreRepairFailure:{moduleLoadFailed:true},expectedRepairResult:{moduleLoadFailed:false}},fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:before},repairResult:{status:'passed',fixtureDigest,observed:after}}}));
}
