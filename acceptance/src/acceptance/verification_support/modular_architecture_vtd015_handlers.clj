(ns acceptance.verification-support.modular-architecture-vtd015-handlers
  (:require [acceptance.steps.support :as support]
            [acceptance.verification-support.modular-architecture-process-evidence :as process-evidence]))

(defonce ^:private evidence (atom nil))

(defn- production-evidence! []
  (process-evidence/load! evidence
    {:command ["node" "test/settled-final-verification-workflow-test.mjs"]
     :prepared-task "unit:test/settled-final-verification-workflow-test.mjs"
     :fallback ["node" "test/settled-final-verification-workflow-test.mjs"]
     :prefix "{\"vtd015Acceptance\"" :key :vtd015Acceptance
     :failure "VTD-015 workflow process contract failed."
     :missing "VTD-015 workflow evidence is missing."}))

(defn- prepared [world]
  (assoc world :vtd015/evidence (production-evidence!)))

(defn- assert! [world predicate message]
  (support/assert! predicate message {:evidence (:vtd015/evidence world)})
  world)

(defn- values [example-values example captures]
  (let [resolved (example-values example captures)]
    (if (seq resolved) resolved captures)))

(defn- value-at [mapping key]
  (or (get mapping key) (get mapping (keyword key))))

(defn handlers [{:keys [example-values]}]
  [{:pattern #"^one user-approved task has a specification commit and a stable task name$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^(.+) receives a candidate that may still change$"
    :handler (fn [world example captures]
               (let [[role] (values example-values example captures)]
                 (assert! (assoc world :vtd015/review-role role)
                          (contains? (get-in world [:vtd015/evidence :reviewReady :roles]) (keyword role))
                          "The role is not permitted to advance review-ready work.")))}
   {:pattern #"^that role completes (.+)$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the role runs only focused checks that can observe its changes$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :reviewReady :focusedOnly]))
                        "A changing candidate claimed broad final proof."))}
   {:pattern #"^the candidate advances as review-ready to (.+)$"
    :handler (fn [world example captures]
               (let [[next-role] (values example-values example captures)
                     role (keyword (:vtd015/review-role world))]
                 (assert! world (= next-role (get-in world [:vtd015/evidence :reviewReady :roles role]))
                          "Review-ready work advanced to the wrong role.")))}
   {:pattern #"^review-ready evidence records the task, base, candidate, changed paths, focused scope, result, and timestamps$"
    :handler (fn [world _ _]
               (let [fields (set (get-in world [:vtd015/evidence :reviewReady :fields]))]
                 (assert! world (and (true? (get-in world [:vtd015/evidence :reviewReady :bound]))
                                     (every? fields ["task" "baseCommit" "candidateCommit" "candidateTree"
                                                     "changeSet" "focusedScope" "result" "startedAt"
                                                     "completedAt" "recordedAt"]))
                          "Review-ready evidence is not completely bound.")))}
   {:pattern #"^the candidate does not claim final regression evidence$"
    :handler (fn [world _ _]
               (assert! world (false? (get-in world [:vtd015/evidence :reviewReady :finalClaim]))
                        "Review-ready evidence claimed final regression proof."))}
   {:pattern #"^the architect has completed architecture review, applicable quality analysis, focused checks, and every resulting repair on one candidate tree$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the architect seals that tree for final verification$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :finalReady :sealedTreeOnly]))
                        "Final verification did not seal one tree."))}
   {:pattern #"^one fresh canonical run executes all 20 packs with properties and the package check$"
    :handler (fn [world _ _]
               (let [final (get-in world [:vtd015/evidence :finalReady])]
                 (assert! world (and (= 20 (:packCount final)) (:propertyRequired final) (:packageRequired final))
                          "The final gate does not preserve the complete terminal plan.")))}
   {:pattern #"^its durable evidence binds the specification base, task, candidate tree, complete plan, artifact, toolchain, receipt, and timestamps$"
    :handler (fn [world _ _]
               (assert! world (= #{"base" "task" "candidateTree" "completePlan" "artifact" "toolchain"
                                          "receipt" "timestamps"}
                                 (set (get-in world [:vtd015/evidence :finalReady :bindings])))
                        "Final-ready evidence is not completely bound."))}
   {:pattern #"^only that passing sealed tree may receive the completion handoff for integration$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :finalReady :sealedTreeOnly]))
                        "An unsealed candidate could receive a completion handoff."))}
   {:pattern #"^a sealed candidate has passing final verification evidence$"
    :handler (fn [world _ _] world)}
   {:pattern #"^(.+) occurs before integration$"
    :handler (fn [world example captures]
               (assoc world :vtd015/change (first (values example-values example captures))))}
   {:pattern #"^the evidence effect is (.+)$"
    :handler (fn [world example captures]
               (let [[effect] (values example-values example captures)]
                 (assert! world (= effect (:effect (value-at
                                                    (get-in world [:vtd015/evidence :invalidation :rows])
                                                    (:vtd015/change world))))
                          "The final evidence effect is incorrect.")))}
   {:pattern #"^the required next action is (.+)$"
    :handler (fn [world example captures]
               (let [[action] (values example-values example captures)]
                 (assert! world (= action (:action (value-at
                                                    (get-in world [:vtd015/evidence :invalidation :rows])
                                                    (:vtd015/change world))))
                          "The invalidation action is incorrect.")))}
   {:pattern #"^one task in the fresh final run fails$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the exact cause is recorded, repaired, and proved with its smallest causal regression$"
    :handler (fn [world _ _]
               (let [failure (get-in world [:vtd015/evidence :failure])]
                 (assert! world (and (:recorded failure) (:causalFocusedProof failure))
                          "A final failure lacks recorded causal repair proof.")))}
   {:pattern #"^the changed candidate runs all 20 packs with properties and the package check freshly$"
    :handler (fn [world _ _]
               (let [failure (get-in world [:vtd015/evidence :failure])]
                 (assert! world (and (:freshAll20 failure) (:package failure))
                          "A repaired candidate did not receive fresh terminal proof.")))}
   {:pattern #"^the failed result remains recorded$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :failure :recorded]))
                        "The final failure was discarded."))}
   {:pattern #"^no retry, lower-concurrency run, carried passing leaf, or unrelated receipt can turn the failure green$"
    :handler (fn [world _ _]
               (let [failure (get-in world [:vtd015/evidence :failure])]
                 (assert! world (every? true? ((juxt :noRetry :noLowerConcurrency :noCarriedLeaf
                                                    :noUnrelatedReceipt) failure))
                          "The final failure could be relabelled green.")))}
   {:pattern #"^a candidate is review-ready without passing final evidence$"
    :handler (fn [world _ _] world)}
   {:pattern #"^(.+) is requested$"
    :handler (fn [world example captures]
               (assoc world :vtd015/action (first (values example-values example captures))))}
   {:pattern #"^the workflow result is (.+)$"
    :handler (fn [world example captures]
               (let [[result] (values example-values example captures)]
                 (assert! world (= result (value-at (get-in world [:vtd015/evidence :actions])
                                                    (:vtd015/action world)))
                          "Review-ready action authorization is incorrect.")))}
   {:pattern #"^the historical (.+) used (.+) successful full runs before safety completion$"
    :handler (fn [world example captures]
               (let [[lineage runs] (values example-values example captures)]
                 (assert! (assoc world :vtd015/lineage lineage)
                          (= (parse-long runs) (:successfulFullRuns
                                               (value-at (get-in world [:vtd015/evidence :historical])
                                                         lineage)))
                          "Historical full-run count changed.")))}
   {:pattern #"^the same role changes are scheduled through settled candidate final verification$"
    :handler (fn [world _ _] world)}
   {:pattern #"^focused checks run while the candidate is changing$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :reviewReady :focusedOnly]))
                        "Review work did not stay focused."))}
   {:pattern #"^one successful full run occurs after the last review change$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :finalReady :sealedTreeOnly]))
                        "The successful full run occurred before settlement."))}
   {:pattern #"^the modeled avoided successful full runs are (.+)$"
    :handler (fn [world example captures]
               (let [[avoided] (values example-values example captures)]
                 (assert! world (= (parse-long avoided) (:avoidedFullRuns
                                                        (value-at (get-in world [:vtd015/evidence :historical])
                                                                  (:vtd015/lineage world))))
                          "Modeled avoided full runs are incorrect.")))}
   {:pattern #"^approval, role handoffs, verification receipts, repairs, and integration already have durable timestamps$"
    :handler (fn [world _ _] world)}
   {:pattern #"^a VTD-015 delivery or its next applicable slice completes$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the scorecard reports approval-to-integration time and elapsed role intervals$"
    :handler (fn [world _ _]
               (let [scorecard (get-in world [:vtd015/evidence :scorecard])]
                 (assert! world (and (pos? (:approvalToIntegrationMs scorecard))
                                     (seq (:roleIntervals scorecard)))
                          "The scorecard lacks elapsed delivery intervals.")))}
   {:pattern #"^it reports focused verification time, successful and invalidated full runs, failures, repairs, reruns, and final-gate time$"
    :handler (fn [world _ _]
               (let [scorecard (get-in world [:vtd015/evidence :scorecard])]
                 (assert! world (every? #(number? (get scorecard %))
                                       [:focusedVerificationMs :successfulFullRuns :invalidatedFullRuns
                                        :failures :repairs :reruns :finalGateMs])
                          "The scorecard omits a required verification measure.")))}
   {:pattern #"^it confirms every terminal evidence leaf and the package check remain present$"
    :handler (fn [world _ _]
               (assert! world (and (true? (get-in world [:vtd015/evidence :scorecard
                                                        :terminalEvidencePreserved]))
                                   (true? (get-in world [:vtd015/evidence :finalReady :packageRequired])))
                        "Terminal evidence or packaging was not conserved."))}
   {:pattern #"^a VTD slice adds zero to completed-feature count$"
    :handler (fn [world _ _]
               (assert! world (zero? (get-in world [:vtd015/evidence :completedFeatureDelta]))
                        "A VTD slice was counted as a feature."))}
   {:pattern #"^the user receives a continue, adjust, or stop recommendation before another enabling slice is activated$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :recommendationRequired]))
                        "The user recommendation gate is absent."))}
   {:pattern #"^VTD-015 must change the workflow that governs its own delivery$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the VTD-015 candidate moves through coder, refactorer, architect, and specifier$"
    :handler (fn [world _ _] world)}
   {:pattern #"^its handoffs obey the previously integrated verification protocol$"
    :handler (fn [world _ _]
               (assert! world (= "legacy-bootstrap" (get-in world [:vtd015/evidence :bootstrap :mode]))
                        "VTD-015 did not preserve its bootstrap protocol."))}
   {:pattern #"^the new review-ready protocol remains inactive until VTD-015 is integrated$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :bootstrap :inactiveUntilIntegration]))
                        "Review-ready became active during bootstrap."))}
   {:pattern #"^VTD-012 is the first live payback measurement$"
    :handler (fn [world _ _]
               (assert! world (= "VTD-012" (get-in world [:vtd015/evidence :bootstrap :firstPayback]))
                        "The first payback task changed."))}
   {:pattern #"^no bootstrap exception bypasses current durable evidence or integration safety$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :bootstrap :noBypass]))
                        "The bootstrap bypasses current safety evidence."))}])
