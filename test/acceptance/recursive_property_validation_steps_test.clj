(ns acceptance.recursive-property-validation-steps-test
  (:require [acceptance.steps.recursive-property-validation :as recursive]
            [clojure.test :refer [deftest is]]))

(def valid-observation
  {:width 320
   :hierarchy {:arraySummary "Array · 6 items"
               :missingSkuSummary "String · present in 5 of 6 items"
               :priceSummary "Mixed types · Number 4 · String 2"
               :nestedSku true
               :specific true
               :empty true
               :paths ["/oOrder"
                       "/oOrder/aProducts"
                       "/oOrder/aProducts/*"
                       "/oOrder/aProducts/*/pricing/amount"
                       "/orders/*/items/*/sku"
                       "/oOrder/aProducts/1/sku"]}
   :layout {:actionsSeparate true :noOverflow true :actionWidths [44 52 80]}
   :search {:open ["/oOrder"
                   "/oOrder/aProducts"
                   "/oOrder/aProducts/*"
                   "/oOrder/aProducts/*/pricing"]
            :restored ["/oOrder"]}
   :entry {:stage "destination"
           :path "/oOrder/aProducts/*/sku"
           :detectedType "String"
           :propertyStageAbsent true
           :statusIsSeparate true
           :eventActions ["Copy payload" "Save to Library" "Revalidate"]
           :statuses {:orderId "✓ 1 rule passed"
                      :sku "○ No rules"
                      :price "⚠ 1 warning"
                      :productType "! 1 error"}}
   :target {:initial {:expression "$[\"oOrder\"][\"aProducts\"][*][\"sku\"]"
                      :segments [:oOrder :aProducts :every :sku]
                      :actions ["Add Property segment"
                                "Add Array index segment"
                                "Reset to observed path"
                                "Apply target path"
                                "Cancel"]}
            :changed "$[\"oOrder\"][\"aProducts\"][*][\"details\"][1][\"sku\"]"
            :reset {:expression "$[\"oOrder\"][\"aProducts\"][*][\"sku\"]"}
            :inspections {:valid {:result "accepted" :matchedValueCount 6 :requiresExpectedType false}
                          :mixed {:result "accepted" :matchedValueCount 6 :requiresExpectedType true}
                          :negative {:result "blocked" :assistance "Enter a non-negative array index"}
                          :decimal {:result "blocked" :assistance "Enter a non-negative whole-number array index"}
                          :nonArray {:result "blocked" :assistance "orderId is not an array"}
                          :missingScope {:result "blocked" :assistance "Choose Every item or a specific aProducts index"}
                          :unobserved {:result "unobserved" :requiresExpectedType true}}
            :parsed [["property" "oOrder"]
                     ["property" "aProducts"]
                     ["index" 0]
                     ["property" "1"]]
            :literalStar "$[\"oOrder\"][\"aProducts\"][0][\"*\"]"
            :wildcard "$[\"oOrder\"][\"aProducts\"][*]"
            :slashArray "$[\"oOrder\"][\"aProducts\"][*][\"details\"][1]"
            :slashEscaped "$[\"oOrder\"][\"a/b\"][\"~name\"]"}})

(deftest accepts-a-complete-recursive-property-browser-observation
  (is (nil? (#'recursive/assert-observation! valid-observation))))
