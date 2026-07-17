(ns acceptance.steps.specification-project-program-assertions
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- assert-created! [observed]
  (support/assert! (and (get-in observed [:created :empty]) (get-in observed [:created :workspace]) (= "Saved" (get-in observed [:created :status])) (str/includes? (get-in observed [:created :context]) "Production") (= 10 (count (get-in observed [:created :tree])))) "The actual project workspace did not create and render a durable blank project." observed))
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
  (support/assert! (and (= {:properties 500 :flows 50 :flowSteps 3} (:graph corrections)) (= [1] (vec (vals (get-in corrections [:flow :occurrences])))) (get-in corrections [:flow :persisted])) "Structured temporal flow state or benchmark graph persistence changed." corrections))
(defn- assert-assignment! [corrections]
  (support/assert! (and (= "1 assignment" (get-in corrections [:assignmentLifecycle :search :count])) (false? (get-in corrections [:assignmentLifecycle :search :empty])) (= 2 (count (set (get-in corrections [:assignmentLifecycle :ids])))) (get-in corrections [:assignmentLifecycle :stableId]) (get-in corrections [:assignmentLifecycle :conditionPreserved]) (= 1 (get-in corrections [:assignmentLifecycle :pinnedRevision])) (get-in corrections [:assignmentLifecycle :publishedUnchanged]) (get-in corrections [:assignmentLifecycle :blankExcluded]) (str/includes? (get-in corrections [:assignmentLifecycle :blankMessage]) "routing fields")) "Truthful assignment rows, identity, pinned revision, structured conditions, placeholder exclusion, or draft isolation changed." corrections))
(defn- assert-decisive! [corrections]
  (support/assert! (and (= ["retail checkout" "trade checkout"] [(get-in corrections [:decisive :retail :selector]) (get-in corrections [:decisive :trade :selector])]) (not= (get-in corrections [:decisive :retail :winner]) (get-in corrections [:decisive :trade :winner])) (not= (get-in corrections [:decisive :retail :schemaId]) (get-in corrections [:decisive :trade :schemaId])) (false? (get-in corrections [:decisive :markerPresent])) (false? (get-in corrections [:decisive :ambiguous]))) "Markerless Retail and Trade prior-flow resolution changed." corrections))
(defn- assert-editor! [corrections]
  (support/assert! (and (= ["Product" "Upsell" "Retail confirmation"] (mapv :name (get-in corrections [:structuredEditor :retailSteps]))) (= ["Trade account" "Trade confirmation"] (mapv :name (get-in corrections [:structuredEditor :tradeSteps]))) (= 5 (get-in corrections [:structuredEditor :retailSteps 0 :maximum])) (get-in corrections [:structuredEditor :retailSteps 1 :optional])) "Accessible structured flow-step authoring changed." corrections))
(defn- assert-coverage! [corrections]
  (support/assert! (and (<= (get-in corrections [:coverage :rendered]) 40) (< (get-in corrections [:coverage :duration]) 100) (str/includes? (get-in corrections [:coverage :deepLink]) "kind=") (get-in corrections [:coverage :focused])) "Coverage virtualization, benchmark, or exact-field deep linking changed." corrections))
(defn- assert-save-failure! [corrections]
  (support/assert! (= {:status "Save failed" :retryVisible true :valuePresent true :retried "Saved" :count 1} (:failed corrections)) "Recoverable autosave did not retain and retry one draft transaction." corrections))
(defn- assert-review! [corrections]
  (support/assert! (and (str/includes? (get-in corrections [:releaseReview :summary]) "structured changes") (= 1 (get-in corrections [:releaseReview :publishedBefore])) (get-in corrections [:releaseReview :focusRestored]) (:restoreAvailable corrections)) "Structured release review, immutable prior release, restore, or focus behavior changed." corrections))
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
    (assert-review! corrections)
    (assert-import! corrections)
    (assert-responsive! corrections))
  observed)
