(ns acceptance.verification-support.receipt-retention-lifecycle-handlers
  (:require [acceptance.causal-regression :as causal-regression]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def ^:private feature-files
  ["features/verification-receipt-retention-lifecycle.feature"])

(def ^:private authoritative-examples
  (support/authoritative-feature-examples feature-files))

(defonce ^:private verified? (atom false))

(defn- receipt-scenario? [world]
  (str/starts-with? (:acceptance/scenario-name world "")
                    "Verification receipt retention lifecycle "))

(defn- verify-receipt-lifecycle! []
  (when-not @verified?
    (let [target "test/verification-contracts/receipt-retention-lifecycle-test.mjs"
          result (support/verified-task-result (str "unit:" target) "node" target)]
      (support/assert! (zero? (:exit result))
                       "Verification receipt lifecycle contract failed."
                       {:target target :out (:out result) :err (:err result)}))
    (reset! verified? true))
  (causal-regression/emit!
   :receipt-lifecycle-task-key-binding
   {:task-key-bound true :family-scoped true}
   {:id "receipt-lifecycle-task-key-binding-v1"
    :causal-category "other:receipt lifecycle task-key binding"
    :input {:family "receipt retention" :lookup "version-2 task identity"}
    :expected-pre-repair-failure {:task-key-bound false :family-scoped false}
    :expected-repair-result {:task-key-bound true :family-scoped true}}))

(defn handlers []
  [{:pattern #"^(.+)$"
    :applies? receipt-scenario?
    :handler (fn [world example _captures]
               (support/validate-authoritative-example!
                authoritative-examples example
                "Verification receipt lifecycle example is not authoritative.")
               (verify-receipt-lifecycle!)
               world)}])
