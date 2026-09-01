(ns acceptance.verification-support.bootstrap-fast-path-handlers
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/verification-process-bootstrap-fast-path.feature"])

(defonce ^:private evidence (atom nil))

(defn- verify-bootstrap! []
  (when-not @evidence
    (let [result (support/verified-command-result
                  "node" "scripts/verification-bootstrap/acceptance-probe.mjs")
          observed (support/json-observation
                    (:out result) :verificationProcessBootstrapFastPath)]
      (support/assert! (and (zero? (:exit result))
                            (support/all-values-true? observed))
                       "Verification bootstrap fast-path contracts failed."
                       {:err (:err result) :out (:out result)})
      (reset! evidence observed))))

(defn- transition [world _example _captures _spec]
  (verify-bootstrap!)
  (assoc world :verification-bootstrap-fast-path/active true))

(def handlers
  (support/feature-scoped-stateful-handlers
   feature-files
   #(= % "a user-approved process-only transition has an exact base commit and stable task")
   :verification-bootstrap-fast-path/active
   transition))
