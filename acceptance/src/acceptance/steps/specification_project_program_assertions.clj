(ns acceptance.steps.specification-project-program-assertions
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- assert-created! [observed]
  (support/assert! (and (get-in observed [:created :empty]) (get-in observed [:created :workspace]) (str/starts-with? (get-in observed [:created :status]) "Saved") (str/includes? (get-in observed [:created :context]) "Production") (str/includes? (get-in observed [:created :context]) "Preview draft") (= 10 (count (get-in observed [:created :tree])))) "The actual project workspace did not create and render a durable blank project." observed))
(defn- assert-search! [observed]
  (support/assert! (= {:rows ["Purchase"] :query "Purchase"} (:search observed)) "Production global search did not return the stored event." observed))
(defn- assert-bulk! [observed]
  (support/assert! (and (= 100 (get-in observed [:bulk :rowCount])) (= 0 (:afterUndo observed)) (get-in observed [:bulk :undoEnabled])) "Bulk authoring and transactional Undo did not cross the production persistence boundary." observed))
(defn- assert-release! [observed]
  (support/assert! (and (str/includes? (:preflight observed) "Ready to publish") (get-in observed [:release :open]) (not (get-in observed [:release :confirmDisabled])) (= 1 (get-in observed [:stored :releases])) (not (get-in observed [:stored :draft]))) "Preflight and atomic release did not complete through actual controls." observed))
(defn- assert-layout! [observed]
  (support/assert! (and (:reloadPreserved observed) (<= (get-in observed [:layout :renderedRows]) 40) (= "auto" (get-in observed [:layout :workspaceOverflow]))) "Reload fidelity or bounded workspace rendering changed." observed))
(defn- assert-documentation! [corrections]
  (support/assert! (and (= (get-in corrections [:documentation :preview]) (get-in corrections [:documentation :plain])) (str/includes? (get-in corrections [:documentation :html]) "omitted flows") (get-in corrections [:documentation :focusRestored])) "Actual rich/plain clipboard output, loss metadata, or documentation focus restoration changed." corrections))
(defn- assert-flow! [corrections]
  (support/assert! (and (= {:properties 500 :flows 50 :flowSteps 3} (:graph corrections)) (= [1 5] (sort (vals (get-in corrections [:flow :occurrences])))) (get-in corrections [:flow :persisted])) "Structured temporal flow state or benchmark graph persistence changed." corrections))
(defn- assert-assignment! [corrections]
  (support/assert! (and (= "1 assignment" (get-in corrections [:assignmentLifecycle :search :count])) (false? (get-in corrections [:assignmentLifecycle :search :empty])) (= 2 (count (set (get-in corrections [:assignmentLifecycle :ids])))) (get-in corrections [:assignmentLifecycle :stableId]) (get-in corrections [:assignmentLifecycle :conditionPreserved]) (= 3 (get-in corrections [:assignmentLifecycle :pinnedRevision])) (get-in corrections [:assignmentLifecycle :publishedUnchanged]) (get-in corrections [:assignmentLifecycle :sidePanelSynced]) (get-in corrections [:assignmentLifecycle :legacyAfterSave]) (get-in corrections [:assignmentLifecycle :projectAuthoritativeAfterSave]) (get-in corrections [:assignmentLifecycle :blankExcluded]) (str/includes? (get-in corrections [:assignmentLifecycle :blankMessage]) "routing fields")) "Truthful assignment rows, identity, pinned revision, structured conditions, placeholder exclusion, draft isolation, or schema-library preservation changed." corrections))
(defn- assert-decisive! [corrections]
  (support/assert! (and (= ["retail checkout" "trade checkout"] [(get-in corrections [:decisive :retail :selector]) (get-in corrections [:decisive :trade :selector])]) (not= (get-in corrections [:decisive :retail :winner]) (get-in corrections [:decisive :trade :winner])) (not= (get-in corrections [:decisive :retail :schemaId]) (get-in corrections [:decisive :trade :schemaId])) (false? (get-in corrections [:decisive :markerPresent])) (false? (get-in corrections [:decisive :ambiguous]))) "Markerless Retail and Trade prior-flow resolution changed." corrections))
(defn- assert-editor! [corrections]
  (support/assert! (and (= ["Product" "Upsell" "Retail confirmation"] (mapv :name (get-in corrections [:structuredEditor :retailSteps]))) (= ["Trade account" "Trade confirmation"] (mapv :name (get-in corrections [:structuredEditor :tradeSteps]))) (= 5 (get-in corrections [:structuredEditor :retailSteps 0 :maximum])) (get-in corrections [:structuredEditor :retailSteps 1 :optional])) "Accessible structured flow-step authoring changed." corrections))
(defn- assert-coverage! [corrections]
  (support/assert! (and (<= (get-in corrections [:coverage :rendered]) 40) (< (get-in corrections [:coverage :duration]) 100) (str/includes? (get-in corrections [:coverage :deepLink]) "kind=") (get-in corrections [:coverage :focused])) "Coverage virtualization, benchmark, or exact-field deep linking changed." corrections))
(defn- assert-save-failure! [corrections]
  (support/assert! (and (str/starts-with? (get-in corrections [:failed :status]) "Save failed")
                        (get-in corrections [:failed :retryVisible])
                        (get-in corrections [:failed :valuePresent])
                        (str/starts-with? (get-in corrections [:failed :retried]) "Saved")
                        (= 1 (get-in corrections [:failed :count])))
                   "Recoverable autosave did not retain and retry one draft transaction." corrections))
(defn- assert-atomic-rollback! [corrections]
  (support/assert! (and (get-in corrections [:atomicRollback :projectBytesUnchanged])
                        (get-in corrections [:atomicRollback :schemaBytesUnchanged])
                        (str/starts-with? (get-in corrections [:atomicRollback :status]) "Save failed"))
                   "A failed canonical-envelope write mutated persisted project or compatibility bytes." corrections))
(defn- assert-conflict-resolution! [corrections]
  (support/assert! (and (get-in corrections [:conflictResolution :open])
                        (= ["Reload current revision" "Reapply pending edit" "Merge selected fields"]
                           (get-in corrections [:conflictResolution :actions]))
                        (get-in corrections [:conflictResolution :externalPreserved])
                        (get-in corrections [:conflictResolution :pendingPreserved])
                        (get-in corrections [:conflictResolution :closed]))
                   "Rendered Reload, Reapply, or field-level Merge lost a concurrent edit."
                   corrections))
(defn- assert-review! [corrections]
  (support/assert! (and (str/includes? (get-in corrections [:releaseReview :summary]) "structured changes") (= 1 (get-in corrections [:releaseReview :publishedBefore])) (get-in corrections [:releaseReview :focusRestored]) (get-in corrections [:releaseReview :legacyPreserved]) (get-in corrections [:releaseReview :projectAuthoritative]) (:restoreAvailable corrections)) "Structured release review, immutable prior release, unrelated-schema preservation, project-schema authority, restore, or focus behavior changed." corrections))
(defn- assert-import! [corrections]
  (support/assert! (and (get-in corrections [:importReview :blocked]) (str/includes? (get-in corrections [:importReview :remapped]) "Collision remapped") (get-in corrections [:importReview :committed])) "Staged collision resolution and atomic project import changed." corrections))
(defn- assert-responsive! [corrections]
  (support/assert! (and (= [360 520 720 1280] (mapv :width (:layouts corrections))) (every? #(and (zero? (:pageOverflow %)) (<= (:rendered %) 40)) (:layouts corrections))) "Responsive decisive-workflow evidence changed." corrections))

(defn assert-runtime! [observed]
  (assert-created! observed)
  (assert-search! observed)
  (assert-bulk! observed)
  (assert-release! observed)
  (assert-layout! observed)
  (let [corrections (:corrections observed)]
    (assert-documentation! corrections)
    (assert-flow! corrections)
    (assert-assignment! corrections)
    (assert-decisive! corrections)
    (assert-editor! corrections)
    (assert-coverage! corrections)
    (assert-save-failure! corrections)
    (assert-atomic-rollback! corrections)
    (assert-conflict-resolution! corrections)
    (assert-review! corrections)
    (assert-import! corrections)
    (assert-responsive! corrections))
  observed)

(defn assert-runtime-scenario! [observed scenario-steps]
  (let [text (str/lower-case (str/join " " scenario-steps))
        corrections (:corrections observed)
        asserted (transient [])
        check! (fn [label predicate assertion]
                 (when predicate
                   (assertion)
                   (conj! asserted label)))]
    (check! :created (or (str/includes? text "blank project")
                         (str/includes? text "contextual editor"))
            #(assert-created! observed))
    (check! :search (str/includes? text "search") #(assert-search! observed))
    (check! :bulk (or (str/includes? text "bulk")
                      (str/includes? text "100 valid"))
            #(assert-bulk! observed))
    (check! :release (or (str/includes? text "release dialog")
                         (str/includes? text "publish"))
            #(assert-release! observed))
    (check! :documentation (or (str/includes? text "documentation")
                               (str/includes? text "clipboard"))
            #(assert-documentation! corrections))
    (check! :flow (or (str/includes? text "flow")
                      (str/includes? text "journey"))
            #(assert-flow! corrections))
    (check! :assignment (or (str/includes? text "assignment")
                            (str/includes? text "pinned revision"))
            #(assert-assignment! corrections))
    (check! :decisive (or (str/includes? text "markerless")
                          (and (str/includes? text "retail")
                               (str/includes? text "trade")))
            #(assert-decisive! corrections))
    (check! :editor (or (str/includes? text "flow editor")
                        (str/includes? text "structured")
                        (str/includes? text "optional"))
            #(assert-editor! corrections))
    (check! :coverage (or (str/includes? text "coverage")
                          (str/includes? text "500 properties")
                          (str/includes? text "50 flows"))
            #(assert-coverage! corrections))
    (check! :save-failure (or (str/includes? text "save failed")
                              (str/includes? text "retry")
                              (str/includes? text "storage adapter"))
            #(assert-save-failure! corrections))
    (check! :atomic-rollback (or (str/includes? text "persisted bytes")
                                 (str/includes? text "prior persisted bytes")
                                 (str/includes? text "write fails"))
            #(assert-atomic-rollback! corrections))
    (check! :conflict-resolution (or (str/includes? text "stale")
                                     (str/includes? text "reapply")
                                     (str/includes? text "field-level revision conflict"))
            #(assert-conflict-resolution! corrections))
    (check! :review (or (str/includes? text "release review")
                        (str/includes? text "historical revision"))
            #(assert-review! corrections))
    (check! :import (or (str/includes? text "file chooser")
                        (str/includes? text "import"))
            #(assert-import! corrections))
    (check! :responsive (or (str/includes? text "360")
                            (str/includes? text "narrow pane")
                            (str/includes? text "primary scroll"))
            #(assert-responsive! corrections))
    (let [labels (persistent! asserted)]
      (support/assert! (seq labels)
                       "The focused browser adapter does not execute an assertion owned by this scenario."
                       {:steps scenario-steps})
      {:scenarioAssertions labels :observation observed})))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-18T03:01:27.735809883+02:00", :module-hash "-1403671508", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-38261127"} {:id "defn-/assert-created!", :kind "defn-", :line 5, :end-line 6, :hash "338786058"} {:id "defn-/assert-search!", :kind "defn-", :line 7, :end-line 8, :hash "356890520"} {:id "defn-/assert-bulk!", :kind "defn-", :line 9, :end-line 10, :hash "660199247"} {:id "defn-/assert-release!", :kind "defn-", :line 11, :end-line 12, :hash "1754877658"} {:id "defn-/assert-layout!", :kind "defn-", :line 13, :end-line 14, :hash "-2069501695"} {:id "defn-/assert-documentation!", :kind "defn-", :line 15, :end-line 16, :hash "1820971250"} {:id "defn-/assert-flow!", :kind "defn-", :line 17, :end-line 18, :hash "1232678231"} {:id "defn-/assert-assignment!", :kind "defn-", :line 19, :end-line 20, :hash "1523199377"} {:id "defn-/assert-decisive!", :kind "defn-", :line 21, :end-line 22, :hash "1149966125"} {:id "defn-/assert-editor!", :kind "defn-", :line 23, :end-line 24, :hash "-1766293860"} {:id "defn-/assert-coverage!", :kind "defn-", :line 25, :end-line 26, :hash "1684807517"} {:id "defn-/assert-save-failure!", :kind "defn-", :line 27, :end-line 28, :hash "2000473343"} {:id "defn-/assert-atomic-rollback!", :kind "defn-", :line 29, :end-line 30, :hash "65901895"} {:id "defn-/assert-review!", :kind "defn-", :line 31, :end-line 32, :hash "-2125047744"} {:id "defn-/assert-import!", :kind "defn-", :line 33, :end-line 34, :hash "1071268371"} {:id "defn-/assert-responsive!", :kind "defn-", :line 35, :end-line 36, :hash "-1345004481"} {:id "defn/assert-runtime!", :kind "defn", :line 38, :end-line 56, :hash "17239381"}]}
;; clj-mutate-manifest-end
