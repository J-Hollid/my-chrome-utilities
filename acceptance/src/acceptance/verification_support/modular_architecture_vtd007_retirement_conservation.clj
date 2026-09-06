(ns acceptance.verification-support.modular-architecture-vtd007-retirement-conservation
  (:require [acceptance.causal-regression :as causal-regression]))

(defn calibration-projection [calibration]
  (-> calibration
      (update "conservation" dissoc "verificationTopologyDigest")
      (dissoc "retiredReceipts" "sourceEvidence")))

(defn evidence-excluded? [base current]
  (and (not (contains? base "retiredReceipts"))
       (boolean (seq (get current "retiredReceipts")))))

(defn emit! [calibration-conserved? retired-receipt-evidence-excluded?]
  (causal-regression/emit!
   :retired-calibration-conservation
   {:vtd007-calibration-conserved calibration-conserved?
    :retired-receipt-evidence-excluded retired-receipt-evidence-excluded?}
   {:id "retired-calibration-conservation-v1"
    :causal-category "other:retired calibration conservation projection"
    :input {:historical-scenario "Modular verification packs 088"
            :later-evidence-field "retiredReceipts"}
    :expected-pre-repair-failure {:vtd007-calibration-conserved false
                                  :retired-receipt-evidence-excluded false}
    :expected-repair-result {:vtd007-calibration-conserved true
                             :retired-receipt-evidence-excluded true}}))
