(ns acceptance.steps.project-event-transport
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-project-event-transport-settings.feature"
   "features/data-layer-project-event-transport-settings-runtime.feature"])

(def entry-modes
  {"project transport fixtures are Retail website at queue.history and queue, Trade portal at event.history and dataLayer, and Partner site at event_queue and event_queue" :model
   "the built extension is running with the production project repository, active-context coordinator, Live observer, and Library push adapter" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- checked! [& command]
  (let [result (apply process/shell {:out :string :err :string} command)]
    (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)})
    result))

(defn- verify-model! []
  (when-not @model-verified?
    (checked! "node" "test/data-layer-project-event-transport-test.mjs")
    (reset! model-verified? true)))

(defn- observe-browser! []
  (or @browser-observation
      (let [result (checked! "node" "test/browser-packs/project-event-transport.mjs")
            line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
            observed (:projectEventTransport (json/parse-string line true))]
        (support/assert! observed "Project event transport browser evidence is missing."
                         {:out (:out result)})
        (reset! browser-observation observed))))

(def runtime-paths
  (set (concat [:installedBoundary]
               (map #(keyword (str "transport" (format "%03d" %))) (range 1 10)))))

(defn- assert-runtime! [evidence]
  (support/assert! (and (= runtime-paths (set (keys evidence)))
                        (every? true? (vals evidence)))
                   "Installed project event transport evidence is incomplete."
                   evidence))

(def example-values
  {"project" #{"Retail website" "Trade portal" "Partner site"}
   "project_identity" #{"project-retail" "project-trade" "project-partner"}
   "observation_path" #{"queue.history" "event.history" "event_queue"}
   "first_observation_path" #{"queue.history" "event.history"}
   "second_observation_path" #{"event.history" "event_queue"}
   "push_path" #{"queue" "dataLayer" "event_queue"}
   "project_push_path" #{"queue" "dataLayer"}
   "first_push_path" #{"queue" "dataLayer"}
   "second_push_path" #{"dataLayer" "event_queue"}
   "new_push_path" #{"eventBus" "commandQueue"}
   "second_project" #{"Trade portal" "Partner site" "project-trade" "project-partner"}
   "event_name" #{"purchase" "checkout_started" "partner_login"}
   "creation_route" #{"Add new event" "Save captured checkout_started as Library event"}
   "template_name" #{"Retail purchase" "Trade checkout start" "Trade purchase"}
   "imported_project" #{"Retail website copy" "Trade portal copy"}
   "setting" #{"Observation history path" "Default push path"}
   "invalid_path" #{"missing.path" "queue.value"}
   "required_target" #{"an array" "a push-capable array"}
   "observed_target" #{"missing" "a scalar"}
   "status" #{"Waiting for observation path" "Push path is not push-capable"}})

(defn validate-example! [_mode example]
  (support/validate-example-domain!
   example-values example
   (filter #(support/example-value example %) (keys example-values))
   "Project event transport example was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :project-event-transport-mode
   verify-model! validate-example!
   observe-browser! assert-runtime!))
