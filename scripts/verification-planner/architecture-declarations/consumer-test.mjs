import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import {loadVerificationPacks,planVerification} from '../../verification-packs.mjs';
import {timeoutIncidentDigest} from '../../verification-reliability-values.mjs';
const before=JSON.parse(execFileSync('git',['show','88672ac0:verification/packs.json'],
 {encoding:'utf8',timeout:5000,maxBuffer:4*1024*1024}));
const current=await loadVerificationPacks();
const source=await readFile('test/verification-contracts/exact-slice-execution-contract-test.mjs','utf8');
const ast=ts.createSourceFile('contract.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const declaration=ast.statements.filter(ts.isVariableStatement).flatMap(statement=>statement.declarationList.declarations)
 .find(item=>item.name.getText(ast)==='expectedSliceClosure');
assert.ok(declaration,'the real consumer assertion must be available');
const program=`const expectedSliceClosure=${declaration.initializer.getText(ast)}; expectedSliceClosure('verification_process','architecture_module_declarations');`;
const outcome=packs=>{try{vm.runInNewContext(program,{packs,assert},{timeout:1000});return 'accepted';}
 catch(error){assert.match(error.message,/one exact consumer slice/);return 'rejected';}};
const observed={prior:outcome(before),current:outcome(current)};
assert.deepEqual(observed,{prior:'rejected',current:'accepted'});
const shell=registry=>registry.find(pack=>pack.id==='shell');
assert.deepEqual(shell(current).globalImpact,shell(before).globalImpact);
const priorShellTasks=planVerification(before,{packIds:['shell'],includeProperties:true}).tasks.map(task=>task.key);
const currentShellTasks=planVerification(current,{packIds:['shell'],includeProperties:true}).tasks.map(task=>task.key);
assert.deepEqual(currentShellTasks.filter(key=>priorShellTasks.includes(key)),priorShellTasks,
 'later feature registrations retain every original Shell task in order');
const fallback=planVerification(current,{changedPaths:['architecture/data-layer-boundaries.json'],includeProperties:true});
for(const task of planVerification(before,{packIds:['shell'],includeProperties:true}).tasks)
 assert.ok(fallback.tasks.some(candidate=>candidate.key===task.key),'unproved declarations keep every Shell task');
const slice=shell(current).verificationSlices.find(slice=>slice.id==='architecture_validation');
assert.ok(slice.tasks.includes('unit:test/modular-utility-architecture-test.mjs'));
const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
 ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
if(context?.causalCategory==='other:architecture declaration consumer registration') {
 const fixture={id:'architecture-consumer-registration-v1',causalCategory:context.causalCategory,
  diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
  expectedPreRepairFailure:{result:'rejected'},expectedRepairResult:{result:'accepted'}};
 const fixtureDigest=timeoutIncidentDigest(fixture);
 console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
  incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
  preRepairResult:{status:'failed',fixtureDigest,observed:{result:observed.prior}},
  repairResult:{status:'passed',fixtureDigest,observed:{result:observed.current}}}}));
}
console.log('architecture consumer registration and complete Shell coverage passed');
