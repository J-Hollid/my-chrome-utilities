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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-08T18:17:11.154156605+02:00", :module-hash "-443883343", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 6, :hash "1370821282"} {:id "def/feature-files", :kind "def", :line 8, :end-line 10, :hash "-479355207"} {:id "def/entry-steps", :kind "def", :line 12, :end-line 14, :hash "-104470174"} {:id "def/model-tests", :kind "def", :line 16, :end-line 18, :hash "524617602"} {:id "form/4/defonce", :kind "defonce", :line 19, :end-line 19, :hash "-1123430404"} {:id "form/5/defonce", :kind "defonce", :line 20, :end-line 20, :hash "367376302"} {:id "defn-/verify-model!", :kind "defn-", :line 22, :end-line 26, :hash "1631068380"} {:id "defn-/observation!", :kind "defn-", :line 28, :end-line 34, :hash "643061845"} {:id "defn-/observed-row", :kind "defn-", :line 36, :end-line 39, :hash "1938472544"} {:id "def/handlers", :kind "def", :line 41, :end-line 50, :hash "-1108936274"}]}
;; clj-mutate-manifest-end
