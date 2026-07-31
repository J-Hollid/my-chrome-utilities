(ns acceptance.steps.specification-studio-guided-test-cases
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/specification-studio-guided-test-cases.feature"
   "features/specification-studio-guided-test-cases-runtime.feature"])

(def entry-modes
  {"an operator is authoring a Specification Project with Pages, Events, Assignments, and effective schemas" :model
   "the built extension is running with production Specification Studio, durable project storage, and project evaluation" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Guided Test case model verification failed. "
   "node" "test/data-layer-guided-test-cases-test.mjs"))

(defn- verify-browser! []
  (support/cached-command-observation!
   browser-observation
   {:command ["node" "test/browser-packs/guided-test-cases.mjs"]
    :observation-key :guidedTestCases
    :runtime-error "Guided Test case installed-browser verification failed."
    :missing-error "Guided Test case installed-browser evidence is missing."}))

(def example-values
  {"test_type" #{"Page context test" "Event validation test"}
   "source" #{"manual creation" "saved Event Library template" "captured Live validation"}
   "property_shape" #{"allowed strings retail and trade" "bounded number" "boolean"
                      "nested object" "array of products" "nullable value"
                      "number from 1 through 10" "nested order object"
                      "array of product objects" "nullable campaign"}
   "json_type" #{"string" "number" "boolean" "object" "array"
                 "null" "null or declared value type"}
   "condition" #{"no input or no reviewed assertion"
                 "actual values equal every reviewed expectation"
                 "one actual value differs"
                 "its recorded evaluator revision is superseded"
                 "recorded evaluator revision is superseded"}
   "status" #{"Blocked" "Matched" "Mismatched" "Stale"}})

(defn- validate-example! [_mode example]
  (support/validate-mode-example-domain!
   :guided-test-cases example-values example-values example
   "Guided Test case example was outside the approved contract."))

(defn- assert-browser! [evidence]
  (support/assert! (every? true? (vals evidence))
                   "Installed Guided Test case evidence is incomplete."
                   evidence))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :specification-studio-guided-test-cases-mode
   verify-model! validate-example!
   verify-browser! assert-browser!))
