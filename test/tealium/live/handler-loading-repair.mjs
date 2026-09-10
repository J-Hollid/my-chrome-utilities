import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verificationDigest} from '../../../scripts/verification-evidence.mjs';

export function checkHandlerLoading() {
  const program = `
    (require '[acceptance.pack-runtime :as packs]
             '[acceptance.steps.tealium-support :as tealium]
             '[acceptance.steps.serena-toolchain-preparation :as serena]
             '[cheshire.core :as json])
    (let [load! #(let [handlers (packs/handlers-for-feature (first serena/feature-files))]
                  (assert (and (seq handlers) (every? map? handlers)))
                  {:handlersLoaded true})
          repaired (load!)
          before (try
                   (intern 'acceptance.steps.tealium-support 'handlers
                           (fn [_ _ _ _ _ _ _] []))
                   (try (load!)
                        (catch IllegalArgumentException error
                          (if (.contains (.getMessage error) "Don't know how to create ISeq")
                            {:handlersLoaded false :cause "function-in-handler-slot"}
                            (throw error))))
                   (finally (ns-unmap 'acceptance.steps.tealium-support 'handlers)))]
      (assert (= repaired (load!)))
      (println (json/generate-string {:before before :repaired repaired})))`;
  const observed = JSON.parse(execFileSync('bb', ['-e', program], {encoding:'utf8'}));
  assert.deepEqual(observed.before, {handlersLoaded:false, cause:'function-in-handler-slot'});
  assert.deepEqual(observed.repaired, {handlersLoaded:true});
  const context = process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
    ? JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) : null;
  if (context?.causalCategory !== 'other:Tealium acceptance helper naming') return;
  const fixture = {id:'tealium-handler-collection-name-v1',
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{namespace:'acceptance.steps.tealium-support', reservedName:'handlers',
      boundary:'acceptance.pack-runtime/handlers-for-feature'},
    expectedPreRepairFailure:{handlersLoaded:false, cause:'function-in-handler-slot'},
    expectedRepairResult:{handlersLoaded:true}};
  const fixtureDigest = verificationDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{status:'failed', fixtureDigest, observed:observed.before},
    repairResult:{status:'passed', fixtureDigest, observed:observed.repaired}}}));
}
