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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-13T01:49:01.537673099+02:00", :module-hash "1323830443", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-347581453"} {:id "def/feature-files", :kind "def", :line 8, :end-line nil, :hash "-989478682"} {:id "form/2/defonce", :kind "defonce", :line 13, :end-line nil, :hash "-1618529344"} {:id "defn-/load-browser-observation!", :kind "defn-", :line 15, :end-line nil, :hash "-583680598"} {:id "defn-/observation!", :kind "defn-", :line 25, :end-line nil, :hash "233446595"} {:id "defn-/transition", :kind "defn-", :line 28, :end-line nil, :hash "662959085"} {:id "def/handlers", :kind "def", :line 33, :end-line nil, :hash "1591672767"}]}
;; clj-mutate-manifest-end
