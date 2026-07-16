(ns acceptance.steps.array-validation-issue-rollup
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-array-validation-issue-rollup.feature"
                    "features/data-layer-array-validation-issue-rollup-runtime.feature"])
(def entry-modes {"a captured event contains array /products with 10 product objects" :model
                  "the built extension side panel is running with production schema validation and Live event presentation" :runtime})
(defonce ^:private model-check (atom nil))
(defonce ^:private browser-check (atom nil))

(defn- verify-model! []
  (support/cached-command-verification! model-check "Array validation issue roll-up model failed. " "node" "test/data-layer-array-validation-issue-rollup-test.mjs"))
(defn- observe! []
  (support/cached-browser-observation! browser-check {:adapter-env "ARRAY_VALIDATION_ROLLUP_BROWSER_ADAPTER" :observation-key :arrayValidationRollup :runtime-error "Array validation roll-up browser runtime failed." :missing-error "Array validation roll-up browser evidence is missing."}))
(defn- validate-example! [mode example]
  (when (and (= mode :model) (support/example-value example "issue_distribution"))
    (let [result (process/shell support/build-shell-options
                                "node" "test/helpers/array-validation-rollup-example-adapter.mjs"
                                (json/generate-string example))]
      (support/assert! (zero? (:exit result))
                       "Array roll-up distribution example was not connected to production behavior."
                       {:example example :error (:err result)})))
  (when-let [entry (support/example-value example "issue_entry_point")]
    (support/assert! (contains? #{"the /products aggregate status" "the /products/* aggregate status" "the Event-level issue link"} entry) "Unknown roll-up entry point." {:entry entry}))
  (when-let [control (support/example-value example "rendered_control")]
    (let [outcome (get-in (observe!) [:controls (keyword control)])
          required-paths #{"/products" "/products/*" "/products#affected" "/products/7"}]
      (support/assert! (and (= "/products/7/type" (:focusedPath outcome))
                            (:ancestorsOpen outcome)
                            (every? (set (:expandedPaths outcome)) required-paths))
                       "Rendered roll-up control did not reveal and focus the concrete issue."
                       {:control control :outcome outcome}))))
(defn- assert-runtime! [observed]
  (support/assert! (= 1 (:issues observed)) "Event-level issue totals were duplicated." {:observed observed})
  (support/assert! (and (str/includes? (:products observed) "1 error in 1 of 10 items") (str/includes? (:every observed) "1 error in 1 of 10 items") (str/includes? (:type observed) "9 passed and 1 error")) "Rendered wildcard roll-ups changed." {:observed observed})
  (support/assert! (= ["Item 8"] (:affectedItems observed)) "Unaffected array items were rendered as affected." {:observed observed})
  (support/assert! (and (some #{"/products/7/type"} (:concretePaths observed)) (= "/products/7/type" (:focusedPath observed)) (:ancestorsOpen observed)) "Concrete issue reveal/focus changed." {:observed observed})
  (support/assert! (= {:aggregates 0 :affectedItems 0 :type "✓ 10 passed" :focusedPath "/products/7/type"}
                      (select-keys (:revalidation observed) [:aggregates :affectedItems :type :focusedPath]))
                   "Revalidation did not remove roll-ups while preserving focus." {:observed observed})
  (support/assert! (and (:fits observed) (= "!" (:symbol observed))) "The narrow accessible roll-up presentation changed." {:observed observed}))

(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :array-validation-rollup-mode verify-model! validate-example! observe! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T21:56:16.615559561+02:00", :module-hash "938901429", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "1999414648"} {:id "def/feature-files", :kind "def", :line 7, :end-line 8, :hash "-1205676152"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 10, :hash "-1339204"} {:id "form/3/defonce", :kind "defonce", :line 11, :end-line 11, :hash "1944861188"} {:id "form/4/defonce", :kind "defonce", :line 12, :end-line 12, :hash "367376302"} {:id "defn-/verify-model!", :kind "defn-", :line 14, :end-line 15, :hash "2104364339"} {:id "defn-/observe!", :kind "defn-", :line 16, :end-line 17, :hash "2134484382"} {:id "defn-/validate-example!", :kind "defn-", :line 18, :end-line 35, :hash "-1585900671"} {:id "defn-/assert-runtime!", :kind "defn-", :line 36, :end-line 44, :hash "237660139"} {:id "def/handlers", :kind "def", :line 46, :end-line 46, :hash "-865754570"}]}
;; clj-mutate-manifest-end
