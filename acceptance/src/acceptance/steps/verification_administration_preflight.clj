(ns acceptance.steps.verification-administration-preflight
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/verification-administration-preflight.feature"])

(defonce ^:private verified (atom false))

(defn- verify-contract! []
  (when-not @verified
    (let [result (support/verified-command-result
                  "node" "test/verification-contracts/administration-preflight-contract-test.mjs")]
      (support/assert! (zero? (:exit result))
                       "Verification administration preflight contracts failed."
                       {:err (:err result) :out (:out result)})
      (reset! verified true))))

(defn- transition [world _example _captures _spec]
  (verify-contract!)
  (assoc world :verification-administration-preflight/active true))

(def handlers
  (support/feature-scoped-stateful-handlers
   feature-files
   #(= % "an exact committed candidate has a canonical review-evidence plan")
   :verification-administration-preflight/active
   transition))
