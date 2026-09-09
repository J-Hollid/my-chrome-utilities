import assert from 'node:assert/strict';
import {loadVerificationPacks,planVerification} from '../../scripts/verification-packs.mjs';
import {execFileSync} from 'node:child_process';
import {verificationDigest as digest} from '../../scripts/verification-evidence/core.mjs';
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

export async function emitLocalFeatureSelectionRepair(context) {
  const localShellPlan=planVerification(await loadVerificationPacks(),{
    changedPaths:['src/workspace-tabs-ui.ts'],includeProperties:true});
  const failedCommit='b0d80237';
  const owner='test/verification-contracts/ownership-shell-contract-test.mjs';
  const source=execFileSync('git',['show',`${failedCommit}:${owner}`],{encoding:'utf8'});
  const start=source.indexOf('assert.equal(localShellPlan.parserTasks.length,');
  const end=source.indexOf('assert.equal(localShellPlan.checkpointTasks.length,',start);
  assert.ok(start>=0&&end>start);
  const oldCheck=new Function('assert','localShellPlan',source.slice(start,end));
  assert.throws(()=>oldCheck(assert,localShellPlan),{code:'ERR_ASSERTION'});
  verifyLocalWorkspaceTasks(localShellPlan);
  const before={accepted:false,expected:localShellPlan.features.length,
    selectedParsers:localShellPlan.parserTasks.length};
  const after={accepted:true,selectedParsers:localShellPlan.parserTasks.length,
    selectedGenerators:localShellPlan.generatorTasks.length};
  assert.deepEqual(after,{accepted:true,selectedParsers:1,selectedGenerators:1});
  const fixture={id:'utility-local-feature-selection-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{failedCommit,owner},
    expectedPreRepairFailure:before,expectedRepairResult:after};
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest:digest(fixture),observed:before},
    repairResult:{status:'passed',fixtureDigest:digest(fixture),observed:after}}}));
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

export function projectUtilityBoundaryHistory(packs, sourcePaths, history) {
  const paths=['src/side-panel.ts','src/side-panel-bootstrap.ts','src/utility-registry.ts'];
  const current=Object.fromEntries(sourcePaths.map(source=>{
    const plan=planVerification(packs,{changedPaths:[source]});
    return [source,{boundary:plan.changedBoundaries[source],packIds:plan.packIds}];
  }));
  for(const source of paths){
    assert.equal(current[source].boundary,'utility_workspace_entry');
    assert.deepEqual(current[source].packIds.toSorted(),utilityHostPackIds.toSorted());
  }
  assert.deepEqual(history.renameToPlatform.toSorted(),utilityHostPackIds.toSorted());
  // VTD-009 predates the independently approved utility entry boundary.
  // Replay its global-root case with the committed pre-preparation boundary. Keep the
  // actual current plans beside this historical projection.
  const historical=structuredClone(packs);
  const shell=historical.find(({id})=>id==='shell');
  shell.sharedBoundaries=shell.sharedBoundaries.filter(({id})=>id!=='utility_workspace_entry');
  const prior=JSON.parse(execFileSync('git',['show','03404bc5^:verification/packs.json'],
    {encoding:'utf8'})).find(({id})=>id==='shell').impactBoundaries
    .find(({id})=>id==='shell_platform_runtime');
  const platform=shell.impactBoundaries.find(({id})=>id===prior.id);
  assert.deepEqual(prior.prefixes.toSorted(),[...platform.prefixes,...paths].toSorted());
  Object.assign(platform,prior);
  const boundaries={...current};
  for(const source of paths){
    const plan=planVerification(historical,{changedPaths:[source]});
    assert.equal(plan.changedBoundaries[source],'shell_platform_runtime');
    assert.deepEqual(plan.packIds.toSorted(),runnablePackIdsFromRegistry(historical).toSorted());
    boundaries[source]={boundary:plan.changedBoundaries[source],packIds:plan.packIds};
  }
  const projected={boundaryBasis:'historical global-root replay; current utility entry checked separately',
    boundaries,currentUtilityBoundaries:Object.fromEntries(paths.map(source=>[source,current[source]])),
    history:{...history,renameToPlatform:boundaries['src/side-panel.ts'].packIds},
    currentRenameToUtilityEntry:history.renameToPlatform};
  const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
    ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
  if(context?.causalCategory==='other:utility historical boundary projection'){
    const program=`
(require '[cheshire.core :as json]
 '[acceptance.verification-support.modular-architecture-vtd009-handlers :as h])
(let [input (json/parse-string (slurp *in*) true)
      steps ["its boundary is shell_platform_runtime" "its selected scope is every runnable pack"]
      entries (h/handlers {:example-values (fn [_ captures] captures)})
      outcome (fn [boundaries]
       (mapv (fn [source]
        (let [world {:modular/registry (:packs input) :vtd009/active true
                     :vtd009/path source :vtd009/evidence {:boundaries boundaries}}]
         (try (doseq [step steps]
          (let [entry (first (filter #(re-matches (:pattern %) step) entries))]
           (assert entry) ((:handler entry) world nil (rest (re-matches (:pattern entry) step)))))
          "accepted" (catch clojure.lang.ExceptionInfo _ "rejected")))) (:paths input)))]
 (println (json/generate-string {:before (outcome (:current input))
                                :after (outcome (:boundaries input))})))`;
    const observed=JSON.parse(execFileSync('bb',['-e',program],
      {input:JSON.stringify({packs,paths,current,boundaries}),encoding:'utf8',timeout:15000}));
    assert.deepEqual(observed,{before:paths.map(()=> 'rejected'),after:paths.map(()=> 'accepted')});
    const fixture={id:'utility-historical-boundary-v1',causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{paths},
      expectedPreRepairFailure:observed.before,expectedRepairResult:observed.after};
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
      incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:'failed',fixtureDigest:digest(fixture),observed:observed.before},
      repairResult:{status:'passed',fixtureDigest:digest(fixture),observed:observed.after}}}));
  }
  return projected;
}
