(in-ns 'acceptance.modular-architecture-steps-test)

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
                  :resolution {:allPackCount 21 :reusedTaskCount 0 :packagePassed true
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
                                 :diagnosticRetryOnPassingRun false :allPackCount 21
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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-11T10:33:57.288175874+02:00", :module-hash "-510081312", :forms [{:id "form/0/in-ns", :kind "in-ns", :line 1, :end-line 1, :hash "-1677165460"} {:id "form/1/deftest", :kind "deftest", :line 3, :end-line 153, :hash "-1904410158"}]}
;; clj-mutate-manifest-end
