(ns acceptance.modular-architecture-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.modular-architecture :as modular]
            [acceptance.verification-support.isolated-handler-audit :as isolation-audit]
            [acceptance.verification-support.modular-architecture-vtd007-handlers :as vtd007]
            [acceptance.verification-support.modular-architecture-vtd009-handlers :as vtd009]
            [acceptance.verification-support.modular-architecture-vtd014-handlers :as vtd014]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(def feature-files
  ["features/modular-chrome-utility-architecture.feature"
   "features/modular-verification-packs.feature"
   "features/modular-acceptance-execution.feature"
   "features/modular-browser-runtime-adapters.feature"])

(deftest verifies-modular-architecture-features
  (doseq [feature-file feature-files]
    (is (= :passed
           (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                          modular/handlers)))
        feature-file)))

(deftest modular-inspection-is-cached-after-validating-the-pack-boundary
  (is (false? (#'modular/enough-verification-packs? (range 5))))
  (is (true? (#'modular/enough-verification-packs? (range 6))))
  (let [inspected (#'modular/inspect! {})]
    (is (true? (:modular/inspected inspected)))
    (is (seq (:modular/registry inspected)))
    (is (= "shared"
           (get (:modular/browser-adapter-modes inspected)
                "test/browser-packs/flow-graph.mjs")))
    (is (not (contains? (:modular/browser-adapter-modes inspected)
                        "test/browser-packs/flow-graph-legacy.mjs")))
    (is (= "integration"
           (get (:modular/browser-adapter-modes inspected)
                "test/twatility-projects-browser-test.mjs")))
    (is (identical? inspected (#'modular/inspect! inspected)))))

(deftest vtd013-steps-use-dedicated-production-backed-semantics
  (let [characterization (#'modular/flow-characterization)
        focused (#'modular/flow-sample-world {} "focused single-target")
        loaded (#'modular/flow-sample-world {} "normally loaded terminal lane 4 of 4")
        maturity (#'modular/flow-maturity-world {} "4" "5" "5")
        budget (#'modular/flow-budget-world {} "12.892 seconds")]
    (is (= "complete" (get-in characterization [:completion :status])))
    (is (= "normal" (:vtd013/execution-load focused)))
    (is (= "loaded" (:vtd013/execution-load loaded)))
    (is (= ["provisional" "non-provisional"]
           [(:vtd013/focused-status maturity) (:vtd013/loaded-status maturity)]))
    (is (= "fail" (:vtd013/budget-result budget))))
  (let [characterization (#'modular/flow-characterization)
        expanded (-> characterization
                     (assoc-in [:classes :focusedNormal :sampleCount] 6)
                     (update-in [:classes :focusedNormal :receiptDigests]
                                conj (apply str (repeat 64 "a")))
                     (assoc-in [:classes :normallyLoaded :sampleCount] 6)
                     (update-in [:classes :normallyLoaded :receiptDigests]
                                conj (apply str (repeat 64 "b"))))]
    (with-redefs-fn {#'modular/flow-characterization (constantly expanded)}
      #(is (= 6 (get-in (#'modular/flow-completion-world {})
                        [:vtd013/focused :sampleCount]))
           "the at-least-five contract accepts additional independent samples")))
  (let [feature (gherkin/parse-file "features/modular-verification-packs.feature")
        steps (->> (:scenarios feature)
                   (filter #(re-matches #"Modular verification packs 03[0-3]" (:name %)))
                   (mapcat :steps)
                   (map :text))]
    (is (= 4 (count (filter #(re-matches #"Modular verification packs 03[0-3]" (:name %))
                            (:scenarios feature)))))
    (doseq [step steps]
      (let [handler (first (filter #(re-matches (:pattern %) step) modular/handlers))]
        (is (some? handler) step)
        (is (not= "^.*$" (str (:pattern handler))) step)))))

(deftest vtd014-steps-use-dedicated-production-backed-semantics
  (let [feature (gherkin/parse-file "features/modular-verification-packs.feature")
        scenarios (filter #(re-matches #"Modular verification packs 1(?:0[4-9]|1[0-9])" (:name %))
                          (:scenarios feature))
        steps (mapcat :steps scenarios)]
    (is (= 16 (count scenarios)))
    (doseq [{:keys [text]} steps]
      (let [handler (first (filter #(re-matches (:pattern %) text) modular/handlers))]
        (is (some? handler) text)
        (is (not= "^.*$" (str (:pattern handler))) text)))))

(deftest vtd014-outline-captures-resolve-authoritative-example-values
  (let [feature (gherkin/parse-file "features/modular-verification-packs.feature")
        execution (first (filter #(= "Modular verification packs 105/example_1" (:name %))
                                 (runtime/expand-executions feature)))
        evidence {:incident {:retryClaimedBeforeExecution true}
                  :retry {:scopes {"an assertion inside logical target TARGET-A"
                                   {:kind "target" :logicalTargetIds ["TARGET-A"]}}
                          :innerDeadlineIdentityConserved true}}]
    (with-redefs-fn {#'vtd014/production-evidence! (constantly evidence)}
      #(is (= "an assertion inside logical target TARGET-A"
              (:vtd014/failure-boundary
               (runtime/run-execution! execution modular/handlers)))))))

(deftest vtd014-row-evidence-resolves-json-keywordized-outline-values
  (is (= "observed"
         (#'vtd014/row-value
          {:vtd014/evidence {:execution {:rows {(keyword "outline row")
                                                   {:result "observed"}}}}}
          [:execution :rows] "outline row" :result))))

(deftest vtd014-scenarios-execute-with-their-dedicated-production-evidence
  (let [feature (gherkin/parse-file "features/modular-verification-packs.feature")
        executions (filter #(re-matches #"Modular verification packs 1(?:0[4-9]|1[0-9])/example_\d+"
                                        (:name %))
                           (runtime/expand-executions feature))
        digest (apply str (repeat 64 "a"))
        evidence {:historical {:boundary "artifact/setup" :excludedPassedTaskCount 274
                               :excludedLogicalTargetIds ["1" "2" "3" "4" "5"]
                               :retroactiveIncident false}
                  :progress {:truncationBounded true}
                  :incident {:state "unresolved" :repositoryCommon true :immutableFields true
                             :ordinaryResumeBlocked true :retryClaimedBeforeExecution true}
                  :failures {:boundaries [{:failure "a runner-owned timeout during target cleanup"
                                           :boundary "the logical target and cleanup phase"
                                           :observed {:retryScope {:kind "target"} :phase "cleanup"}}
                                          {:failure "an offscreen control hit-test assertion"
                                           :boundary "the logical browser target and assertion site"
                                           :observed {:retryScope {:kind "target"} :assertionSite "layout:1"}}
                                          {:failure "a Property Set settling assertion"
                                           :boundary "the executable target or case and unsettled state"
                                           :observed {:retryScope {:kind "case"}
                                                      :boundedState {:settled false}}}
                                          {:failure "an indivisible task assertion or nonzero exit"
                                           :boundary "the canonical task and diagnostic fingerprint"
                                           :observed {:retryScope {:kind "task"} :fingerprint digest}}]}
                  :non-timeout-fixtures {:hit-test {:classification "confirmed-flaky"
                                                    :state "unresolved"
                                                    :retryScope {:kind "target"}
                                                    :phase "assertion" :assertionSite "layout:1"
                                                    :fingerprint digest :boundedState {:x 1}}
                                         :property-set-settling {:classification "confirmed-flaky"
                                                                 :state "unresolved"
                                                                 :retryScope {:kind "case"}
                                                                 :phase "assertion" :assertionSite "settling:1"
                                                                 :fingerprint digest :boundedState {:settled false}}}
                  :retry {:scopes {"an assertion inside logical target TARGET-A"
                                   {:kind "target" :logicalTargetIds ["TARGET-A"]}
                                   "an executable scenario or generated case" {:kind "case"}
                                   "shared artifact setup before any target"
                                   {:kind "setup" :logicalTargetIds []}
                                   "an indivisible non-browser task" {:kind "task"}
                                   "absent, invalid, or ambiguous progress"
                                   {:kind "rejected" :rejected true}}
                          :innerDeadlineIdentityConserved true
                          :classifications {:passed "confirmed-flaky"
                                            :sameFailure "reproduced-failure"
                                            :failed "changed-failure"
                                            :identityChanged "diagnostic-contract-failure"}
                          :secondRetryRejected true}
                  :repair {:symptomSuppressionRejected true :limitOnlyRejected true
                           :unprovenRejected true :staleRejected true
                           :unrelatedRejected true :eligible true :descendant true :freshFocused true}
                  :store {:concurrentIndependentIds true :tamperRejected true :symlinkRejected true
                          :malformedRejected true
                          :lineage {:unrelatedExcluded true :rebasePreserved true
                                    :invalidTreeRejected true :unrelatedRebaseRejected true
                                    :abandonmentDecisionRequired true :abandonmentReleased true
                                    :abandonedReuseRejected true}
                          :transitionHistory {:duplicateRejected true :reorderedRejected true
                                              :missingRejected true :inconsistentRejected true
                                              :earlierTimestampRejected true
                                              :duplicateLineageRejected true}}
                  :resolution {:allPackCount 20 :reusedTaskCount 0 :packagePassed true
                               :archiveVerified true :resolvedIncidentExcludedFromBlocking true
                               :handoffGate true :downstreamIncidentDistinct true
                               :evidence {:failureDigest digest :resolutionDigest digest
                                          :repairCommit "repair" :repairTree "tree"
                                          :causalCategory "readiness" :regression {}
                                          :focusedReceipt {} :checkpointReceiptSha256 digest}}
                  :conservation {:changedFiles ["scripts/verification-reliability-store.mjs"]
                                 :productChangedFiles [] :featureChangedFiles []
                                 :currentTaskDigest digest :acceptedBaseTaskDigest digest
                                 :currentPackContractDigest digest :acceptedBasePackContractDigest digest
                                 :currentCalibrationDigest digest :acceptedBaseCalibrationDigest digest
                                 :diagnosticRetryOnPassingRun false :allPackCount 20
                                 :packageTask "scripts/package.mjs"}
                  :execution {:prerequisites {:approvedFirstLaunch true :workspaceNarrow true
                                              :mixedRouteObservation
                                              {:scoped "scoped-command-approval|bwrap-shared-loopback"
                                               :workspace "workspace-sandbox|bwrap-unshared-network"}
                                              :deniedBeforeLaunch true :declarationsFailClosed true
                                              :rows {"the workspace sandbox cannot bind"
                                                     {:firstRunAction "use the existing scoped approval route immediately"
                                                      :launchResult "the child launches once with its declared access"
                                                      :route "scoped-command-approval" :launchCount 1
                                                      :trialRunCount 0}
                                                     "the workspace sandbox is sufficient"
                                                     {:firstRunAction "use the current sandbox without an approval prompt"
                                                      :launchResult "the child launches once with no additional access"
                                                      :route "workspace-sandbox" :launchCount 1 :trialRunCount 0}
                                                     "scoped approval is denied"
                                                     {:firstRunAction "record environment-prerequisite-blocked"
                                                      :launchResult "no child launches and no passing result is created"
                                                      :route "blocked" :launchCount 0 :trialRunCount 0}}}
                              :restriction {:environmentContractFailure true :retryPermitted false
                                            :capability "local-loopback"
                                            :explicitApprovalUnchanged true
                                            :unrelatedRestrictionsDenied true :publicNetworkDenied true
                                            :retainedContract true :narrowRepairRequired true
                                            :wrongIncidentRepairRejected true :nextInvocationRouted true}
                              :checkpoint {:singleton true :attachedWithoutDuplicate true
                                           :continuation true :reusedOnlyPassed true
                                           :interruptedAndUnstartedOnly true :packagePlanned true
                                           :promotionOnly true :identityDriftRejected true
                                           :staleOwnerRecovered true
                                           :forgedAttemptRejected
                                           {:missingResult true :extraResult true :forgedResult true
                                            :impossibleState true :reorderedTransitions true
                                            :duplicatedTransition true :promotionDrift true}
                                           :promotionScopes
                                           {"completed receipt finalization is interrupted" "receipt-finalization"
                                            "pending evidence creation is interrupted" "pending-evidence"
                                            "Git-note recording loses its lock or permission" "git-note-recording"
                                            "handoff eligibility cannot read durable evidence" "handoff-eligibility"}
                                           :preflightRows
                                           {"every prerequisite is satisfied and no attempt exists"
                                            {:action "create one repository-common checkpoint attempt"
                                             :taskExecution "the planned tasks may launch" :observed true}
                                            "one compatible incomplete attempt already exists"
                                            {:action "attach to that attempt"
                                             :taskExecution "no second all-pack process launches" :observed true}
                                            "another owner holds an incompatible active lease"
                                            {:action "report or queue behind the named owner outside timing"
                                             :taskExecution "no checkpoint task launches" :observed true}
                                            "a lease is demonstrably stale"
                                            {:action "use the bounded audited stale-owner recovery"
                                             :taskExecution "tasks launch only after lease recovery completes"
                                             :observed true}
                                            "a required executable or bounded output capacity is unavailable"
                                            {:action "record environment-prerequisite-blocked"
                                             :taskExecution "no checkpoint task launches" :observed true}
                                            "the candidate lineage has an unresolved incident"
                                            {:action "require focused causal repair"
                                             :taskExecution "no checkpoint task launches" :observed true}}
                                           :driftRows
                                           (into {} (map (fn [drift]
                                                          [drift {:stoppedBeforeLaunch true
                                                                  :retainedForDiagnosis true
                                                                  :noFreshAttempt true
                                                                  :executionContractIncident true}])
                                                        ["the candidate commit or tree changes"
                                                         "the registry or canonical plan changes"
                                                         "the locked toolchain identity changes"
                                                         "the built artifact identity changes"]))}
                              :sharedBoundary {:incidentAware true :rawDiagnosticIneligible true
                                               :focusedKinds ["unit" "property" "acceptance"
                                                              "browser" "checkpoint" "package"]}}}]
    (is (= 48 (count executions)))
    (with-redefs-fn {#'vtd014/production-evidence! (constantly evidence)}
      #(doseq [execution executions]
         (is (map? (runtime/run-execution! execution modular/handlers)) (:name execution))))))

(deftest vtd003-steps-use-dedicated-production-backed-semantics
  (let [calibration (#'modular/performance-calibration)
        pack-world (#'modular/calibration-pack-world
                    {} "flow_graph" "src/flow-graph/workspace-section-ui.ts")
        target-world (#'modular/calibration-target-world
                      {} "FLOW_GRAPH_EXAMPLES_TARGET")]
    (is (= "complete" (get-in calibration [:completion :status])))
    (is (= ["flow_graph"] (:vtd003/selected-packs pack-world)))
    (is (= 4596 (get-in target-world [:vtd003/target-budget :limit]))))
  (let [feature (gherkin/parse-file "features/modular-verification-packs.feature")
        scenarios (filter #(re-matches #"Modular verification packs 03[4-9]" (:name %))
                          (:scenarios feature))]
    (is (= 6 (count scenarios)))
    (doseq [step (map :text (mapcat :steps scenarios))]
      (let [handler (first (filter #(re-matches (:pattern %) step) modular/handlers))]
        (is (some? handler) step)
        (is (not= "^.*$" (str (:pattern handler))) step)))))

(defn- assert-dedicated-scenario-handlers! [scenario-pattern expected-count]
  (let [feature (gherkin/parse-file "features/modular-verification-packs.feature")
        scenarios (filter #(re-matches scenario-pattern (:name %))
                          (:scenarios feature))]
    (is (= expected-count (count scenarios)))
    (doseq [step (map :text (mapcat :steps scenarios))]
      (let [handler (first (filter #(re-matches (:pattern %) step) modular/handlers))]
        (is (some? handler) step)
        (is (not= "^.*$" (str (:pattern handler))) step)))))

(deftest vtd004-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 04[0-5]" 6))

(deftest vtd004-durable-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 0(?:4[6-9]|5[0-2])" 7))

(deftest vtd004-event-library-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 05[3-9]" 7))

(deftest vtd004-event-library-isolation-audit-uses-dedicated-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 060" 1))

(deftest vtd004-capture-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 06[1-7]" 7))

(deftest vtd004-schemas-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 0(?:6[8-9]|7[0-4])" 7))

(deftest vtd005-layered-editor-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 0(?:7[5-9]|80)" 6))

(deftest vtd009-helper-shell-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 08[1-7]" 7))

(deftest vtd007-browser-control-steps-use-dedicated-production-backed-semantics
  (assert-dedicated-scenario-handlers! #"Modular verification packs 0(?:8[8-9]|9[0-4])" 7))

(deftest vtd007-handlers-reject-mutated-example-outcomes-and-deadline-owners
  (let [handlers (vtd007/handlers {:example-values (fn [_ captures] captures)})
        invoke (fn [world text captures]
                 ((:handler (first (filter #(re-matches (:pattern %) text) handlers)))
                  world nil captures))
        readiness (-> {}
                      (invoke "a shared browser readiness check for target TARGET-READY, phase navigation, and predicate \"the requested workspace is mounted\"" [])
                      (invoke "its monotonic deadline is 100 milliseconds, poll interval is 25 milliseconds, maximum snapshot is 80 characters, and stability interval is 0 milliseconds" ["0 milliseconds"])
                      (invoke "its observed ready states are true" ["true"]))
        deadline (invoke {} "the browser boundary Chrome termination has its own bounded deadline"
                         ["Chrome termination"])]
    (is (thrown? Exception
                 (invoke readiness "the readiness outcome is succeeds after 50 milliseconds"
                         ["succeeds after 50 milliseconds"])))
    (is (thrown? Exception
                 (invoke deadline
                         "the failure names DevTools protocol call rather than a product readiness predicate"
                         ["DevTools protocol call"])))))

(deftest vtd007-handlers-reject-permuted-forced-failure-descriptions
  (let [handlers (vtd007/handlers {:example-values (fn [_ captures] captures)})
        invoke (fn [world text captures]
                 ((:handler (first (filter #(re-matches (:pattern %) text) handlers)))
                  world nil captures))
        rows [["Chrome debug-port startup" "Chrome never exposes a debugging port"]
              ["DevTools protocol call" "a requested protocol response never arrives"]
              ["logical target outer work" "target work never completes"]
              ["Chrome termination" "the browser ignores graceful termination"]
              ["profile cleanup" "the browser profile remains temporarily busy"]]]
    (doseq [[[owner failure] [_ permuted]] (map vector rows (concat (rest rows) [(first rows)]))]
      (let [world (invoke {} (str "the browser boundary " owner " has its own bounded deadline")
                          [owner])]
        (is (thrown? Exception
                     (invoke world (str permuted " is forced independently") [permuted]))
            (str failure " must not accept " permuted))))))

(deftest vtd007-handlers-reject-disconnected-surface-phase-program-and-plan-evidence
  (let [handlers (vtd007/handlers {:example-values (fn [_ captures] captures)})
        invoke (fn [world text captures]
                 ((:handler (first (filter #(re-matches (:pattern %) text) handlers)))
                  world nil captures))
        evidence {:surfaces [{:browserSurface "the shared side-panel harness"
                              :readinessBoundary "initial navigation, post-fixture reload, and installed reload"
                              :stabilityRequirement "no extra stability interval"
                              :productionFacts {:entryPoint "test/browser-packs/shared-harness.mjs"
                                                :predicateOwner
                                                "test/browser-packs/shared-harness.mjs"
                                                :phases ["navigation" "post-fixture reload"
                                                         "installed reload"]
                                                :sharedCalls 1
                                                :compoundPredicateOutcomes
                                                [true false false false]}}]
                  :timing {:identity "swarmforgeBrowserTargetTiming"
                           :passConserved true
                           :failurePartialPhase "fixture"
                           :realRunners
                           {:flowFailure
                            {:activePhase "interaction" :timingRecords 1
                             :timing {:phaseNames ["target setup" "navigation" "fixture"
                                                   "readiness" "interaction" "persistence"
                                                   "assertion" "cleanup"]
                                      :applicableNonZeroPhases
                                      ["target setup" "navigation" "interaction" "cleanup"]
                                      :phaseTotal 10 :durationMs 10}}
                            :installedFailure
                            {:activePhase "interaction" :timingRecords 1
                             :timing {:phaseNames ["target setup" "navigation" "fixture"
                                                   "interaction" "persistence" "assertion"
                                                   "target cleanup"]
                                      :applicableNonZeroPhases
                                      ["target setup" "navigation" "interaction"
                                       "target cleanup"]
                                      :phaseTotal 10 :durationMs 10}}}}
                  :programs {:invalidRejected true :targetAndPhase true
                             :invalidTransmissionCount 0 :invalidCaseCount 5
                             :validProgramCount 5
                             :protocolAdapters
                             [{:pathname "test/browser-packs/shared-harness.mjs"
                               :transmissionCount 1 :allValidated true}
                              {:pathname "test/support/browser-target-session.mjs"
                               :transmissionCount 1 :allValidated true}
                              {:pathname "test/browser-packs/flow-graph.mjs"
                               :transmissionCount 1 :allValidated true}]
                             :policyEntryPoints
                             ["test/browser-packs/shared-harness.mjs"
                              "test/support/browser-target-session.mjs"
                              "test/support/layered-schema-targets.mjs"
                              "test/browser-packs/flow-graph.mjs"
                              "test/support/flow-examples-timing.mjs"]
                             :fixedDelays [{:milliseconds 20 :reasonAdjacent true}]
                             :fixedAttempts [{:condition "count<20"
                                              :reasonAdjacent true}]
                             :fixedWaitsBehaviorOnly true
                             :validResults (mapv #(hash-map :phase %)
                                                 ["setup" "workflow" "readiness"
                                                  "persistence" "observation"])}
                  :conservation {:targetsOnce true :tasksUnchanged true}}
        with-evidence (fn [value work]
                        (with-redefs-fn {#'vtd007/production-boundary (delay value)} work))]
    (with-evidence
      (assoc-in evidence [:surfaces 0 :productionFacts :phases]
                ["navigation" "installed reload"])
      #(is (thrown? Exception
                    (invoke {} "the shared side-panel harness currently owns local fixed-attempt readiness loops"
                            ["the shared side-panel harness"]))))
    (with-evidence
      (assoc-in evidence [:surfaces 0 :productionFacts :compoundPredicateOutcomes]
                [true true false false])
      #(is (thrown? Exception
                    (invoke {} "the shared side-panel harness currently owns local fixed-attempt readiness loops"
                            ["the shared side-panel harness"]))))
    (with-evidence
      (assoc-in evidence [:surfaces 0 :productionFacts :predicateOwner]
                "test/support/browser-observation-control.mjs")
      #(is (thrown? Exception
                    (invoke {} "the shared side-panel harness currently owns local fixed-attempt readiness loops"
                            ["the shared side-panel harness"]))))
    (with-evidence
      (assoc-in evidence [:timing :realRunners :flowFailure :activePhase] "readiness")
      #(let [world (invoke {} "a browser target records target setup, navigation, fixture, interaction, persistence, assertion, and cleanup when those phases apply" [])]
         (is (thrown? Exception
                      (invoke world "a failure retains completed phase durations and identifies the active partial phase" [])))))
    (doseq [mutated [(assoc-in evidence
                               [:timing :realRunners :flowFailure :timing :phaseNames]
                               ["navigation" "target setup"])
                     (assoc-in evidence
                               [:timing :realRunners :flowFailure :timing :durationMs] 11)
                     (assoc-in evidence
                               [:timing :realRunners :flowFailure :timing
                                :applicableNonZeroPhases]
                               ["target setup" "navigation" "interaction"])]]
      (with-evidence
        mutated
        #(let [world (invoke {} "a browser target records target setup, navigation, fixture, interaction, persistence, assertion, and cleanup when those phases apply" [])]
           (is (thrown? Exception
                        (invoke world "its target-scoped phase durations are finite, non-negative, ordered, and cover the target duration exactly once within rounding tolerance" []))))))
    (with-evidence
      (assoc-in evidence [:programs :validResults 0 :phase] "observation")
      #(let [world (invoke {} "shared side-panel, installed Layered Schema, and Flow fixture programs are generated before DevTools evaluation" [])]
         (is (thrown? Exception
                      (invoke world "valid setup, workflow, readiness, persistence, and observation programs retain their current results" [])))))
    (with-evidence
      (assoc-in evidence [:programs :invalidTransmissionCount] 1)
      #(let [world (invoke {} "shared side-panel, installed Layered Schema, and Flow fixture programs are generated before DevTools evaluation" [])]
         (is (thrown? Exception
                      (invoke world "it is rejected before transmission with its logical target and phase" [])))))
    (doseq [mutated [(assoc-in evidence [:programs :invalidCaseCount] 4)
                     (assoc-in evidence [:programs :protocolAdapters 0 :allValidated] false)]]
      (with-evidence
        mutated
        #(let [world (invoke {} "shared side-panel, installed Layered Schema, and Flow fixture programs are generated before DevTools evaluation" [])]
           (is (thrown? Exception
                        (invoke world "it is rejected before transmission with its logical target and phase" []))))))
    (with-evidence
      (assoc-in evidence [:programs :fixedDelays 0 :reasonAdjacent] false)
      #(let [world (invoke {} "shared side-panel, installed Layered Schema, and Flow fixture programs are generated before DevTools evaluation" [])]
         (is (thrown? Exception
                      (invoke world "fixed waits in those shared entry points remain only where elapsed time or animation is the behavior under test and the reason is adjacent" [])))))
    (doseq [mutated [(assoc-in evidence [:programs :fixedAttempts 0 :reasonAdjacent] false)
                     (update-in evidence [:programs :policyEntryPoints] pop)]]
      (with-evidence
        mutated
        #(let [world (invoke {} "shared side-panel, installed Layered Schema, and Flow fixture programs are generated before DevTools evaluation" [])]
           (is (thrown? Exception
                        (invoke world "fixed waits in those shared entry points remain only where elapsed time or animation is the behavior under test and the reason is adjacent" []))))))
    (with-evidence
      (assoc-in evidence [:conservation :targetsOnce] false)
      #(let [world (invoke {} "VTD-007 adds one shared browser-observation control helper consumed transitively by all 20 runnable packs" [])]
         (is (thrown? Exception
                      (invoke world "every logical browser target, feature, and handler executes exactly once as before" [])))))
    (with-evidence
      (assoc-in evidence [:conservation :tasksUnchanged] false)
      #(let [world (invoke {} "VTD-007 adds one shared browser-observation control helper consumed transitively by all 20 runnable packs" [])]
         (is (thrown? Exception
                      (invoke world "the migration neither adds nor removes a planned task or evidence leaf in exact-pack and terminal-full scope" [])))))))

(deftest vtd009-scope-labels-and-history-changes-resolve-exactly
  (is (= 20 (#'vtd009/scope "every runnable pack")))
  (is (= ["flow_graph" "layered_schema"]
         (#'vtd009/scope "layered_schema and flow_graph")))
  (is (= ["capture dependant closure" "shell" "10 packs"]
         (#'vtd009/scope "capture dependant closure, shell, and 10 packs")))
  (is (= :deleteHelper
         (#'vtd009/history-key
          "delete test/support/layered-schema-usability-targets.mjs")))
  (is (= :renameToPlatform
         (#'vtd009/history-key
          "rename src/workspace-tabs-ui.ts to src/platform/workspace-tabs-ui.ts")))
  (is (= :unavailable (#'vtd009/history-key "modify an unrelated file"))))

(defn- assert-parsed-cross-pack-step-consumer!
  [{:keys [owner owner-feature handler consumer consumer-feature pattern step message]}]
  (let [packs [{:id owner
                :dependencies []
                :features [owner-feature]
                :isolatedVerificationHandlers [handler]}
               {:id consumer
                :dependencies [owner]
                :features [consumer-feature]}]]
    (with-redefs-fn {#'acceptance.verification-support.isolated-handler-audit/namespace-handlers
                     (constantly [{:pattern pattern}])}
      #(is (= [{:handler handler
                :consumerPack consumer
                :feature consumer-feature
                :step step}]
              (isolation-audit/loaded-cross-pack-step-consumers packs))
           message))))

(deftest event-library-isolation-audit-matches-effective-patterns-against-parsed-dependant-steps
  (assert-parsed-cross-pack-step-consumer!
   {:owner "event-library"
    :owner-feature "features/data-layer-event-template-library.feature"
    :handler "acceptance/src/acceptance/steps/event_template_library.clj"
    :consumer "project_event_transport"
    :consumer-feature "features/data-layer-project-event-transport-settings.feature"
    :pattern #"<project> is active"
    :step "<project> is active"
    :message "handler feature metadata cannot conceal a pattern matching a parsed dependant step"}))

(deftest capture-isolation-audit-matches-effective-patterns-against-parsed-dependant-steps
  (assert-parsed-cross-pack-step-consumer!
   {:owner "capture"
    :owner-feature "features/data-layer-event-feed-query-builder.feature"
    :handler "acceptance/src/acceptance/steps/event_feed_query.clj"
    :consumer "schemas"
    :consumer-feature "features/data-layer-schema-validation-workflow.feature"
    :pattern #"captured event event-7 has no matching automatic assignment or manual attachment"
    :step "captured event event-7 has no matching automatic assignment or manual attachment"
    :message "Capture feature metadata cannot conceal a parsed cross-pack step"}))

(deftest schemas-isolation-audit-matches-effective-patterns-against-parsed-dependant-steps
  (assert-parsed-cross-pack-step-consumer!
   {:owner "schemas"
    :owner-feature "features/data-layer-live-allowed-value-expansion.feature"
    :handler "acceptance/src/acceptance/steps/allowed_value_expansion.clj"
    :consumer "defects"
    :consumer-feature "features/data-layer-defect-library.feature"
    :pattern #"a testing session contains captured events with schema validation results"
    :step "a testing session contains captured events with schema validation results"
    :message "Schemas feature metadata cannot conceal a parsed cross-pack step"}))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-11T06:57:29.242803699+02:00", :module-hash "-1791096173", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 9, :hash "1366990184"} {:id "def/feature-files", :kind "def", :line 11, :end-line 15, :hash "-21201147"} {:id "form/2/deftest", :kind "deftest", :line 17, :end-line 22, :hash "-244926829"} {:id "form/3/deftest", :kind "deftest", :line 24, :end-line 38, :hash "-328044063"} {:id "form/4/deftest", :kind "deftest", :line 40, :end-line 74, :hash "228982377"} {:id "form/5/deftest", :kind "deftest", :line 76, :end-line 85, :hash "-2118911970"} {:id "form/6/deftest", :kind "deftest", :line 87, :end-line 98, :hash "1820139466"} {:id "form/7/deftest", :kind "deftest", :line 100, :end-line 105, :hash "-740854160"} {:id "form/8/deftest", :kind "deftest", :line 107, :end-line 257, :hash "-1968283538"} {:id "form/9/deftest", :kind "deftest", :line 259, :end-line 275, :hash "1644470916"} {:id "defn-/assert-dedicated-scenario-handlers!", :kind "defn-", :line 277, :end-line 285, :hash "1569417212"} {:id "form/11/deftest", :kind "deftest", :line 287, :end-line 288, :hash "245194227"} {:id "form/12/deftest", :kind "deftest", :line 290, :end-line 291, :hash "554417531"} {:id "form/13/deftest", :kind "deftest", :line 293, :end-line 294, :hash "1323694502"} {:id "form/14/deftest", :kind "deftest", :line 296, :end-line 297, :hash "138892075"} {:id "form/15/deftest", :kind "deftest", :line 299, :end-line 300, :hash "2013011596"} {:id "form/16/deftest", :kind "deftest", :line 302, :end-line 303, :hash "-1365660205"} {:id "form/17/deftest", :kind "deftest", :line 305, :end-line 306, :hash "-514588585"} {:id "form/18/deftest", :kind "deftest", :line 308, :end-line 309, :hash "-310595953"} {:id "form/19/deftest", :kind "deftest", :line 311, :end-line 312, :hash "802773267"} {:id "form/20/deftest", :kind "deftest", :line 314, :end-line 331, :hash "435291924"} {:id "form/21/deftest", :kind "deftest", :line 333, :end-line 348, :hash "-2047542094"} {:id "form/22/deftest", :kind "deftest", :line 350, :end-line 488, :hash "575408246"} {:id "form/23/deftest", :kind "deftest", :line 490, :end-line 502, :hash "1260497997"} {:id "defn-/assert-parsed-cross-pack-step-consumer!", :kind "defn-", :line 504, :end-line 520, :hash "571745781"} {:id "form/25/deftest", :kind "deftest", :line 522, :end-line 531, :hash "-1052248530"} {:id "form/26/deftest", :kind "deftest", :line 533, :end-line 542, :hash "130986114"} {:id "form/27/deftest", :kind "deftest", :line 544, :end-line 553, :hash "1719726216"}]}
;; clj-mutate-manifest-end
