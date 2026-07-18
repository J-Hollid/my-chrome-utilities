(ns acceptance.specification-project-program-steps-test
  (:require [acceptance.steps.specification-project-program]
            [acceptance.steps.specification-project-program-assertions]
            [clojure.test :refer [deftest is]]))

(defn- runtime-assertion []
  (deref (ns-resolve 'acceptance.steps.specification-project-program-assertions
                     'assert-runtime!)))

(deftest validates-specification-project-runtime-observation
  (let [observed {:created {:empty true
                            :workspace true
                            :status "Saved"
                            :context "Shop data specification · Production · Draft"
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
    (is (= observed ((runtime-assertion) observed)))))
