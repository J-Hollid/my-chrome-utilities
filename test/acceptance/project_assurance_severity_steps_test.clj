(ns acceptance.project-assurance-severity-steps-test
  (:require [acceptance.steps.project-assurance-severity :as assurance]
            [clojure.test :refer [deftest is]]))

(deftest assurance-browser-evidence-accepts-only-complete-status-values
  (is (nil? (#'assurance/assert-browser!
             {:warning true
              :blockedEvidence {:compiler true :presentation "status"}})))
  (is (thrown? clojure.lang.ExceptionInfo
               (#'assurance/assert-browser!
                {:warning false
                 :blockedEvidence {:compiler true}}))))

(deftest assurance-examples-remain-inside-the-approved-domain
  (is (map? (assurance/validate-example!
             :model
             {"project_state" "no Fixtures"
              "finding" "No Fixtures"})))
  (is (thrown? clojure.lang.ExceptionInfo
               (assurance/validate-example!
                :runtime
                {"project_state" "blocking Fixture warning"}))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-29T18:24:31.678588438+02:00", :module-hash "1096248478", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-109684694"} {:id "form/1/deftest", :kind "deftest", :line 5, :end-line 12, :hash "852544106"} {:id "form/2/deftest", :kind "deftest", :line 14, :end-line 22, :hash "-1267714373"}]}
;; clj-mutate-manifest-end
