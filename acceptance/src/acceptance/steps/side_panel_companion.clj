(ns acceptance.steps.side-panel-companion
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/side-panel-companion-brand-correction.feature"
   "features/side-panel-companion-brand-correction-runtime.feature"])
(def entry-modes
  {"the side panel uses the Specification Studio companion presentation" :model
   "the production side panel is installed and running in Chrome" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(def authoritative-examples (support/authoritative-feature-examples feature-files))

(defn assert-runtime! [evidence]
  (support/assert!
   (and (number? (:minimumContrast evidence)) (>= (:minimumContrast evidence) 4.5)
        (= #{360 420 512} (set (:widths evidence)))
        (= #{"projects" "live" "library" "sessions" "defects" "schemas" "hotkeys"}
           (set (:views evidence)))
        (= 21 (:populatedObservations evidence))
        (= 4 (:accessibilityModes evidence))
        (= 12 (:dialogClosures evidence))
        (= 3 (:longRecordWidths evidence))
        (true? (:recovery evidence)) (true? (:archive evidence))
        (true? (:studio evidence)) (true? (:emptyFilterPreservedActive evidence)))
   "Complete installed companion evidence is required." evidence))

(defn- observe-browser! []
  (support/cached-command-observation! browser-observation
    {:command ["node" "test/twatility-projects-browser-test.mjs"]
     :observation-key :sidePanelCompanion
     :runtime-error "Installed companion checks failed."
     :missing-error "Installed companion evidence is missing."}))
(defn- verify-model! []
  (support/cached-command-verification! model-verified?
    "Project record presentation failed. "
    "node" "test/side-panel-companion-presentation-test.mjs")
  (assert-runtime! (observe-browser!)))
(defn- validate-example! [_mode example]
  (support/validate-authoritative-example! authoritative-examples example
    "Companion example is outside the approved contract."))
(def handlers
  (support/verified-feature-mode-handlers feature-files entry-modes :side-panel-companion-mode
    verify-model! validate-example! observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-07T14:59:20.778864513+02:00", :module-hash "-2011105357", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "118452979"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-1116103354"} {:id "def/entry-modes", :kind "def", :line 7, :end-line 9, :hash "479485761"} {:id "form/3/defonce", :kind "defonce", :line 10, :end-line 10, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 11, :end-line 11, :hash "-1618529344"} {:id "def/authoritative-examples", :kind "def", :line 12, :end-line 12, :hash "1598887325"} {:id "defn/assert-runtime!", :kind "defn", :line 14, :end-line 26, :hash "-1564688784"} {:id "defn-/observe-browser!", :kind "defn-", :line 28, :end-line 33, :hash "-707804042"} {:id "defn-/verify-model!", :kind "defn-", :line 34, :end-line 38, :hash "-606865129"} {:id "defn-/validate-example!", :kind "defn-", :line 39, :end-line 41, :hash "1035788056"} {:id "def/handlers", :kind "def", :line 42, :end-line 44, :hash "1404939306"}]}
;; clj-mutate-manifest-end
