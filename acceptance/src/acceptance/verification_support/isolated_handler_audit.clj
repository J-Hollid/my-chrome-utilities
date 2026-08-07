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
