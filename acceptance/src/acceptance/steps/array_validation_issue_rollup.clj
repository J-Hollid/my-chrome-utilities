(ns acceptance.steps.array-validation-issue-rollup
  (:require [acceptance.steps.support :as support]
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
(defn- validate-example! [_ example]
  (when-let [entry (support/example-value example "issue_entry_point")]
    (support/assert! (contains? #{"the /products aggregate status" "the /products/* aggregate status" "the Event-level issue link"} entry) "Unknown roll-up entry point." {:entry entry}))
  (when-let [control (support/example-value example "rendered_control")]
    (support/assert! (contains? #{"products aggregate status" "Every item aggregate status" "Event-level /products/7/type issue"} control) "Unknown rendered roll-up control." {:control control})))
(defn- assert-runtime! [observed]
  (support/assert! (= 1 (:issues observed)) "Event-level issue totals were duplicated." {:observed observed})
  (support/assert! (and (str/includes? (:products observed) "1 error in 1 of 10 items") (str/includes? (:every observed) "1 error in 1 of 10 items") (str/includes? (:type observed) "9 passed and 1 error")) "Rendered wildcard roll-ups changed." {:observed observed})
  (support/assert! (= ["Item 8"] (:affectedItems observed)) "Unaffected array items were rendered as affected." {:observed observed})
  (support/assert! (and (some #{"/products/7/type"} (:concretePaths observed)) (= "/products/7/type" (:focusedPath observed)) (:ancestorsOpen observed)) "Concrete issue reveal/focus changed." {:observed observed})
  (support/assert! (and (:fits observed) (= "!" (:symbol observed))) "The narrow accessible roll-up presentation changed." {:observed observed}))

(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :array-validation-rollup-mode verify-model! validate-example! observe! assert-runtime!))
