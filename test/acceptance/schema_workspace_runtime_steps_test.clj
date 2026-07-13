(ns acceptance.schema-workspace-runtime-steps-test
  (:require [acceptance.steps.schema-workspace-runtime :as workspace]
            [clojure.test :refer [deftest is testing]]))

(def valid-observation
  {:transfer {:before {:schemas ["schema:checkout" "schema:order"]
                       :rules ["rule:page-type" "rule:channel"]}
              :content {:version 1
                        :schemas ["schema:checkout" "schema:order"]
                        :rules ["rule:page-type" "rule:channel"]}}})

(deftest shared-export-preflight-is-independent-of-outline-counts
  (is (= valid-observation
         (#'workspace/assert-export-preflight! valid-observation))))

(deftest shared-export-preflight-keeps-envelope-and-identity-checks-separate
  (testing "a valid format version cannot hide a missing schema identity"
    (is (thrown-with-msg? clojure.lang.ExceptionInfo
                          #"schema identities"
                          (#'workspace/assert-export-preflight!
                           (assoc-in valid-observation [:transfer :content :schemas] ["schema:checkout"])))))
  (testing "schema identity equality cannot hide an invalid envelope version"
    (is (thrown-with-msg? clojure.lang.ExceptionInfo
                          #"format version"
                          (#'workspace/assert-export-preflight!
                           (assoc-in valid-observation [:transfer :content :version] 2))))))

(deftest visibility-observation-starts-only-at-feature-entry-steps
  (let [world {:browser-observation {:ruleEditorVisibility {}}}
        example {}]
    (is (true? (:schema-rule-visibility?
                (#'workspace/begin-visibility-observation
                 world example "Data Layer view <view_name> is active"))))
    (is (= world
           (#'workspace/begin-visibility-observation
            world example "Rule configuration is not visible")))))

(deftest browser-workspace-reuses-a-validated-observation-for-the-same-fixture
  (let [observation {:mounted true}]
    (reset! workspace/browser-workspace-observations {nil observation})
    (is (= {:browser-observation observation}
           (#'workspace/browser-workspace! {} {})))
    (reset! workspace/browser-workspace-observations {})))
