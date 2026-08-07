(ns acceptance.verification-support.isolated-handler-audit
  (:require [acceptance.pack-runtime :as pack-runtime]
            [aps.gherkin :as gherkin]
            [cheshire.core :as json]))

(defn- resolved-handlers [namespace handler-var]
  (or (some-> (ns-resolve namespace handler-var) deref) []))

(defn- namespace-handlers [handler]
  (let [namespace (pack-runtime/handler-namespace handler)]
    (require namespace)
    (concat (resolved-handlers namespace 'priority-handlers)
            (resolved-handlers namespace 'handlers))))

(defn- dependency-closure [packs pack-id]
  (loop [selected #{pack-id}]
    (let [expanded (into selected
                         (mapcat :dependencies
                                 (filter #(contains? selected (:id %)) packs)))]
      (if (= selected expanded) selected (recur expanded)))))

(defn- parsed-steps [feature]
  (let [parsed (gherkin/parse-file feature)]
    (concat (:background parsed) (mapcat :steps (:scenarios parsed)))))

(defn- first-matching-step [patterns feature]
  (some (fn [{:keys [text]}]
          (when (some #(re-matches % text) patterns) text))
        (parsed-steps feature)))

(defn loaded-cross-pack-step-consumers [packs]
  (vec
   (for [owner packs
         :when (= "event-library" (:id owner))
         handler (:isolatedVerificationHandlers owner)
         :let [patterns (mapv :pattern (namespace-handlers handler))]
         consumer packs
         :when (and (not= (:id owner) (:id consumer))
                    (contains? (dependency-closure packs (:id consumer)) (:id owner)))
         feature (:features consumer)
         :let [step (first-matching-step patterns feature)]
         :when step]
     {:handler handler
      :consumerPack (:id consumer)
      :feature feature
      :step step})))

(defn -main [& _]
  (let [registry (json/parse-string (slurp *in*) true)]
    (println (json/generate-string (loaded-cross-pack-step-consumers registry)))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-07T12:14:40.518759165+02:00", :module-hash "-1228588493", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-1981888344"} {:id "defn-/resolved-handlers", :kind "defn-", :line 6, :end-line 7, :hash "1219426525"} {:id "defn-/namespace-handlers", :kind "defn-", :line 9, :end-line 13, :hash "1417235603"} {:id "defn-/dependency-closure", :kind "defn-", :line 15, :end-line 20, :hash "1600343553"} {:id "defn-/parsed-steps", :kind "defn-", :line 22, :end-line 24, :hash "-553318818"} {:id "defn-/first-matching-step", :kind "defn-", :line 26, :end-line 29, :hash "-1229323408"} {:id "defn/loaded-cross-pack-step-consumers", :kind "defn", :line 31, :end-line 46, :hash "-1105234812"} {:id "defn/-main", :kind "defn", :line 48, :end-line 50, :hash "-772846762"}]}
;; clj-mutate-manifest-end
