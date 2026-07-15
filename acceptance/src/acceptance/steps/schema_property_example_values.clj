(ns acceptance.steps.schema-property-example-values
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-schema-property-example-values.feature"
   "features/data-layer-schema-property-example-values-runtime.feature"])

(def entry-modes
  {"the Schema Library contains Product detail current revision 3" :model
   "the built extension side panel is running with production Schema Library persistence and defect report builders" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Schema-property-example-values model verification failed. "
   "node" "test/data-layer-schema-property-example-values-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_PROPERTY_EXAMPLE_VALUES_BROWSER_ADAPTER"
    :observation-key :schemaPropertyExampleValues
    :runtime-error "Schema-property-example-values browser runtime failed."
    :missing-error "Schema-property-example-values browser evidence is missing."}))

(defn- assert-runtime!
  [{:keys [initially allowedSaved customCases live defect missing lifecycle layout runtimeErrors] :as observed}]
  (support/assert!
   (and (= ["not logged in" "logged in"] (:choices initially))
        (:custom initially) (:customHidden initially)
        (= {:value "logged in" :selectionMethod "allowed value"} (:example allowedSaved))
        (:restored allowedSaved) (:currentUnchanged allowedSaved)
        (= [["product_name" "robot" "string"]
            ["product_id" 1 "number"]
            ["consent" false "boolean"]
            ["category" nil "null"]]
           (mapv (juxt :path :value :type) customCases))
        (every? #(and (= "custom" (:selectionMethod %)) (:selected %)) customCases))
   "Rendered example-value editing lost typed choices, working-draft isolation, or custom JSON types."
   {:initially initially :allowedSaved allowedSaved :customCases customCases})
  (support/assert!
   (and (str/includes? (:information live) "Example value: 1")
        (:observedUnchanged live) (:payloadUnchanged live)
        (:hidden (:initial defect))
        (= {:value "logged in" :hidden false :focused true :scroll 43} (:prefilled defect))
        (= {:count 1 :value "logged in" :type "string"} (:firstCorrection defect))
        (= {:value "member" :focused true :selection 3 :scroll 43} (:retained defect))
        (= "" (get-in defect [:withoutExample :value])))
   "Live documentation or validation-defect custom-prefill behavior diverged."
   {:live live :defect defect})
  (support/assert!
   (and (= "guest" (get-in defect [:conflict :value]))
        (str/includes? (get-in defect [:conflict :warning]) "does not satisfy")
        (get-in defect [:conflict :confirmation])
        (= {:value "1" :type "number"} (:prefill missing))
        (= {:products [{:id 1}]} (:payload missing) (:saved missing))
        (:copied missing) (:reopened missing) (:recopied missing) (:provenanceOmitted missing)
        (= {:state "1 issues" :copyDisabled true :reportUnavailable true} (:invalid missing)))
   "Conflict validation, missing-event gating, or typed report representation fidelity diverged."
   {:conflict (:conflict defect) :missing missing})
  (support/assert!
   (and (= {:value "not logged in" :selectionMethod "custom"} (:inherited lifecycle) (:historical lifecycle))
        (= {:value "logged in" :selectionMethod "allowed value"} (:current lifecycle))
        (nil? (:legacy lifecycle))
        (<= (:body layout) (:width layout))
        (empty? runtimeErrors))
   "Example-value lifecycle, legacy compatibility, layout, or browser runtime safety regressed."
   {:lifecycle lifecycle :layout layout :runtimeErrors runtimeErrors})
  observed)

(def example-values
  {"property_path" #{"/product_name" "/product_id" "/consent" "/category"}
   "property_type" #{"string" "number" "boolean" "nullable"}
   "custom_example" #{"robot" "1" "false" "null"}
   "json_type" #{"string" "number" "boolean" "null"}})

(defn- validate-example! [_mode example]
  (support/validate-example-domain!
   example-values example (filter #(support/example-value example %) (keys example-values))
   "Schema-property-example-values example value was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-property-example-values-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))
