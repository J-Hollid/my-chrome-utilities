import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import path from "node:path";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";
const handlerPath="acceptance/src/acceptance/verification_support/modular_architecture_schemas_handlers.clj";
const temporary=await mkdtemp(path.resolve("tmp/schema-boundary-count-"));
let observed;
try {
  const oldPath=path.join(temporary,"prior.clj");
  await writeFile(oldPath,execFileSync("git",["show",`a6d424f6:${handlerPath}`],
    {timeout:10000,maxBuffer:1024*1024}));
  const program=`
(require '[cheshire.core :as json]
         '[acceptance.verification-support.modular-architecture-schemas-handlers :as handlers])
(let [registry (json/parse-string (slurp "verification/packs.json") true)
      pack (first (filter #(= "schemas" (:id %)) registry))
      paths (vec (mapcat :prefixes (:impactBoundaries pack)))
      outcome (fn [step source-paths]
                (let [entry (first (filter #(re-matches (:pattern %) step)
                                          (handlers/handlers {})))
                      world {:vtd004/pack {:impactBoundaries [{:prefixes source-paths}]}}]
                  (assert entry "Count assertion handler must exist")
                  (try ((:handler entry) world nil nil) "accepted"
                       (catch clojure.lang.ExceptionInfo _ "rejected"))))]
  (assert (= 90 (count paths) (count (set paths))))
  (load-file (first *command-line-args*))
  (let [prior (outcome "every one of the 89 Schemas-owned source files matches exactly one boundary" paths)]
    (load-file (second *command-line-args*))
    (let [step "every one of the 90 Schemas-owned source files matches exactly one boundary"]
      (println (json/generate-string
        {:prior prior :current (outcome step paths)
         :missing (outcome step (pop paths))
         :duplicate (outcome step (conj (pop paths) (first paths)))
         :extra (outcome step (conj paths "unexpected-source.ts"))})))))`;
  observed=JSON.parse(execFileSync("bb",["-e",program,oldPath,handlerPath],
    {encoding:"utf8",timeout:12000,maxBuffer:1024*1024}));
} finally {await rm(temporary,{recursive:true,force:true});}
assert.deepEqual(observed,{prior:"rejected",current:"accepted",missing:"rejected",
  duplicate:"rejected",extra:"rejected"});
const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
if(context?.causalCategory==="other:stale schema boundary count"){
  const fixture={id:"schema-boundary-count-handler-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    expectedPreRepairFailure:{result:"rejected"},
    expectedRepairResult:{result:"accepted",missing:"rejected",duplicate:"rejected",extra:"rejected"}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{result:observed.prior}},
    repairResult:{status:"passed",fixtureDigest,observed:{result:observed.current,
      missing:observed.missing,duplicate:observed.duplicate,extra:observed.extra}}}}));
}
console.log("Schema boundary count handler regression passed");
