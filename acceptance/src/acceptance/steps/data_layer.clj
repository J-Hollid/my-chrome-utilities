(ns acceptance.steps.data-layer
  (:require [acceptance.steps.support :as support]
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

(defn- history-path-input-present? [html]
  (str/includes? html "id=\"history-path\""))

(def history-path-input-source-snippets
  ["historyPathInput"
   "renderHistoryPath(path"])

(defn- history-path-input-persists? [source]
  (or (str/includes? source "setHistoryArrayPath(historyPathInput.value)")
      (str/includes? source "setHistoryArrayPath(typedPath)")))

(defn- history-path-input-listener? [source]
  (boolean (re-find #"addEventListener\((\"|')input" source)))

(defn- history-path-input-source-snippets-present? [source]
  (and (every? #(str/includes? source %) history-path-input-source-snippets)
       (history-path-input-persists? source)))

(defn- history-path-input-source-wired? [source]
  (every? true?
          [(history-path-input-source-snippets-present? source)
           (history-path-input-listener? source)]))

(defn- text-or-empty [value]
  (or value ""))

(defn history-path-text-entry-wired? [html source]
  (let [html (text-or-empty html)
        source (text-or-empty source)]
    (every? true?
            [(history-path-input-present? html)
             (history-path-input-source-wired? source)])))

(defn history-path-incremental-entry-wired? [source]
  (every? #(str/includes? source %)
          ["const typedPath = historyPathInput.value"
           "setHistoryArrayPath(typedPath)"
           "renderHistoryPath(path, typedPath)"]))

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
;; {:version 1, :tested-at "2026-07-09T16:55:51.942141674+02:00", :module-hash "1556898244", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "665615209"} {:id "def/sample-page-object", :kind "def", :line 5, :end-line nil, :hash "-1848148161"} {:id "def/canonical-history-path-first-text", :kind "def", :line 10, :end-line nil, :hash "-1862483156"} {:id "def/canonical-history-path-intermediate-text", :kind "def", :line 11, :end-line nil, :hash "-1613988587"} {:id "def/canonical-history-path", :kind "def", :line 12, :end-line nil, :hash "-1465520940"} {:id "defn-/path-parts", :kind "defn-", :line 14, :end-line nil, :hash "419197630"} {:id "defn-/resolve-path-step", :kind "defn-", :line 19, :end-line nil, :hash "-420970885"} {:id "defn-/resolve-next-path-value", :kind "defn-", :line 24, :end-line nil, :hash "1236954905"} {:id "defn-/resolve-path", :kind "defn-", :line 29, :end-line nil, :hash "-1354359008"} {:id "defn-/missing-path-value?", :kind "defn-", :line 32, :end-line nil, :hash "-1529581284"} {:id "defn-/available-path-status", :kind "defn-", :line 35, :end-line nil, :hash "999113274"} {:id "defn/path-status", :kind "defn", :line 38, :end-line nil, :hash "763407066"} {:id "defn/settings-allow-history-path-entry?", :kind "defn", :line 44, :end-line nil, :hash "1305756245"} {:id "defn/settings-show-history-path?", :kind "defn", :line 49, :end-line nil, :hash "-1413225078"} {:id "defn-/history-path-input-present?", :kind "defn-", :line 55, :end-line nil, :hash "65075959"} {:id "def/history-path-input-source-snippets", :kind "def", :line 58, :end-line nil, :hash "1464910545"} {:id "defn-/history-path-input-persists?", :kind "defn-", :line 62, :end-line nil, :hash "983089819"} {:id "defn-/history-path-input-listener?", :kind "defn-", :line 66, :end-line nil, :hash "221516054"} {:id "defn-/history-path-input-source-snippets-present?", :kind "defn-", :line 69, :end-line nil, :hash "-361044832"} {:id "defn-/history-path-input-source-wired?", :kind "defn-", :line 73, :end-line nil, :hash "2036369545"} {:id "defn-/text-or-empty", :kind "defn-", :line 78, :end-line nil, :hash "1824059485"} {:id "defn/history-path-text-entry-wired?", :kind "defn", :line 81, :end-line nil, :hash "115923083"} {:id "defn/history-path-incremental-entry-wired?", :kind "defn", :line 88, :end-line nil, :hash "-1927700416"} {:id "defn-/assert-history-path-entry-wired!", :kind "defn-", :line 94, :end-line nil, :hash "1656299186"} {:id "defn/enter-history-array-path", :kind "defn", :line 106, :end-line nil, :hash "-1171965928"} {:id "defn/type-history-array-path-sequence", :kind "defn", :line 112, :end-line nil, :hash "745901200"} {:id "defn/history-path-first-text-matches?", :kind "defn", :line 125, :end-line nil, :hash "-800347924"} {:id "defn/history-path-intermediate-text-matches?", :kind "defn", :line 128, :end-line nil, :hash "-693775796"} {:id "defn/history-path-field-and-configured-path-match?", :kind "defn", :line 131, :end-line nil, :hash "-1420769439"} {:id "defn/history-path-persisted-locally?", :kind "defn", :line 135, :end-line nil, :hash "1348645401"} {:id "def/forbidden-data-layer-patterns", :kind "def", :line 139, :end-line nil, :hash "1110511120"} {:id "defn/forbidden-data-layer-scope-findings", :kind "defn", :line 147, :end-line nil, :hash "735728097"} {:id "defn/forbidden-data-layer-scope-findings-of-kind", :kind "defn", :line 150, :end-line nil, :hash "540751877"} {:id "defn-/inspect-settings", :kind "defn-", :line 153, :end-line nil, :hash "810151922"} {:id "def/handlers", :kind "def", :line 161, :end-line nil, :hash "1381294199"}]}
;; clj-mutate-manifest-end
