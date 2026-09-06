import {execFileSync} from "node:child_process";
execFileSync("bb", ["-e", `
(require '[acceptance.pack-runtime :as packs] '[acceptance.runtime :as runtime]
 '[acceptance.steps.project-library-dialogs :as subject]
 '[acceptance.steps.support :as support] '[aps.gherkin :as gherkin])
(let [feature (gherkin/parse-file subject/feature)
 handlers (packs/handlers-for-feature subject/feature)
 world {:acceptance/feature-name (:name feature)}]
 (with-redefs [support/verified-command-result
  (fn [& command] {:exit 0 :out
   (if (= (last command) "test/project-library-dialogs/structure-test.mjs")
    "{\\\"projectLibraryDialogStructure\\\":{\\\"modules\\\":true,\\\"callbacks\\\":true,\\\"presentation\\\":true,\\\"completeArchitecture\\\":true}}"
    "{\\\"projectLibraryDialogs\\\":{\\\"installed\\\":true,\\\"lifecycle\\\":true,\\\"coordinator\\\":true}}")})]
  (doseq [execution (runtime/expand-executions feature)]
   (reduce (fn [state step]
    (let [selected (first (filter #(and (re-matches (:pattern %) (:text step))
     (or (nil? (:applies? %)) ((:applies? %) state))) handlers))]
     (assert (some #{selected} subject/handlers) (:text step))
     (runtime/execute-step! state (:example execution) step handlers)))
    world (:steps execution))))
 (reset! subject/evidence nil)
 (with-redefs [support/verified-command-result (fn [& _] {:exit 1 :out ""})]
  (assert (try (runtime/run-feature! feature handlers) false (catch Exception _ true)))))
`], {encoding:"utf8",timeout:10000,maxBuffer:1024*1024});
console.log("Project Library dialog acceptance dispatch and failure propagation passed");

// Reproduce the recorded old boundary assertion, then check the complete repair.
const {default:assert} = await import("node:assert/strict");
const {default:vm} = await import("node:vm");
const {default:ts} = await import("typescript");
const {loadVerificationPacks} = await import("../../scripts/verification-packs.mjs");
const {timeoutIncidentDigest} = await import("../../scripts/verification-reliability-values.mjs");
const {assertProjectDialogRegistry} = await import("./registry-contract.mjs");
const projectManagementPack = (await loadVerificationPacks()).find(pack=>pack.id==="project_management");
const original = execFileSync("git", ["show","25532a5e:test/verification-contracts/registry-project-management-contract-test.mjs"], {encoding:"utf8",timeout:5000,maxBuffer:1024*1024});
const ast = ts.createSourceFile("prior.mjs",original,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const priorAssertion = ast.statements.find(node=>ts.isExpressionStatement(node)&&ts.isCallExpression(node.expression)&&node.expression.arguments[0]?.getText(ast).startsWith("projectManagementPack.impactBoundaries.map"));
assert.ok(priorAssertion,"the exact failed assertion remains identifiable");
const outcome = run => {try {run();return "accepted";}catch{return "rejected";}};
const observed = {
  prior:outcome(()=>vm.runInNewContext(priorAssertion.getText(ast),{assert,projectManagementPack},{timeout:1000})),
  current:outcome(()=>assertProjectDialogRegistry(projectManagementPack)),
  extra:outcome(()=>assertProjectDialogRegistry({...projectManagementPack,impactBoundaries:[...projectManagementPack.impactBoundaries,{id:"unexpected",sourceClass:"application controller",propagateDependants:true}]})),
  missing:outcome(()=>assertProjectDialogRegistry({...projectManagementPack,impactBoundaries:projectManagementPack.impactBoundaries.slice(1)})),
};
assert.deepEqual(observed,{prior:"rejected",current:"accepted",extra:"rejected",missing:"rejected"});
const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION ? JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) : undefined;
if(context?.causalCategory==="other:project library registration") {
  const fixture={id:"project-library-dialog-registration-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    expectedPreRepairFailure:{result:"rejected"},expectedRepairResult:{result:"accepted",extra:"rejected",missing:"rejected"}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{result:observed.prior}},
    repairResult:{status:"passed",fixtureDigest,observed:{result:observed.current,extra:observed.extra,missing:observed.missing}}}}));
}
if(context?.causalCategory==="other:project library conservation") {
  const {verifyDialogConservationRepair}=await import("./conservation-regression.mjs");
  await verifyDialogConservationRepair(context);
}
