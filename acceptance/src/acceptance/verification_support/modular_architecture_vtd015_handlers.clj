(ns acceptance.verification-support.modular-architecture-vtd015-handlers
  (:require [acceptance.steps.support :as support]
            [acceptance.verification-support.modular-architecture-process-evidence :as process-evidence]))

(defonce ^:private evidence (atom nil))
(defonce ^:private ownership-evidence (atom nil))

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

(defn- ownership-assert! [world predicate message]
  (support/assert! predicate message {:evidence (:vtd015/ownership-evidence world)})
  world)

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
                        "The bootstrap bypasses current safety evidence."))}
   {:pattern #"^the user explicitly requests master integration and QA contains one or more QA-ready tasks after master$"
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
   {:pattern #"^a user-approved QA feature names its development focus, QA impact, and likely shared integration surfaces$"
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
   {:pattern #"^no feature-mode all-20 run is authorized$"
    :handler (fn [world _ _]
               (ownership-assert! world (false? (get-in world [:vtd015/ownership-evidence :routing :featureAll20Authorized]))
                                  "Ownership readiness authorized an all-20 feature run."))}
   {:pattern #"^an approved feature has a coarse ownership boundary$"
    :handler (fn [world _ _] (ownership-prepared world))}
   {:pattern #"^its standing-authorized preparation stage completes focused review$"
    :handler (fn [world _ _] world)}
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
   {:pattern #"^the product evidence range cannot contain the ownership change that narrows its own plan$"
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
                                  "Failed or stale terminal evidence consumed an obligation."))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-17T10:15:18.416104793+02:00", :module-hash "-1688471804", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1551051199"} {:id "form/1/defonce", :kind "defonce", :line 5, :end-line 5, :hash "701185655"} {:id "form/2/defonce", :kind "defonce", :line 6, :end-line 6, :hash "-1357907350"} {:id "defn-/production-evidence!", :kind "defn-", :line 8, :end-line 15, :hash "-288875895"} {:id "defn-/prepared", :kind "defn-", :line 17, :end-line 18, :hash "693136156"} {:id "defn-/ownership-prepared", :kind "defn-", :line 20, :end-line 29, :hash "63625446"} {:id "defn-/ownership-assert!", :kind "defn-", :line 31, :end-line 33, :hash "-1481341608"} {:id "defn-/assert!", :kind "defn-", :line 35, :end-line 37, :hash "-1474981311"} {:id "defn-/values", :kind "defn-", :line 39, :end-line 41, :hash "-170718585"} {:id "defn-/value-at", :kind "defn-", :line 43, :end-line 44, :hash "1199202542"} {:id "defn/handlers", :kind "defn", :line 46, :end-line 387, :hash "-173378486"}]}
;; clj-mutate-manifest-end
