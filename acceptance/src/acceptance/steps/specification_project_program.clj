(ns acceptance.steps.specification-project-program
  (:require [acceptance.steps.specification-project-program-assertions :as assertions]
            [acceptance.steps.support :as support]))

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
(defn- validate-example! [_mode _example] true)
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :specification-project-program-mode verify-model! validate-example! runtime-observation! assertions/assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-18T02:55:15.292048812+02:00", :module-hash "-393828746", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1445825122"} {:id "def/feature-files", :kind "def", :line 5, :end-line 19, :hash "-2007404059"} {:id "def/model-entry-steps", :kind "def", :line 21, :end-line 39, :hash "1167464283"} {:id "def/runtime-entry-steps", :kind "def", :line 41, :end-line 55, :hash "1900255542"} {:id "def/entry-modes", :kind "def", :line 57, :end-line 57, :hash "-1111548379"} {:id "form/5/defonce", :kind "defonce", :line 58, :end-line 58, :hash "344781070"} {:id "form/6/defonce", :kind "defonce", :line 59, :end-line 59, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 61, :end-line 62, :hash "1297884846"} {:id "defn-/runtime-observation!", :kind "defn-", :line 63, :end-line 64, :hash "1089675431"} {:id "defn-/validate-example!", :kind "defn-", :line 65, :end-line 65, :hash "-1184981427"} {:id "def/handlers", :kind "def", :line 66, :end-line 66, :hash "-179437326"}]}
;; clj-mutate-manifest-end
