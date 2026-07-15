(ns acceptance.steps.guided-nested-property-merge
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-guided-nested-property-merge.feature"
   "features/data-layer-guided-nested-property-merge-runtime.feature"])

(def entry-modes
  {"a captured product_view event contains products with product_name and product_id" :model
   "the built extension side panel is running with production guided validation, Schema Library persistence, and schema validation" :runtime
   "captured product_view contains products with product_name and product_id" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(def example-rows
  #{{"array_ancestor" "/products/*" "first_path" "/products/*/product_name" "first_type" "String" "second_path" "/products/*/product_id" "second_type" "Number"}
    {"array_ancestor" "/products/*" "first_path" "/products/*/product_id" "first_type" "Number" "second_path" "/products/*/product_name" "second_type" "String"}
    {"array_ancestor" "/orders/*/products/*" "first_path" "/orders/*/products/*/product_name" "first_type" "String" "second_path" "/orders/*/products/*/product_id" "second_type" "Number"}})

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Guided nested property merge model verification failed. "
   "node" "test/data-layer-guided-nested-property-merge-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "GUIDED_NESTED_PROPERTY_MERGE_BROWSER_ADAPTER"
    :observation-key :guidedNestedPropertyMerge
    :runtime-error "Guided nested property merge browser runtime failed."
    :missing-error "Guided nested property merge browser evidence is missing."}))

(defn- validate-example! [_mode example]
  (let [keys ["array_ancestor" "first_path" "first_type" "second_path" "second_type"]
        supplied (into {} (keep (fn [key]
                                  (when-let [value (support/example-value example key)]
                                    [key value]))
                                keys))]
    (when (seq supplied)
      (support/assert! (contains? example-rows supplied)
                       "Guided nested merge example was outside the specified path/type combinations."
                       {:example supplied}))))

(defn- assert-runtime! [observed]
  (let [{:keys [sibling persistence constraints]} observed
        products (:products constraints)]
    (support/assert! (= {:name "string" :id "number"} (:types sibling))
                     "Rendered guided saves did not retain both sibling types." sibling)
    (support/assert! (= ["/products/*/product_id" "/products/*/product_name"] (:rulePaths sibling))
                     "Rendered guided saves did not retain one rule per canonical sibling path." sibling)
    (support/assert! (and (:sameItem sibling)
                          (every? (set (:treePaths sibling)) ["products.*.product_name" "products.*.product_id"]))
                     "The rendered schema tree did not show both properties beneath the same array item." sibling)
    (support/assert! (= [["/products/*/product_id" "/products/0/product_id"]
                         ["/products/*/product_name" "/products/0/product_name"]]
                        (:failures persistence))
                     "Reloaded production validation did not report independent template and concrete paths." persistence)
    (support/assert! (and (= ["product_id" "product_name"] (:properties persistence))
                          (= 1 (:minItems products))
                          (= 20 (:maxItems products))
                          (= ["product_name"] (get-in products [:items :required]))
                          (false? (get-in products [:items :additionalProperties]))
                          (= 1 (get-in products [:items :minProperties]))
                          (= "string" (get-in products [:items :properties :product_name :type]))
                          (= "number" (get-in products [:items :properties :product_id :type])))
                     "Adding the nested sibling changed existing array, item, or property constraints."
                     constraints)
    (support/assert! (and (= "Human-readable name" (get-in constraints [:documentation :properties (keyword "/products/*/product_name") :description]))
                          (= 1 (count (filter #(= "/products/*/product_id" (:propertyPath %)) (:rules constraints))))
                          (= ["local:product-name" "local:unrelated"] (mapv :id (take 2 (:rules constraints)))))
                     "Adding the nested sibling changed documentation, unrelated rules, or duplicated its rule."
                     constraints)))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :guided-nested-property-merge-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T15:44:46.991216983+02:00", :module-hash "2136525742", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-1880471612"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-1100780065"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 11, :hash "2141139184"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "def/example-rows", :kind "def", :line 16, :end-line 19, :hash "254306185"} {:id "defn-/verify-model!", :kind "defn-", :line 21, :end-line 25, :hash "-105212784"} {:id "defn-/runtime-observation!", :kind "defn-", :line 27, :end-line 33, :hash "1690801121"} {:id "defn-/validate-example!", :kind "defn-", :line 35, :end-line 44, :hash "-225202464"} {:id "defn-/assert-runtime!", :kind "defn-", :line 46, :end-line 74, :hash "847892441"} {:id "def/handlers", :kind "def", :line 76, :end-line 79, :hash "174785666"}]}
;; clj-mutate-manifest-end
