(ns acceptance.defect-library-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.defect-library :as defect-library]
            [clojure.test :refer [deftest]]))

(deftest verifies-defect-library-features
  (feature-support/verify-feature-suite!
   defect-library/feature-files defect-library/handlers all/handlers))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T19:47:24.036739975+02:00", :module-hash "-464393215", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "802449126"} {:id "form/1/deftest", :kind "deftest", :line 7, :end-line 9, :hash "-231077547"}]}
;; clj-mutate-manifest-end
