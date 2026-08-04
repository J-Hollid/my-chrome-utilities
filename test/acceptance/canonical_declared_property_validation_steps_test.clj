(ns acceptance.canonical-declared-property-validation-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.canonical-declared-property-validation :as canonical]
            [acceptance.steps.guided-draft-continuation]
            [acceptance.steps.guided-validation-destination-assertions]
            [acceptance.steps.live-validation-visual-assertions :as visual-assertions]
            [clojure.test :refer [deftest is]]))

(defn- private-value [namespace symbol]
  (deref (ns-resolve namespace symbol)))

(deftest verifies-canonical-declared-property-validation-features
  (feature-support/verify-feature-suite!
   canonical/feature-files canonical/handlers all/handlers))

(deftest canonical-policy-requires-lossless-property-definitions
  (let [assert-policy! (private-value 'acceptance.steps.canonical-declared-property-validation 'assert-policy!)
        policy {:checked true :stored true :propertiesUnchanged true :declaredIssues []
                :extraIssues [{:instancePath "/debug" :expected "declared property" :actual "boolean"}]}]
    (is (nil? (assert-policy! policy)))
    (is (thrown-with-msg? clojure.lang.ExceptionInfo #"changed property definitions"
                          (assert-policy! (assoc policy :propertiesUnchanged false))))))

(deftest guided-continuation-uses-rendered-schema-picker-order
  (let [assert-continuation! (private-value 'acceptance.steps.guided-draft-continuation 'assert-continuation!)
        interaction (private-value 'acceptance.steps.guided-draft-continuation 'expected-interaction)
        observed {:initial (private-value 'acceptance.steps.guided-draft-continuation 'expected-initial)
                  :interaction interaction
                  :reload (private-value 'acceptance.steps.guided-draft-continuation 'expected-reload)}]
    (is (nil? (assert-continuation! {} observed)))
    (is (thrown-with-msg? clojure.lang.ExceptionInfo #"selected working draft"
                          (assert-continuation! {} (update-in observed [:interaction :switchOpen :choices] reverse))))))

(deftest guided-save-failure-retains-review-and-atomic-storage
  (let [failed-save (private-value 'acceptance.steps.guided-validation-destination-assertions 'failed-save)
        failure {:flowVisible true
                 :review "New schema draft Signal Shop pageview will be created and remain unavailable until publication."
                 :schemasUnchanged true :rulesUnchanged true
                 :recovery {:open true :named true :durableTruth true :retryEnabled true :exportEnabled true}
                 :retryCommitted true}
        observed {:saveFailure failure}]
    (is (nil? (failed-save {} observed)))
    (is (thrown-with-msg? clojure.lang.ExceptionInfo #"preserve the review and storage state"
                          (failed-save {} {:saveFailure (assoc failure :rulesUnchanged false)})))))

(deftest live-validation-routes-only-counted-property-examples
  (let [event-example {"property_path" "/oOrder/orderId" "validation_status" "Passed"}
        missing-observation {:properties {:order_id {:missing "Missing"}}
                             :issueRows ["/order_id · Required property · rule Required fields v1"]}]
    (is (nil? (visual-assertions/assert-step! "its property row is displayed" event-example {:runtime true})))
    (is (nil? (visual-assertions/assert-step! "the same issue appears in the event issue list"
                                              {} missing-observation)))
    (is (thrown-with-msg? clojure.lang.ExceptionInfo #"both views"
                          (visual-assertions/assert-step! "the same issue appears in the event issue list"
                                                          {} (assoc missing-observation :issueRows ["order_id: Required property"]))))))
