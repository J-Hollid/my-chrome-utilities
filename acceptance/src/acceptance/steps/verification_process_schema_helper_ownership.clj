(ns acceptance.steps.verification-process-schema-helper-ownership
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/verification-process-schema-controller-helper-ownership.feature"])

(defonce ^:private evidence (atom nil))

(defn- verified-evidence! []
  (when-not @evidence
    (let [result (support/verified-command-result
                  "node" "test/verification-contracts/schema-controller-slice-activation-test.mjs")]
      (support/assert! (zero? (:exit result))
                       "Schema controller helper ownership contracts failed."
                       {:err (:err result) :out (:out result)})
      (reset! evidence {:verified true})))
  @evidence)

(defn- transition [world _example _captures _spec]
  (assoc world
         :verification-schema-helper-ownership/active true
         :verification-schema-helper-ownership/evidence (verified-evidence!)))

(def handlers
  (support/feature-scoped-stateful-handlers
   feature-files
   #(= % "QA has the ten installed Schema controller slices and the existing project hydration owner")
   :verification-schema-helper-ownership/active
   transition))
