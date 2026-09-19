(ns acceptance.steps.deterministic-baseline-evidence
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/deterministic-baseline-evidence.feature"])
(defonce verified? (atom false))

(defn- transition [world example captures _]
  (support/cached-command-verification! verified?
    "Deterministic baseline evidence contract failed. "
    "node" "test/verification-contracts/deterministic-baseline-evidence-contract-test.mjs")
  (doseq [key (support/capture-placeholder-keys captures)]
    (support/require-example example key))
  (assoc world :deterministic-baseline-evidence/active true))

(def handlers
  (support/feature-scoped-stateful-handlers feature-files
    #(= % "a focused review has an exact base, candidate, and selected plan")
    :deterministic-baseline-evidence/active transition))
