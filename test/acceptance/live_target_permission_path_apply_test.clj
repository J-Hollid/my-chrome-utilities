(ns acceptance.live-target-permission-path-apply-test
  (:require [acceptance.pack-runtime :as packs]
            [acceptance.runtime :as runtime]
            [aps.gherkin :as gherkin]))

(def feature-path "features/modular-verification-packs.feature")

(let [feature (gherkin/parse-file feature-path)
      wanted #{"Modular verification packs 204"
               "Modular verification packs 205"
               "Modular verification packs 206"}
      scenarios (filterv #(contains? wanted (:name %)) (:scenarios feature))]
  (when-not (= 3 (count scenarios))
    (throw (ex-info "Expected exactly three path-apply acceptance scenarios"
                    {:scenarios (mapv :name scenarios)})))
  (let [result (runtime/run-feature! (assoc feature :scenarios scenarios)
                                     (packs/handlers-for-feature feature-path))]
    (when-not (= {:status :passed :executions 3} result)
      (throw (ex-info "Path-apply acceptance scenario failed" {:result result})))))

(println "live target permission path apply Clojure acceptance passed")

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-24T21:17:01.151659801+02:00", :module-hash "1902015293", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-1107340904"} {:id "def/feature-path", :kind "def", :line 6, :end-line 6, :hash "-57033470"} {:id "form/2/let", :kind "let", :line 8, :end-line 19, :hash "418883370"} {:id "form/3/println", :kind "println", :line 21, :end-line 21, :hash "915648894"}]}
;; clj-mutate-manifest-end
