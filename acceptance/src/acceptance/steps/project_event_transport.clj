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
  (let [result (apply support/verified-command-result command)]
    (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)})
    result))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Project event transport model verification failed. "
   "node" "test/data-layer-project-event-transport-test.mjs"))

(defn- browser-evidence [output]
  (let [payload-line (->> (str/split-lines output)
                          (filter #(str/starts-with? % "{"))
                          last)]
    (:projectEventTransport (json/parse-string payload-line true))))

(defn- observe-browser! []
  (or @browser-observation
      (let [result (checked! "node" "test/browser-packs/project-event-transport.mjs")
            observed (browser-evidence (:out result))]
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

(defn validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode example-values example-values example
   "Project event transport example was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :project-event-transport-mode
   verify-model! validate-example!
   observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-04T11:33:29.659491871+02:00", :module-hash "-1245313757", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1161658571"} {:id "def/feature-files", :kind "def", :line 7, :end-line nil, :hash "1304307325"} {:id "def/entry-modes", :kind "def", :line 11, :end-line nil, :hash "588498899"} {:id "form/3/defonce", :kind "defonce", :line 15, :end-line nil, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 16, :end-line nil, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 18, :end-line nil, :hash "1504155082"} {:id "defn-/verify-model!", :kind "defn-", :line 23, :end-line nil, :hash "909766936"} {:id "defn-/browser-evidence", :kind "defn-", :line 29, :end-line nil, :hash "1314548465"} {:id "defn-/observe-browser!", :kind "defn-", :line 35, :end-line nil, :hash "-768731034"} {:id "def/runtime-paths", :kind "def", :line 43, :end-line nil, :hash "357627987"} {:id "defn-/assert-runtime!", :kind "defn-", :line 47, :end-line nil, :hash "-228036445"} {:id "def/example-values", :kind "def", :line 53, :end-line nil, :hash "-832753933"} {:id "defn/validate-example!", :kind "defn", :line 75, :end-line nil, :hash "97038699"} {:id "def/handlers", :kind "def", :line 80, :end-line nil, :hash "814749181"}]}
;; clj-mutate-manifest-end
