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
