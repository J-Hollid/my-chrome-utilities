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
               (let [boundary (first (values example-values example captures))]
                 (assert! world (some #{[(:vtd014/first-failure world) boundary]}
                                      (get-in world [:vtd014/evidence :failures :boundaries]))
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
               (assert! world (contains? retry-scopes (:vtd014/failure-boundary world))
                        "The failure boundary has no deterministic diagnostic scope."))}
   {:pattern #"^it executes (.+)$"
    :handler (fn [world example captures]
               (assert! world (= (retry-scopes (:vtd014/failure-boundary world))
                                 (first (values example-values example captures)))
                        "The diagnostic retry widened beyond the smallest failed boundary."))}
   {:pattern #"^(?:no previously passing task or compatible sibling target executes|the candidate tree, artifact, toolchain, execution-load class, task configuration, environment, and applicable limits are unchanged)$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :incident :retryClaimedBeforeExecution]))
                        "Diagnostic identity was not conserved and claimed before execution."))}

   {:pattern #"^a reliability incident has not used its diagnostic retry$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^the unchanged isolated retry (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd014/retry-outcome
                      (first (values example-values example captures))))}
   {:pattern #"^the incident classification is (.+)$"
    :handler (fn [world example captures]
               (assert! world (= (retry-outcomes (:vtd014/retry-outcome world))
                                 (first (values example-values example captures)))
                        "Diagnostic retry classification changed."))}
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
   {:pattern #"^(?:each exact failed boundary passes on its one unchanged isolated retry|both incidents are classified confirmed-flaky without requiring a pre-registered failure message|each retains its target or case, phase, assertion site, normalized fingerprint, and bounded observed geometry or unsettled state|neither passing retry supplies handoff evidence|both require a causal repair and deterministic regression)$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (get-in world [:vtd014/evidence :non-timeout-fixtures])))
                        "Non-timeout reliability fixtures did not retain their blocking contract."))}

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
   {:pattern #"^(?:repository-common incident state is loaded for evidence or handoff|every stable incident id and immutable failure digest is retained exactly once|atomic state transitions cannot overwrite another writer|a redirected, symlinked, traversing, malformed, truncated, duplicate, out-of-order, or digest-mismatched record fails closed|an unrelated candidate lineage is not blocked|abandoning or rebasing the affected lineage cannot discard its unresolved incident without a separate specifier-approved user decision)$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (get-in world [:vtd014/evidence :store])))
                        "Repository-common reliability state did not fail closed."))}

   {:pattern #"^a causal reliability repair and its fresh focused regression have passed$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^one fresh canonical all-20 checkpoint and node scripts/package.mjs pass without reused tasks or another failure$"
    :handler (fn [world _ _]
               (let [resolution (get-in world [:vtd014/evidence :resolution])]
                 (assert! world (and (= 20 (:allPackCount resolution))
                                     (zero? (:reusedTaskCount resolution))
                                     (:packagePassed resolution))
                          "Reliability resolution did not use a fresh all-20 checkpoint and package.")))}
   {:pattern #"^(?:the incident resolution binds .+|Git-note verification recomputes every resolution link|the current candidate lineage has no unresolved incident or retry result awaiting repair|git_handoff is permitted while repair note handoffs remained available throughout the blocked state|a later failure in a downstream role creates a new incident rather than reopening or hiding the resolved one)$"
    :handler (fn [world _ _]
               (let [resolution (get-in world [:vtd014/evidence :resolution :evidence])]
                 (assert! world (and (= 64 (count (:failureDigest resolution)))
                                     (= 64 (count (:resolutionDigest resolution))))
                          "Reliability resolution evidence is not digest-bound.")))}

   {:pattern #"^VTD-014 changes shared reliability, evidence, and handoff infrastructure for all 20 runnable packs$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^a verification run completes without a failure$"
    :handler (fn [world _ _]
               (assert! world (false? (get-in world [:vtd014/evidence :conservation :diagnosticRetryOnPassingRun]))
                        "A passing run executed a reliability retry."))}
   {:pattern #"^(?:its exact task identities, logical targets, observations, assertion leaves, batching, budgets, calibrations, worker limits, shards, and package check are unchanged|no diagnostic retry executes|previously passing work may be reused for diagnosis but no failed result can bypass incident classification|no final post-repair checkpoint reuses a pre-repair result|no src product file, product behavior, saved value, accessibility result, feature owner, handler owner, pack dependency, target budget, calibration, worker limit, or shard changes|production impact boundaries are unchanged|the one-time delivery checkpoint runs all 20 runnable packs in canonical order followed by node scripts/package.mjs)$"
    :handler (fn [world _ _]
               (let [conservation (get-in world [:vtd014/evidence :conservation])]
                 (assert! world (and (false? (:diagnosticRetryOnPassingRun conservation))
                                     (every? true? (vals (dissoc conservation
                                                                 :diagnosticRetryOnPassingRun))))
                        "VTD-014 conservation evidence is incomplete.")))}])
