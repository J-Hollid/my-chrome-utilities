(ns acceptance.steps.project-observation-sources
  (:require [acceptance.steps.support :as support]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-project-observation-sources.feature"
   "features/data-layer-project-observation-sources-runtime.feature"])

(def entry-steps
  #{"Retail is the active project with default push path commandQueue"
    "the built extension runs with its production repository, source settings, Capture controller, and page observer"})

(def model-tests
  ["settings" "editor-state" "context-boundary" "persistence" "page-hook"
   "coordinator" "activation-order" "subscription" "project-switch" "feed" "saved-evidence"])
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

(defn- matching [records expected]
  (first (filter #(every? (fn [[key value]] (= value (get % key))) expected) records)))

(defn- input-row [records expected]
  (first (filter #(matching [(:input %)] expected) records)))

(defn- example-text [example key]
  (support/require-example example key))

(defn- observed-row [world example observed]
  (let [runtime? (str/ends-with? (:acceptance/feature-name world) " runtime")
        number (inc (:acceptance/scenario-index world))
        value #(example-text example %)
        keyboard #(matching (:keyboard observed)
                            (cond-> {:name (value "name") :path (value "path")}
                              runtime? (assoc :width (parse-long (value "width")))))
        portability #(matching (:portability observed) {:path (value "path") :pushPath (value "push_path")})
        push #(matching (:push observed) {:source (value "source")})
        evidence #(matching (:evidence observed)
                            (if runtime?
                              {:payload (json/parse-string (value "payload") true) :source (value "source")}
                              {:payload (assoc (json/parse-string (value "payload") true) :event (value "event_name"))}))]
    (if runtime?
      (case number
        1 (keyboard)
        2 (input-row (:activation observed) (into {} (map (fn [key] [(keyword key) (value key)])
                                                          ["marketing_before" "application_before" "handoff" "live"])))
        3 (matching (:unavailable observed) {:value (value "unavailable") :event "A1" :status (value "status")})
        4 (evidence)
        5 (input-row (:edits observed) (if (= "change path to analyticsQueue" (value "action"))
                                        {:action "change path" :path "analyticsQueue"}
                                        {:action (value "action")}))
        6 (matching (:transitions observed) {:transition (value "transition")})
        7 (matching (:aliases observed) {:relation (value "array_relation")})
        8 (push)
        9 (if (= "switch to another project" (value "action")) (:projects observed)
              (matching (:disposal observed) {:action (value "action")}))
        10 (portability)
        11 (when (empty? (get-in observed [:settings :empty]))
             (input-row (:edits observed) {:first "M1" :later "M2, M3" :action "disable"}))
        12 (:settings observed))
      (case number
        1 (keyboard)
        2 (matching (get-in observed [:settings :invalid]) {:name (value "name") :path (value "path") :error (value "error")})
        3 (input-row (:filter observed) {:receipt_order (value "receipt_order") :selected_source (value "selected_source") :count (parse-long (value "count"))})
        4 (matching (:unavailable observed) {:value (if (= "missing" (value "value")) "absent" "a scalar") :event (value "event") :status (value "status")})
        5 (evidence)
        6 (input-row (:edits observed) {:first (value "first") :later (value "later") :action "disable"})
        7 (input-row (:edits observed) {:first (value "first") :name (value "name") :path (value "path") :action "change path"})
        8 (when (contains? #{"project switching" "durable extension reload"} (value "route")) (:projects observed))
        9 (portability)
        10 (push)
        11 (when (and (empty? (get-in observed [:settings :empty]))
                      (zero? (get-in observed [:projects :closed :sources]))) (:settings observed))
        12 (:settings observed)
        13 (matching (get-in observed [:settings :invalid])
                     (assoc (case (value "field") "Name" {:name ""} "Path" {:path ""}) :error (value "error")))))))

(def handlers
  (support/feature-scoped-stateful-handlers
   feature-files entry-steps :observation-source-evidence
   (fn [world example captures _step]
     (doseq [key (support/capture-placeholder-keys captures)] (example-text example key))
     (verify-model!)
     (let [row (observed-row world example (observation!))]
       (support/assert! row "The example has no matching production observation."
                        {:scenario (:acceptance/scenario-name world) :example example})
       (assoc world :observation-source-evidence row)))))
