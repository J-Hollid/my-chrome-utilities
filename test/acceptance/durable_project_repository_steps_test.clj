(ns acceptance.durable-project-repository-steps-test
  (:require [acceptance.steps.durable-project-repository :as durable]
            [clojure.test :refer [deftest is testing]]))

(deftest validates-durable-failure-example-domain
  (testing "specified failure examples remain accepted"
    (doseq [failure ["quota exceeded" "transaction aborted" "repository unavailable"]]
      (is (= {"failure" failure}
             (durable/validate-example! :model {"failure" failure})))))
  (testing "case mutations and unknown failures are rejected"
    (doseq [failure ["quota exceedeD" "tRansaction aborted"
                     "repository unavailabLe" "unknown failure"]]
      (is (thrown? Exception
                   (durable/validate-example! :runtime {"failure" failure})))))
  (testing "scenarios without example parameters remain valid"
    (is (= {} (durable/validate-example! :model {})))))
