(ns acceptance.required-rule-type-independence-steps-test
  (:require [acceptance.steps.required-rule-type-independence]
            [clojure.test :refer [deftest is]]))

(defn- runtime-assertion []
  (deref (ns-resolve 'acceptance.steps.required-rule-type-independence
                     'assert-runtime!)))

(deftest validates-required-rule-type-independence-runtime-observation
  (let [offered (mapv (fn [path]
                        {:path path
                         :enabled true
                         :metadata "Required · type any · version 3"})
                      ["/title" "/quantity" "/consented" "/customer" "/products"])
        attachments (mapv (fn [path]
                            {:id "reusable-required-7"
                             :version 3
                             :propertyPath path})
                          ["/title" "/quantity" "/consented" "/customer" "/products"])
        observed {:offered offered
                  :attachments attachments
                  :libraryCount 1
                  :ruleUnchanged true
                  :reloadPreserved true
                  :validation {:missingStatuses (vec (repeat 5 "error"))
                               :presentStatuses (vec (repeat 5 "pass"))
                               :notApplicableStatuses (vec (repeat 5 "not-applicable"))
                               :presentIssues 0
                               :notApplicableIssues 0}}]
    (is (= observed ((runtime-assertion) observed)))))
