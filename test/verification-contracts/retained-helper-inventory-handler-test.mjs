import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import path from "node:path";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";
const handlerPath="acceptance/src/acceptance/verification_support/modular_architecture_vtd009_handlers.clj";
const temporary=await mkdtemp(path.resolve("tmp/retained-helper-inventory-"));
let observed;
try {
  const oldPath=path.join(temporary,"prior.clj");
  await writeFile(oldPath,execFileSync("git",["show",`0fe05173:${handlerPath}`],
    {timeout:10000,maxBuffer:1024*1024}));
  const program=`
(require '[cheshire.core :as json]
         '[acceptance.verification-support.modular-architecture-vtd009-handlers :as handlers])
(let [registry (json/parse-string (slurp "verification/packs.json") true)
      declarations (:verificationHelpers (first (filter #(= "shell" (:id %)) registry)))
      helpers (into {} (map (fn [helper] [(keyword (:path helper)) helper]) declarations))
      retained "all 25 retained support helpers and shared-harness have one declaration"
      support "after both removals the 24 tracked support helpers are all declared"
      outcome (fn [step inventory]
                (let [entry (first (filter #(re-matches (:pattern %) step) (handlers/handlers {})))
                      support-count (count (filter #(clojure.string/starts-with? (:path %) "test/support/")
                                                   (vals inventory)))
                      world {:vtd009/evidence {:helpers inventory :dormant {:retainedHelpers support-count}}}]
                  (assert entry "Inventory handler must exist")
                  (try ((:handler entry) world nil nil) "accepted"
                       (catch clojure.lang.ExceptionInfo _ "rejected"))))]
  (assert (contains? helpers (keyword "scripts/verification-granularity-dispositions.mjs")))
  (assert (contains? helpers (keyword "test/support/schema-library-fake-dom.mjs")))
  (load-file (first *command-line-args*))
  (let [prior-retained (outcome retained helpers) prior-support (outcome support helpers)]
    (load-file (second *command-line-args*))
    (println (json/generate-string
      {:priorRetained prior-retained :priorSupport prior-support
       :retained (outcome retained helpers) :support (outcome support helpers)
       :missing (outcome retained (dissoc helpers (keyword "test/support/headless-chrome.mjs")))
       :missingControl (outcome retained (dissoc helpers (keyword "test/support/browser-observation-control.mjs")))
       :extra (outcome retained (assoc helpers (keyword "test/support/unexpected.mjs") {:path "test/support/unexpected.mjs"}))}))))`;
  observed=JSON.parse(execFileSync("bb",["-e",program,oldPath,handlerPath],
    {encoding:"utf8",timeout:12000,maxBuffer:1024*1024}));
} finally {await rm(temporary,{recursive:true,force:true});}
const expected={retained:"accepted",support:"accepted",missing:"rejected",missingControl:"rejected",extra:"rejected"};
assert.deepEqual(observed,{priorRetained:"rejected",priorSupport:"rejected",...expected});
const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
if(context?.causalCategory==="other:retained helper inventory projection"){
  // Also exercise the original schema failure of this acceptance-session incident.
  await import("./schema-boundary-count-handler-test.mjs");
  const fixture={id:"retained-helper-inventory-handler-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    expectedPreRepairFailure:{retained:"rejected",support:"rejected"},expectedRepairResult:expected};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  const {priorRetained,priorSupport,...repaired}=observed;
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{retained:priorRetained,support:priorSupport}},
    repairResult:{status:"passed",fixtureDigest,observed:repaired}}}));
}
console.log("Retained helper inventory handler regression passed");
