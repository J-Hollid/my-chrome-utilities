(ns acceptance.live-target-permission-path-apply-test
  (:require [acceptance.pack-runtime :as packs]
            [acceptance.runtime :as runtime]
            [aps.gherkin :as gherkin]))

(def feature-path "features/modular-verification-packs.feature")

(let [feature (gherkin/parse-file feature-path)
      scenarios (filterv #(= "Modular verification packs 101" (:name %))
                         (:scenarios feature))]
  (when-not (= 1 (count scenarios))
    (throw (ex-info "Expected exactly one path-apply acceptance scenario"
                    {:scenarios (mapv :name scenarios)})))
  (let [result (runtime/run-feature! (assoc feature :scenarios scenarios)
                                     (packs/handlers-for-feature feature-path))]
    (when-not (= :passed (:status result))
      (throw (ex-info "Path-apply acceptance scenario failed" {:result result})))))

(println "live target permission path apply Clojure acceptance passed")
