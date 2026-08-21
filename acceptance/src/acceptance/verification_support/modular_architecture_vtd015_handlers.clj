(ns acceptance.verification-support.modular-architecture-vtd015-handlers
  (:require [acceptance.steps.support :as support]
            [acceptance.verification-support.modular-architecture-process-evidence :as process-evidence]))

(defonce ^:private evidence (atom nil))
(defonce ^:private ownership-evidence (atom nil))
(defonce ^:private confirmed-flaky-evidence (atom nil))

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

(defn- ownership-prepared [world]
  (assoc world :vtd015/ownership-evidence
         (process-evidence/load! ownership-evidence
           {:command ["node" "test/verification-process-contract-test.mjs"]
            :prepared-task "unit:test/verification-process-contract-test.mjs"
            :fallback ["node" "test/verification-process-contract-test.mjs"]
            :prefix "{\"verificationOwnershipReadinessAcceptance\""
            :key :verificationOwnershipReadinessAcceptance
            :failure "Verification ownership-readiness process contract failed."
            :missing "Verification ownership-readiness evidence is missing."})))

(defn- confirmed-flaky-prepared [world]
  (assoc world :vtd015/confirmed-flaky-evidence
         (process-evidence/load! confirmed-flaky-evidence
           {:command ["node" "test/verification-process-contract-test.mjs"]
            :prepared-task "unit:test/verification-process-contract-test.mjs"
            :fallback ["node" "test/verification-process-contract-test.mjs"]
            :prefix "{\"verificationConfirmedFlakyFeatureDeferralAcceptance\""
            :key :verificationConfirmedFlakyFeatureDeferralAcceptance
            :failure "Confirmed-flaky feature deferral process contract failed."
            :missing "Confirmed-flaky feature deferral evidence is missing."})))

(defn- ownership-assert! [world predicate message]
  (support/assert! predicate message {:evidence (:vtd015/ownership-evidence world)})
  world)

(defn- granularity-assert! [world]
  (let [prepared-world (ownership-prepared world)
        evidence (get-in prepared-world [:vtd015/ownership-evidence :granularity])]
    (ownership-assert! prepared-world
                       (and (map? evidence)
                            (every? true? (mapcat vals (vals (dissoc evidence :firstUse))))
                            (true? (get-in evidence [:firstUse :productBehaviorAbsent])))
                       "Verification granularity evidence is incomplete.")))

(defn- assert! [world predicate message]
  (support/assert! predicate message {:evidence (:vtd015/evidence world)})
  world)

(defn- values [example-values example captures]
  (let [resolved (example-values example captures)]
    (if (seq resolved) resolved captures)))

(defn- value-at [mapping key]
  (or (get mapping key) (get mapping (keyword key))))

(def ownership-readiness-results
  {"a complete current plan smaller than all runnable packs" "bounded-ready"
   "an all-pack plan caused only by shared paths with provable exact QA consumers" "coarse-boundary"
   "an all-pack plan whose executable behavior can affect every runnable pack" "genuinely-global"
   "missing, malformed, ambiguous, or incompatible current or historical ownership" "ownership-unavailable"
   "a bounded seam would change approved behavior, persistence, migration, or security" "requirements-expanded"})

(def boundary-declaration-results
  {"one owner, exact paths, exact consumers, structural class, and observable smoke"
   "feature mode selects the declared owner and consumers and records any named obligation"
   "a duplicate, conflict, missing owner, missing consumer, or unobservable smoke"
   "planning blocks before task launch"
   "an undeclared shared path"
   "existing conservative ownership remains authoritative"})

(def ownership-change-results
  {"an existing path gains a narrower shared boundary"
   "the union of former owners and current owners and consumers"
   "a declared path is renamed or deleted"
   "the union of readable old and new owners and consumers"
   "a new path has a valid current declaration"
   "its current owner and consumers"
   "historical ownership is unavailable or incompatible"
   "no task launch and an ownership-unavailable result"})

(def within-pack-readiness-results
  {"a wider pack or task scope whose selected tasks are causally related"
   ["bounded-ready" "record forecast variance and continue with the canonical plan"]
   "a local semantic change, unrelated complete task families, and a stable observable subordinate boundary"
   ["coarse-within-pack" "expose the material scope mismatch for bounded agent judgment without automatically starting preparation"]
   "a local semantic change and unrelated task families without a proved stable observable subordinate boundary"
   ["bounded-ready" "expose the deferred refinement opportunity and continue with the conservative parent-pack closure"]
   "a large parent pack whose complete task closure is genuinely required by the changed behavior"
   ["bounded-ready" "continue with the complete parent-pack closure"]})

(def within-pack-mapping-results
  {"a valid current path and subordinate slice"
   "the slice tasks, prerequisites, and declared consumers"
   "a new or unclassified path with a known parent-pack owner"
   "the conservative parent-pack closure"
   "a compatible base-to-current slice rename or ownership change"
   "the union of old and new slice tasks, prerequisites, and consumers"
   "a missing, duplicate, conflicting, or unobservable slice declaration"
   "the conservative parent-pack closure with a bounded diagnostic"
   "unavailable or incompatible parent-pack ownership"
   "no task launch and the existing ownership-unavailable result"})

(def ownership-intent-results
  {"a syntactically valid absent prefix with a known proposed owner and consumers"
   "validate the proposal without treating it as a current changed path"
   "an invalid prefix or unknown proposed parent owner"
   "reject the proposal with a bounded diagnostic"
   "an existing path whose current ownership conflicts with the proposal"
   "retain current ownership and report the conflict before product coding"})

(def immediate-preparation-results
  {"a coarse ownership boundary" "standing-authorized ownership preparation"
   "a coarse-within-pack boundary" "standing-authorized verification-slice preparation"})

(defn- capture-granularity-value [world key value]
  (assoc (granularity-assert! world) key value))

(defn- assert-granularity-relation! [world mapping key expected message]
  (ownership-assert! world (= expected (get mapping (get world key))) message))

(defn- review-ready-handlers [{:keys [example-values]}]
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
   {:pattern #"^the architect seals that tree for QA integration$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :qaPilot :qaReady :exactTreeOnly]))
                        "QA integration did not seal one exact tree."))}
   {:pattern #"^only that exact tree may receive a QA-ready handoff with bound focused evidence$"
    :handler (fn [world _ _]
               (let [qa-ready (get-in world [:vtd015/evidence :qaPilot :qaReady])]
                 (assert! world (and (:exactTreeOnly qa-ready) (:boundFocusedEvidence qa-ready))
                          "QA-ready did not bind focused evidence to the exact tree.")))}
   {:pattern #"^the specifier may fast-forward that exact tree into QA$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :qaPilot :qaReady :qaFastForwardOnly]))
                        "QA integration is not restricted to an exact fast-forward."))}
   {:pattern #"^no full regression or master completion is claimed$"
    :handler (fn [world _ _]
               (let [qa-ready (get-in world [:vtd015/evidence :qaPilot :qaReady])]
                 (assert! world (and (false? (:fullRegressionClaim qa-ready))
                                     (false? (:masterCompletionClaim qa-ready)))
                          "QA-ready claimed final regression or master completion.")))}
   ])

(defn- final-gate-handlers [{:keys [example-values]}]
  [{:pattern #"^one fresh canonical run executes all 20 packs with properties and the package check$"
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
   {:pattern #"^(.+) occurs before master promotion$"
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
   ])

(defn- scorecard-handlers [{:keys [example-values]}]
  [{:pattern #"^the historical (.+) used (.+) successful full runs before safety completion$"
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
                        "The bootstrap bypasses current safety evidence."))}
   ])

(defn- qa-release-handlers []
  [{:pattern #"^the user explicitly requests master integration and QA contains one or more QA-ready tasks after master$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :qaPilot :masterIntegration :explicitUserRequest]))
                        "Master integration started without an explicit user request."))}
   {:pattern #"^the specifier freezes the exact QA head as a release candidate based on current master$"
    :handler (fn [world _ _]
               (let [integration (get-in world [:vtd015/evidence :qaPilot :masterIntegration])]
                 (assert! world (and (:qaHeadFrozen integration) (:masterBaseBound integration))
                          "The release candidate is not the frozen QA head based on master.")))}
   {:pattern #"^the architect starts a clean release lineage at that exact candidate$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :qaPilot :masterIntegration :cleanLineage]))
                        "The release candidate inherited stale task ancestry."))}
   {:pattern #"^its durable evidence binds the master base, release task, candidate tree, complete plan, artifact, toolchain, receipt, and timestamps$"
    :handler (fn [world _ _]
               (assert! world (= #{"masterBase" "releaseTask" "candidateTree" "completePlan"
                                          "artifact" "toolchain" "receipt" "timestamps"}
                                 (set (get-in world [:vtd015/evidence :qaPilot :masterIntegration :bindings])))
                        "Release evidence is not completely bound."))}
   {:pattern #"^only that passing sealed tree may advance master$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :qaPilot :masterIntegration :exactPromotionOnly]))
                        "Master could advance to an unverified tree."))}
   {:pattern #"^QA and master finish on the same verified commit$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :qaPilot :masterIntegration :branchesConverge]))
                        "QA and master do not converge after promotion."))}
   {:pattern #"^QA-integrated tasks and a master promotion have durable approval, handoff, receipt, and integration timestamps$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the pilot scorecard is reported$"
    :handler (fn [world _ _] world)}
   {:pattern #"^it reports approval-to-QA, QA queue, and approval-to-master time for every included feature$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (get-in world [:vtd015/evidence :qaPilot :scorecard :deliveryIntervals])))
                        "The pilot scorecard omits a delivery interval."))}
   {:pattern #"^it accounts for every focused check, terminal attempt, failure, repair, revert, rerun, and the terminal cost per included task$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (get-in world [:vtd015/evidence :qaPilot :scorecard :verificationMeasures])))
                        "The pilot scorecard omits a verification measure."))}
   {:pattern #"^it compares actual master-promotion time with the per-task terminal baseline$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :qaPilot :scorecard :baselineComparison]))
                        "The pilot scorecard lacks its terminal baseline comparison."))}
   {:pattern #"^the user decides when another master integration phase begins$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd015/evidence :qaPilot :scorecard :userControlsPromotion]))
                        "Master integration can begin without the user."))}
   ])

(defn- ownership-flow-handlers [{:keys [example-values]}]
  [{:pattern #"^a user-approved QA feature names its development focus, QA impact, and likely shared integration surfaces$"
    :handler (fn [world _ _] (ownership-prepared world))}
   {:pattern #"^ownership readiness is evaluated before product coding$"
    :handler (fn [world _ _]
               (ownership-assert! world (true? (get-in world [:vtd015/ownership-evidence :intent :planOnly]))
                                  "Intent ownership readiness was not plan-only."))}
   {:pattern #"^a read-only intent plan reports current owners, consumers, planned packs, task estimate, and expansion-causing paths$"
    :handler (fn [world _ _]
               (ownership-assert! world (true? (get-in world [:vtd015/ownership-evidence :intent :fieldsReported]))
                                  "Intent ownership readiness omitted required planning fields."))}
   {:pattern #"^no build, test, receipt, incident, evidence claim, Git change, or handoff is produced$"
    :handler (fn [world _ _]
               (ownership-assert! world (true? (get-in world [:vtd015/ownership-evidence :intent :sideEffectsAbsent]))
                                  "Intent ownership readiness produced a side effect."))}
   {:pattern #"^ownership readiness classifies an approved feature as (.+)$"
    :handler (fn [world example captures]
               (assoc (ownership-prepared world) :vtd015/ownership-classification
                      (first (values example-values example captures))))}
   {:pattern #"^the feature workflow selects its next stage$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the workflow routes to (.+)$"
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))]
                 (ownership-assert! world
                                    (= expected (value-at (get-in world [:vtd015/ownership-evidence :routing :rows])
                                                          (:vtd015/ownership-classification world)))
                                    "Ownership readiness selected the wrong workflow stage.")))}
   {:pattern #"^no feature-mode all-runnable-pack run is authorized$"
    :applies? (fn [world]
                (not= "Modular verification packs 192"
                      (:acceptance/scenario-name world)))
    :handler (fn [world _ _]
               (if (:vtd015/ownership-evidence world)
                 (ownership-assert! world
                                    (false? (get-in world [:vtd015/ownership-evidence :routing :featureAll20Authorized]))
                                    "Ownership readiness authorized an all-20 feature run.")
                 (let [prepared-world (confirmed-flaky-prepared world)]
                   (support/assert!
                    (false? (get-in prepared-world
                                    [:vtd015/confirmed-flaky-evidence :routing :featureAll20Authorized]))
                    "Confirmed-flaky admission authorized an all-20 feature run."
                    {:evidence (:vtd015/confirmed-flaky-evidence prepared-world)})
                   prepared-world)))}
   {:pattern #"^an approved feature has a coarse ownership boundary$"
    :handler (fn [world _ _] (ownership-prepared world))}
   {:pattern #"^bounded agent judgment selected immediate (.+) for (.+)$"
    :handler (fn [world example captures]
               (let [[preparation-stage planning-result]
                     (values example-values example captures)]
                 (ownership-assert!
                  (granularity-assert! world)
                  (= preparation-stage (get immediate-preparation-results planning-result))
                  "Immediate preparation does not match its planning result.")))}
   {:pattern #"^its (<preparation_stage>|standing-authorized ownership preparation|standing-authorized verification-slice preparation|standing-authorized preparation stage) completes focused review$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^the preparation is independently committed and integrated into QA from an architect QA-ready handoff$"
    :handler (fn [world _ _]
               (let [preparation (get-in world [:vtd015/ownership-evidence :preparation])]
                 (ownership-assert! world (and (:independentCommit preparation) (:qaReadyIntegration preparation))
                                    "Ownership preparation was not independently integrated through QA-ready review.")))}
   {:pattern #"^the product candidate has not implemented externally visible feature behavior$"
    :handler (fn [world _ _]
               (ownership-assert! world (true? (get-in world [:vtd015/ownership-evidence :preparation :behaviorAbsent]))
                                  "Ownership preparation activated product behavior."))}
   {:pattern #"^the already-approved product task restarts from that exact QA head without another product approval$"
    :handler (fn [world _ _]
               (ownership-assert! world (true? (get-in world [:vtd015/ownership-evidence :preparation :restartFromExactQaHead]))
                                  "The product task did not restart from the prepared QA head."))}
   {:pattern #"^the product evidence range cannot contain the (<preparation_change>|ownership change|verification-slice change) that narrows its own plan$"
    :handler (fn [world _ _]
               (ownership-assert! world (true? (get-in world [:vtd015/ownership-evidence :preparation :evidenceRangeSeparated]))
                                  "Product evidence included its ownership-preparation change."))}
   {:pattern #"^a coder has the first coherent committed candidate for an approved QA feature$"
    :handler (fn [world _ _] (ownership-prepared world))}
   {:pattern #"^exact candidate ownership is checked before a complete planned diagnostic or evidence run$"
    :handler (fn [world _ _] world)}
   {:pattern #"^plan-only preflight uses the canonical Git change set and current and historical ownership$"
    :handler (fn [world _ _]
               (let [exact (get-in world [:vtd015/ownership-evidence :exact])]
                 (ownership-assert! world (and (:planOnly exact) (:canonicalHistoricalUnion exact))
                                    "Exact ownership preflight did not use the canonical historical union.")))}
   {:pattern #"^it executes no task and creates no receipt, incident, package, or evidence eligibility$"
    :handler (fn [world _ _]
               (ownership-assert! world (true? (get-in world [:vtd015/ownership-evidence :exact :noSideEffects]))
                                  "Exact ownership preflight produced a side effect."))}
   {:pattern #"^an authorized settled candidate runs one property-enabled review-evidence plan after its final commit$"
    :handler (fn [world _ _]
               (let [exact (get-in world [:vtd015/ownership-evidence :exact])]
                 (ownership-assert! world (and (:propertyReviewEvidence exact) (:afterFinalCommit exact))
                                    "Settled ownership evidence was not one post-commit property run.")))}
   {:pattern #"^an ordinary or dirty-tree diagnostic receipt cannot be recorded as review-ready evidence$"
    :handler (fn [world _ _]
               (ownership-assert! world (true? (get-in world [:vtd015/ownership-evidence :exact :invalidReceiptRejected]))
                                  "An ineligible receipt could become review-ready."))}
   {:pattern #"^focused QA evidence used a declared shared boundary with a terminal-full obligation$"
    :handler (fn [world _ _]
               (let [prepared-world (ownership-prepared world)]
                 (ownership-assert! prepared-world
                                    (true? (get-in prepared-world [:vtd015/ownership-evidence :obligations :declared]))
                                    "Focused QA evidence omitted its terminal obligation.")))}
   {:pattern #"^later QA features proceed or the user requests master integration$"
    :handler (fn [world _ _] world)}
   {:pattern #"^unrelated QA features neither resolve nor repeat the obligation$"
    :handler (fn [world _ _]
               (ownership-assert! world (true? (get-in world [:vtd015/ownership-evidence :obligations :unrelatedFeaturesPreserve]))
                                  "An unrelated QA feature changed a terminal obligation."))}
   {:pattern #"^master integration applies the existing canonical final-verification procedure to the frozen candidate$"
    :handler (fn [world _ _]
               (ownership-assert! world (true? (get-in world [:vtd015/ownership-evidence :obligations :canonicalMasterProcedure]))
                                  "Master integration bypassed canonical final verification."))}
   {:pattern #"^matching passing terminal evidence changes the obligation state to consumed$"
    :handler (fn [world _ _]
               (ownership-assert! world (true? (get-in world [:vtd015/ownership-evidence :obligations :passingConsumes]))
                                  "Matching terminal evidence did not consume the obligation."))}
   {:pattern #"^unsuccessful terminal evidence or a behavior-bearing candidate change retains the active obligation$"
    :handler (fn [world _ _]
               (ownership-assert! world (true? (get-in world [:vtd015/ownership-evidence :obligations :failureRetains]))
                                  "Failed or stale terminal evidence consumed an obligation."))}
   ])

(defn- granularity-mapping-handlers [{:keys [example-values]}]
  [{:pattern #"^an ownership intent or exact candidate has (.+)$"
    :handler (fn [world example captures]
               (capture-granularity-value world :vtd015/planning-condition
                                          (first (values example-values example captures))))}
   {:pattern #"^the ownership-readiness class is (.+)$"
    :handler (fn [world example captures]
               (assert-granularity-relation!
                world ownership-readiness-results :vtd015/planning-condition
                (first (values example-values example captures))
                "Ownership-readiness classification does not match its planning condition."))}
   {:pattern #"^a shared QA boundary declaration has (.+)$"
    :handler (fn [world example captures]
               (capture-granularity-value world :vtd015/declaration-state
                                          (first (values example-values example captures))))}
   {:pattern #"^the feature-mode planner returns (.+)$"
    :handler (fn [world example captures]
               (assert-granularity-relation!
                world boundary-declaration-results :vtd015/declaration-state
                (first (values example-values example captures))
                "Feature-mode planning does not match its boundary declaration."))}
   {:pattern #"^a canonical change set contains (.+)$"
    :handler (fn [world example captures]
               (capture-granularity-value world :vtd015/ownership-change
                                          (first (values example-values example captures))))}
   {:pattern #"^the conserved pack selection is (.+)$"
    :handler (fn [world example captures]
               (assert-granularity-relation!
                world ownership-change-results :vtd015/ownership-change
                (first (values example-values example captures))
                "Conserved verification scope does not match its ownership change."))}
   {:pattern #"^a feature forecast and its canonical bounded plan have (.+)$"
    :handler (fn [world example captures]
               (capture-granularity-value world :vtd015/plan-relation
                                          (first (values example-values example captures))))}
   {:pattern #"^the readiness result is (.+)$"
    :handler (fn [world example captures]
               (assert-granularity-relation!
                world (update-vals within-pack-readiness-results first) :vtd015/plan-relation
                (first (values example-values example captures))
                "Within-pack readiness does not match its plan relation."))}
   {:pattern #"^the workflow action is (.+)$"
    :handler (fn [world example captures]
               (assert-granularity-relation!
                world (update-vals within-pack-readiness-results second) :vtd015/plan-relation
                (first (values example-values example captures))
                "Within-pack workflow action does not match its plan relation."))}
   {:pattern #"^within-pack planning receives (.+)$"
    :handler (fn [world example captures]
               (capture-granularity-value world :vtd015/mapping-state
                                          (first (values example-values example captures))))}
   {:pattern #"^the task scope is (.+)$"
    :handler (fn [world example captures]
               (assert-granularity-relation!
                world within-pack-mapping-results :vtd015/mapping-state
                (first (values example-values example captures))
                "Within-pack task scope does not match its mapping state."))}
   {:pattern #"^ownership intent includes (.+)$"
    :handler (fn [world example captures]
               (capture-granularity-value world :vtd015/proposed-prefix-state
                                          (first (values example-values example captures))))}
   {:pattern #"^the intent result is (.+)$"
    :handler (fn [world example captures]
               (assert-granularity-relation!
                world ownership-intent-results :vtd015/proposed-prefix-state
                (first (values example-values example captures))
                "Ownership-intent result does not match its proposed prefix."))}
   ])

(defn- granularity-contract-handlers []
  [{:pattern #"^(?:a feature forecast and its canonical bounded plan have .+|within-pack readiness is assessed|the readiness result is .+|the workflow action is .+|pack size, task count, forecast variance, or hypothetical future reuse alone never decides whether refinement is worthwhile)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:one existing verification pack has a proved reusable task boundary|a subordinate verification slice is declared|it has one stable identity, exact source paths, direct registered tasks, prerequisites, consumers, and an observable boundary|the union of its slices and conservative remainder equals the former exact-pack task closure|focused planning may select only the applicable slice, prerequisites, and consumers|exact-pack and terminal planning still select every former task exactly once|no top-level pack, assertion leaf, dependency, property, package proof, or terminal obligation is removed or made optional)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:within-pack planning receives .+|it selects tasks for one canonically owned pack|the task scope is .+|no unavailable or ambiguous slice narrows verification)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:ownership intent includes .+|intent preflight validates the proposed subordinate ownership|the intent result is .+|exact candidate preflight later evaluates only committed paths through canonical current and historical ownership|intent preflight executes no task or repository write)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:a focused QA candidate used an active subordinate verification slice|the user-requested terminal checkpoint finds a causal failure outside that applicable slice|the selection miss is recorded|the failed release candidate follows the existing focused repair and fresh all-20 checkpoint rule|the implicated slice becomes ineligible for narrowing until an independently reviewed mapping repair reaches QA|later feature work uses the conservative parent-pack closure during that quarantine|no separate all-20 calibration run, automatic assertion deletion, or undeclared narrowing is authorized)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:an approved feature's canonical preflight has .+|the feature workflow chooses whether to continue|it performs .+|no bounded forecast variance becomes a product-scope blocker|actual feature work proves a selected pack has a stable materially overbroad internal boundary|the standing verification-slice preparation validates that boundary|the former parent-pack task closure equals its slices and conservative remainder|focused selection includes every applicable direct task, prerequisite, and consumer|exact-pack and terminal selection retain every former task exactly once|the preparation adds no product behavior, top-level pack, omitted assertion, or optional evidence)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:accumulated QA work used one or more focused verification slices|the architect performs the one user-requested master-integration checkpoint|the scorecard compares terminal-only failures with the focused slices selected for the accumulated work|a causal selection miss quarantines its slice to the parent-pack closure until a reviewed mapping repair reaches QA|a passing checkpoint records calibration without authorizing undeclared future narrowing|the same terminal checkpoint remains the only complete run required for the sealed candidate)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:a coder's bounded judgment selects immediate preparation after intent or exact preflight reports a disproportionate plan|the automatic preparation route is activated|the coder sends the specifier one authorized file-based note with the product task, QA base, causal paths, task families, proposed slice, and any stopped patch reference|the paused product handoff closes without a completed implementation claim|the specifier sends the derived verification-slice task from current QA without waiting for another user decision|architect QA-ready integration of that preparation causes the original stable product task to be reissued from the exact new QA head|every role uses the ordinary file-based handoff channel rather than reporting forecast variance as a user blocker)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:read-only readiness reports a bounded verification plan materially disproportionate to the semantic product change|the responsible agent records a deferred verification-granularity observation after applying bounded judgment|the observation is bound to the stable task, exact QA base, causal paths, semantic change scope, planned packs and tasks, unrelated task families, possible seam, decision rationale, and reconsideration evidence|recording occurs outside plan-only preflight without changing the product candidate, canonical ownership, conservative verification plan, receipt, incident state, or evidence eligibility|duplicate task, path, and boundary-generation observations increase measured occurrence without erasing prior decisions|missing, ambiguous, stale, or non-ancestral identity cannot enter the active observation portfolio)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:one durable verification-granularity observation has .+|the pre-promotion portfolio assigns its explicit disposition|the disposition is .+|the observation cannot silently disappear from the append-only history)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:a user has requested master promotion and the active granularity portfolio selects verification-only hardening|the selected refinements are planned|they preserve every product behavior, assertion, owner, consumer, exact-pack task, terminal obligation, and package input|each refinement receives focused review evidence and architect QA-ready integration before release freeze|an unsafe, expanding, or unproved refinement is not integrated and returns to an explicit carried disposition|no all-20 checkpoint runs until the resulting QA head is frozen once for the ordinary master-integration gate)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:a bounded feature plan is materially disproportionate to one local semantic change|immediate refinement is judged more complex, risky, or time-consuming than the behavior it enables|the feature proceeds with canonical conservative verification|one durable granularity observation records the exact mismatch and judgment without changing product scope|the observation does not narrow the current evidence plan or authorize an all-20 feature run|preparation may be reconsidered from measured later evidence without assuming a roadmap or predicted touch frequency)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:the user requests master promotion while QA ancestry contains active granularity observations|the specifier performs the pre-promotion portfolio review|new unrelated product handoffs stop while QA remains mutable only for selected verification-only hardening|every active observation is explicitly selected, combined, carried with a reason, or retired with evidence|selection uses observed semantic mismatch, occurrences, verification wall time and failure surface, seam coherence, implementation and evidence cost, and change risk|no roadmap, pack count, task count, elapsed time, or hypothetical future touch frequency decides by itself)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   {:pattern #"^(?:the pre-promotion portfolio selected one or more bounded granularity refinements|those refinements complete ordinary focused QA review|only architect QA-ready refinements advance QA before release freeze|every unselected or unsuccessful observation retains an explicit portfolio disposition|the specifier freezes the resulting exact QA head once and sends that release candidate directly to the architect|the architect runs the ordinary single all-20 checkpoint with properties and package proof on that sealed candidate)$"
    :handler (fn [world _ _] (granularity-assert! world))}
   ])

(defn handlers [config]
  (vec (concat (review-ready-handlers config)
               (final-gate-handlers config)
               (scorecard-handlers config)
               (qa-release-handlers)
               (ownership-flow-handlers config)
               (granularity-mapping-handlers config)
               (granularity-contract-handlers))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-19T17:11:42.048203572+02:00", :module-hash "1092771625", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1551051199"} {:id "form/1/defonce", :kind "defonce", :line 5, :end-line 5, :hash "701185655"} {:id "form/2/defonce", :kind "defonce", :line 6, :end-line 6, :hash "-1357907350"} {:id "form/3/defonce", :kind "defonce", :line 7, :end-line 7, :hash "-2111650016"} {:id "defn-/production-evidence!", :kind "defn-", :line 9, :end-line 16, :hash "-288875895"} {:id "defn-/prepared", :kind "defn-", :line 18, :end-line 19, :hash "693136156"} {:id "defn-/ownership-prepared", :kind "defn-", :line 21, :end-line 30, :hash "63625446"} {:id "defn-/confirmed-flaky-prepared", :kind "defn-", :line 32, :end-line 41, :hash "-1740890553"} {:id "defn-/ownership-assert!", :kind "defn-", :line 43, :end-line 45, :hash "-1481341608"} {:id "defn-/granularity-assert!", :kind "defn-", :line 47, :end-line 54, :hash "1069318827"} {:id "defn-/assert!", :kind "defn-", :line 56, :end-line 58, :hash "-1474981311"} {:id "defn-/values", :kind "defn-", :line 60, :end-line 62, :hash "-170718585"} {:id "defn-/value-at", :kind "defn-", :line 64, :end-line 65, :hash "1199202542"} {:id "def/ownership-readiness-results", :kind "def", :line 67, :end-line 72, :hash "-654905179"} {:id "def/boundary-declaration-results", :kind "def", :line 74, :end-line 80, :hash "-1868035828"} {:id "def/ownership-change-results", :kind "def", :line 82, :end-line 90, :hash "-950045580"} {:id "def/within-pack-readiness-results", :kind "def", :line 92, :end-line 100, :hash "-2133689349"} {:id "def/within-pack-mapping-results", :kind "def", :line 102, :end-line 112, :hash "-1666536195"} {:id "def/ownership-intent-results", :kind "def", :line 114, :end-line 120, :hash "-1223192190"} {:id "def/immediate-preparation-results", :kind "def", :line 122, :end-line 124, :hash "713829812"} {:id "defn-/capture-granularity-value", :kind "defn-", :line 126, :end-line 127, :hash "497315109"} {:id "defn-/assert-granularity-relation!", :kind "defn-", :line 129, :end-line 130, :hash "-19419182"} {:id "defn-/review-ready-handlers", :kind "defn-", :line 132, :end-line 186, :hash "1566725346"} {:id "defn-/final-gate-handlers", :kind "defn-", :line 188, :end-line 256, :hash "-1061038204"} {:id "defn-/scorecard-handlers", :kind "defn-", :line 258, :end-line 335, :hash "-879584147"} {:id "defn-/qa-release-handlers", :kind "defn-", :line 337, :end-line 385, :hash "1389603030"} {:id "defn-/ownership-flow-handlers", :kind "defn-", :line 387, :end-line 503, :hash "334820817"} {:id "defn-/granularity-mapping-handlers", :kind "defn-", :line 505, :end-line 572, :hash "2031076427"} {:id "defn-/granularity-contract-handlers", :kind "defn-", :line 574, :end-line 603, :hash "-1160902884"} {:id "defn/handlers", :kind "defn", :line 605, :end-line 612, :hash "1966110546"}]}
;; clj-mutate-manifest-end
