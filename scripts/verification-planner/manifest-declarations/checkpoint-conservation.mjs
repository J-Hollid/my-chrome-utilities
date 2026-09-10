import assert from 'node:assert/strict';
import {acceptedCommit,committedRegistry} from './historical-conservation.mjs';
import {approvedTealiumCheckpointIds} from '../../../test/verification-contracts/acceptance-history-projection.mjs';
import {timeoutIncidentDigest as digest} from '../../verification-reliability-values.mjs';

export function verifyApprovedCheckpointAdditions(current,old) {
  const accepted=committedRegistry(acceptedCommit).find(p=>p.id==='shell').checkpointCommands;
  const added=new Set(approvedTealiumCheckpointIds);
  const additions=accepted.filter(task=>added.has(task.id));
  assert.equal(added.size,18);
  assert.deepEqual(additions.map(task=>task.id),approvedTealiumCheckpointIds);
  assert.deepEqual(accepted.filter(task=>!added.has(task.id)),old,
    'Every fixed historical command is retained in order with its exact execution settings');
  const check=commands=>assert.deepEqual(commands,accepted,
    'Only the exact independently accepted checkpoint additions are allowed');
  check(current);
  for(const mutate of [commands=>commands.shift(),commands=>{commands[0].executable='changed';},
    commands=>commands.splice(commands.findIndex(c=>added.has(c.id)),1),
    commands=>commands.push({id:'unapproved',executable:'node',args:['unapproved']}),
    commands=>commands.find(c=>added.has(c.id)).args.push('unapproved')]) {
    const changed=structuredClone(current);mutate(changed);
    assert.throws(()=>check(changed),assert.AssertionError);
  }
  const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
    ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
  if(context?.causalCategory!=='other:Tealium checkpoint conservation')return;
  assert.throws(()=>assert.deepEqual(current,old),assert.AssertionError);
  check(current);
  const pre={historicalProjectionAccepted:false},post={historicalProjectionAccepted:true};
  const fixture={id:'tealium-checkpoint-command-conservation-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{failedCommit:'a97a2d140bd476b6d39762326811bf4c110d5c5f',
      test:'test/utility-tab-expansion/ownership-test.mjs',
      historicalCommit:'03f3e769de13943f0e516ea91b0fe3b48c621825',acceptedCommit,
      oldDigest:digest(old),currentDigest:digest(current)},
    expectedPreRepairFailure:pre,expectedRepairResult:post};
  const fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:pre},
    repairResult:{status:'passed',fixtureDigest,observed:post}}}));
}
