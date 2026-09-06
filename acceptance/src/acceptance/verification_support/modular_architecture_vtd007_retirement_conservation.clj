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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-06T13:44:26.624363674+02:00", :module-hash "1425241510", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-907119328"} {:id "defn/calibration-projection", :kind "defn", :line 4, :end-line 7, :hash "142888074"} {:id "defn/evidence-excluded?", :kind "defn", :line 9, :end-line 11, :hash "172919744"} {:id "defn/emit!", :kind "defn", :line 13, :end-line 25, :hash "520171153"}]}
;; clj-mutate-manifest-end
