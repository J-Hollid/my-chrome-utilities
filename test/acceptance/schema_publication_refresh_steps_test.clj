(ns acceptance.schema-publication-refresh-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.schema-publication-refresh :as publication]
            [clojure.test :refer [deftest]]))

(deftest verifies-schema-publication-refresh-features
  (feature-support/verify-feature-suite!
   publication/feature-files publication/handlers all/handlers))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T19:47:38.123416734+02:00", :module-hash "-1383996524", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "603028962"} {:id "form/1/deftest", :kind "deftest", :line 7, :end-line 9, :hash "1978211333"}]}
;; clj-mutate-manifest-end
