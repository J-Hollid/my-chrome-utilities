(ns acceptance.defect-library-steps-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.all :as all]
            [acceptance.steps.defect-library :as defect-library]
            [aps.gherkin :as gherkin]
            [clojure.set :as set]
            [clojure.test :refer [deftest is]]))

(deftest verifies-defect-library-features
  (is (set/subset? (set defect-library/handlers) (set all/handlers)))
  (doseq [feature-file defect-library/feature-files]
    (is (= :passed
           (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                          defect-library/handlers)))
        feature-file)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T18:05:58.792665089+02:00", :module-hash "232361877", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 7, :hash "-1181909003"} {:id "form/1/deftest", :kind "deftest", :line 9, :end-line 15, :hash "-397981586"}]}
;; clj-mutate-manifest-end
