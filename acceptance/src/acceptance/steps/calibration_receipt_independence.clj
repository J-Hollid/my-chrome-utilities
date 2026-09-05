(ns acceptance.steps.calibration-receipt-independence
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/calibration-receipt-independence.feature"])
(defonce evidence (atom nil))
(defn- observe [file key]
  (let [result (support/verified-command-result "node" (str "test/verification-contracts/" file))
        value (support/json-observation (:out result) key)]
    (support/assert! (and (zero? (:exit result)) value) "Calibration contract failed." result)
    value))
(defn- verify! []
  (or @evidence
      (reset! evidence
              {:rules (observe "calibration-rule-test.mjs" :calibrationRules)
               :sources (observe "calibration-source-independence-test.mjs" :calibrationSources)
               :history (observe "calibration-history-test.mjs" :calibrationHistory)
               :consumer (observe "calibration-receipt-consumer-test.mjs" :calibrationConsumer)
               :others (observe "calibration-receipt-consumer-test.mjs" :calibrationOtherConsumers)})))
(def conditions
  {"valid declared samples within the cutoff" "valid"
   "an eligible sample omitted from declarations" "omitted"
   "duplicate declarations" "duplicate"
   "a declared sample with no raw or validated compact identity" "missing"
   "a rejected receipt declared as eligible" "rejected"
   "a declared receipt from another environment" "crossClass"
   "a declared receipt after the cutoff" "postCutoff"
   "compact retirement identity differs from available raw evidence" "retirementMismatch"})
(defn- relations [observed]
  [{:keys ["condition" "result"]
    :rows (set (for [[condition key] conditions
                     :when (if (= key "valid") (get-in observed [:rules :valid])
                               (some #{key} (get-in observed [:rules :rejected])))]
                 [condition (if (= key "valid") "accepted" "rejected")]))}
   {:keys ["source_state" "disposition"]
    :rows #{["one of the six identified missing raw samples" "unavailable with its original digest and no invented completion identity"]
            ["the seventh sample with an existing validated retirement record" "that unchanged compact retirement identity"]}}
   {:keys ["consumer_state" "retention"]
    :rows #{["only the explicitly disposed historical calibration reference" "no calibration-only retention or old-ledger read"]
            ["an active calibration without the historical disposition" "existing raw or validated compact input rules"]
            ["a pending review or active incident" "existing consumer retention"]
            ["malformed or incorrectly bound historical provenance" "reject the disposition without authorizing cleanup"]}}])
(defn- transition [world example captures {:keys [text]}]
  (let [{:keys [rules sources history consumer others] :as observed} (verify!)]
    (doseq [key (support/capture-placeholder-keys captures)] (support/require-example example key))
    (support/validate-example-relations! (relations observed) example "Unproved calibration example.")
    (when (= text "temporary calibration sources are <source_state>")
      (support/assert! (contains? #{"absent" "populated with unrelated worker receipts"}
                                  (support/require-example example "source_state"))
                       "Unknown temporary source state." example))
    (support/assert! (and (:valid rules) (:authoredInputs rules) (:nonmutation rules)
                          (:identical sources) (:absent sources) (:populated sources)
                          (:retained history) (= 6 (:unavailable history)) (= 1 (:retired history))
                          (false? (:freshMeasurementEvidence history)) (:rejectsMalformed history)
                          (:historicalClosed consumer) (zero? (:ledgerReads consumer))
                          (:activeRetained consumer) (:missingActiveIndexRejected consumer)
                          (:malformedRejected consumer) (:pendingReview others) (:activeIncident others))
                     "Calibration independence contract is incomplete." observed)
    (assoc world :calibration-independence/active true)))
(def handlers
  (support/feature-scoped-stateful-handlers feature-files
   #(= % "historical calibration data is distinct from fresh verification evidence")
   :calibration-independence/active transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-05T20:45:16.52083159+02:00", :module-hash "1460623764", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "368352108"} {:id "def/feature-files", :kind "def", :line 4, :end-line 4, :hash "1664476800"} {:id "form/2/defonce", :kind "defonce", :line 5, :end-line 5, :hash "701185655"} {:id "defn-/observe", :kind "defn-", :line 6, :end-line 10, :hash "-425194249"} {:id "defn-/verify!", :kind "defn-", :line 11, :end-line 18, :hash "-333849661"} {:id "def/conditions", :kind "def", :line 19, :end-line 27, :hash "-387586707"} {:id "defn-/relations", :kind "defn-", :line 28, :end-line 41, :hash "1327602217"} {:id "defn-/transition", :kind "defn-", :line 42, :end-line 58, :hash "2033014252"} {:id "def/handlers", :kind "def", :line 59, :end-line 62, :hash "-120518890"}]}
;; clj-mutate-manifest-end
