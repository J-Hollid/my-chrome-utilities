(ns acceptance.steps.live-validation-visuals
  (:require [acceptance.steps.live-validation-visual-assertions :as assertions]
            [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-live-validation-feed-presentation.feature"
   "features/data-layer-live-validation-interaction.feature"
   "features/data-layer-live-validation-property-presentation.feature"])

(defonce ^:private browser-observation (atom nil))

(defn- load-browser-observation! []
  (reset! browser-observation
          (support/load-browser-observation!
            {:adapter-env "LIVE_VALIDATION_VISUALS_BROWSER_ADAPTER"
             :observation-key :liveValidationVisuals
             :runtime-error "Live validation visuals browser runtime failed."
             :missing-error "Live validation visuals browser observation is missing."})))

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
;; {:version 1, :tested-at "2026-07-13T17:34:38.558477832+02:00", :module-hash "-2070917972", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "306069593"} {:id "def/feature-files", :kind "def", :line 5, :end-line nil, :hash "-989478682"} {:id "form/2/defonce", :kind "defonce", :line 10, :end-line nil, :hash "-1618529344"} {:id "defn-/load-browser-observation!", :kind "defn-", :line 12, :end-line nil, :hash "1111559418"} {:id "defn-/observation!", :kind "defn-", :line 20, :end-line nil, :hash "233446595"} {:id "defn-/transition", :kind "defn-", :line 23, :end-line nil, :hash "662959085"} {:id "def/handlers", :kind "def", :line 28, :end-line nil, :hash "1591672767"}]}
;; clj-mutate-manifest-end
