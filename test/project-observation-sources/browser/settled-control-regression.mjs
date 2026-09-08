import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {waitForSettledControl} from './settled-control.mjs';

export async function verifySettledControlRegression(context) {
  async function observe(settled) {
    let menuOpen=false,clicked,current,rendered=false;
    const control=()=>({isConnected:true,disabled:false,closest:()=>null,click(){clicked=this;menuOpen=true;}});
    current=control();
    const pause=async()=>{if(!rendered){rendered=true;current.isConnected=false;current=control();menuOpen=false;}};
    const selected=settled?await waitForSettledControl(()=>current,'property action',pause):current;
    selected.click();await pause();
    return {menuOpen,clickedCurrentControl:clicked===current};
  }
  const before=await observe(false),after=await observe(true);
  const expectedPreRepairFailure={menuOpen:false,clickedCurrentControl:false};
  const expectedRepairResult={menuOpen:true,clickedCurrentControl:true};
  assert.deepEqual(before,expectedPreRepairFailure);assert.deepEqual(after,expectedRepairResult);
  let polls=0;
  await assert.rejects(()=>waitForSettledControl(()=>undefined,'missing',async()=>{polls++;}),/Control did not settle/);
  assert.equal(polls,300,'missing controls retain the bounded wait');
  if(!context)return;
  const normalize=value=>Array.isArray(value)?value.map(normalize):value&&typeof value==='object'
    ?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,normalize(item)])):value;
  const digest=value=>createHash('sha256').update(JSON.stringify(normalize(value))).digest('hex');
  const fixture={id:'schema-property-control-render-boundary-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{pendingRenderReplacesControl:true},
    expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,preRepairResult:{status:'failed',fixtureDigest,observed:before},
    repairResult:{status:'passed',fixtureDigest,observed:after}}}));
}
