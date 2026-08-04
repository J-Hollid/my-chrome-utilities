(ns acceptance.steps.guided-validation
  (:require [acceptance.steps.guided-validation-assertions :as assertions]
            [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-guided-validation-constraint-authoring.feature"
   "features/data-layer-guided-validation-creation.feature"
   "features/data-layer-guided-validation-form-assistance.feature"
   "features/data-layer-guided-validation-path-scope.feature"
   "features/data-layer-guided-validation-schema-destination.feature"
   "features/data-layer-guided-validation-schema-picker-dialog.feature"])

(def ^:private entry-modes
  {"captured event pageview from http://127.0.0.1:4173/ is selected in Live" :creation
   "a guided validation draft is open for captured event pageview" :constraint
   "the guided validation flow is displayed" :form
   "a guided validation draft is open for pageview from http://127.0.0.1:4173/" :path
   "a guided validation draft defines an allowed-values rule for property page_type" :destination
   "a guided validation draft has selected payload property page_type" :destination
   "Add validation started from payload property page_type" :destination
   "the guided validation schema destination stage is displayed at 320 CSS px wide" :picker})

(defonce ^:private browser-observation (atom nil))

(defn- load-browser-observation! []
  (let [options {:adapter-env "GUIDED_VALIDATION_BROWSER_ADAPTER"
                 :runtime-error "Guided validation browser runtime verification failed."
                 :missing-error "Guided validation browser observation is missing."}
        guided (support/load-browser-observation!
                (assoc options :observation-key :guidedValidation))
        picker (support/load-browser-observation!
                (assoc options :observation-key :guidedSchemaPicker))]
    (reset! browser-observation (assoc guided :schemaPicker picker))))

(defn- browser-observation! []
  (if-some [observation @browser-observation]
    observation
    (load-browser-observation!)))

(defn- begin-mode [world text]
  (if-some [mode (get entry-modes text)]
    (assoc world
           :guided-validation-mode mode
           :guided-validation-observation (browser-observation!))
    world))

(defn- transition [world example _captures {:keys [text]}]
  (let [world (begin-mode world text)
        observation (:guided-validation-observation world)
        active-mode (:guided-validation-mode world)]
    (support/assert! observation "Guided validation browser adapter was not executed." {:step text})
    (assertions/assert-mode! active-mode text example observation)
    world))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (contains? entry-modes (:text spec))
                           (:guided-validation-mode world)))
           :handler (fn [world example captures]
                      (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T00:33:51.41628833+02:00", :module-hash "-3009010", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1376270334"} {:id "def/feature-files", :kind "def", :line 8, :end-line nil, :hash "-1845685542"} {:id "def/entry-modes", :kind "def", :line 16, :end-line nil, :hash "-650113430"} {:id "form/3/defonce", :kind "defonce", :line 25, :end-line nil, :hash "-1618529344"} {:id "defn-/parse-browser-payload", :kind "defn-", :line 27, :end-line nil, :hash "-749063334"} {:id "defn-/combine-browser-observations", :kind "defn-", :line 30, :end-line nil, :hash "-12053386"} {:id "defn-/load-browser-observation!", :kind "defn-", :line 34, :end-line nil, :hash "-604886080"} {:id "defn-/browser-observation!", :kind "defn-", :line 48, :end-line nil, :hash "1601955891"} {:id "defn-/begin-mode", :kind "defn-", :line 53, :end-line nil, :hash "276448475"} {:id "defn-/transition", :kind "defn-", :line 60, :end-line nil, :hash "-526565651"} {:id "def/handlers", :kind "def", :line 68, :end-line nil, :hash "1321343894"}]}
;; clj-mutate-manifest-end
