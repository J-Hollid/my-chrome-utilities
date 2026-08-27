(ns acceptance.live-target-permission-path-apply-test
  (:require [acceptance.pack-runtime :as packs]
            [acceptance.runtime :as runtime]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(def feature-path "features/modular-verification-packs.feature")

(deftest live-target-permission-path-apply-acceptance
  (let [feature (gherkin/parse-file feature-path)
        wanted #{"Modular verification packs 204"
                 "Modular verification packs 205"
                 "Modular verification packs 206"}
        scenarios (filterv #(contains? wanted (:name %)) (:scenarios feature))]
    (is (= 3 (count scenarios)) "all three path-apply scenarios remain registered")
    (is (= {:status :passed :executions 3}
           (runtime/run-feature! (assoc feature :scenarios scenarios)
                                 (packs/handlers-for-feature feature-path)))
        "the path-apply acceptance scenarios pass as one focused contract")))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-27T17:52:43.549676857+02:00", :module-hash "1661441014", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "92638594"} {:id "def/feature-path", :kind "def", :line 7, :end-line 7, :hash "-57033470"} {:id "form/2/deftest", :kind "deftest", :line 9, :end-line 19, :hash "-1497622675"}]}
;; clj-mutate-manifest-end
