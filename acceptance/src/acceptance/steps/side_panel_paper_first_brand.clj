(ns acceptance.steps.side-panel-paper-first-brand
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/side-panel-paper-first-brand-alignment.feature"
   "features/side-panel-paper-first-brand-alignment-runtime.feature"])

(def entry-modes
  {"the TWAtility Belt side panel is displayed with its default presentation" :model
   "the paper-first side-panel redesign is built and packaged" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Side-panel paper-first model verification failed. "
   "node" "test/side-panel-paper-first-brand-test.mjs"))

(defn- observe-browser! []
  (support/cached-command-observation!
   browser-observation
   {:command ["node" "test/twatility-side-panel-shell-browser-test.mjs"]
    :observation-key :sidePanelPaperFirstBrand
    :runtime-error "Side-panel paper-first browser verification failed."
    :missing-error "Side-panel paper-first browser evidence is missing."}))

(defn- assert-runtime! [evidence]
  (support/assert! (and (map? evidence) (every? true? (vals evidence)))
                   "Installed side-panel paper-first evidence is incomplete."
                   evidence))

(def authoritative-examples
  (support/authoritative-feature-examples feature-files))

(defn- validate-example! [_mode example]
  (support/validate-authoritative-example!
   authoritative-examples example
   "Side-panel paper-first example is outside the approved contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :side-panel-paper-first-brand-mode
   verify-model! validate-example! observe-browser! assert-runtime!))
