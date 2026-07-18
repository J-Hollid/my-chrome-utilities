(ns acceptance.specification-project-program-steps-test
  (:require [acceptance.steps.specification-project-program]
            [acceptance.steps.specification-project-program-assertions]
            [clojure.test :refer [deftest is]]))

(defn- runtime-assertion []
  (deref (ns-resolve 'acceptance.steps.specification-project-program-assertions
                     'assert-runtime!)))

(defn- scenario-runtime-assertion []
  (deref (ns-resolve 'acceptance.steps.specification-project-program-assertions
                     'assert-runtime-scenario!)))

(defn- example-validator []
  (deref (ns-resolve 'acceptance.steps.specification-project-program
                     'validate-example!)))

(defn- program-helper [name]
  (deref (ns-resolve 'acceptance.steps.specification-project-program name)))

(deftest routes-scenarios-to-focused-verification
  (let [verification-script (program-helper 'verification-script)
        detailed? (program-helper 'detailed-r02-scenario?)
        focused? (program-helper 'focused-browser-scenario?)
        command-evidence (program-helper 'command-evidence)]
    (is (= "test/data-layer-specification-bulk-test.mjs"
           (verification-script "staged bulk requirements")))
    (is (= "test/data-layer-specification-assurance-test.mjs"
           (verification-script "truthful preflight release correction")))
    (is (= "test/data-layer-specification-project-test.mjs"
           (verification-script "project workspace")))
    (is (detailed? {:acceptance/feature-name
                    "Data layer unified specification evaluation runtime"}))
    (is (not (detailed? {:acceptance/feature-name
                         "Data layer durable authoring drafts"})))
    (is (focused? {:acceptance/feature-name
                   "Data layer canonical project schema drafts runtime"
                   :acceptance/scenario-index 13}))
    (is (not (focused? {:acceptance/feature-name
                        "Data layer canonical project schema drafts runtime"
                        :acceptance/scenario-index 12})))
    (is (= {:scenarioId "Feature#1"}
           (command-evidence true {:out "build output\n{\"scenarioId\":\"Feature#1\"}\n"})))
    (is (nil? (command-evidence true {:out "build output\n"})))
    (is (nil? (command-evidence false {:out "{\"ignored\":true}\n"})))))

(deftest validates-complete-specification-project-example-rows
  (let [validate! (example-validator)
        model-row {"review_state" "unresolved matcher tie"
                   "confirmation_state" "blocked"
                   "guidance" "Resolve applicability ambiguity"}
        runtime-row {"gate_state" "unresolved ambiguity"
                     "outcome" "blocked at its linked matcher"}]
    (is (= {} (validate! :model {})))
    (is (= model-row (validate! :model model-row)))
    (is (= runtime-row (validate! :runtime runtime-row)))
    (is (thrown? clojure.lang.ExceptionInfo
                 (validate! :runtime (assoc runtime-row "outcome" "published"))))
    (is (thrown? clojure.lang.ExceptionInfo
                 (validate! :model runtime-row)))))

(deftest validates-specification-project-runtime-observation
  (let [observed {:created {:empty true
                            :workspace true
                            :status "Saved"
                            :context "Shop data specification · Production · Preview draft"
                            :tree (vec (range 10))}
                  :search {:rows ["Purchase"] :query "Purchase"}
                  :bulk {:rowCount 100 :undoEnabled true}
                  :afterUndo 0
                  :preflight "Ready to publish"
                  :release {:open true :confirmDisabled false}
                  :stored {:releases 1 :draft false}
                  :reloadPreserved true
                  :layout {:renderedRows 20 :workspaceOverflow "auto"}
                  :corrections
                  {:documentation {:preview "Full-fidelity Specification Project"
                                   :plain "Full-fidelity Specification Project"
                                   :html "Full-fidelity Specification Project; omitted flows"
                                   :focusRestored true}
                   :restoreAvailable true
                   :graph {:properties 500 :flows 50 :flowSteps 3}
                   :flow {:occurrences {"retail" 5 "purchase" 1} :persisted true}
                   :assignmentLifecycle
                   {:search {:count "1 assignment" :empty false}
                    :ids ["assignment-1" "assignment-2"]
                    :stableId true
                    :conditionPreserved true
                    :pinnedRevision 3
                    :publishedUnchanged true
                    :sidePanelSynced true
                    :legacyAfterSave true
                    :projectAuthoritativeAfterSave true
                    :blankExcluded true
                    :blankMessage "Complete the routing fields"}
                   :decisive {:retail {:selector "retail checkout"
                                       :winner "retail-assignment"
                                       :schemaId "retail-schema"}
                              :trade {:selector "trade checkout"
                                      :winner "trade-assignment"
                                      :schemaId "trade-schema"}
                              :markerPresent false
                              :ambiguous false}
                   :structuredEditor
                   {:retailSteps [{:name "Product" :maximum 5}
                                  {:name "Upsell" :optional true}
                                  {:name "Retail confirmation"}]
                    :tradeSteps [{:name "Trade account"}
                                 {:name "Trade confirmation"}]}
                   :coverage {:rendered 40
                              :duration 20
                              :deepLink "?kind=profiles&entity=profile-1"
                              :focused true}
                   :failed {:status "Save failed"
                            :retryVisible true
                            :valuePresent true
                            :retried "Saved"
                            :count 1}
                   :atomicRollback {:projectBytesUnchanged true
                                    :schemaBytesUnchanged true
                                    :status "Save failed"}
                   :conflictResolution {:open true
                                        :actions ["Reload current revision"
                                                  "Reapply pending edit"
                                                  "Merge selected fields"]
                                        :externalPreserved true
                                        :pendingPreserved true
                                        :closed true}
                   :releaseReview {:summary "structured changes"
                                   :publishedBefore 1
                                   :focusRestored true
                                   :legacyPreserved true
                                   :projectAuthoritative true}
                   :importReview {:blocked true
                                  :remapped "Collision remapped"
                                  :committed true}
                   :layouts (mapv (fn [width]
                                    {:width width :pageOverflow 0 :rendered 40})
                                  [360 520 720 1280])}}]
    (is (= observed ((runtime-assertion) observed)))
    (is (= [:assignment]
           (:scenarioAssertions
            ((scenario-runtime-assertion)
             observed
             ["When two same-schema same-event assignments are created through rendered controls"
              "Then production storage contains two unequal stable IDs"]))))
    (is (= [:created :search :bulk :release :documentation :flow :assignment
            :editor :coverage :save-failure :atomic-rollback
            :conflict-resolution :review :import :responsive :decisive]
           (:scenarioAssertions
            ((scenario-runtime-assertion)
             observed
             ["A blank project contextual editor supports search, 100 valid bulk rows, a release dialog and publish"
              "Documentation clipboard flow journey assignment pinned revision markerless Retail Trade"
              "The flow editor is structured and optional with coverage for 500 properties and 50 flows"
              "Save failed retry storage adapter preserves prior persisted bytes when a write fails"
              "A stale field-level revision conflict supports reapply"
              "Release review historical revision file chooser import at 360 with a primary scroll owner"]))))
    (is (thrown? clojure.lang.ExceptionInfo
                 ((scenario-runtime-assertion) observed ["Then unrelated behavior happens"])))))
