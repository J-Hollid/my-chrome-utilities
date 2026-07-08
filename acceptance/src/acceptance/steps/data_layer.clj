(ns acceptance.steps.data-layer
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def sample-page-object
  {:queue {:history [] :value "scalar"}
   :test {:test []}
   :some {:deep {:object {:history []}}}})

(defn- path-parts [path]
  (->> (str/split path #"\.")
       (map str/trim)
       (remove str/blank?)))

(defn- resolve-path-step [current part]
  (if (map? current)
    (get current (keyword part))
    ::not-found))

(defn- resolve-next-path-value [current part]
  (if (nil? current)
    nil
    (resolve-path-step current part)))

(defn- resolve-path [page-object path]
  (reduce resolve-next-path-value page-object (path-parts path)))

(defn- missing-path-value? [value]
  (or (nil? value) (= ::not-found value)))

(defn- available-path-status [value]
  (if (vector? value) "ready" "not an array"))

(defn path-status [page-object path]
  (let [value (resolve-path page-object path)]
    (if (missing-path-value? value)
      "path missing"
      (available-path-status value))))

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

(defn forbidden-data-layer-scope-findings-of-kind [files kind]
  (filter #(= kind (:kind %)) (forbidden-data-layer-scope-findings files)))

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
               (let [findings (forbidden-data-layer-scope-findings-of-kind
                               (:data-layer-files world)
                               :config-import)]
                 (support/assert! (empty? findings)
                                  "Config import behavior was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^config export is not present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-data-layer-scope-findings-of-kind
                               (:data-layer-files world)
                               :config-export)]
                 (support/assert! (empty? findings)
                                  "Config export behavior was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^validation schemas are not present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-data-layer-scope-findings-of-kind
                               (:data-layer-files world)
                               :validation-schema)]
                 (support/assert! (empty? findings)
                                  "Validation schema behavior was found."
                                  {:findings (vec findings)})
                 world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-08T22:41:42.688558634+02:00", :module-hash "-934435032", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "665615209"} {:id "def/sample-page-object", :kind "def", :line 5, :end-line nil, :hash "-1848148161"} {:id "defn-/path-parts", :kind "defn-", :line 10, :end-line nil, :hash "419197630"} {:id "defn-/resolve-path-step", :kind "defn-", :line 15, :end-line nil, :hash "2119888022"} {:id "defn-/resolve-next-path-value", :kind "defn-", :line 20, :end-line nil, :hash "1236954905"} {:id "defn-/resolve-path", :kind "defn-", :line 25, :end-line nil, :hash "-1354359008"} {:id "defn-/missing-path-value?", :kind "defn-", :line 28, :end-line nil, :hash "-752761823"} {:id "defn-/available-path-status", :kind "defn-", :line 31, :end-line nil, :hash "999113274"} {:id "defn/path-status", :kind "defn", :line 34, :end-line nil, :hash "763407066"} {:id "defn/settings-allow-history-path-entry?", :kind "defn", :line 40, :end-line nil, :hash "1305756245"} {:id "defn/settings-show-history-path?", :kind "defn", :line 45, :end-line nil, :hash "-1413225078"} {:id "defn/history-path-persisted-locally?", :kind "defn", :line 51, :end-line nil, :hash "1348645401"} {:id "def/forbidden-data-layer-patterns", :kind "def", :line 55, :end-line nil, :hash "1110511120"} {:id "defn/forbidden-data-layer-scope-findings", :kind "defn", :line 63, :end-line nil, :hash "735728097"} {:id "defn/forbidden-data-layer-scope-findings-of-kind", :kind "defn", :line 66, :end-line nil, :hash "540751877"} {:id "defn-/inspect-settings", :kind "defn-", :line 69, :end-line nil, :hash "810151922"} {:id "def/handlers", :kind "def", :line 77, :end-line nil, :hash "2086493290"}]}
;; clj-mutate-manifest-end
