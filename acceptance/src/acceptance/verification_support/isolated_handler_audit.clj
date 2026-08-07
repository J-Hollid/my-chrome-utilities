(ns acceptance.verification-support.isolated-handler-audit
  (:require [aps.gherkin :as gherkin]
            [cheshire.core :as json]
            [clojure.string :as str]))

(defn- handler-namespace [handler]
  (-> handler
      (str/replace #"^acceptance/src/" "")
      (str/replace #"\.clj$" "")
      (str/replace "/" ".")
      (str/replace "_" "-")
      symbol))

(defn- namespace-handlers [handler]
  (let [namespace (handler-namespace handler)]
    (require namespace)
    (concat (or (some-> (ns-resolve namespace 'priority-handlers) deref) [])
            (or (some-> (ns-resolve namespace 'handlers) deref) []))))

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
