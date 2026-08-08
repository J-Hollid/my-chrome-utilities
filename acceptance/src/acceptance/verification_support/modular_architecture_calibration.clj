(ns acceptance.verification-support.modular-architecture-calibration
  (:require [acceptance.steps.support :as support]
            [aps.json :as aps-json]
            [babashka.fs :as fs]))

(defn performance-calibration []
  (aps-json/read-json-file
   (str (fs/path (support/repository-root) "verification" "performance-calibration.json"))))

(defn calibration-pack [calibration pack-id]
  (first (filter #(= pack-id (:id %)) (:runnablePacks calibration))))

(defn calibration-target [calibration target-id]
  (get (:browserTargets calibration) (keyword target-id)))

(defn calibration-pack-world [verify-throughput! world pack-id representative-path]
  (let [inspected (verify-throughput! world)
        calibration (performance-calibration)
        pack (case pack-id
               "capture" (get-in inspected [:vtd004/capture-evidence :calibration :previous])
               "schemas" (get-in inspected [:vtd004/schemas-evidence :calibration :previous])
               (calibration-pack calibration pack-id))
        registry (aps-json/read-json-file
                  (str (fs/path (support/repository-root) "verification/packs.json")))
        registry-pack (first (filter #(= pack-id (:id %)) registry))]
    (support/assert! (and pack registry-pack
                          (= representative-path (:representativeChangedPath pack)
                             (:representativeChangedPath registry-pack))
                          (fs/regular-file? (fs/path (support/repository-root) representative-path)))
                     "Representative verification file is not exact, owned, and committed."
                     {:pack pack-id :path representative-path})
    (assoc inspected
           :vtd003/calibration calibration
           :vtd003/pack pack
           :vtd003/selected-packs (:selectedPacks pack))))

(defn calibration-target-world [verify-throughput! world target-id]
  (let [calibration (performance-calibration)
        unmeasured? (= target-id "an unmeasured target")
        fallback-case (get-in calibration [:calibrationCases :unmeasuredDeclaredRegistry])
        resolved-id (if unmeasured? (:targetId fallback-case) target-id)
        budget (if unmeasured? (:budget fallback-case)
                   (calibration-target calibration resolved-id))]
    (support/assert! budget "Browser target calibration is missing."
                     {:target target-id :resolved-target resolved-id})
    (assoc (verify-throughput! world)
           :vtd003/calibration calibration
           :vtd003/target-id resolved-id
           :vtd003/target-budget budget)))

(defn calibration-world [verify-throughput! world]
  (assoc (verify-throughput! world) :vtd003/calibration (performance-calibration)))

(defn regression-world [world regression]
  (let [fan-out? (= regression "selected packs add gamma")
        measured (if fan-out? 2 61)
        limit (if fan-out? 1 60)]
    (support/assert! (contains? #{"selected packs add gamma"
                                 "corrected critical path exceeds the 60 second limit"}
                               regression)
                     "Unknown representative-path regression fixture." {:regression regression})
    (assoc world
           :vtd003/result (if (> measured limit) "fail" "pass")
           :vtd003/diagnostic
           (str "src/alpha/local-ui.ts selected alpha and beta; critical-path baseline 50 seconds; "
                "measured " measured "; limit " limit))))

(defn assert-vtd003! [world predicate message]
  (support/assert! predicate message {:calibration (:vtd003/calibration world)})
  world)

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-08T12:16:41.561938793+02:00", :module-hash "-1531419588", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "702125126"} {:id "defn/performance-calibration", :kind "defn", :line 6, :end-line 8, :hash "-1292448049"} {:id "defn/calibration-pack", :kind "defn", :line 10, :end-line 11, :hash "-2084832475"} {:id "defn/calibration-target", :kind "defn", :line 13, :end-line 14, :hash "-464783358"} {:id "defn/calibration-pack-world", :kind "defn", :line 16, :end-line 35, :hash "873884160"} {:id "defn/calibration-target-world", :kind "defn", :line 37, :end-line 49, :hash "854402514"} {:id "defn/calibration-world", :kind "defn", :line 51, :end-line 52, :hash "349749996"} {:id "defn/regression-world", :kind "defn", :line 54, :end-line 66, :hash "1243936214"} {:id "defn/assert-vtd003!", :kind "defn", :line 68, :end-line 70, :hash "-1417059923"}]}
;; clj-mutate-manifest-end
