(ns acceptance.steps.project-observation-sources
  (:require [acceptance.steps.support :as support]
            [acceptance.steps.project-observation-sources.common :as evidence]
            [acceptance.steps.project-observation-sources.product :as product]
            [acceptance.steps.project-observation-sources.runtime :as runtime]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-project-observation-sources.feature"
   "features/data-layer-project-observation-sources-runtime.feature"])

(def entry-steps
  #{"Retail is the active project with default push path commandQueue"
    "the built extension runs with its production repository, source settings, Capture controller, and page observer"})

(def model-tests
  ["settings" "editor-state" "context-boundary" "persistence" "page-hook"
   "coordinator" "activation-order" "subscription" "refresh-order" "project-switch" "feed" "saved-evidence"])
(defonce model-checks (into {} (map (fn [name] [name (atom false)]) model-tests)))
(defonce browser-check (atom nil))

(defn- verify-model! []
  (doseq [name model-tests]
    (support/cached-command-verification!
     (get model-checks name) "Observation source unit check failed. "
     "node" (str "test/project-observation-sources/" name "-test.mjs"))))

(defn- observation! []
  (support/cached-command-observation!
   browser-check
   {:command ["node" "test/project-observation-sources-browser-test.mjs"]
    :observation-key :projectObservationContracts
    :runtime-error "Installed observation source checks failed."
    :missing-error "Installed observation source evidence is missing."}))

(defn- observed-row [world example observed]
  (let [resolve (if (str/ends-with? (:acceptance/feature-name world) " runtime")
                  runtime/observed-row product/observed-row)]
    (resolve (inc (:acceptance/scenario-index world)) example observed)))

(def handlers
  (support/feature-scoped-stateful-handlers
   feature-files entry-steps :observation-source-evidence
   (fn [world example captures _step]
     (doseq [key (support/capture-placeholder-keys captures)] (evidence/value example key))
     (verify-model!)
     (let [row (observed-row world example (observation!))]
       (support/assert! row "The example has no matching production observation."
                        {:scenario (:acceptance/scenario-name world) :example example})
       (assoc world :observation-source-evidence row)))))
