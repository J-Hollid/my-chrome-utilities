import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {planVerification,verificationOwner} from '../../verification-packs.mjs';
import {acceptedCommit,committedRegistry} from './historical-conservation.mjs';

const definitions={detection:['browser-target','page-reader','types'],
  devtools:['broker','connection','deadline','definitions','entry','lexical-context','source','template-expression'],
  live:['entry','metadata/owner','metadata/request','owner','render','session','source-actions','target']};
export const approvedSources=Object.entries(definitions).flatMap(([part,names])=>
  names.map(name=>`src/tealium/${part}/${name}.ts`)).sort();
const slices={detection:['tealium_detection','tealium_devtools','tealium_live'],
  devtools:['tealium_devtools','tealium_live'],live:['tealium_live']};
const historicalCommit='36b661b74f6c26c901a3cfb9036be2f4aa8a676f';
let reference;
function acceptedSources() {
  if(reference)return reference;
  const historicalPacks=committedRegistry(historicalCommit);
  const historicalSources=execFileSync('git',['ls-tree','-r','--name-only',historicalCommit,'--','src'],
    {encoding:'utf8'}).trim().split('\n').filter(file=>file.endsWith('.ts')&&
      verificationOwner(historicalPacks,file)==='shell');
  return reference={historicalSources,acceptedPacks:committedRegistry(acceptedCommit)};
}

function projectSources(packs,sourcePaths,hostAdditions) {
  const {historicalSources,acceptedPacks}=acceptedSources();
  const historical=historicalSources.filter(file=>!hostAdditions.includes(file)).sort();
  assert.equal(historical.length,22,'The fixed historical population is retained');
  assert.deepEqual(sourcePaths.toSorted(),[...historical,...approvedSources].sort(),
    'Every historical and approved source is present, with no arbitrary additions');
  for(const source of sourcePaths)assert.equal(verificationOwner(packs,source),'shell',source);
  for(const source of approvedSources) {
    const part=source.split('/')[2];
    const plan=planVerification(packs,{changedPaths:[source]});
    assert.equal(plan.changedBoundaries[source],`tealium_${part}_runtime`);
    assert.deepEqual(plan.packIds,['shell']);
    assert.deepEqual(plan.selectedVerificationSlices,{shell:slices[part]});
    assert.deepEqual(plan.parentPackSliceFallbacks,[]);
    const accepted=planVerification(acceptedPacks,{changedPaths:[source]});
    assert.deepEqual(plan.tasks,accepted.tasks,'Accepted owner and consumer execution is conserved');
  }
  return sourcePaths.filter(file=>!approvedSources.includes(file));
}

export function verifyTealiumSourceAdditions(packs,sourcePaths,hostAdditions) {
  const projected=projectSources(packs,sourcePaths,hostAdditions);
  for(const paths of [sourcePaths.filter(p=>p!==approvedSources[0]),
    [...sourcePaths,'src/tealium/live/unapproved.ts'],sourcePaths.filter(p=>p!==projected[0]),
    sourcePaths.map(p=>p===projected[0]?'src/changed-historical.ts':p)])
    assert.throws(()=>projectSources(packs,paths,hostAdditions),assert.AssertionError);
  const changedOwner=structuredClone(packs);
  const owner=changedOwner.find(p=>p.id==='shell');
  const moved=owner.verificationSlices.find(s=>s.id==='tealium_detection');
  owner.verificationSlices=owner.verificationSlices.filter(s=>s!==moved);
  changedOwner.find(p=>p.id==='capture').verificationSlices.push(moved);
  assert.throws(()=>projectSources(changedOwner,sourcePaths,hostAdditions),assert.AssertionError);
  const changedConsumer=structuredClone(packs);
  changedConsumer.find(p=>p.id==='shell').verificationSlices
    .find(s=>s.id==='tealium_detection').consumers=[];
  assert.throws(()=>projectSources(changedConsumer,sourcePaths,hostAdditions),assert.AssertionError);
  return projected;
}
