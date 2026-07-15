(ns acceptance.steps.recursive-declared-property-validation
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-recursive-declared-property-validation.feature"
   "features/data-layer-recursive-declared-property-validation-runtime.feature"])

(def entry-modes
  {"Generic pageview revision 4 declares page_type" :model
   "a persisted Generic pageview working draft declares /commerce/order/id and /products/*/product_name" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified? "Recursive declared-property model verification failed. "
   "node" "test/data-layer-recursive-declared-property-validation-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "RECURSIVE_DECLARED_PROPERTY_VALIDATION_BROWSER_ADAPTER"
    :observation-key :recursiveDeclaredPropertyValidation
    :runtime-error "Recursive declared-property browser runtime failed."
    :missing-error "Recursive declared-property browser evidence is missing."}))

(defn- assert-runtime! [{:keys [checkbox valid cases repeated representations disabled enabled publication runtimeErrors] :as observed}]
  (support/assert!
   (and checkbox
        (empty? (:issues valid))
        (= ["/commerce/order/id" "/products/*/product_name"] (:canonical valid)))
   "Declared nested objects or repeated items were rejected by production validation." observed)
  (support/assert!
   (= [["/commerce/debug" "boolean" "#/properties/commerce/additionalProperties"]
       ["/commerce/order/internal_id" "string" "#/properties/commerce/properties/order/additionalProperties"]
       ["/products/0/debug" "boolean" "#/properties/products/items/additionalProperties"]]
      (mapv (fn [{:keys [pointer count issue]}]
              (support/assert! (= 1 count) "Nested extra property did not produce exactly one issue." {:pointer pointer :count count})
              [pointer (:actual issue) (:schemaLocation issue)])
            cases))
   "Nested undeclared-property evidence lost its concrete path, type, or object boundary." cases)
  (support/assert!
   (= [{:instancePath "/products/0/debug" :actual "boolean"}
       {:instancePath "/products/1/debug" :actual "boolean"}
       {:instancePath "/products/1/metadata" :actual "object"}]
      repeated)
   "Repeated items or an undeclared object were expanded, collapsed, or wildcarded incorrectly." repeated)
  (support/assert!
   (and (= #{"nested" "path-keyed"} (set (map :name representations)))
        (every? #(and (empty? (:issues %)) (:unchanged %)) representations))
   "Nested and path-keyed representations did not validate equivalently and immutably." representations)
  (support/assert!
   (and (= {:stored true :undeclared 0 :ruleActive true} disabled)
        (:stored enabled)
        (:draftUnchanged enabled)
        (= ["/root_extra" "/commerce/debug" "/products/0/debug"] (:paths enabled)))
   "Policy toggling changed independent rules or failed to restore recursive checks." {:disabled disabled :enabled enabled})
  (support/assert!
   (and (= 5 (:version publication))
        (str/includes? (:result publication) "Revalidated 2 current Live events")
        (str/includes? (:detail publication) "commerce.debug")
        (= ["event:nested-extra"] (:queryMatches publication))
        (:defectMatch publication)
        (:archivedUnchanged publication)
        (= 4 (:archivedVersion publication))
        (empty? runtimeErrors))
   "Publication refresh, Live presentation, query/defect matching, or archived evidence regressed." observed)
  observed)

(def model-example-values
  {"concrete_path" #{"/commerce/debug" "/commerce/order/internal_id" "/products/0/debug" "/products/1/attributes/source" "/commerce/order/id" "/products/0/product_name" "/products/2/attributes/color"}
   "value" #{"true" "\"internal\"" "\"feed\""}
   "actual_type" #{"boolean" "string"}
   "object_boundary" #{"#/properties/commerce/additionalProperties"
                         "#/properties/commerce/properties/order/additionalProperties"
                         "#/properties/products/items/additionalProperties"
                         "#/properties/products/items/properties/attributes/additionalProperties"}
   "schema_representation" #{"nested commerce order id" "path-keyed /commerce/order/id"
                              "nested products item product_name" "path-keyed /products/*/attributes/color"}
   "canonical_path" #{"/commerce/order/id" "/products/*/product_name" "/products/*/attributes/color"}})

(def runtime-example-values
  {"concrete_path" #{"/commerce/debug" "/commerce/order/internal_id" "/products/0/debug" "/products/0/product_name" "/products/2/product_name"}
   "value" #{"true" "\"internal\""}
   "actual_type" #{"boolean" "string"}
   "schema_representation" #{"nested products object-item properties" "path-keyed /products/*/product_name"}})

(defn- validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode runtime-example-values model-example-values example
   "Recursive declared-property example value was outside the specified contract."))

(def handlers
  (into [{:pattern #"^the built extension side panel is running with production schema editing, validation, persistence, and Live event presentation$"
          :handler (fn [world _example _captures] world)}]
        (support/verified-feature-mode-handlers
         feature-files entry-modes :recursive-declared-property-validation-mode
         verify-model! validate-example! runtime-observation! assert-runtime!)))
