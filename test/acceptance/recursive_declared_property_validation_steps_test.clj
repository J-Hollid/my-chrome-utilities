(ns acceptance.recursive-declared-property-validation-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.recursive-declared-property-validation :as recursive]
            [clojure.test :refer [deftest is]]))

(deftest verifies-recursive-declared-property-validation-features
  (feature-support/verify-feature-suite!
   recursive/feature-files recursive/handlers all/handlers))

(deftest recursive-publication-uses-concrete-pointer-evidence
  (let [assert-runtime! (deref (ns-resolve 'acceptance.steps.recursive-declared-property-validation 'assert-runtime!))
        observed {:checkbox true
                  :valid {:issues [] :canonical ["/commerce/order/id" "/products/*/product_name"]}
                  :cases [{:pointer "/commerce/debug" :count 1 :issue {:actual "boolean" :schemaLocation "#/properties/commerce/additionalProperties"}}
                          {:pointer "/commerce/order/internal_id" :count 1 :issue {:actual "string" :schemaLocation "#/properties/commerce/properties/order/additionalProperties"}}
                          {:pointer "/products/0/debug" :count 1 :issue {:actual "boolean" :schemaLocation "#/properties/products/items/additionalProperties"}}]
                  :repeated [{:instancePath "/products/0/debug" :actual "boolean"}
                             {:instancePath "/products/1/debug" :actual "boolean"}
                             {:instancePath "/products/1/metadata" :actual "object"}]
                  :representations [{:name "nested" :issues [] :unchanged true}
                                    {:name "path-keyed" :issues [] :unchanged true}]
                  :disabled {:stored true :undeclared 0 :ruleActive true}
                  :enabled {:stored true :draftUnchanged true :paths ["/root_extra" "/commerce/debug" "/products/0/debug"]}
                  :publication {:version 5 :result "Revalidated 2 current Live events"
                                :detail "Issue at /commerce/debug" :queryMatches ["event:nested-extra"]
                                :defectMatch true :archivedUnchanged true :archivedVersion 4}
                  :runtimeErrors []}]
    (is (= observed (assert-runtime! observed)))
    (is (thrown-with-msg? clojure.lang.ExceptionInfo #"Publication refresh"
                          (assert-runtime! (assoc-in observed [:publication :detail] "Issue at commerce.debug"))))))
