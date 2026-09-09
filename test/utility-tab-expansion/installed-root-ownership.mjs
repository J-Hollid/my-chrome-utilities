import assert from 'node:assert/strict';
import {planVerification} from '../../scripts/verification-packs.mjs';
import {runnablePackIdsFromRegistry} from '../../scripts/verification-pack-cardinality/contract.mjs';

export const utilityHostPackIds=['project_management','durable_project_repository','command-palette','hotkeys',
  'capture','event-library','project_event_transport','schemas','defects','replay',
  'live_flow_testing','shell','verification_process'];

export function verifyLocalWorkspaceTasks(plan) {
  assert.deepEqual(plan.tasks.map(({key})=>key),[
    'build:dist','unit:test/workspace-tabs-installed-controller-test.mjs',
    'property:test/workspace-tabs-property-test.mjs',
    'browser-observation:LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER+SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER+WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER',
    'acceptance-parse:features/side-panel-workspace-tabs.feature',
    'acceptance-generate:features/side-panel-workspace-tabs.feature',
  ],'local workspace changes retain the independently approved exact task boundary');
}

export function verifyUtilitySourceAdditions(packs,sourcePaths) {
  const added=['src/utility-contributions/index.ts',...['workspace','page-client','retained-page',
    'installed-shell-controller','contribution','protocol','installed-entry']
    .map(name=>`src/utility-host/${name}.ts`)];
  assert.deepEqual(sourcePaths.filter(p=>p.startsWith('src/utility-host/')||
    p.startsWith('src/utility-contributions/')).sort(),added.toSorted());
  const expected=utilityHostPackIds.toSorted();
  for(const source of added){
    const plan=planVerification(packs,{changedPaths:[source]});
    assert.equal(plan.changedBoundaries[source],'retained_utility_page_host');
    assert.deepEqual(plan.packIds.toSorted(),expected,`${source} retains every exact utility host consumer`);
  }
  return sourcePaths.filter(p=>!added.includes(p));
}

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
