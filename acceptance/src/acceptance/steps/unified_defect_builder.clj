(ns acceptance.steps.unified-defect-builder
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-unified-defect-report-builder.feature"
   "features/data-layer-unified-defect-report-builder-runtime.feature"])

(def entry-modes
  {"a testing session contains visits to /products and /checkout" :model
   "the built extension side panel is running with production defect reporting, schema validation, session chronology, Jira export, and Defect Library persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification! model-verified?
    "Unified defect builder model verification failed. "
    "node" "test/data-layer-unified-defect-builder-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation! browser-observation
    {:adapter-env "UNIFIED_DEFECT_BUILDER_BROWSER_ADAPTER"
     :observation-key :unifiedDefectBuilder
     :runtime-error "Unified defect builder browser runtime failed."
     :missing-error "Unified defect builder browser evidence is missing."}))

(defn- assert-runtime! [observed]
  (let [initial (get-in observed [:unified :initial])
        complete (get-in observed [:unified :complete])]
    (support/assert! (and (every? (set (:stages initial)) ["Expected result" "Steps to reproduce" "Supporting timeline" "Report details"])
                          (:evidence initial)
                          (:commonControls initial)
                          (:copyDisabled initial)
                          (:saveDisabled initial))
                     "The rendered missing-event path did not use the common production stages and composers."
                     observed)
    (support/assert! (and (str/includes? (:schemaExpected initial) "order_id · required string")
                          (str/includes? (:schemaExpected initial) "currency · one of EUR or USD")
                          (str/includes? (:preview initial) "Actual result")
                          (str/includes? (:preview initial) "Expected result"))
                     "Schema-derived expectations or the continuously rendered preview were absent."
                     observed)
    (support/assert! (and (false? (:copyDisabled complete))
                          (false? (:saveDisabled complete))
                          (str/includes? (:preview complete) "pushed or observed in event-history")
                          (str/includes? (:preview complete) "Checkout purchase revision 4")
                          (str/includes? (:preview complete) "Expect purchase to be pushed"))
                     "Completion did not retain absence evidence, schema identity, journey assertion, copy, and save."
                     observed)
    (support/assert! (and (= "Missing event" (get-in observed [:zero :report :type]))
                          (nil? (get-in observed [:zero :report :payload]))
                          (nil? (get-in observed [:zero :report :capture]))
                          (zero? (get-in observed [:zero :report :issues]))
                          (= ["purchase-1"] (get-in observed [:warning :override :evidence])))
                     "The unified path fabricated captured evidence or lost explicit matching-event override evidence."
                     observed))
  observed)

(def example-values
  {"defect_kind" #{"captured validation issue" "missing purchase event"}
   "evidence_stage" #{"selected issue and captured Actual result" "expected-event confirmation and absence verification" "validation issue selection and captured Actual result"}
   "property" #{"currency" "order_id"}
   "constraint" #{"one of EUR or USD" "required string"}
   "response_choice" #{"Use generic constraint" "schema value EUR" "custom value A-123"}
   "expected_presentation" #{"currency is EUR OR USD" "currency is EUR" "order_id is A-123"}
   "response_source" #{"schema constraint" "schema-provided value" "operator custom response"}
   "step_kind" #{"Click component" "Log in as user" "Scroll" "Custom step"}
   "step_input" #{"Checkout, sticky footer button" "returning customer" "bottom of the page" "Apply the free delivery filter"}
   "step_text" #{"Click Checkout — sticky footer button" "Log in as returning customer" "Scroll to the bottom of the page" "Apply the free delivery filter"}})

(defn- validate-example! [_mode example]
  (support/validate-example-domain! example-values example
    (filter #(support/example-value example %) (keys example-values))
    "Unified defect builder example value was outside the specified contract."))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   #(contains? entry-modes %)
   :unified-defect-builder-mode
   (fn [world example _captures {:keys [text]}]
     (support/mode-transition world example text entry-modes :unified-defect-builder-mode
       verify-model! validate-example! #(assert-runtime! (runtime-observation!))))))
