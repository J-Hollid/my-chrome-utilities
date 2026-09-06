import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import {schemaConservationCounts} from "./schema-conservation-counts.mjs";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";
const basePack=JSON.parse(execFileSync("git",["show","09828badc5:verification/packs.json"],
  {timeout:10000,maxBuffer:4*1024*1024})).find(pack=>pack.id==="schemas");
const profile=Object.fromEntries(["unit","property","features","handlers","browserAdapters"].map(key=>
  [key,basePack[key].filter(path=>path!=="test/browser-packs/side-panel-schemas.mjs" &&
    path!=="test/side-panel-direct-compatibility-capture-test.mjs" &&
    !/^test\/data-layer-installed\/(?:consumers\/)?[^/]+-(?:controller|consumer)-test\.mjs$/u.test(path))]));
const projected={tasks:{length:298},unitTasks:{length:53},checkpointTasks:[{}],
  observationTasks:[{logicalTargetIds:Array(46).fill("target")}]};
const counts=schemaConservationCounts(projected,profile);
assert.deepEqual(counts,{exactTaskCount:294,unitCount:50,propertyCount:29,
  featureCount:105,handlerCount:61,adapterCount:2,targetCount:46});
const priorSource=execFileSync("git",["show",
  "a6d424f6:test/verification-contracts/ownership-schemas-contract-test.mjs"],
  {encoding:"utf8",timeout:10000,maxBuffer:1024*1024});
const priorExpression=priorSource.match(/exactTaskCount:(exactSchemasPlan\.tasks\.length[\s\S]*?),\n    unitCount:/u)[1];
assert.equal(vm.runInNewContext(priorExpression,{exactSchemasPlan:projected,
  schemasPack:{unit:{length:82}},schemasEvidenceProfile:profile},{timeout:1000}),265);
const handlerPath="acceptance/src/acceptance/verification_support/modular_architecture_schemas_handlers.clj";
const temporary=await mkdtemp(path.resolve("tmp/schema-boundary-count-"));
let observed;
try {
  const oldPath=path.join(temporary,"prior.clj");
  await writeFile(oldPath,execFileSync("git",["show",`a6d424f6:${handlerPath}`],
    {timeout:10000,maxBuffer:1024*1024}));
  const countsPath=path.join(temporary,"counts.json");
  await writeFile(countsPath,JSON.stringify({...counts,executionTaskCounts:{unit:53,property:29,checkpoints:1,exact:298}}));
  const program=`
(require '[cheshire.core :as json]
         '[acceptance.verification-support.modular-architecture-schemas-handlers :as handlers])
(let [registry (json/parse-string (slurp "verification/packs.json") true)
      pack (first (filter #(= "schemas" (:id %)) registry))
      paths (vec (mapcat :prefixes (:impactBoundaries pack)))
      counts (json/parse-string (slurp (nth *command-line-args* 2)) true)
      profile-step "every Schemas boundary maps to the complete owner evidence profile"
      outcome (fn [step source-paths]
                (let [entry (first (filter #(re-matches (:pattern %) step)
                                          (handlers/handlers {:verify-throughput! identity :performance-calibration (constantly {})})))
                      world {:vtd004/pack {:impactBoundaries [{:prefixes source-paths}]}
                             :modular/registry [pack] :vtd004/schemas-evidence {:conservation counts}}]
                  (assert entry "Count assertion handler must exist")
                  (try ((:handler entry) world nil nil) "accepted"
                       (catch clojure.lang.ExceptionInfo _ "rejected"))))]
  (assert (= 90 (count paths) (count (set paths))))
  (load-file (first *command-line-args*))
  (let [prior (outcome "every one of the 89 Schemas-owned source files matches exactly one boundary" paths)
        prior-profile (outcome profile-step paths)]
    (load-file (second *command-line-args*))
    (let [step "every one of the 90 Schemas-owned source files matches exactly one boundary"]
      (println (json/generate-string
        {:prior prior :priorProfile prior-profile :currentProfile (outcome profile-step paths) :current (outcome step paths)
         :missing (outcome step (pop paths))
         :duplicate (outcome step (conj (pop paths) (first paths)))
         :extra (outcome step (conj paths "unexpected-source.ts"))})))))`;
  observed=JSON.parse(execFileSync("bb",["-e",program,oldPath,handlerPath,countsPath],
    {encoding:"utf8",timeout:12000,maxBuffer:1024*1024}));
} finally {await rm(temporary,{recursive:true,force:true});}
assert.deepEqual(observed,{prior:"rejected",priorProfile:"rejected",currentProfile:"accepted",current:"accepted",missing:"rejected",
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
