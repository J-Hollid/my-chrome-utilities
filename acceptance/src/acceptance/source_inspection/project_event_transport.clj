(ns acceptance.source-inspection.project-event-transport
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def owner "src/data-layer-installed/project-event-transport/index.ts")

(def history-path-input-source-snippets
  ["historyPathInput"
   "renderHistoryPath(path"])

(defn settings-source [root]
  (str/join "\n" [(support/source-file root "src/side-panel.ts")
                   (support/source-file root owner)]))

(defn- history-path-input-present? [html]
  (str/includes? html "id=\"history-path\""))

(defn- history-path-input-persists? [source]
  (or (str/includes? source "setHistoryArrayPath(historyPathInput.value)")
      (str/includes? source "setHistoryArrayPath(typedPath")
      (and (str/includes? source "configureProjectEventTransport")
           (str/includes? source "saveProjectEventTransport()")
           (boolean (re-find #"observationHistoryPath\s*:\s*historyPathInput(?:\?\.|\.)value" source))
           (boolean (re-find #"historyPathInput(?:\?\.|\.)addEventListener\([\"']change[\"']" source)))))

(defn- history-path-input-listener? [source]
  (boolean (re-find #"historyPathInput(?:\?\.|\.)addEventListener\([\"']input[\"']" source)))

(defn history-path-text-entry-wired? [html source]
  (let [html (or html "")
        source (or source "")]
    (and (history-path-input-present? html)
         (every? #(str/includes? source %) history-path-input-source-snippets)
         (history-path-input-persists? source)
         (history-path-input-listener? source))))

(defn history-path-incremental-entry-wired? [source]
  (let [typed-path-read? (boolean
                          (re-find #"const\s+typedPath\s*=\s*historyPathInput(?:\?\.|\.)value"
                                   source))]
    (and typed-path-read?
         (history-path-input-listener? source)
         (or (and (str/includes? source "setHistoryArrayPath(typedPath")
                  (or (str/includes? source "renderHistoryPath(path, typedPath)")
                      (str/includes? source "targetPathStatusController.configure(path, typedPath)")))
             (boolean
              (re-find #"targetPathStatusController\.configure\(\s*currentObservationHistoryPath\(\)\s*,\s*typedPath\s*\)"
                       source))))))
