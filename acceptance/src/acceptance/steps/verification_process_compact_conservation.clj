(ns acceptance.steps.verification-process-compact-conservation
  (:require [acceptance.steps.support :as support]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/verification-process-compact-conservation.feature"])

(defonce ^:private evidence (atom nil))

(defn- verified-evidence! []
  (when-not @evidence
    (let [result (support/verified-command-result
                  "node" "test/verification-contracts/compact-conservation-contract-test.mjs")
          payload (->> (str/split-lines (:out result))
                       (filter #(str/starts-with? % "{\"verificationProcessCompactConservation\""))
                       first
                       (#(json/parse-string % true))
                       :verificationProcessCompactConservation)]
      (support/assert! (and (zero? (:exit result)) (:exactParity payload)
                            (:deterministic payload) (:noSnapshot payload)
                            (:failClosed payload))
                       "Compact conservation production contracts failed."
                       {:err (:err result) :out (:out result)})
      (reset! evidence payload)))
  @evidence)

(defn- transition [world _example _captures _spec]
  (assoc world :verification-compact-conservation/active true
    :verification-compact-conservation/evidence (verified-evidence!)))

(def handlers
  (support/feature-scoped-stateful-handlers
   feature-files
   #(= % "verification registry generation must preserve exact task and ownership behavior")
   :verification-compact-conservation/active
   transition))
