import {timeoutIncidentDigest} from '../../verification-reliability-values.mjs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {loadVerificationPacks} from '../../verification-packs.mjs';
import {verificationProcessHandlerInventory as expected} from './handler-inventory.mjs';
import {execFileSync} from 'node:child_process';
execFileSync('bb',['-e',`
(require '[acceptance.pack-runtime :as packs] '[acceptance.runtime :as runtime]
 '[acceptance.steps.verification-architecture-module-declarations :as subject]
 '[acceptance.steps.support :as support] '[aps.gherkin :as gherkin])
(let [feature (gherkin/parse-file subject/feature)
 handlers (packs/handlers-for-feature subject/feature)
 world {:acceptance/feature-name (:name feature)}]
 (doseq [execution (runtime/expand-executions feature)]
  (reduce (fn [state step]
   (let [selected (first (filter #(and (re-matches (:pattern %) (:text step))
    (or (nil? (:applies? %)) ((:applies? %) state))) handlers))]
    (assert (some #{selected} subject/handlers) (:text step))
    (runtime/execute-step! state (:example execution) step handlers)))
   world (:steps execution)))
 (reset! subject/evidence nil)
 (with-redefs [support/verified-command-result (fn [& _] {:exit 1 :out ""})]
  (assert (try (runtime/run-feature! feature handlers) false (catch Exception _ true))))
 (doseq [relation subject/relations row (:rows relation)]
  (let [valid (zipmap (:keys relation) row)]
   (support/validate-example-relations! [relation] valid "valid")
   (assert (try (support/validate-example-relations! [relation]
    (assoc valid (last (:keys relation)) "invalid-value") "invalid") false
    (catch Exception _ true))))))
`],{encoding:'utf8',timeout:10000,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe']});
console.log('architecture declaration handler dispatch and failure propagation passed');
const actual=(await loadVerificationPacks()).find(pack=>pack.id==='verification_process').handlers;
const original=execFileSync('git',['show','46ee8bd6540e4b3f2b2fe7d9fd8fbd7efa64dd61:test/verification-pack-cardinality-contract-test.mjs'],
 {encoding:'utf8',timeout:5000,maxBuffer:1024*1024});
const ast=ts.createSourceFile('original.mjs',original,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const assertion=ast.statements.find(statement=>ts.isExpressionStatement(statement)&&
 ts.isCallExpression(statement.expression)&&statement.expression.expression.getText(ast)==='assert.deepEqual'&&
 statement.expression.arguments[0]?.getText(ast)==='verificationProcessPack.handlers');
assert.ok(assertion,'the original exact inventory assertion remains identifiable');
const oldExpected=JSON.parse(JSON.stringify(vm.runInNewContext(assertion.expression.arguments[1].getText(ast),{},{timeout:1000})));
assert.throws(()=>assert.deepEqual(actual,oldExpected));
assert.deepEqual(actual,expected);
assert.deepEqual(expected.slice(1),oldExpected,'every previous handler remains in order');
assert.throws(()=>assert.deepEqual([...actual,'unexpected-handler'],expected));
console.log('exact handler inventory reproduces the old failure and accepts only the complete current list');
const outcome=(left,right)=>{try{assert.deepEqual(left,right);return 'accepted';}catch{return 'rejected';}};
const observed={prior:outcome(actual,oldExpected),current:outcome(actual,expected),
 extra:outcome([...actual,'unexpected-handler'],expected),conserved:outcome(expected.slice(1),oldExpected)};
assert.deepEqual(observed,{prior:'rejected',current:'accepted',extra:'rejected',conserved:'accepted'});
const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
 ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
if(context?.causalCategory==='other:architecture acceptance registration') {
 const fixture={id:'architecture-handler-inventory-v1',causalCategory:context.causalCategory,
  diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
  expectedPreRepairFailure:{result:'rejected'},
  expectedRepairResult:{result:'accepted',extra:'rejected',conserved:'accepted'}};
 const fixtureDigest=timeoutIncidentDigest(fixture);
 console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
  incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
  preRepairResult:{status:'failed',fixtureDigest,observed:{result:observed.prior}},
  repairResult:{status:'passed',fixtureDigest,observed:{result:observed.current,
   extra:observed.extra,conserved:observed.conserved}}}}));
}
