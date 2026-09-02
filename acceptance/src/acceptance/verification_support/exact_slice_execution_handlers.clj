(ns acceptance.verification-support.exact-slice-execution-handlers
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/verification-process-exact-slice-execution.feature"])

(defn- transition [world _example _captures _spec]
  (assoc world :verification-exact-slice-execution/active true))

(def handlers
  (support/feature-scoped-stateful-handlers
   feature-files
   #(= % "a process-only candidate changes no product behavior")
   :verification-exact-slice-execution/active
   transition))
