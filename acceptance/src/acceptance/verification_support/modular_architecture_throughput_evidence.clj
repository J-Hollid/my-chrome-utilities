(ns acceptance.verification-support.modular-architecture-throughput-evidence
  (:require [acceptance.verification-support.modular-architecture-process-evidence :as process-evidence]))

(defonce ^:private registry-evidence (atom nil))
(defonce ^:private event-evidence (atom nil))
(defonce ^:private capture-evidence (atom nil))
(defonce ^:private schemas-evidence (atom nil))
(defonce ^:private history-evidence (atom nil))
(defonce ^:private promotion-evidence (atom nil))
(defonce ^:private reliability-evidence (atom nil))

(defn- load-evidence! [cache task prefix key label]
  (process-evidence/load! cache
    {:command ["node" task]
     :prepared-task (str "unit:" task)
     :fallback ["node" task]
     :prefix prefix
     :key key
     :failure (str label " contract failed.")
     :missing (str label " evidence is missing.")}))

(defn prepare [world]
  (let [registry (load-evidence! registry-evidence
                   "test/verification-contracts/reliability-calibration-contract-test.mjs"
                   "{\"vtd004Acceptance\"" nil "Verification registry throughput")
        event (load-evidence! event-evidence
                "test/verification-contracts/ownership-event-library-contract-test.mjs"
                "{\"vtd004EventAcceptance\"" nil "Verification Event Library ownership")
        capture (load-evidence! capture-evidence
                  "test/verification-contracts/ownership-capture-contract-test.mjs"
                  "{\"vtd004CaptureAcceptance\"" nil "Verification Capture ownership")
        schemas (load-evidence! schemas-evidence
                  "test/verification-contracts/ownership-schemas-contract-test.mjs"
                  "{\"vtd004SchemasAcceptance\"" nil "Verification Schemas ownership")
        promotion (load-evidence! promotion-evidence
                    "test/verification-contracts/evidence-promotion-conservation-contract-test.mjs"
                    "{\"vtd005Acceptance\"" nil "Verification promotion throughput")
        history (load-evidence! history-evidence
                  "test/verification-contracts/ownership-priority-contract-test.mjs"
                  "{\"vtd009HistoryAcceptance\"" :vtd009HistoryAcceptance
                  "Verification historical ownership")
        reliability (load-evidence! reliability-evidence
                      "test/verification-contracts/reliability-calibration-contract-test.mjs"
                      "{\"vtd009Acceptance\"" nil "Verification reliability throughput")]
    (assoc world
           :vtd004/project-evidence (:vtd004Acceptance registry)
           :vtd004/durable-evidence (:vtd004DurableAcceptance registry)
           :vtd004/event-evidence (:vtd004EventAcceptance event)
           :vtd004/capture-evidence (:vtd004CaptureAcceptance capture)
           :vtd004/schemas-evidence (:vtd004SchemasAcceptance schemas)
           :vtd005/evidence (:vtd005Acceptance promotion)
           :vtd009/evidence (assoc (:vtd009Acceptance reliability) :history
                                  (merge history (:history (:vtd009Acceptance reliability)))))))
