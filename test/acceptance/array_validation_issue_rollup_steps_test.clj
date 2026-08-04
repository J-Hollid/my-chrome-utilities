(ns acceptance.array-validation-issue-rollup-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.array-validation-issue-rollup :as rollup]
            [acceptance.steps.support :as support]
            [clojure.test :refer [deftest is]]))

(deftest validates-array-rollup-example-relations-without-a-child-process
  (let [example {"issue_distribution" "type error in item 8 and name warning in item 4"
                 "error_count" "1"
                 "warning_count" "1"
                 "affected_item_count" "2"}]
    (is (= example
           (support/validate-example-relations!
            rollup/issue-distribution-relations example "invalid relation")))
    (is (thrown?
         clojure.lang.ExceptionInfo
         (support/validate-example-relations!
          rollup/issue-distribution-relations
          (assoc example "affected_item_count" "1")
          "invalid relation")))))

(deftest verifies-array-validation-issue-rollup-features
  (feature-support/verify-feature-suite!
   rollup/feature-files rollup/handlers all/handlers))
