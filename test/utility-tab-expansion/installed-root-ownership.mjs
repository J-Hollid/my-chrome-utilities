import assert from 'node:assert/strict';
import {planVerification} from '../../scripts/verification-packs.mjs';
import {runnablePackIdsFromRegistry} from '../../scripts/verification-pack-cardinality/contract.mjs';

export function verifyInstalledRootOwnership(packs) {
  const entry=packs.find(({id})=>id==='shell').sharedBoundaries
    .find(({id})=>id==='utility_workspace_entry');
  const actual=planVerification(packs,{changedPaths:['src/side-panel.ts']});
  const expected=entry?[entry.owner,...entry.consumers]:runnablePackIdsFromRegistry(packs);
  assert.deepEqual([...actual.packIds].sort(),[...expected].sort(),
    'the installed root retains every declared owner and consumer');
  if(!entry)return;
  assert.ok(actual.terminalFullObligations.includes('src/side-panel.ts'));
  const undeclared=structuredClone(packs);
  const shell=undeclared.find(({id})=>id==='shell');
  shell.sharedBoundaries=shell.sharedBoundaries.filter(({id})=>id!==entry.id);
  assert.deepEqual(planVerification(undeclared,{changedPaths:['src/side-panel.ts']}).packIds.sort(),
    runnablePackIdsFromRegistry(undeclared).sort(),
    'an undeclared installed root still requires every runnable pack');
}
