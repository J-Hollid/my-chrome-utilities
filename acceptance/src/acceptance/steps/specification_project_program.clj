(ns acceptance.steps.specification-project-program
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-atomic-project-release.feature" "features/data-layer-atomic-project-release-runtime.feature"
   "features/data-layer-bulk-requirement-authoring.feature" "features/data-layer-bulk-requirement-authoring-runtime.feature"
   "features/data-layer-documentation-export.feature" "features/data-layer-documentation-export-runtime.feature"
   "features/data-layer-durable-authoring-drafts.feature" "features/data-layer-durable-authoring-drafts-runtime.feature"
   "features/data-layer-named-applicability.feature" "features/data-layer-named-applicability-runtime.feature"
   "features/data-layer-page-event-catalog.feature" "features/data-layer-page-event-catalog-runtime.feature"
   "features/data-layer-project-fixtures-preflight.feature" "features/data-layer-project-fixtures-preflight-runtime.feature"
   "features/data-layer-project-interchange.feature" "features/data-layer-project-interchange-runtime.feature"
   "features/data-layer-requirement-profile-composition.feature" "features/data-layer-requirement-profile-composition-runtime.feature"
   "features/data-layer-retail-trade-decisive-workflow.feature" "features/data-layer-retail-trade-decisive-workflow-runtime.feature"
   "features/data-layer-specification-project-foundation.feature" "features/data-layer-specification-project-foundation-runtime.feature"
   "features/data-layer-specification-workspace-navigation.feature" "features/data-layer-specification-workspace-navigation-runtime.feature"
   "features/data-layer-temporal-flow-authoring.feature" "features/data-layer-temporal-flow-authoring-runtime.feature"
   "features/data-layer-truthful-assignment-lifecycle.feature" "features/data-layer-truthful-assignment-lifecycle-runtime.feature"])

(def model-entry-steps
  ["Shop data specification release 3 has a durable working draft" "Shop data specification has a durable working draft"
   "Shop data specification contains published requirements, applicability, flows, fixtures, and release metadata"
   "schema Sitewide page context is open for editing in the side panel"
   "Shop data specification contains page Checkout confirmation and event Purchase"
   "Shop data specification is open in Specification Builder"
   "Shop data specification contains pages, events, applicability, profiles, and flows in a durable draft"
   "Shop data specification contains a draft and immutable releases"
   "Shop data specification contains profiles Sitewide, Commerce, Purchase, Retail confirmation, and Trade account"
   "a greenfield Specification Project is being authored without captured traffic"
   "no captured traffic and no Specification Project exist"
   "Shop data specification is open"
   "one accepted project edit transaction changes <project_content>"
   "a legacy Schema Library contains schemas, revisions, rules, assignments, examples, and supported imports"
   "compatibility migration cannot resolve one legacy reference"
   "Shop data specification is open in the full-page workspace"
   "projects Shop data specification and Admin data specification exist"
   "Shop data specification contains profiles, pages, events, applicability sets, flows, fixtures, and releases"
   "Sitewide page context revision 2 and Purchase revision 3 are published"])

(def runtime-entry-steps
  ["the built extension is running with production project draft, preflight, diff, release, persistence, and validation systems"
   "the built extension is running with production project transactions, import adapters, grid, and undo history"
   "the built extension is running with production Specification Builder and documentation export systems"
   "the built extension is running with production schema editor, draft persistence, and publication systems"
   "the built extension is running with production applicability editor, resolver, analyzer, persistence, and side-panel tester"
   "the built extension is running with production project catalog, persistence, indexing, and validation systems"
   "the built extension is running with production fixture runner, temporal evaluator, coverage, preflight, and navigation systems"
   "the built extension is running with production project serialization, migration, diff, import, export, persistence, and validation systems"
   "the built extension is running with production profile composition, provenance, validation, persistence, and impact systems"
   "the built unpacked extension is running in an isolated Chrome QA profile"
   "the built extension is running with production project storage, side-panel companion, and full-page workspace"
   "the built extension is running with the actual Specification Builder page and side-panel companion"
   "the built extension is running with production flow editor, temporal evaluator, persistence, and validation systems"
   "the built extension is running with production assignment editor, resolver, persistence, and schema publication systems"])

(def entry-modes (merge (zipmap model-entry-steps (repeat :model)) (zipmap runtime-entry-steps (repeat :runtime))))
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification! model-verified? "Specification Project model verification failed. " "node" "test/data-layer-specification-project-test.mjs"))
(defn- runtime-observation! []
  (support/cached-browser-observation! browser-observation {:adapter-env "SPECIFICATION_PROJECT_BROWSER_ADAPTER" :observation-key :specificationProject :runtime-error "Specification Project browser runtime failed." :missing-error "Specification Project browser evidence is missing."}))
(defn- assert-runtime! [observed]
  (support/assert! (and (get-in observed [:created :empty]) (get-in observed [:created :workspace]) (= "Saved" (get-in observed [:created :status])) (str/includes? (get-in observed [:created :context]) "Production") (= 10 (count (get-in observed [:created :tree])))) "The actual project workspace did not create and render a durable blank project." observed)
  (support/assert! (= {:rows ["Purchase"] :query "Purchase"} (:search observed)) "Production global search did not return the stored event." observed)
  (support/assert! (and (= 100 (get-in observed [:bulk :rowCount])) (= 0 (:afterUndo observed)) (get-in observed [:bulk :undoEnabled])) "Bulk authoring and transactional Undo did not cross the production persistence boundary." observed)
  (support/assert! (and (str/includes? (:preflight observed) "Ready to publish") (get-in observed [:release :open]) (not (get-in observed [:release :confirmDisabled])) (= 1 (get-in observed [:stored :releases])) (not (get-in observed [:stored :draft]))) "Preflight and atomic release did not complete through actual controls." observed)
  (support/assert! (and (:reloadPreserved observed) (<= (get-in observed [:layout :renderedRows]) 40) (= "auto" (get-in observed [:layout :workspaceOverflow]))) "Reload fidelity or bounded workspace rendering changed." observed)
  (let [corrections (:corrections observed)]
    (support/assert! (and (= (get-in corrections [:documentation :preview]) (get-in corrections [:documentation :plain])) (str/includes? (get-in corrections [:documentation :html]) "omitted flows") (get-in corrections [:documentation :focusRestored])) "Actual rich/plain clipboard output, loss metadata, or documentation focus restoration changed." corrections)
    (support/assert! (and (= {:properties 500 :flows 50 :flowSteps 3} (:graph corrections)) (= [1 5] (sort (vals (get-in corrections [:flow :occurrences])))) (get-in corrections [:flow :persisted])) "Structured temporal flow state or benchmark graph persistence changed." corrections)
    (support/assert! (and (= "1 assignment" (get-in corrections [:assignmentLifecycle :search :count])) (false? (get-in corrections [:assignmentLifecycle :search :empty])) (= 2 (count (set (get-in corrections [:assignmentLifecycle :ids])))) (get-in corrections [:assignmentLifecycle :stableId]) (get-in corrections [:assignmentLifecycle :conditionPreserved]) (= 3 (get-in corrections [:assignmentLifecycle :pinnedRevision])) (get-in corrections [:assignmentLifecycle :publishedUnchanged]) (get-in corrections [:assignmentLifecycle :sidePanelSynced]) (get-in corrections [:assignmentLifecycle :legacyAfterSave]) (get-in corrections [:assignmentLifecycle :projectAuthoritativeAfterSave]) (get-in corrections [:assignmentLifecycle :blankExcluded]) (str/includes? (get-in corrections [:assignmentLifecycle :blankMessage]) "routing fields")) "Truthful assignment rows, identity, pinned revision, structured conditions, placeholder exclusion, draft isolation, or schema-library preservation changed." corrections)
    (support/assert! (and (= ["retail checkout" "trade checkout"] [(get-in corrections [:decisive :retail :selector]) (get-in corrections [:decisive :trade :selector])]) (not= (get-in corrections [:decisive :retail :winner]) (get-in corrections [:decisive :trade :winner])) (not= (get-in corrections [:decisive :retail :schemaId]) (get-in corrections [:decisive :trade :schemaId])) (false? (get-in corrections [:decisive :markerPresent])) (false? (get-in corrections [:decisive :ambiguous]))) "Markerless Retail and Trade prior-flow resolution changed." corrections)
    (support/assert! (and (= ["Product" "Upsell" "Retail confirmation"] (mapv :name (get-in corrections [:structuredEditor :retailSteps]))) (= ["Trade account" "Trade confirmation"] (mapv :name (get-in corrections [:structuredEditor :tradeSteps]))) (= 5 (get-in corrections [:structuredEditor :retailSteps 0 :maximum])) (get-in corrections [:structuredEditor :retailSteps 1 :optional])) "Accessible structured flow-step authoring changed." corrections)
    (support/assert! (and (<= (get-in corrections [:coverage :rendered]) 40) (< (get-in corrections [:coverage :duration]) 100) (str/includes? (get-in corrections [:coverage :deepLink]) "kind=") (get-in corrections [:coverage :focused])) "Coverage virtualization, benchmark, or exact-field deep linking changed." corrections)
    (support/assert! (= {:status "Save failed" :retryVisible true :valuePresent true :retried "Saved" :count 1} (:failed corrections)) "Recoverable autosave did not retain and retry one draft transaction." corrections)
    (support/assert! (= {:projectBytesUnchanged true :schemaBytesUnchanged true :status "Save failed"} (:atomicRollback corrections)) "A failed second storage write did not restore both prior byte strings." corrections)
    (support/assert! (and (str/includes? (get-in corrections [:releaseReview :summary]) "structured changes") (= 1 (get-in corrections [:releaseReview :publishedBefore])) (get-in corrections [:releaseReview :focusRestored]) (get-in corrections [:releaseReview :legacyPreserved]) (get-in corrections [:releaseReview :projectAuthoritative]) (:restoreAvailable corrections)) "Structured release review, immutable prior release, unrelated-schema preservation, project-schema authority, restore, or focus behavior changed." corrections)
    (support/assert! (and (get-in corrections [:importReview :blocked]) (str/includes? (get-in corrections [:importReview :remapped]) "Collision remapped") (get-in corrections [:importReview :committed])) "Staged collision resolution and atomic project import changed." corrections)
    (support/assert! (and (= [360 520 720 1280] (mapv :width (:layouts corrections))) (every? #(and (zero? (:pageOverflow %)) (<= (:rendered %) 40)) (:layouts corrections))) "Responsive decisive-workflow evidence changed." corrections))
  observed)
(defn- validate-example! [_mode _example] true)
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :specification-project-program-mode verify-model! validate-example! runtime-observation! assert-runtime!))
