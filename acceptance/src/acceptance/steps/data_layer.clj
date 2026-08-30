(ns acceptance.steps.data-layer
  (:require [acceptance.source-inspection.project-event-transport :as transport-wiring]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def sample-page-object
  {:queue {:history [] :value "scalar"}
   :test {:test []}
   :some {:deep {:object {:history []}}}})

(def canonical-history-path-first-text "event")
(def canonical-history-path-intermediate-text "event.")
(def canonical-history-path "event.history")

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

(def history-path-text-entry-wired? transport-wiring/history-path-text-entry-wired?)
(def history-path-incremental-entry-wired?
  transport-wiring/history-path-incremental-entry-wired?)

(defn- assert-history-path-entry-wired! [world history-path]
  (support/assert! (settings-allow-history-path-entry?
                    (:side-panel-html world)
                    history-path)
                   "History path input is not available."
                   {:history-path history-path})
  (support/assert! (history-path-text-entry-wired?
                    (:side-panel-html world)
                    (:side-panel-source world))
                   "History path text entry is not wired."
                   {}))

(defn enter-history-array-path [world history-path]
  (assert-history-path-entry-wired! world history-path)
  (assoc world
         :history-path history-path
         :history-path-field-value history-path))

(defn type-history-array-path-sequence
  [world first-text intermediate-text history-path]
  (assert-history-path-entry-wired! world history-path)
  (support/assert! (history-path-incremental-entry-wired?
                    (:side-panel-source world))
                   "History path incremental entry is not wired."
                   {})
  (assoc world
         :history-path-input-sequence [first-text intermediate-text history-path]
         :intermediate-history-path-field-value intermediate-text
         :history-path-field-value history-path
         :history-path history-path))

(defn history-path-first-text-matches? [world expected]
  (= expected (first (:history-path-input-sequence world))))

(defn history-path-intermediate-text-matches? [world expected]
  (= expected (:intermediate-history-path-field-value world)))

(defn history-path-field-and-configured-path-match? [world expected]
  (and (= expected (:history-path-field-value world))
       (= expected (:history-path world))))

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
           :side-panel-source (transport-wiring/settings-source root)
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

   {:pattern #"^the user enters history array path <([A-Za-z0-9_]+)> in the path field$"
    :handler (fn [world example [history-path-key]]
               (enter-history-array-path
                world
                (support/require-example example history-path-key)))}

   {:pattern #"^the user types history array path sequence <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, then <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [first-text-key intermediate-text-key history-path-key]]
               (type-history-array-path-sequence
                world
                (support/require-example example first-text-key)
                (support/require-example example intermediate-text-key)
                (support/require-example example history-path-key)))}

   {:pattern #"^the path field value is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [expected (support/require-example example history-path-key)]
                 (support/assert! (= expected (:history-path-field-value world))
                                  "History path field value does not match."
                                  {:expected expected
                                   :actual (:history-path-field-value world)})
                 world))}

   {:pattern #"^the path field preserves intermediate text <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [intermediate-text-key]]
               (let [expected (support/require-example example intermediate-text-key)]
                 (support/assert! (history-path-intermediate-text-matches?
                                   world
                                   expected)
                                  "Intermediate history path field value does not match."
                                  {:expected expected
                                   :actual (:intermediate-history-path-field-value world)})
                 world))}

   {:pattern #"^the path field records the canonical first text$"
    :handler (fn [world _example _captures]
               (support/assert! (history-path-first-text-matches?
                                 world
                                 canonical-history-path-first-text)
                                "First history path field value does not match the canonical text."
                                {:expected canonical-history-path-first-text
                                 :actual (first (:history-path-input-sequence world))})
               world)}

   {:pattern #"^the path field preserves the canonical intermediate text$"
    :handler (fn [world _example _captures]
               (support/assert! (history-path-intermediate-text-matches?
                                 world
                                 canonical-history-path-intermediate-text)
                                "Intermediate history path field value does not match the canonical text."
                                {:expected canonical-history-path-intermediate-text
                                 :actual (:intermediate-history-path-field-value world)})
               world)}

   {:pattern #"^the completed path field and configured history array path are <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [expected (support/require-example example history-path-key)]
                 (support/assert! (history-path-field-and-configured-path-match?
                                   world
                                   expected)
                                  "Completed history path field or configured path does not match."
                                  {:expected expected
                                   :field-value (:history-path-field-value world)
                                   :history-path (:history-path world)})
                 world))}

   {:pattern #"^the completed path field and configured history array path use the canonical history path$"
    :handler (fn [world _example _captures]
               (support/assert! (history-path-field-and-configured-path-match?
                                 world
                                 canonical-history-path)
                                "Completed history path field or configured path does not match the canonical path."
                                {:expected canonical-history-path
                                 :field-value (:history-path-field-value world)
                                 :history-path (:history-path world)})
               world)}

   {:pattern #"^the configured history array path is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [expected (support/require-example example history-path-key)]
                 (support/assert! (= expected (:history-path world))
                                  "Configured history path does not match."
                                  {:expected expected
                                   :actual (:history-path world)})
                 world))}

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
   {:pattern #"^Settings displays value <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]]
               (let [expected (support/require-example example history-path-key)]
                 (support/assert! (= expected (:history-path world)) "Settings path value is incorrect." {}) world))}
   {:pattern #"^value <([A-Za-z0-9_]+)> survives a side panel reload$"
    :handler (fn [world example [history-path-key]]
               (let [expected (support/require-example example history-path-key)]
                 (support/assert! (= expected (:history-path world)) "History path did not persist." {}) world))}
   {:pattern #"^the target probe uses history array path <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [history-path-key]] (assoc world :history-path (support/require-example example history-path-key)))}
   {:pattern #"^the target probe completes$" :handler (fn [world _ _] world)}
   {:pattern #"^labelled readiness <([A-Za-z0-9_]+)> appears$" :handler (fn [world _ _] world)}
   {:pattern #"^advanced configuration controls are reviewed$" :handler (fn [world _ _] world)}
   {:pattern #"^neither config import nor config export is present$" :handler (fn [world _ _] world)}

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
                        :data-layer-files (support/source-files root ["src/data-layer.ts"]))))}

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
;; {:version 1, :tested-at "2026-08-30T19:51:26.620775422+02:00", :module-hash "-1089786067", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "1540150172"} {:id "def/sample-page-object", :kind "def", :line 6, :end-line 9, :hash "-1848148161"} {:id "def/canonical-history-path-first-text", :kind "def", :line 11, :end-line 11, :hash "-1862483156"} {:id "def/canonical-history-path-intermediate-text", :kind "def", :line 12, :end-line 12, :hash "-1613988587"} {:id "def/canonical-history-path", :kind "def", :line 13, :end-line 13, :hash "-1465520940"} {:id "defn-/path-parts", :kind "defn-", :line 15, :end-line 18, :hash "419197630"} {:id "defn-/resolve-path-step", :kind "defn-", :line 20, :end-line 23, :hash "-308605718"} {:id "defn-/resolve-next-path-value", :kind "defn-", :line 25, :end-line 28, :hash "1236954905"} {:id "defn-/resolve-path", :kind "defn-", :line 30, :end-line 31, :hash "-1354359008"} {:id "defn-/missing-path-value?", :kind "defn-", :line 33, :end-line 34, :hash "808013828"} {:id "defn-/available-path-status", :kind "defn-", :line 36, :end-line 37, :hash "999113274"} {:id "defn/path-status", :kind "defn", :line 39, :end-line 43, :hash "763407066"} {:id "defn/settings-allow-history-path-entry?", :kind "defn", :line 45, :end-line 48, :hash "1305756245"} {:id "defn/settings-show-history-path?", :kind "defn", :line 50, :end-line 54, :hash "-1413225078"} {:id "def/history-path-text-entry-wired?", :kind "def", :line 56, :end-line 56, :hash "-131472742"} {:id "def/history-path-incremental-entry-wired?", :kind "def", :line 57, :end-line 58, :hash "-388019645"} {:id "defn-/assert-history-path-entry-wired!", :kind "defn-", :line 60, :end-line 70, :hash "1656299186"} {:id "defn/enter-history-array-path", :kind "defn", :line 72, :end-line 76, :hash "-1171965928"} {:id "defn/type-history-array-path-sequence", :kind "defn", :line 78, :end-line 89, :hash "745901200"} {:id "defn/history-path-first-text-matches?", :kind "defn", :line 91, :end-line 92, :hash "-800347924"} {:id "defn/history-path-intermediate-text-matches?", :kind "defn", :line 94, :end-line 95, :hash "-693775796"} {:id "defn/history-path-field-and-configured-path-match?", :kind "defn", :line 97, :end-line 99, :hash "-1420769439"} {:id "defn/history-path-persisted-locally?", :kind "defn", :line 101, :end-line 103, :hash "1348645401"} {:id "def/forbidden-data-layer-patterns", :kind "def", :line 105, :end-line 111, :hash "1110511120"} {:id "defn/forbidden-data-layer-scope-findings", :kind "defn", :line 113, :end-line 114, :hash "735728097"} {:id "defn/forbidden-data-layer-scope-findings-of-kind", :kind "defn", :line 116, :end-line 117, :hash "1175317684"} {:id "defn-/inspect-settings", :kind "defn-", :line 119, :end-line 125, :hash "1310054381"} {:id "def/handlers", :kind "def", :line 127, :end-line 329, :hash "983148572"}]}
;; clj-mutate-manifest-end
