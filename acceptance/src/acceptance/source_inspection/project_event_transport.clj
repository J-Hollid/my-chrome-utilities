(ns acceptance.source-inspection.project-event-transport
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def owner "src/data-layer-installed/project-event-transport/index.ts")

(def history-path-input-source-snippets
  ["historyPathInput"])

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
           (boolean (re-find #"historyPathInput(?:\?\.|\.)addEventListener\([\"']change[\"']" source)))
      (and (str/includes? source "await ports.savePaths(snapshot)")
           (boolean (re-find #"observationPath\s*:\s*historyPathInput(?:\?\.|\.)value" source))
           (boolean (re-find #"historyPathInput(?:\?\.|\.)addEventListener\([\"']change[\"']" source)))))

(defn- history-path-input-listener? [source]
  (boolean (re-find #"historyPathInput(?:\?\.|\.)addEventListener\([\"']input[\"']" source)))

(defn- history-path-renderer? [source]
  (or (str/includes? source "renderHistoryPath(path")
      (str/includes? source "renderTargetPath(path")))

(defn history-path-text-entry-wired? [html source]
  (let [html (or html "")
        source (or source "")]
    (and (history-path-input-present? html)
         (every? #(str/includes? source %) history-path-input-source-snippets)
         (history-path-renderer? source)
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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-30T20:02:31.178355416+02:00", :module-hash "1516781517", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "516389520"} {:id "def/owner", :kind "def", :line 5, :end-line 5, :hash "-1539356535"} {:id "def/history-path-input-source-snippets", :kind "def", :line 7, :end-line 8, :hash "-321170856"} {:id "defn/settings-source", :kind "defn", :line 10, :end-line 12, :hash "861841705"} {:id "defn-/history-path-input-present?", :kind "defn-", :line 14, :end-line 15, :hash "65075959"} {:id "defn-/history-path-input-persists?", :kind "defn-", :line 17, :end-line 26, :hash "-1186009939"} {:id "defn-/history-path-input-listener?", :kind "defn-", :line 28, :end-line 29, :hash "866695440"} {:id "defn-/history-path-renderer?", :kind "defn-", :line 31, :end-line 33, :hash "1896447865"} {:id "defn/history-path-text-entry-wired?", :kind "defn", :line 35, :end-line 42, :hash "1962127616"} {:id "defn/history-path-incremental-entry-wired?", :kind "defn", :line 44, :end-line 55, :hash "2134396755"}]}
;; clj-mutate-manifest-end
