(ns acceptance.verification-support.modular-architecture-vtd014-handlers
  (:require [acceptance.steps.support :as support]
            [acceptance.verification-support.modular-architecture-process-evidence :as process-evidence]))

(defonce ^:private evidence (atom nil))

(defn- production-evidence! []
  (process-evidence/load! evidence
    {:command ["node" "test/verification-process-contract-test.mjs"]
     :prepared-task "unit:test/verification-process-contract-test.mjs"
     :fallback ["node" "test/verification-process-contract-test.mjs"]
     :prefix "{\"vtd014Acceptance\"" :key :vtd014Acceptance
     :failure "VTD-014 production process contract failed."
     :missing "VTD-014 production evidence is missing."}))

(defn- prepared [world]
  (assoc world :vtd014/evidence (production-evidence!)))

(defn- assert! [world predicate message]
  (support/assert! predicate message {:evidence (:vtd014/evidence world)})
  world)

(defn- values [example-values example captures]
  (let [resolved (example-values example captures)]
    (if (seq resolved) resolved captures)))

(defn- evidence-value [mapping key]
  (or (get mapping key) (get mapping (keyword key))))

(defn- non-timeout-fixtures [world]
  (vals (or (get-in world [:vtd014/evidence :nonTimeoutFixtures])
            (get-in world [:vtd014/evidence :non-timeout-fixtures]))))

(def ^:private retry-scopes
  {"an assertion inside logical target TARGET-A" "TARGET-A only"
   "an executable scenario or generated case" "that case only"
   "shared artifact setup before any target" "the setup boundary only and no target workflow"
   "an indivisible non-browser task" "that exact task"
   "absent, invalid, or ambiguous progress" "no retry until the progress contract is repaired"})

(def ^:private retry-outcomes
  {"passes" "confirmed-flaky"
   "repeats the same normalized failure" "reproduced-failure"
   "fails with another fingerprint" "changed-failure"
   "cannot conserve the isolated identity" "diagnostic-contract-failure"})

(def ^:private retry-outcome-keys
  {"passes" "passed"
   "repeats the same normalized failure" "sameFailure"
   "fails with another fingerprint" "failed"
   "cannot conserve the isolated identity" "identityChanged"})

(def ^:private repair-outcomes
  {"descendant code, a causal regression, and fresh focused verification"
   "eligible for one fresh all-pack checkpoint"
   "only a larger timeout, added sleep, repeated polling count, or weakened assertion"
   "rejected as symptom suppression"
   "only a budget, calibration, worker count, or environment label"
   "rejected as a limit-only change"
   "a verbal explanation without a deterministic causal regression"
   "rejected as unproven"
   "reused focused results, pre-repair results, no changed candidate, or an unrelated change"
   "rejected as stale or non-causal"})

(defn handlers [{:keys [example-values]}]
  [{:pattern #"^the canonical verification runner manifests (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/first-failure
                      (first (values example-values example captures))))}
   {:pattern #"^it records the failure before any unchanged retry$"
    :handler (fn [world _ _]
               (assert! world (= "unresolved" (get-in world [:vtd014/evidence :incident :state]))
                        "The manifested failure did not create an unresolved incident."))}
   {:pattern #"^one repository-common reliability incident identifies (.+)$"
    :handler (fn [world example captures]
               (let [boundary (first (values example-values example captures))
                     record (first (filter #(= (:vtd014/first-failure world) (:failure %))
                                           (get-in world [:vtd014/evidence :failures :boundaries])))
                     observed (:observed record)
                     exact? (case boundary
                              "the logical target and cleanup phase"
                              (and (= "target" (get-in observed [:retryScope :kind]))
                                   (= "cleanup" (:phase observed)))
                              "the logical browser target and assertion site"
                              (and (= "target" (get-in observed [:retryScope :kind]))
                                   (:assertionSite observed))
                              "the executable target or case and unsettled state"
                              (and (= "case" (get-in observed [:retryScope :kind]))
                                   (false? (get-in observed [:boundedState :settled])))
                              "the canonical task and diagnostic fingerprint"
                              (and (= "task" (get-in observed [:retryScope :kind]))
                                   (= 64 (count (:fingerprint observed))))
                              false)]
                 (assert! world (and (= boundary (:boundary record)) exact?)
                          "The reliability incident did not retain its smallest boundary.")))}
   {:pattern #"^(?:it retains the candidate lineage, canonical task, owning pack, failure class, normalized fingerprint, phase, bounded final state, receipt, artifact, and toolchain|the incident is visible from coder, refactorer, architect, and specifier worktrees|the failed result cannot later become passed merely by combining its output with a resumed receipt)$"
    :handler (fn [world _ _]
               (let [incident (get-in world [:vtd014/evidence :incident])]
                 (assert! world (and (:repositoryCommon incident) (:immutableFields incident)
                                     (:ordinaryResumeBlocked incident))
                          "Reliability incident identity, visibility, or resume blocking failed.")))}

   {:pattern #"^a reliability incident's last trusted boundary is (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/failure-boundary
                      (first (values example-values example captures))))}
   {:pattern #"^the agent uses its one unchanged diagnostic retry$"
    :handler (fn [world _ _]
               (assert! world (some? (evidence-value
                                      (get-in world [:vtd014/evidence :retry :scopes])
                                      (:vtd014/failure-boundary world)))
                        "The failure boundary has no deterministic diagnostic scope."))}
   {:pattern #"^it executes (.+)$"
    :handler (fn [world example captures]
               (let [boundary (:vtd014/failure-boundary world)
                     expected (first (values example-values example captures))
                     scope (evidence-value (get-in world [:vtd014/evidence :retry :scopes]) boundary)
                     exact? (case boundary
                              "an assertion inside logical target TARGET-A"
                              (= ["target" ["TARGET-A"]] [(:kind scope) (:logicalTargetIds scope)])
                              "an executable scenario or generated case" (= "case" (:kind scope))
                              "shared artifact setup before any target"
                              (= ["setup" []] [(:kind scope) (:logicalTargetIds scope)])
                              "an indivisible non-browser task" (= "task" (:kind scope))
                              "absent, invalid, or ambiguous progress"
                              (and (= "rejected" (:kind scope)) (true? (:rejected scope)))
                              false)]
                 (assert! world (and (= (retry-scopes boundary) expected) exact?)
                          "The diagnostic retry widened beyond the smallest failed boundary.")))}
   {:pattern #"^(?:no previously passing task or compatible sibling target executes|the candidate tree, artifact, toolchain, execution-load class, task configuration, environment, and applicable limits are unchanged)$"
    :handler (fn [world _ _]
               (assert! world (and (true? (get-in world [:vtd014/evidence :incident :retryClaimedBeforeExecution]))
                                   (true? (get-in world [:vtd014/evidence :retry :innerDeadlineIdentityConserved])))
                        "Diagnostic identity was not conserved and claimed before execution."))}

   {:pattern #"^a reliability incident has not used its diagnostic retry$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^the unchanged isolated retry (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd014/retry-outcome
                      (first (values example-values example captures))))}
   {:pattern #"^the incident classification is (.+)$"
    :handler (fn [world example captures]
               (let [outcome (:vtd014/retry-outcome world)
                     expected (first (values example-values example captures))
                     observed (evidence-value
                               (get-in world [:vtd014/evidence :retry :classifications])
                               (retry-outcome-keys outcome))]
                 (assert! world (and (= (retry-outcomes outcome) expected)
                                     (= expected observed))
                          "Diagnostic retry classification changed.")))}
   {:pattern #"^(?:it remains unresolved and blocks evidence and Git handoff|another unchanged retry or a normal resume containing the failed task is rejected)$"
    :handler (fn [world _ _]
               (assert! world (and (true? (get-in world [:vtd014/evidence :retry :secondRetryRejected]))
                                   (true? (get-in world [:vtd014/evidence :incident :ordinaryResumeBlocked])))
                        "A classified timeout was allowed to become green."))}

   {:pattern #"^the historical Capture receipt 1686032b-39aa-4140-a4db-f4f265e28eb5 passed 274 tasks before its five-target browser batch reached 600014 milliseconds$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^(?:its final output shows the dist-artifact lock owner but no logical target start|VTD-014 classifies the sanitized historical fixture|its active boundary is dist-artifact setup before any Capture target|its permitted diagnostic retry is the lock setup boundary only|the 274 passing tasks and all five Capture target workflows are excluded|the fixture does not create a retroactive live incident in repository-common state)$"
    :handler (fn [world _ _]
               (let [historical (get-in world [:vtd014/evidence :historical])]
                 (assert! world (and (= "artifact/setup" (:boundary historical))
                                     (= 274 (:excludedPassedTaskCount historical))
                                     (= 5 (count (:excludedLogicalTargetIds historical)))
                                     (false? (:retroactiveIncident historical)))
                          "Historical Capture timeout classification is not exact.")))}

   {:pattern #"^one fixture forces an offscreen control hit-test failure and another forces a Property Set settling failure$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^each exact failed boundary passes on its one unchanged isolated retry$"
    :handler (fn [world _ _]
               (let [fixtures (non-timeout-fixtures world)]
                 (assert! world (= #{"target" "case"}
                                    (set (map #(get-in % [:retryScope :kind]) fixtures)))
                          "Non-timeout retries widened beyond their failed boundaries.")))}
   {:pattern #"^both incidents are classified confirmed-flaky without requiring a pre-registered failure message$"
    :handler (fn [world _ _]
               (assert! world (every? #(= "confirmed-flaky" (:classification %))
                                      (non-timeout-fixtures world))
                        "Non-timeout passing retries were allowed to become green."))}
   {:pattern #"^each retains its target or case, phase, assertion site, normalized fingerprint, and bounded observed geometry or unsettled state$"
    :handler (fn [world _ _]
               (assert! world (every? #(and (:phase %) (:assertionSite %)
                                            (= 64 (count (:fingerprint %))) (map? (:boundedState %)))
                                      (non-timeout-fixtures world))
                        "Non-timeout failure identity was not conserved."))}
   {:pattern #"^neither passing retry supplies handoff evidence$"
    :handler (fn [world _ _]
               (assert! world (every? #(= "unresolved" (:state %))
                                      (non-timeout-fixtures world))
                        "A passing diagnostic retry supplied handoff evidence."))}
   {:pattern #"^both require a causal repair and deterministic regression$"
    :handler (fn [world _ _]
               (assert! world (and (true? (get-in world [:vtd014/evidence :repair :unprovenRejected]))
                                   (every? #(= "unresolved" (:state %))
                                           (non-timeout-fixtures world)))
                        "A non-timeout flake bypassed causal repair."))}

   {:pattern #"^a reliability incident has a proposed repair with (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/repair-evidence
                      (first (values example-values example captures))))}
   {:pattern #"^the resolution gate validates the proposal$"
    :handler (fn [world _ _]
               (assert! world (contains? repair-outcomes (:vtd014/repair-evidence world))
                        "Unknown reliability repair proposal class."))}
   {:pattern #"^the proposal is (.+)$"
    :handler (fn [world example captures]
               (let [repair-evidence (:vtd014/repair-evidence world)
                     outcome (first (values example-values example captures))
                     repair (get-in world [:vtd014/evidence :repair])
                     observed? (case repair-evidence
                                 "descendant code, a causal regression, and fresh focused verification"
                                 (and (:eligible repair) (:descendant repair) (:freshFocused repair))
                                 "only a larger timeout, added sleep, repeated polling count, or weakened assertion"
                                 (:symptomSuppressionRejected repair)
                                 "only a budget, calibration, worker count, or environment label"
                                 (:limitOnlyRejected repair)
                                 "a verbal explanation without a deterministic causal regression"
                                 (:unprovenRejected repair)
                                 "reused focused results, pre-repair results, no changed candidate, or an unrelated change"
                                 (and (:staleRejected repair) (:unrelatedRejected repair))
                                 false)]
                 (assert! world (and (= (repair-outcomes repair-evidence) outcome) observed?)
                          "Reliability causal repair gate accepted the wrong proposal class.")))}

   {:pattern #"^reliability incidents and their state transitions are written concurrently$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^repository-common incident state is loaded for evidence or handoff$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :store :concurrentIndependentIds]))
                        "Repository-common reliability state was not loaded."))}
   {:pattern #"^every stable incident id and immutable failure digest is retained exactly once$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :store :concurrentIndependentIds]))
                        "Concurrent incidents lost a stable identity."))}
   {:pattern #"^atomic state transitions cannot overwrite another writer$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :store :concurrentIndependentIds]))
                        "Concurrent incident transitions overwrote another writer."))}
   {:pattern #"^a redirected, symlinked, traversing, malformed, truncated, duplicate, out-of-order, or digest-mismatched record fails closed$"
    :handler (fn [world _ _]
               (let [store (get-in world [:vtd014/evidence :store])]
                 (assert! world (and (:tamperRejected store) (:symlinkRejected store)
                                     (:malformedRejected store)
                                     (every? true? (vals (:transitionHistory store))))
                          "Malformed reliability state did not fail closed.")))}
   {:pattern #"^an unrelated candidate lineage is not blocked$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :store :lineage :unrelatedExcluded]))
                        "An unrelated lineage was blocked."))}
   {:pattern #"^abandoning or rebasing the affected lineage cannot discard its unresolved incident without a separate specifier-approved user decision$"
    :handler (fn [world _ _]
               (assert! world (and (true? (get-in world [:vtd014/evidence :store :lineage :rebasePreserved]))
                                   (true? (get-in world [:vtd014/evidence :store :lineage :abandonmentDecisionRequired])))
                        "An affected lineage discarded its unresolved incident."))}

   {:pattern #"^a causal reliability repair and its fresh focused regression have passed$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^one fresh canonical all-20 checkpoint and node scripts/package.mjs pass without reused tasks or another failure$"
    :handler (fn [world _ _]
               (let [resolution (get-in world [:vtd014/evidence :resolution])]
                 (assert! world (and (= 20 (:allPackCount resolution))
                                     (zero? (:reusedTaskCount resolution))
                                     (:packagePassed resolution))
                          "Reliability resolution did not use a fresh all-20 checkpoint and package.")))}
   {:pattern #"^the incident resolution binds .+$"
    :handler (fn [world _ _]
               (let [resolution (get-in world [:vtd014/evidence :resolution :evidence])]
                 (assert! world (and (= 64 (count (:failureDigest resolution)))
                                     (= 64 (count (:resolutionDigest resolution)))
                                     (:repairCommit resolution) (:repairTree resolution)
                                     (:causalCategory resolution) (:regression resolution)
                                     (:focusedReceipt resolution) (:checkpointReceiptSha256 resolution))
                          "Reliability resolution evidence is not completely bound.")))}
   {:pattern #"^Git-note verification recomputes every resolution link$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :resolution :archiveVerified]))
                        "Resolution archive links were not recomputed."))}
   {:pattern #"^the current candidate lineage has no unresolved incident or retry result awaiting repair$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :resolution :resolvedIncidentExcludedFromBlocking]))
                        "The resolved incident still blocks its candidate lineage."))}
   {:pattern #"^git_handoff is permitted while repair note handoffs remained available throughout the blocked state$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :resolution :handoffGate]))
                        "The resolved incident did not release the handoff gate."))}
   {:pattern #"^a later failure in a downstream role creates a new incident rather than reopening or hiding the resolved one$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :resolution :downstreamIncidentDistinct]))
                        "A later failure reused the resolved incident identity."))}

   {:pattern #"^VTD-014 changes shared reliability, evidence, and handoff infrastructure for all 20 runnable packs$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^a verification run completes without a failure$"
    :handler (fn [world _ _]
               (assert! world (false? (get-in world [:vtd014/evidence :conservation :diagnosticRetryOnPassingRun]))
                        "A passing run executed a reliability retry."))}
   {:pattern #"^(?:its exact task identities, logical targets, observations, assertion leaves, batching, budgets, calibrations, worker limits, shards, and package check are unchanged|no diagnostic retry executes|previously passing work may be reused for diagnosis but no failed result can bypass incident classification|no final post-repair checkpoint reuses a pre-repair result|no src product file, product behavior, saved value, accessibility result, feature owner, handler owner, pack dependency, target budget, calibration, worker limit, or shard changes|production impact boundaries are unchanged|the one-time delivery checkpoint runs all 20 runnable packs in canonical order followed by node scripts/package.mjs)$"
    :handler (fn [world _ _]
               (let [conservation (get-in world [:vtd014/evidence :conservation])
                     digests-match? (and (= (:currentTaskDigest conservation)
                                            (:masterTaskDigest conservation))
                                         (= (:currentPackContractDigest conservation)
                                            (:masterPackContractDigest conservation))
                                         (= (:currentCalibrationDigest conservation)
                                            (:masterCalibrationDigest conservation)))]
                 (assert! world (and (false? (:diagnosticRetryOnPassingRun conservation))
                                     (empty? (:productChangedFiles conservation))
                                     (empty? (:featureChangedFiles conservation))
                                     digests-match?
                                     (= 20 (:allPackCount conservation))
                                     (= "scripts/package.mjs" (:packageTask conservation)))
                        "VTD-014 conservation evidence is incomplete.")))}])
