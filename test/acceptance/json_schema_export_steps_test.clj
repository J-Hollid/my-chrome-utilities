(ns acceptance.json-schema-export-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.json-schema-export :as json-schema-export]
            [acceptance.steps.support :as support]
            [clojure.test :refer [deftest is]]))

(deftest validates-json-schema-example-relations-without-a-child-process
  (let [example {"rule_type" "Item count"
                 "comparison" "=="
                 "standard_assertion" "minItems 50 and maxItems 50"}]
    (is (= [9 10 8]
           (mapv (comp count :rows) json-schema-export/model-example-relations)))
    (is (= example
           (support/validate-example-relations!
            json-schema-export/model-example-relations example "invalid relation")))
    (is (thrown?
         clojure.lang.ExceptionInfo
         (support/validate-example-relations!
          json-schema-export/model-example-relations
          (assoc example "standard_assertion" "maxItems 50")
          "invalid relation")))))

(deftest verifies-json-schema-export-features
  (feature-support/verify-feature-suite!
   json-schema-export/feature-files json-schema-export/handlers all/handlers))
