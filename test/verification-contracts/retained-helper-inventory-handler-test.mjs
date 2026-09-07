import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtemp,writeFile,rm,readdir} from "node:fs/promises";
import path from "node:path";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";
const handlerPath="acceptance/src/acceptance/verification_support/modular_architecture_vtd009_handlers.clj";
const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
const copyHelperRepair=context?.causalCategory==="other:copy presentation helper inventory";
const depthRepair=context?.causalCategory==="other:retained support inventory depth";
const supportCount=(await readdir("test/support")).filter(name=>name.endsWith(".mjs")).length;
const temporary=await mkdtemp(path.resolve("tmp/retained-helper-inventory-"));
let observed;
try {
  const oldPath=path.join(temporary,"prior.clj");
  await writeFile(oldPath,execFileSync("git",["show",`${depthRepair?"7ee40ff9":copyHelperRepair?"ec50b04a":"0fe05173"}:${handlerPath}`],
    {timeout:10000,maxBuffer:1024*1024}));
  const feature="features/modular-verification-packs.feature";
  const oldFeature=path.join(temporary,"prior.feature");
  await writeFile(oldFeature,execFileSync("git",["show",`0fe05173:${feature}`],
    {timeout:10000,maxBuffer:1024*1024}));
  const oldIr=path.join(temporary,"prior.json"),currentIr=path.join(temporary,"current.json");
  for(const [source,target] of [[oldFeature,oldIr],[feature,currentIr]])
    execFileSync("bb",["gherkin-parser",source,target],{timeout:12000,maxBuffer:1024*1024});
  const program=`
(require '[cheshire.core :as json]
         '[acceptance.verification-support.modular-architecture-vtd009-handlers :as handlers])
(let [registry (json/parse-string (slurp "verification/packs.json") true)
      declarations (:verificationHelpers (first (filter #(= "shell" (:id %)) registry)))
      helpers (into {} (map (fn [helper] [(keyword (:path helper)) helper]) declarations))
      retained "all 25 retained support helpers and shared-harness have one declaration"
      support "after both removals the 24 tracked support helpers are all declared"
      examples (fn [file] (:examples (first (filter #(= "Modular verification packs 081" (:name %))
                              (:scenarios (json/parse-string (slurp file) true))))))
      old-row (first (filter #(= "test/support/browser-target-session.mjs" (:helper %))
                            (examples (nth *command-line-args* 2))))
      rows (examples (nth *command-line-args* 3))
      outcome (fn [step inventory & [helper count-adjustment]]
                (let [entry (first (filter #(re-matches (:pattern %) step) (handlers/handlers {:example-values (fn [_ captures] captures)})))
                      support-count (+ (parse-long (nth *command-line-args* 4))
                                       (or count-adjustment 0))
                      world {:modular/registry registry :vtd009/helper (keyword (or helper "unused")) :vtd009/evidence {:helpers inventory :dormant {:retainedHelpers support-count}}}]
                  (assert entry "Inventory handler must exist")
                  (try ((:handler entry) world nil (rest (re-matches (:pattern entry) step))) "accepted"
                       (catch clojure.lang.ExceptionInfo _ "rejected"))))]
  (assert (contains? helpers (keyword "scripts/verification-granularity-dispositions.mjs")))
  (assert (contains? helpers (keyword "test/support/schema-library-fake-dom.mjs")))
  (load-file (first *command-line-args*))
  (let [prior-retained (outcome retained helpers) prior-support (outcome support helpers)
        prior-consumers (outcome (str "its exact consumers are " (:consumer_scope old-row)) helpers (:helper old-row))]
    (load-file (second *command-line-args*))
    (println (json/generate-string
      {:priorRetained prior-retained :priorSupport prior-support :priorConsumers prior-consumers
       :allConsumerRows (every? #(= "accepted" (outcome (str "its exact consumers are " (:consumer_scope %))
                                                      helpers (:helper %))) rows)
       :retained (outcome retained helpers) :support (outcome support helpers)
       :missingSupport (outcome support helpers nil -1)
       :extraSupport (outcome support helpers nil 1)
       :missing (outcome retained (dissoc helpers (keyword "test/support/headless-chrome.mjs")))
       :missingControl (outcome retained (dissoc helpers (keyword "test/support/browser-observation-control.mjs")))
       :extra (outcome retained (assoc helpers (keyword "test/support/unexpected.mjs") {:path "test/support/unexpected.mjs"}))}))))`;
  observed=JSON.parse(execFileSync("bb",["-e",program,oldPath,handlerPath,oldIr,currentIr,String(supportCount)],
    {encoding:"utf8",timeout:12000,maxBuffer:1024*1024}));
} finally {await rm(temporary,{recursive:true,force:true});}
const expected={allConsumerRows:true,retained:"accepted",support:"accepted",missingSupport:"rejected",extraSupport:"rejected",missing:"rejected",missingControl:"rejected",extra:"rejected"};
assert.deepEqual(observed,{priorRetained:depthRepair?"accepted":"rejected",priorSupport:"rejected",
  priorConsumers:"rejected",...expected});
if(context?.causalCategory==="other:retained helper inventory projection"||copyHelperRepair||depthRepair){
  // Also exercise the original schema failure of this acceptance-session incident.
  if(!copyHelperRepair&&!depthRepair)await import("./schema-boundary-count-handler-test.mjs");
  const fixture={id:"retained-helper-inventory-handler-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    expectedPreRepairFailure:{retained:depthRepair?"accepted":"rejected",support:"rejected",
      consumers:"rejected"},expectedRepairResult:expected};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  const {priorRetained,priorSupport,priorConsumers,...repaired}=observed;
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{retained:priorRetained,support:priorSupport,consumers:priorConsumers}},
    repairResult:{status:"passed",fixtureDigest,observed:repaired}}}));
}
console.log("Retained helper inventory handler regression passed");
