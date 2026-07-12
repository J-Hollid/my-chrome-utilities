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
   "features/data-layer-guided-validation-path-scope.feature"
   "features/data-layer-guided-validation-schema-destination.feature"])

(def ^:private entry-modes
  {"captured event pageview from http://127.0.0.1:4173/ is selected in Live" :creation
   "a guided validation draft is open for captured event pageview" :constraint
   "the guided validation flow is displayed" :form
   "a guided validation draft is open for pageview from http://127.0.0.1:4173/" :path
   "a guided validation draft defines an allowed-values rule for property page_type" :destination})

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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-12T23:01:53.512522317+02:00", :module-hash "712298597", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1376270334"} {:id "def/feature-files", :kind "def", :line 8, :end-line nil, :hash "-1789939698"} {:id "def/entry-modes", :kind "def", :line 15, :end-line nil, :hash "-1772175282"} {:id "form/3/defonce", :kind "defonce", :line 22, :end-line nil, :hash "-1618529344"} {:id "defn-/load-browser-observation!", :kind "defn-", :line 24, :end-line nil, :hash "-504869510"} {:id "defn-/browser-observation!", :kind "defn-", :line 37, :end-line nil, :hash "1601955891"} {:id "defn-/begin-mode", :kind "defn-", :line 42, :end-line nil, :hash "276448475"} {:id "defn-/transition", :kind "defn-", :line 49, :end-line nil, :hash "-526565651"} {:id "def/handlers", :kind "def", :line 57, :end-line nil, :hash "1321343894"}]}
;; clj-mutate-manifest-end
