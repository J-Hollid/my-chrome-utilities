(ns acceptance.steps.guided-validation
  (:require [acceptance.steps.guided-validation-assertions :as assertions]
            [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-guided-validation-constraint-authoring.feature"
   "features/data-layer-guided-validation-creation.feature"
   "features/data-layer-guided-validation-form-assistance.feature"
   "features/data-layer-guided-validation-path-scope.feature"])

(def ^:private entry-modes
  {"captured event pageview from http://127.0.0.1:4173/ is selected in Live" :creation
   "a guided validation draft is open for captured event pageview" :constraint
   "the guided validation flow is displayed" :form
   "a guided validation draft is open for pageview from http://127.0.0.1:4173/" :path})

(defonce ^:private browser-observation (atom nil))

(defn- load-browser-observation! []
  (let [result (process/shell (assoc support/build-shell-options
                                     :env {"GUIDED_VALIDATION_BROWSER_ADAPTER" "1"})
                              "node" "test/side-panel-component-layout-runtime-test.mjs")
        line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
        payload (when line (json/parse-string line true))
        observation (:guidedValidation payload)]
    (support/assert! (zero? (:exit result))
                     "Guided validation browser runtime verification failed."
                     {:out (:out result) :err (:err result)})
    (support/assert! observation "Guided validation browser observation is missing." {:payload payload})
    (reset! browser-observation observation)))

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
