(ns acceptance.steps.live-flow-guided-testing
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]))

(def feature-files
  ["features/data-layer-live-flow-guided-testing.feature"
   "features/data-layer-live-flow-guided-testing-runtime.feature"])
(def entry-modes
  {"Retail website is the active project" :model
   "the installed extension has active project Retail website" :runtime})
(defonce model-verified? (atom false))
(defonce browser-verified? (atom false))

(defn- checked! [message & command]
  (let [result (apply process/shell {:out :string :err :string} command)]
    (support/assert! (zero? (:exit result)) (str message " " (:err result)) {:out (:out result)})
    result))

(defn- verify-model! []
  (when-not @model-verified?
    (checked! "Live Flow testing model verification failed." "node" "test/data-layer-live-flow-testing-test.mjs")
    (reset! model-verified? true)))

(defn- observe-browser! []
  (when-not @browser-verified?
    (checked! "Live Flow testing browser adapter failed." "node" "test/browser-packs/live-flow-testing.mjs")
    (reset! browser-verified? true))
  @browser-verified?)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :live-flow-guided-testing-mode
   verify-model! (fn [_mode _example] true)
   observe-browser!
   (fn [verified?]
     (support/assert! verified? "Installed Live Flow testing evidence is missing." {}))))
