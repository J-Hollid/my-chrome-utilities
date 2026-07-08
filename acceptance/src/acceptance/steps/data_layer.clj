(ns acceptance.steps.data-layer
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def sample-page-object
  {:queue {:history [] :value 1}
   :test {:test []}
   :some {:deep {:object {:history []}}}})

(defn- path-parts [path]
  (->> (str/split path #"\.")
       (map str/trim)
       (remove str/blank?)))

(defn- resolve-path [page-object path]
  (reduce (fn [current part]
            (cond
              (nil? current) nil
              (map? current) (get current (keyword part))
              :else ::not-found))
          page-object
          (path-parts path)))

(defn path-status [page-object path]
  (let [value (resolve-path page-object path)]
    (cond
      (or (nil? value) (= ::not-found value)) "path missing"
      (vector? value) "ready"
      :else "not an array")))

(defn settings-allow-history-path-entry? [html history-path]
  (and (seq history-path)
       (str/includes? html "id=\"data-layer-settings\"")
       (str/includes? html "id=\"history-path\"")))

(defn settings-show-history-path? [html source history-path]
  (and (seq history-path)
       (str/includes? html "id=\"history-path-display\"")
       (str/includes? source "historyPathDisplay")
       (str/includes? source "textContent = path")))

(defn history-path-persisted-locally? [source]
  (and (str/includes? source "HISTORY_PATH_STORAGE_KEY")
       (str/includes? source "localStorage.setItem")))

(def forbidden-data-layer-patterns
  [{:kind :config-import
    :pattern #"(?i)importConfig|config import|import configuration"}
   {:kind :config-export
    :pattern #"(?i)exportConfig|config export|export configuration"}
   {:kind :validation-schema
    :pattern #"(?i)validationSchema|z\.object|json schema"}])

(defn forbidden-data-layer-scope-findings [files]
  (support/pattern-findings forbidden-data-layer-patterns files))

(defn- inspect-settings [world]
  (let [root (or (:root world) (support/repository-root))]
    (assoc world
           :root root
           :side-panel-html (support/source-file root "side-panel.html")
           :side-panel-source (support/source-file root "src/side-panel.ts")
           :data-layer-source (support/source-file root "src/data-layer.ts"))))

(def handlers
  [{:pattern #"^the data layer testing settings are opened$"
    :handler (fn [world _example _captures]
               (inspect-settings world))}

   {:pattern #"^the user can enter history array path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [history-path (support/require-example example history-path-key)]
                 (support/assert! (settings-allow-history-path-entry?
                                   (:side-panel-html world)
                                   history-path)
                                  "History path input is not available."
                                  {:history-path history-path})
                 (assoc world :history-path history-path)))}

   {:pattern #"^the configured history array path is shown in the side panel$"
    :handler (fn [world _example _captures]
               (support/assert! (settings-show-history-path?
                                 (:side-panel-html world)
                                 (:side-panel-source world)
                                 (:history-path world))
                                "Configured history path is not shown."
                                {:history-path (:history-path world)})
               world)}

   {:pattern #"^the configured history array path is persisted locally$"
    :handler (fn [world _example _captures]
               (support/assert! (history-path-persisted-locally?
                                 (:data-layer-source world))
                                "Configured history path is not persisted locally."
                                {})
               world)}

   {:pattern #"^history array path <([A-Za-z0-9_]+)> is configured$"
    :handler (fn [world example [history-path-key]]
               (assoc world
                      :root (support/repository-root)
                      :history-path (support/require-example example history-path-key)))}

   {:pattern #"^the configured page object is checked$"
    :handler (fn [world _example _captures]
               (assoc world
                      :page-object sample-page-object
                      :path-status (path-status sample-page-object (:history-path world))))}

   {:pattern #"^path status <([A-Za-z0-9_]+)> is shown in the side panel$"
    :handler (fn [world example [status-key]]
               (let [expected (support/require-example example status-key)]
                 (support/assert! (= expected (:path-status world))
                                  "Path status does not match."
                                  {:expected expected
                                   :actual (:path-status world)
                                   :history-path (:history-path world)})
                 (support/assert! (str/includes?
                                   (support/source-file (:root world) "side-panel.html")
                                   "history-path-status")
                                  "Path status output is not present in the side panel."
                                  {})
                 world))}

   {:pattern #"^no page script error is caused by the path check$"
    :handler (fn [world _example _captures]
               (support/assert! (not= ::error (:path-status world))
                                "Path check caused a script error."
                                {:history-path (:history-path world)})
               world)}

   {:pattern #"^data layer settings are inspected$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)]
                 (assoc world
                        :root root
                        :data-layer-files (support/source-files root))))}

   {:pattern #"^config import is not present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :config-import (:kind %))
                                      (forbidden-data-layer-scope-findings
                                       (:data-layer-files world)))]
                 (support/assert! (empty? findings)
                                  "Config import behavior was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^config export is not present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :config-export (:kind %))
                                      (forbidden-data-layer-scope-findings
                                       (:data-layer-files world)))]
                 (support/assert! (empty? findings)
                                  "Config export behavior was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^validation schemas are not present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :validation-schema (:kind %))
                                      (forbidden-data-layer-scope-findings
                                       (:data-layer-files world)))]
                 (support/assert! (empty? findings)
                                  "Validation schema behavior was found."
                                  {:findings (vec findings)})
                 world))}])
