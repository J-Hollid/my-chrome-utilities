import {iconFeatures,iconKeys,iconRegistryCommit,recordIconTaskRepair} from '../../../test/utility-tab-expansion/navigation-icons/task-conservation.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {commandTask,planVerification} from '../tasks/planner.mjs';
import {projectAcceptanceSessionToBaseline,approvedTealiumCheckpointIds} from
  '../../../test/verification-contracts/acceptance-history-projection.mjs';
import {timeoutIncidentDigest as digest} from '../../verification-reliability-values.mjs';

export const acceptedCommit='d69fb8059f7c3f68e7d4856be6619a8ab3e2b23a';
export const approvedFeatures=['tealium-connection-recovery','tealium-connection-recovery-runtime',
  'tealium-detection','tealium-detection-runtime','tealium-live',
  'tealium-live-runtime','tealium-source-navigation','tealium-source-navigation-runtime']
  .map(name=>`features/${name}.feature`).sort();
const approvedUnits=['detection/model','live/model','devtools/model','detection/reader',
  'detection/target','live/filter','live/session','devtools/bridge','devtools/source',
  'live/owner','live/source-actions','live/mapping','devtools/activation'];
const host='browser:test/project-observation-source-host-browser-test.mjs';
export const approvedKeys=[host,...approvedUnits.map(name=>`unit:test/tealium/${name}-test.mjs`),
  ...approvedFeatures.flatMap(file=>['parse','generate'].map(stage=>`acceptance-${stage}:${file}`)),
  ...approvedTealiumCheckpointIds.map(id=>`checkpoint:shell:${id}`)].sort();
const liveFeatureFiles=['features/data-layer-live-add-all-schema.feature',
  'features/data-layer-live-add-all-schema-runtime.feature'];
const processFeatureFiles=['features/verification-registration-review-preflight.feature'];
const task=(key,stage,packId,executable,args,target)=>commandTask({key,stage,packId,executable,args,target,
  requiredCapabilities:[],temporaryPathClass:'workspace'});
const browserTask=(path)=>commandTask({key:`browser:${path}`,stage:'browser',packId:'schemas',
  executable:'node',args:[path],target:path,requiredCapabilities:['local-loopback'],
  temporaryPathClass:'chrome-short'});
const liveTasks=[
  task('unit:test/data-layer-live-add-all-schema-test.mjs','unit','schemas','node',
    ['test/data-layer-live-add-all-schema-test.mjs'],'test/data-layer-live-add-all-schema-test.mjs'),
  task('unit:test/data-layer-installed/schemas/live-schema-bulk-controller-test.mjs','unit','schemas','node',
    ['test/data-layer-installed/schemas/live-schema-bulk-controller-test.mjs'],
    'test/data-layer-installed/schemas/live-schema-bulk-controller-test.mjs'),
  task('property:test/data-layer-live-add-all-schema-property-test.mjs','property','schemas','node',
    ['test/data-layer-live-add-all-schema-property-test.mjs'],
    'test/data-layer-live-add-all-schema-property-test.mjs'),
  browserTask('test/data-layer-live-add-all-schema-native-recovery-browser-test.mjs'),
  ...liveFeatureFiles.flatMap(file=>[
    task(`acceptance-parse:${file}`,'acceptance-parse',null,'bb',
      ['gherkin-parser',file,`build/acceptance/ir/${file.slice('features/'.length,-'.feature'.length)}.json`],file),
    task(`acceptance-generate:${file}`,'acceptance-generate',null,'bb',
      ['acceptance-entrypoint-generator',`build/acceptance/ir/${file.slice('features/'.length,-'.feature'.length)}.json`,
        'build/acceptance/generated'],file)])];
const liveKeys=liveTasks.map(item=>item.key).sort();
export const processTasks=[
  task('unit:test/verification-registration-review-preflight-test.mjs','unit','verification_process','node',
    ['test/verification-registration-review-preflight-test.mjs'],
    'test/verification-registration-review-preflight-test.mjs'),
  task('unit:test/verification-review-preflight-workflow-test.mjs','unit','verification_process','node',
    ['test/verification-review-preflight-workflow-test.mjs'],
    'test/verification-review-preflight-workflow-test.mjs'),
  ...processFeatureFiles.flatMap(file=>[
    task(`acceptance-parse:${file}`,'acceptance-parse',null,'bb',
      ['gherkin-parser',file,`build/acceptance/ir/${file.slice('features/'.length,-'.feature'.length)}.json`],file),
    task(`acceptance-generate:${file}`,'acceptance-generate',null,'bb',
      ['acceptance-entrypoint-generator',`build/acceptance/ir/${file.slice('features/'.length,-'.feature'.length)}.json`,
        'build/acceptance/generated'],file)])];
const processKeys=processTasks.map(item=>item.key).sort();
const shellRepairKey='unit:test/shell-acceptance-registration-repair-test.mjs';
const shellRepairIdentity={key:shellRepairKey,stage:'unit',packId:'shell',executable:'node',
  args:['test/shell-acceptance-registration-repair-test.mjs'],
  target:'test/shell-acceptance-registration-repair-test.mjs',environment:null,
  requiredCapabilities:[],temporaryPathClass:'workspace',
  display:'node test/shell-acceptance-registration-repair-test.mjs'};

export function governedHistoricalTaskAdditions(selectedKeys,historicalKeys=[],{
  basePacks,browserTargetIds=[],governedTasks=[]}={}) {
  const selected=new Set(selectedKeys);
  const historical=new Set(historicalKeys);
  const accepted=planVerification(committedRegistry(acceptedCommit),
    {changedPaths:['manifest.json'],includeProperties:true}).tasks;
  const icons=planVerification(committedRegistry(iconRegistryCommit),
    {changedPaths:['src/utility-host/workspace.ts'],includeProperties:true}).tasks
    .filter(task=>iconKeys.includes(task.key));
  const requestedTargets=new Set(browserTargetIds);
  const baseTargets=basePacks?basePacks.flatMap(pack=>{
    const targetIds=(pack.browserObservations??[]).map(({id})=>id)
      .filter(id=>requestedTargets.has(id));
    return targetIds.length?planVerification(basePacks,{packIds:[pack.id],
      browserTargetIds:targetIds}).tasks:[];
  }):[];
  const governed=new Map([...accepted,...icons,...baseTargets,...liveTasks,...processTasks,
    shellRepairIdentity,...governedTasks]
    .map(task=>[task.key,task]));
  return [...governed.values()].filter(task=>selected.has(task.key)&&!historical.has(task.key))
    .map(task=>structuredClone(task));
}
export const committedRegistry=commit=>JSON.parse(execFileSync('git',
  ['show',`${commit}:verification/packs.json`],{encoding:'utf8',maxBuffer:8*1024*1024}));
const keys=tasks=>tasks.map(task=>task.key).sort();
const artifacts=feature=>[
  `build/acceptance/generated/${feature.replace(/[^a-z0-9]+/gu,'-')}_acceptance_test.clj`,
  `build/acceptance/ir/${feature.slice('features/'.length,-'.feature'.length)}.json`];
const sessionAdditions=new Map([
  ['acceptance-session:shell',[...approvedFeatures,...iconFeatures]],
  ['acceptance-session:schemas',liveFeatureFiles],
  ['acceptance-session:verification_process',processFeatureFiles]]);

export function projectGovernedHistoricalTasks(tasks,selectedFeaturesByPack=new Map(),
  sessionPrerequisitesByPack=new Map()) {
  return tasks.map(old=>{
    const selectedFeatures=selectedFeaturesByPack.get(old.packId);
    if(old.stage==='acceptance-session'&&selectedFeatures) {
      const features=[...selectedFeatures].sort();
      const args=[...old.args.slice(0,2),...features.flatMap(artifacts)];
      return {...structuredClone(old),args,target:features.join(','),
        prerequisiteTaskKeys:structuredClone(sessionPrerequisitesByPack.get(old.packId)??[]),
        display:[old.executable,...args].join(' ')};
    }
    const additions=sessionAdditions.get(old.key);
    if(!additions)return structuredClone(old);
    const oldFeatures=old.target.split(',');
    const features=[...oldFeatures,...additions.filter(feature=>!oldFeatures.includes(feature))].sort();
    const args=[...old.args.slice(0,2),...features.flatMap(artifacts)];
    return {...structuredClone(old),args,target:features.join(','),
      display:[old.executable,...args].join(' ')};
  });
}

export function governedHistoricalReviewTasks(historicalTasks,selectedFeaturesByPack=new Map(),
  sessionPrerequisitesByPack=new Map()) {
  return projectGovernedHistoricalTasks(historicalTasks,selectedFeaturesByPack,
    sessionPrerequisitesByPack);
}

export function assertHistoricalIdentity(actual,old,basePacks) {
  if(!sessionAdditions.has(old.key))return assert.deepEqual(actual,old,old.key);
  const additions=sessionAdditions.get(old.key);
  const features=[...old.target.split(','),...additions].sort();
  assert.equal(new Set(features).size,features.length,'Approved features are new and unique');
  const expectedArgs=[...old.args.slice(0,2),...features.flatMap(artifacts)];
  recordIconTaskRepair('session',actual.args,expectedArgs,[...old.args.slice(0,2),
    ...[...old.target.split(','),...approvedFeatures].sort().flatMap(artifacts)]);
  assert.deepEqual(actual.args,expectedArgs);
  assert.equal(actual.target,features.join(','));
  assert.equal(actual.display,[actual.executable,...actual.args].join(' '));
  const projected=projectAcceptanceSessionToBaseline(actual,basePacks);
  assert.deepEqual({...projected,display:old.display},old,'Historical executable identity is retained');
}

export function assertHistoricalPopulation(actual,old,basePacks) {
  const approved=planVerification(committedRegistry(acceptedCommit),
    {changedPaths:['manifest.json'],includeProperties:true}).tasks;
  const oldKeys=new Set(keys(old));
  const additions=approved.filter(task=>!oldKeys.has(task.key)&&!iconKeys.includes(task.key));
  assert.deepEqual(keys(additions),approvedKeys,'Only independently accepted additions are allowed');
  const icons=planVerification(committedRegistry(iconRegistryCommit),
    {changedPaths:['src/utility-host/workspace.ts'],includeProperties:true}).tasks
    .filter(task=>iconKeys.includes(task.key));
  assert.deepEqual(keys(icons),iconKeys,'Only the exact approved icon tasks are added');
  assert.deepEqual(keys(actual),[...keys(old),...approvedKeys,...iconKeys,...liveKeys,...processKeys,
    shellRepairKey].sort());
  const byKey=new Map(actual.map(task=>[task.key,task]));
  for(const task of old)assertHistoricalIdentity(byKey.get(task.key),task,basePacks);
  for(const task of [...additions,...icons,...liveTasks,...processTasks])
    assert.deepEqual(byKey.get(task.key),task,task.key);
  assert.deepEqual(byKey.get(shellRepairKey),shellRepairIdentity,shellRepairKey);
}

export function recordHistoricalRepair(kind,old,actual,check) {
  const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
    ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
  if(!['other:Tealium historical task conservation',
    'other:Shell repair historical task conservation',
    'other:accepted verification identity registration'].includes(context?.causalCategory))return;
  const previous=()=>kind==='fallback'
    ?assert.deepEqual(keys(actual),[...keys(old),host].sort()):assert.deepEqual(actual,old);
  assert.throws(previous,assert.AssertionError,'The original assertion rejects the approved additions');
  check();
  const pre={historicalProjectionAccepted:false},post={historicalProjectionAccepted:true};
  const repairName=context.causalCategory.includes('Shell')?'shell-repair':
    context.causalCategory.includes('accepted verification')?'live-add-all-schema':'tealium';
  const fixture={id:`historical-${kind}-${repairName}-v1`,causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{failedCommit:'6013b1602360f8cd03bcef81ab5e32ed57048a77',
      historicalCommit:kind==='fallback'?'3d91abb4f7':'a3034336ad5973d1b57b818a0465eb7c434b78b8',
      acceptedCommit,oldDigest:digest(old),actualDigest:digest(actual)},
    expectedPreRepairFailure:pre,expectedRepairResult:post};
  const fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:pre},
    repairResult:{status:'passed',fixtureDigest,observed:post}}}));
}
