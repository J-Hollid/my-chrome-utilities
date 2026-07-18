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

(def ^:private scenario-assertion-fragments
  [[:created ["blank project" "contextual editor"]]
   [:search ["search"]]
   [:bulk ["bulk" "100 valid"]]
   [:release ["release dialog" "publish"]]
   [:documentation ["documentation" "clipboard"]]
   [:flow ["flow" "journey"]]
   [:assignment ["assignment" "pinned revision"]]
   [:editor ["flow editor" "structured" "optional"]]
   [:coverage ["coverage" "500 properties" "50 flows"]]
   [:save-failure ["save failed" "retry" "storage adapter"]]
   [:atomic-rollback ["persisted bytes" "prior persisted bytes" "write fails"]]
   [:conflict-resolution ["stale" "reapply" "field-level revision conflict"]]
   [:review ["release review" "historical revision"]]
   [:import ["file chooser" "import"]]
   [:responsive ["360" "narrow pane" "primary scroll"]]])

(def ^:private scenario-assertions
  {:created #(assert-created! %)
   :search #(assert-search! %)
   :bulk #(assert-bulk! %)
   :release #(assert-release! %)
   :documentation #(assert-documentation! (:corrections %))
   :flow #(assert-flow! (:corrections %))
   :assignment #(assert-assignment! (:corrections %))
   :decisive #(assert-decisive! (:corrections %))
   :editor #(assert-editor! (:corrections %))
   :coverage #(assert-coverage! (:corrections %))
   :save-failure #(assert-save-failure! (:corrections %))
   :atomic-rollback #(assert-atomic-rollback! (:corrections %))
   :conflict-resolution #(assert-conflict-resolution! (:corrections %))
   :review #(assert-review! (:corrections %))
   :import #(assert-import! (:corrections %))
   :responsive #(assert-responsive! (:corrections %))})

(defn- includes-any? [text fragments]
  (some #(str/includes? text %) fragments))

(defn- decisive-scenario? [text]
  (or (str/includes? text "markerless")
      (every? #(str/includes? text %) ["retail" "trade"])))

(defn- scenario-assertion-labels [text]
  (cond-> (->> scenario-assertion-fragments
               (keep (fn [[label fragments]]
                       (when (includes-any? text fragments) label)))
               vec)
    (decisive-scenario? text) (conj :decisive)))

(defn assert-runtime-scenario! [observed scenario-steps]
  (let [text (str/lower-case (str/join " " scenario-steps))
        labels (scenario-assertion-labels text)]
    (doseq [label labels]
      ((scenario-assertions label) observed))
    (support/assert! (seq labels)
                     "The focused browser adapter does not execute an assertion owned by this scenario."
                     {:steps scenario-steps})
    {:scenarioAssertions labels :observation observed}))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-18T14:33:02.840548903+02:00", :module-hash "-1565161406", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-38261127"} {:id "defn-/assert-created!", :kind "defn-", :line 5, :end-line 6, :hash "741343283"} {:id "defn-/assert-search!", :kind "defn-", :line 7, :end-line 8, :hash "356890520"} {:id "defn-/assert-bulk!", :kind "defn-", :line 9, :end-line 10, :hash "660199247"} {:id "defn-/assert-release!", :kind "defn-", :line 11, :end-line 12, :hash "1754877658"} {:id "defn-/assert-layout!", :kind "defn-", :line 13, :end-line 14, :hash "-2069501695"} {:id "defn-/assert-documentation!", :kind "defn-", :line 15, :end-line 16, :hash "1820971250"} {:id "defn-/assert-flow!", :kind "defn-", :line 17, :end-line 18, :hash "1232678231"} {:id "defn-/assert-assignment!", :kind "defn-", :line 19, :end-line 20, :hash "1523199377"} {:id "defn-/assert-decisive!", :kind "defn-", :line 21, :end-line 22, :hash "1149966125"} {:id "defn-/assert-editor!", :kind "defn-", :line 23, :end-line 24, :hash "-1766293860"} {:id "defn-/assert-coverage!", :kind "defn-", :line 25, :end-line 26, :hash "1684807517"} {:id "defn-/assert-save-failure!", :kind "defn-", :line 27, :end-line 33, :hash "906691435"} {:id "defn-/assert-atomic-rollback!", :kind "defn-", :line 34, :end-line 38, :hash "-939091929"} {:id "defn-/assert-conflict-resolution!", :kind "defn-", :line 39, :end-line 47, :hash "1483489936"} {:id "defn-/assert-review!", :kind "defn-", :line 48, :end-line 49, :hash "-2125047744"} {:id "defn-/assert-import!", :kind "defn-", :line 50, :end-line 51, :hash "1071268371"} {:id "defn-/assert-responsive!", :kind "defn-", :line 52, :end-line 53, :hash "-1345004481"} {:id "defn/assert-runtime!", :kind "defn", :line 55, :end-line 74, :hash "2009329272"} {:id "def/scenario-assertion-fragments", :kind "def", :line 76, :end-line 91, :hash "-675920017"} {:id "def/scenario-assertions", :kind "def", :line 93, :end-line 109, :hash "1372875521"} {:id "defn-/includes-any?", :kind "defn-", :line 111, :end-line 112, :hash "1734327060"} {:id "defn-/decisive-scenario?", :kind "defn-", :line 114, :end-line 116, :hash "1690368481"} {:id "defn-/scenario-assertion-labels", :kind "defn-", :line 118, :end-line 123, :hash "-324339548"} {:id "defn/assert-runtime-scenario!", :kind "defn", :line 125, :end-line 133, :hash "-2090900873"}]}
;; clj-mutate-manifest-end
