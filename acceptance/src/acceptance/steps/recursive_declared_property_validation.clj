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

(defn- preserve-world [world _example _captures]
  world)

(def handlers
  (into [{:pattern #"^the built extension side panel is running with production schema editing, validation, persistence, and Live event presentation$"
          :handler preserve-world}]
        (support/verified-feature-mode-handlers
         feature-files entry-modes :recursive-declared-property-validation-mode
         verify-model! validate-example! runtime-observation! assert-runtime!)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T19:30:14.443264948+02:00", :module-hash "-1281151030", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1344757995"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "397782958"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-1701385040"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 19, :hash "1337834842"} {:id "defn-/runtime-observation!", :kind "defn-", :line 21, :end-line 27, :hash "217014499"} {:id "defn-/assert-runtime!", :kind "defn-", :line 29, :end-line 70, :hash "-622812099"} {:id "def/model-example-values", :kind "def", :line 72, :end-line 82, :hash "-1882581064"} {:id "def/runtime-example-values", :kind "def", :line 84, :end-line 88, :hash "-1075256112"} {:id "defn-/validate-example!", :kind "defn-", :line 90, :end-line 93, :hash "-794393922"} {:id "defn-/preserve-world", :kind "defn-", :line 95, :end-line 96, :hash "1701793430"} {:id "def/handlers", :kind "def", :line 98, :end-line 103, :hash "-588957617"}]}
;; clj-mutate-manifest-end
