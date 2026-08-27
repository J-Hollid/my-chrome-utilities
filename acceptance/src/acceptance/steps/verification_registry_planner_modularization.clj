(ns acceptance.steps.verification-registry-planner-modularization
  (:require [acceptance.steps.support :as support]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/verification-registry-planner-modularization.feature"])

(defonce ^:private evidence (atom nil))

(defn- verification-result []
  (support/verified-command-result
   "node" "test/verification-registry-planner-modularization-acceptance-test.mjs"))

(defn- result-payload [result]
  (->> (str/split-lines (:out result))
       (filter #(str/starts-with? % "{"))
       last
       (#(json/parse-string % true))
       :verificationRegistryPlannerModularization))

(defn- validate-result! [result payload]
  (support/assert! (and (zero? (:exit result)) (:passed payload))
                   "Verification registry and planner production contracts failed."
                   {:err (:err result) :out (:out result)}))

(defn- load-verified-evidence! []
  (let [result (verification-result)
        payload (result-payload result)]
    (validate-result! result payload)
    (reset! evidence payload)))

(defn- verified-evidence! []
  (when-not @evidence (load-verified-evidence!))
  @evidence)

(defn- transition [world _example _captures _spec]
  (assoc world
         :verification-registry-planner-modularization/active true
         :verification-registry-planner-modularization/evidence (verified-evidence!)))

(def handlers
  (support/feature-scoped-stateful-handlers
   feature-files
   #(= % "verification planning is bound to one candidate and its current and historical registries")
   :verification-registry-planner-modularization/active
   transition))
