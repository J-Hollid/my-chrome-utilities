(ns acceptance.steps.specification-project-program
  (:require [acceptance.steps.specification-project-program-assertions :as assertions]
            [acceptance.steps.support :as support]
            [aps.gherkin :as gherkin]
            [babashka.process :as process]
            [cheshire.core :as json]
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
   "features/data-layer-truthful-assignment-lifecycle.feature" "features/data-layer-truthful-assignment-lifecycle-runtime.feature"
   "features/data-layer-canonical-project-schema-drafts.feature" "features/data-layer-canonical-project-schema-drafts-runtime.feature"
   "features/data-layer-contextual-specification-editors.feature" "features/data-layer-contextual-specification-editors-runtime.feature"
   "features/data-layer-effective-requirement-coverage-correction.feature" "features/data-layer-effective-requirement-coverage-correction-runtime.feature"
   "features/data-layer-effective-schema-compilation.feature" "features/data-layer-effective-schema-compilation-runtime.feature"
   "features/data-layer-greenfield-retail-trade-production-release.feature" "features/data-layer-greenfield-retail-trade-production-release-runtime.feature"
   "features/data-layer-production-fixture-execution.feature" "features/data-layer-production-fixture-execution-runtime.feature"
   "features/data-layer-specification-builder-operator-usability.feature" "features/data-layer-specification-builder-operator-usability-runtime.feature"
   "features/data-layer-staged-multiformat-bulk-authoring.feature" "features/data-layer-staged-multiformat-bulk-authoring-runtime.feature"
   "features/data-layer-temporal-flow-execution-correction.feature" "features/data-layer-temporal-flow-execution-correction-runtime.feature"
   "features/data-layer-truthful-preflight-release-correction.feature" "features/data-layer-truthful-preflight-release-correction-runtime.feature"
   "features/data-layer-unified-specification-evaluation.feature" "features/data-layer-unified-specification-evaluation-runtime.feature"])

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
   "Sitewide page context revision 2 and Purchase revision 3 are published"
   "a Specification Project owns one revisioned canonical draft"
   "the full-page workspace has a selected project entity"
   "coverage is computed from the compiled project and current fixture evidence"
   "requirement profiles are ordered explicitly for a validation context"
   "no Specification Project or captured traffic exists"
   "fixtures execute the compiled production evaluator used by Live capture"
   "the operator uses the full-page Specification Builder and side-panel companion"
   "a Requirement Profile is open in its full-width authoring workspace"
   "a compiled Flow uses stable Page, Event, Profile, Applicability, Step, and Transition IDs"
   "preflight and release consume the compiled production plan, evaluator results, and effective coverage"
   "a canonical Specification Project draft can be compiled"])

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
   "the built extension is running with production assignment editor, resolver, persistence, and schema publication systems"
   "the built unpacked extension has a blank project created through rendered controls"
   "the built unpacked extension has compiled contexts and current fixture evidence"
   "the built unpacked extension has profiles authored through rendered controls"
   "the built unpacked extension is loaded from its chrome-extension URL in a fresh isolated Chrome profile"
   "the built unpacked extension has fixtures authored through rendered controls"
   "the built unpacked extension is loaded from its chrome-extension URL"
   "the built unpacked extension has an empty Profile open in the rendered grid"
   "the built unpacked extension has a Flow authored through rendered stable-reference controls"
   "the built unpacked extension has a project authored through rendered controls"
   "the built unpacked extension has a typed compatibility project adopted through rendered migration controls"])

(def entry-modes (merge (zipmap model-entry-steps (repeat :model)) (zipmap runtime-entry-steps (repeat :runtime))))

(def ^:private canonical-example-rows
  (->> feature-files
       (group-by #(if (str/ends-with? % "-runtime.feature") :runtime :model))
       (map (fn [[mode files]]
              [mode (->> files
                         (mapcat (fn [feature-file]
                                   (mapcat :examples (:scenarios (gherkin/parse-file feature-file)))))
                         set)]))
       (into {})))

(defn- validate-example! [mode example]
  (when (seq example)
    (let [row (into {} (map (fn [[key value]] [(name key) value])) example)]
      (support/assert!
       (contains? (get canonical-example-rows mode) row)
       "Specification Project example row is outside the specified contract."
       {:mode mode :row row})))
  example)

(defn- scenario-id [world]
  (str (:acceptance/feature-name world) " / " (:acceptance/scenario-name world)))

(defn- verification-script [feature-name]
  (cond
    (str/includes? feature-name "bulk") "test/data-layer-specification-bulk-test.mjs"
    (str/includes? feature-name "temporal") "test/data-layer-temporal-flow-test.mjs"
    (or (str/includes? feature-name "fixture")
        (str/includes? feature-name "coverage")
        (str/includes? feature-name "preflight")
        (str/includes? feature-name "release correction")) "test/data-layer-specification-assurance-test.mjs"
    (or (str/includes? feature-name "compilation")
        (str/includes? feature-name "unified specification")) "test/data-layer-specification-engine-test.mjs"
    (str/includes? feature-name "canonical project schema") "test/data-layer-specification-repository-test.mjs"
    (str/includes? feature-name "runtime callback") "test/data-layer-specification-runtime-test.mjs"
    :else "test/data-layer-specification-project-test.mjs"))

(def ^:private detailed-r02-features
  ["canonical project schema drafts" "contextual specification editors"
   "effective requirement coverage correction" "effective schema compilation"
   "greenfield retail trade production release" "production fixture execution"
   "specification builder operator usability" "staged multiformat bulk authoring"
   "temporal flow execution correction" "truthful preflight release correction"
   "unified specification evaluation"])

(defn- detailed-r02-scenario? [world]
  (let [feature (str/lower-case (:acceptance/feature-name world))]
    (some #(str/includes? feature %) detailed-r02-features)))

(defn- focused-browser-scenario? [world]
  (let [feature (:acceptance/feature-name world)
        index (:acceptance/scenario-index world)]
    (or (and (str/includes? feature "truthful assignment lifecycle runtime")
             (contains? #{1 2 4} index))
        (and (str/includes? feature "canonical project schema drafts runtime")
             (contains? #{3 13} index))
        (and (str/includes? feature "greenfield Retail Trade production release runtime")
             (contains? #{6 8 9} index)))))

(defn- verify-command! [world]
  (let [detailed? (detailed-r02-scenario? world)
        script (if detailed?
                 "acceptance/runtime/specification-project-scenario.mjs"
                 (verification-script (:acceptance/feature-name world)))
        scenario {:feature (:acceptance/feature-name world)
                  :name (:acceptance/scenario-name world)
                  :index (:acceptance/scenario-index world)
                  :steps (:acceptance/scenario-steps world)}
        options (if detailed?
                  (assoc support/build-shell-options
                         :env (assoc (into {} (System/getenv))
                                     "SPECIFICATION_PROJECT_SCENARIO_JSON"
                                     (json/generate-string scenario)))
                  support/build-shell-options)
        result (process/shell options "node" script)
        evidence-line (last (filter #(str/starts-with? % "{")
                                    (str/split-lines (:out result))))
        evidence (when (and detailed? evidence-line)
                   (json/parse-string evidence-line true))]
    (support/assert! (zero? (:exit result))
                     (str "Scenario-specific production verification failed for "
                          (scenario-id world) ". " (:err result))
                     {:scenario (scenario-id world) :script script
                      :out (:out result) :err (:err result)})
    (when detailed?
      (support/assert! (= (str (:acceptance/feature-name world) "#"
                               (inc (:acceptance/scenario-index world)))
                           (:scenarioId evidence))
                       "Scenario verifier returned evidence for a different scenario."
                       {:expected scenario :evidence evidence}))
    {:kind :production-module :scenario (scenario-id world) :script script
     :evidence evidence}))

(defn- verify-browser! [world]
  (let [observed (support/load-browser-observation-with-environment!
                  {:environment {"SPECIFICATION_PROJECT_BROWSER_ADAPTER" "1"
                                 "SPECIFICATION_PROJECT_SCENARIO_ID" (scenario-id world)}
                   :observation-key :specificationProject
                   :runtime-error (str "Scenario-specific browser verification failed for " (scenario-id world) ".")
                   :missing-error "Scenario-specific Specification Project browser evidence is missing."})]
    (assertions/assert-runtime-scenario! observed (:acceptance/scenario-steps world))
    {:kind :focused-browser :scenario (scenario-id world)}))

(defn- verify-scenario! [world mode]
  (if (and (= :runtime mode) (focused-browser-scenario? world))
    (verify-browser! world)
    (verify-command! world)))

(defn- transition [world example _captures {:keys [text]}]
  (let [mode (or (entry-modes text) (:specification-project-program-mode world))]
    (support/assert! mode "Scenario did not establish its acceptance mode."
                     {:step text :scenario (scenario-id world)})
    (validate-example! mode example)
    (if (:specification-project-scenario-evidence world)
      world
      (assoc world
             :specification-project-program-mode mode
             :specification-project-scenario-evidence (verify-scenario! world mode)))))

(def handlers
  (support/feature-mode-handlers feature-files entry-modes
                                 :specification-project-program-mode transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-18T03:01:22.704403947+02:00", :module-hash "2081113630", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "2025647922"} {:id "def/feature-files", :kind "def", :line 7, :end-line 21, :hash "-2007404059"} {:id "def/model-entry-steps", :kind "def", :line 23, :end-line 41, :hash "1167464283"} {:id "def/runtime-entry-steps", :kind "def", :line 43, :end-line 57, :hash "1900255542"} {:id "def/entry-modes", :kind "def", :line 59, :end-line 59, :hash "-1111548379"} {:id "def/canonical-example-rows", :kind "def", :line 61, :end-line 69, :hash "1968744663"} {:id "form/6/defonce", :kind "defonce", :line 71, :end-line 71, :hash "344781070"} {:id "form/7/defonce", :kind "defonce", :line 72, :end-line 72, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 74, :end-line 75, :hash "1297884846"} {:id "defn-/runtime-observation!", :kind "defn-", :line 76, :end-line 77, :hash "1089675431"} {:id "defn-/validate-example!", :kind "defn-", :line 78, :end-line 85, :hash "-1455732981"} {:id "def/handlers", :kind "def", :line 86, :end-line 86, :hash "-179437326"}]}
;; clj-mutate-manifest-end
