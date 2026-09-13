(ns acceptance.steps.verification-registration-review-preflight
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/verification-registration-review-preflight.feature"])
(defonce verified? (atom false))
(defn- transition [world example captures _]
  (support/cached-command-verification! verified?
    "Verification registration review preflight failed. "
    "node" "test/verification-registration-review-preflight-test.mjs")
  (doseq [key (support/capture-placeholder-keys captures)]
    (support/require-example example key))
  (assoc world :verification-registration-review-preflight/active true))
(def handlers
  (support/feature-scoped-stateful-handlers feature-files
    #(= % "review preparation has a candidate, specification commit, received work base, evidence base, and intended handoff base")
    :verification-registration-review-preflight/active transition))
