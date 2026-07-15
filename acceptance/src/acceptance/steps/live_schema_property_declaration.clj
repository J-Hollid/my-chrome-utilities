(ns acceptance.steps.live-schema-property-declaration
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-live-schema-property-declaration.feature" "features/data-layer-live-schema-property-declaration-runtime.feature"])
(def entry-modes {"captured product_view is selected in the Live event inspector" :model
                  "the built extension side panel is running with production Live inspection, Schema Library drafts, persistence, and validation" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- verify-model! [] (support/cached-command-verification! model-verified? "Live property declaration model failed. " "npm" "run" "pretest:unit:schema-verification"))
(defn- observe! [] (support/cached-browser-observation! browser-observation {:adapter-env "LIVE_SCHEMA_PROPERTY_DECLARATION_BROWSER_ADAPTER" :observation-key :liveSchemaPropertyDeclaration :runtime-error "Live property declaration browser failed." :missing-error "Live property declaration evidence is missing."}))
(defn- assert-runtime! [{:keys [actions review saved separate] :as observed}]
  (support/assert! (and (:addToSchema actions) (:addValidation actions) (str/includes? (:destination actions) "Product detail")) "Live property actions were not distinct." observed)
  (support/assert! (and (str/includes? (:text review) "/products/*/product_name") (str/includes? (:text review) "String") (str/includes? (:text review) "revision 3") (:noValidationControls review) (:storageUnchanged review)) "Declaration review crossed into validation configuration or persisted early." review)
  (support/assert! (and (= "string" (:type saved)) (= ["type"] (:keys saved)) (= 1 (count (:assignments saved))) (= 1 (count (:rules saved))) (= 3 (:version saved)) (:guidedVisible separate) (zero? (:declarationDialogs separate))) "Declaration persistence changed rules, assignments, version, or the validation boundary." observed)
  observed)
(def model-values {"concrete_path" #{"/page_type" "/commerce/currency" "/products/0/product_name" "/products/0/product_id"}
                   "canonical_path" #{"/page_type" "/commerce/currency" "/products/*/product_name" "/products/*/product_id"}
                   "detected_type" #{"String" "Number"}})
(def runtime-values {"concrete_path" #{"/products/0/product_name" "/products/0/product_id"}
                     "canonical_path" #{"/products/*/product_name" "/products/*/product_id"}
                     "detected_type" #{"String" "Number"}})
(defn- validate-example! [mode example] (support/validate-mode-example-domain! mode runtime-values model-values example "Live property declaration example is outside the contract."))
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :live-schema-property-declaration-mode verify-model! validate-example! observe! assert-runtime!))
