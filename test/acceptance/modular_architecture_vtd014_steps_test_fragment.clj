(in-ns 'acceptance.modular-architecture-steps-test)

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

(deftest vtd014-checkpoint-task-execution-rejects-a-disconnected-example-value
  (let [feature (gherkin/parse-file "features/modular-verification-packs.feature")
        execution (first (filter #(= "Modular verification packs 115/example_1" (:name %))
                                 (runtime/expand-executions feature)))
        disconnected (update execution :example assoc "task_execution"
                             "no checkpoint task launches")
        evidence {:execution
                  {:checkpoint
                   {:singleton true
                    :preflightRows
                    {"every prerequisite is satisfied and no attempt exists"
                     {:action "create one repository-common checkpoint attempt"
                      :taskExecution "the planned tasks may launch"
                      :observed true}}}}}]
    (with-redefs-fn {#'vtd014/production-evidence! (constantly evidence)}
      #(is (thrown-with-msg?
            clojure.lang.ExceptionInfo
            #"Checkpoint task launch did not honor the singleton lease"
            (runtime/run-execution! disconnected modular/handlers))))))

(deftest vtd014-row-evidence-resolves-json-keywordized-outline-values
  (is (= "observed"
         (#'vtd014/row-value
          {:vtd014/evidence {:execution {:rows {(keyword "outline row")
                                                   {:result "observed"}}}}}
          [:execution :rows] "outline row" :result))))

(deftest vtd014-flow-style-example-binds-the-installed-observation-contract
  (let [feature (gherkin/parse-file "features/modular-verification-packs.feature")
        execution (first (filter #(= "Modular verification packs 158/example_2" (:name %))
                                 (runtime/expand-executions feature)))
        contract {:baseCommit "66b91e38e6"
                  :rows [{:state "selected Page with visible ports"
                          :viewport "360 by 800" :displayMode "ordinary Flow"
                          :surfaces ["none"]}]
                  :zooms [25 100 200]
                  :observationTask "browser-observation:FLOW_STYLESHEET_EXTRACTION_TARGET"
                  :observationPath "flowGraph.styles.measurements.states"
                  :resultPaths {:equivalence "flowGraph.styles.equivalence"
                                :reducedMotion "flowGraph.styles.reducedMotion"
                                :forcedColors "flowGraph.styles.forcedColors"
                                :keyboardFocus "flowGraph.styles.keyboardFocus"
                                :canonicalStable "flowGraph.styles.canonicalStable"
                                :packageAssets "flowGraph.styles.assetsLoaded"}}
        evidence {:flowStyles {:installedObservation true :runtimeContract contract
                               :packageAssets true}}]
    (with-redefs-fn {#'vtd014/production-evidence! (constantly evidence)}
      #(is (map? (runtime/run-execution! execution modular/handlers))))
    (with-redefs-fn {#'vtd014/production-evidence!
                     (constantly (assoc-in evidence [:flowStyles :runtimeContract :rows 0 :viewport]
                                           "desktop"))}
      #(is (thrown-with-msg? clojure.lang.ExceptionInfo
                             #"declared matrix"
                             (runtime/run-execution! execution modular/handlers))))))

(defn- invoke-handler
  ([handlers world text captures]
   (invoke-handler handlers world text captures nil))
  ([handlers world text captures example]
   ((:handler (first (filter #(re-matches (:pattern %) text) handlers)))
    world example captures)))

(deftest modular-outline-handlers-reject-disconnected-example-values
  (let [vtd006-handlers (vtd006/handlers {})
        vtd006-evidence {:registryValidation
                         {:duplicateId true :unknownId true :configurationDifference true
                          :owningPack true :duplicateOutput true :hookShape true
                          :beforeResourcesStarted true :emptyDefinitionsBeforeResources true}}
        vtd014-handlers (vtd014/handlers {:example-values (fn [_ captures] captures)})
        vtd014-evidence {:execution {:prerequisites
                                     {:approvedFirstLaunch true :workspaceNarrow true
                                      :deniedBeforeLaunch true
                                      :rows {"the workspace sandbox cannot bind"
                                             {:firstRunAction "use the existing scoped approval route immediately"
                                              :launchResult "the child launches once with its declared access"
                                              :route "scoped-command-approval" :launchCount 1}}}}
                         :flowReloadLifecycle
                         {:fixtures {:delayedInitialization true :delayedActiveProject true
                                     :emptyShellRejected true :initializerFailureStaged true}}}]
    (with-redefs-fn {#'vtd006/production-evidence! (constantly vtd006-evidence)}
      #(let [world (invoke-handler vtd006-handlers {}
                                   "the side-panel target request contains a duplicate logical target id"
                                   ["<invalid_contract>"]
                                   {"invalid_contract" "a duplicate logical target id"})]
         (is (thrown? Exception
                      (invoke-handler vtd006-handlers world
                                      "execution is rejected with the unknown id"
                                      ["<diagnostic>"] {"diagnostic" "the unknown id"})))))
    (with-redefs-fn {#'vtd014/production-evidence! (constantly vtd014-evidence)}
      #(do
         (let [world (invoke-handler vtd014-handlers {}
                                     "canonical task a workspace-only unit task declares no restricted host capability"
                                     ["a workspace-only unit task" "no restricted host capability"])]
           (is (thrown? Exception
                        (invoke-handler vtd014-handlers world
                                        "its current agent environment is the workspace sandbox cannot bind"
                                        ["the workspace sandbox cannot bind"]))))
         (let [world (invoke-handler vtd014-handlers {}
                                     "FLOW_WORKSPACE_CONTROLS_TARGET has begun one registered browser reload" [])
               world (invoke-handler vtd014-handlers world
                                     "lifecycle readiness observes the current document generation has not completed initialization"
                                     ["the current document generation has not completed initialization"])]
           (is (thrown? Exception
                        (invoke-handler vtd014-handlers world
                                        "readiness produces report ready" ["report ready"]))))))))

(deftest vtd014-priority-relations-reject-every-mutated-example-field
  (let [feature (gherkin/parse-file "features/modular-verification-packs.feature")
        scenario-names #{"Modular verification packs 131"
                         "Modular verification packs 152"
                         "Modular verification packs 153"
                         "Modular verification packs 154"
                         "Modular verification packs 155"
                         "Modular verification packs 159"
                         "Modular verification packs 162"}
        executions (filter #(contains? scenario-names (get-in % [:scenario :name]))
                           (runtime/expand-executions feature))
        handlers modular/priority-handlers
        evidence {:runIntent {:deferred {:ordinaryConservation true :unresolved true}}
                  :styles {"invalid or undeclared boundary" {:validationBlocked true}}
                  :flowStyles {:declaredBoundaries true}
                  :taskSuccession {:plannerProjection {:invalidBlocked true}}}
        invoke-first (fn [execution example]
                       (let [text (get-in execution [:scenario :steps 0 :text])
                             match (some (fn [{:keys [pattern] :as handler}]
                                           (when-let [captures (re-matches pattern text)]
                                             [handler (vec (rest captures))]))
                                         handlers)]
                         (is (some? match) text)
                         ((get-in match [0 :handler]) {} example (second match))))]
    (is (= 7 (count handlers)))
    (is (= 34 (count executions)))
    (with-redefs-fn {#'vtd014/production-evidence! (constantly evidence)}
      #(doseq [execution executions]
         (is (map? (invoke-first execution (:example execution))) (:name execution))
         (doseq [[key value] (:example execution)]
           (is (thrown? Exception
                        (invoke-first execution
                                      (assoc (:example execution) key (str value "!"))))
               (str (:name execution) " rejects " key)))))))

(deftest ownership-readiness-steps-use-dedicated-handlers
  (let [feature (gherkin/parse-file "features/settled-candidate-final-verification.feature")
        executions (filter #(re-matches #"Settled candidate final verification 0(?:1[6-9]|20)/example_[0-9]+"
                                        (:name %))
                           (runtime/expand-executions feature))]
    (is (= 10 (count executions)))
    (doseq [step (mapcat :steps executions)]
      (let [handler (first (filter #(re-matches (:pattern %) (:text step)) modular/handlers))]
        (is (some? handler) (:text step))
        (is (not= "^.*$" (str (:pattern handler))) (:text step)))))
  (let [diagnostic (first (filter #(re-matches (:pattern %) "it executes TARGET-A only")
                                  modular/handlers))
        preflight (first (filter #(re-matches (:pattern %)
                                             "it executes no task and creates no receipt, incident, package, or evidence eligibility")
                                 modular/handlers))
        preparation (first (filter #(re-matches (:pattern %)
                                               "its <preparation_stage> completes focused review")
                                   modular/handlers))
        evidence-range (first (filter #(re-matches (:pattern %)
                                                  "the product evidence range cannot contain the <preparation_change> that narrows its own plan")
                                      modular/handlers))]
    (is (= "^it executes (<retry_scope>|TARGET-A only|that case only|the setup boundary only and no target workflow|that exact task|no retry until the progress contract is repaired)$"
           (str (:pattern diagnostic))))
    (is (= "^it executes no task and creates no receipt, incident, package, or evidence eligibility$"
           (str (:pattern preflight))))
    (is (= "^its (<preparation_stage>|standing-authorized ownership preparation|standing-authorized verification-slice preparation|standing-authorized preparation stage) completes focused review$"
           (str (:pattern preparation))))
    (is (= "^the product evidence range cannot contain the (<preparation_change>|ownership change|verification-slice change) that narrows its own plan$"
           (str (:pattern evidence-range))))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-17T12:47:48.598331558+02:00", :module-hash "-392025800", :forms [{:id "form/0/in-ns", :kind "in-ns", :line 1, :end-line 1, :hash "-1677165460"} {:id "form/1/deftest", :kind "deftest", :line 3, :end-line 12, :hash "1821403176"} {:id "form/2/deftest", :kind "deftest", :line 14, :end-line 25, :hash "-363311847"} {:id "form/3/deftest", :kind "deftest", :line 27, :end-line 45, :hash "272130773"} {:id "form/4/deftest", :kind "deftest", :line 47, :end-line 52, :hash "-740854160"} {:id "form/5/deftest", :kind "deftest", :line 54, :end-line 80, :hash "842940222"} {:id "defn-/invoke-handler", :kind "defn-", :line 82, :end-line 87, :hash "1056761188"} {:id "form/7/deftest", :kind "deftest", :line 89, :end-line 131, :hash "-1316076482"} {:id "form/8/deftest", :kind "deftest", :line 133, :end-line 166, :hash "-71976303"} {:id "form/9/deftest", :kind "deftest", :line 168, :end-line 196, :hash "1691437449"}]}
;; clj-mutate-manifest-end
