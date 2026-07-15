(ns acceptance.steps.guided-nested-property-merge
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-guided-nested-property-merge.feature"
   "features/data-layer-guided-nested-property-merge-runtime.feature"])

(def entry-modes
  {"a captured product_view event contains products with product_name and product_id" :model
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
