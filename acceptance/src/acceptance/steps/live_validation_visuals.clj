(ns acceptance.steps.live-validation-visuals
  (:require [acceptance.steps.live-validation-visual-assertions :as assertions]
            [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-live-validation-feed-presentation.feature"
   "features/data-layer-live-validation-interaction.feature"
   "features/data-layer-live-validation-property-presentation.feature"])

(defonce ^:private browser-observation (atom nil))

(defn- load-browser-observation! []
  (let [result (process/shell (assoc support/build-shell-options :env {"LIVE_VALIDATION_VISUALS_BROWSER_ADAPTER" "1"})
                              "node" "test/side-panel-component-layout-runtime-test.mjs")
        line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
        payload (when line (json/parse-string line true))
        observation (:liveValidationVisuals payload)]
    (support/assert! (zero? (:exit result)) "Live validation visuals browser runtime failed." {:out (:out result) :err (:err result)})
    (support/assert! observation "Live validation visuals browser observation is missing." {:payload payload})
    (reset! browser-observation observation)))

(defn- observation! []
  (or @browser-observation (load-browser-observation!)))

(defn- transition [world example _captures {:keys [text]}]
  (let [observation (observation!)]
    (assertions/assert-step! text example observation)
    (assoc world :live-validation-visuals observation)))

(def handlers
  (mapv (fn [spec] {:pattern (support/template-pattern (:text spec))
                    :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))
