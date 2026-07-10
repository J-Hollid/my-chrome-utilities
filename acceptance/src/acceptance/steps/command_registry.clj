(ns acceptance.steps.command-registry
  (:require [acceptance.steps.support :as support]
            [babashka.fs :as fs]
            [babashka.process :as process]
            [clojure.string :as str]))

(def command-fields #{"id" "title" "description" "category" "run"})

(defn defined-fields [source]
  (->> command-fields
       (filter (fn [field]
                 (re-find (re-pattern (str "\\b" field "\\s*[:(]")) source)))
       set))

(defn listable-registry? [source]
  (boolean (re-find #"export\s+function\s+listCommands\s*\(" source)))

(defn registered-command? [source command-id]
  (boolean (re-find (re-pattern (java.util.regex.Pattern/quote command-id)) source)))

(defn command-has-behavior? [source command-id]
  (boolean
   (and (registered-command? source command-id)
        (every? #(contains? (defined-fields source) %) command-fields)
        (re-find #"export\s+function\s+runCommandById\s*\(" source)
        (re-find #"record\s*\(" source))))

(defn stable-keymap-identifiers? [source]
  (support/matches-all? source
                        [#"\bid\s*:\s*\"[a-z0-9-]+\.[a-z0-9-]+\""
                         #"export\s+function\s+findCommand\s*\("
                         #"command\.id\s*={3}\s*id"]))

(defn command-id-execution? [source]
  (support/matches-all? source
                        [#"export\s+function\s+runCommandById\s*\("
                         #"findCommand\s*\(\s*id\s*\)"
                         #"command\.run\s*\(\s*context\s*\)"]))

(defn separate-from-rendering? [registry-source rendering-source]
  (and (every? #(contains? (defined-fields registry-source) %) command-fields)
       (not (re-find #"\b(id|title|description|category|run)\s*:" rendering-source))))

(def forbidden-command-ui-patterns
  [{:kind :command-palette
    :pattern #"(?i)commandPalette|command palette"}
   {:kind :keybindings
    :pattern #"(?i)keybindings|keyboard shortcut|addEventListener\(['\"]keydown"}])

(defn forbidden-command-ui-findings [files]
  (support/pattern-findings forbidden-command-ui-patterns files))

(defn forbidden-command-ui-findings-of-kind [files kind]
  (filter #(= kind (:kind %)) (forbidden-command-ui-findings files)))

(defn- run-command-with-node [command-id]
  (let [script (format "import { runCommandById } from './dist/commands.js'; runCommandById(%s, { record: (entry) => console.log(JSON.stringify(entry)) });"
                       (pr-str command-id))]
    (process/shell {:out :string :err :string :continue true}
                   "node" "--input-type=module" "--eval" script)))

(defn- read-node-json [result]
  (let [path (fs/create-temp-file {:prefix "command-run" :suffix ".json"})]
    (spit (str path) (:out result))
    (support/read-json path)))

(def handlers
  [{:pattern #"^the command registry contract is inspected$"
    :handler (fn [world _example _captures]
               (let [root (or (:root world) (support/repository-root))]
                 (assoc world
                        :root root
                        :registry-source (support/source-file root "src/commands.ts")
                        :rendering-source (support/source-file root "src/side-panel.ts"))))}

   {:pattern #"^each command defines <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, and <([A-Za-z0-9_]+)>$"
    :handler (fn [world example field-keys]
               (let [expected (set (map #(support/require-example example %) field-keys))
                     actual (defined-fields (:registry-source world))]
                 (support/assert! (= expected actual)
                                  "Command fields do not match the registry contract."
                                  {:expected expected :actual actual})
                 world))}

   {:pattern #"^the registry can list commands$"
    :handler (fn [world _example _captures]
               (support/assert! (listable-registry? (:registry-source world))
                                "Registry does not expose a command list."
                                {})
               world)}

   {:pattern #"^command registry logic is separated from side panel rendering$"
    :handler (fn [world _example _captures]
               (support/assert! (separate-from-rendering? (:registry-source world)
                                                          (:rendering-source world))
                                "Command logic is mixed into side panel rendering."
                                {})
               world)}

   {:pattern #"^command <([A-Za-z0-9_]+)> is inspected$"
    :handler (fn [world example [command-key]]
               (let [root (or (:root world) (support/repository-root))
                     command-id (support/require-example example command-key)]
                 (assoc world
                        :root root
                        :command-id command-id
                        :registry-source (support/source-file root "src/commands.ts"))))}

   {:pattern #"^command <([A-Za-z0-9_]+)> is registered$"
    :handler (fn [world example [command-key]]
               (let [command-id (support/require-example example command-key)]
                 (support/assert! (registered-command? (:registry-source world) command-id)
                                  "Command is not registered."
                                  {:command-id command-id})
                 world))}

   {:pattern #"^command <([A-Za-z0-9_]+)> has a title, description, category, and run behavior$"
    :handler (fn [world example [command-key]]
               (let [command-id (support/require-example example command-key)]
                 (support/assert! (command-has-behavior? (:registry-source world) command-id)
                                  "Command does not have the required behavior contract."
                                  {:command-id command-id})
                 world))}

   {:pattern #"^command <([A-Za-z0-9_]+)> is run by id$"
    :handler (fn [world example [command-key]]
               (let [command-id (support/require-example example command-key)
                     world (support/run-build-command
                            (assoc world :root (or (:root world) (support/repository-root))))]
                 (support/ensure-build-passed! world)
                 (let [result (run-command-with-node command-id)]
                   (support/assert! (zero? (:exit result))
                                    "Command failed when run by id."
                                    {:exit (:exit result)
                                     :out (:out result)
                                     :err (:err result)})
                   (assoc world
                          :command-id command-id
                          :command-run-record (read-node-json result)))))}

   {:pattern #"^visible app state or log records that command <([A-Za-z0-9_]+)> ran$"
    :handler (fn [world example [command-key]]
               (let [command-id (support/require-example example command-key)
                     record (:command-run-record world)]
                 (support/assert! (= command-id (:commandId record))
                                  "Command run record does not identify the command."
                                  {:expected command-id :actual (:commandId record)})
                 (support/assert! (str/includes? (:message record) command-id)
                                  "Command run record does not expose visible command state."
                                  {:record record})
                 world))}

   {:pattern #"^command features are inspected$"
    :handler (fn [world _example _captures]
               (let [root (or (:root world) (support/repository-root))]
                 (assoc world
                        :root root
                        :command-feature-files (support/source-files root))))}

   {:pattern #"^no command palette is present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-command-ui-findings-of-kind
                               (:command-feature-files world)
                               :command-palette)]
                 (support/assert! (empty? findings)
                                  "Command palette implementation was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^no user-configurable keybindings are present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-command-ui-findings-of-kind
                               (:command-feature-files world)
                               :keybindings)]
                 (support/assert! (empty? findings)
                                  "User-configurable keybindings were found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^registered command ids are stable keymap identifiers$"
    :handler (fn [world _example _captures]
               (let [root (or (:root world) (support/repository-root))
                     source (support/source-file root "src/commands.ts")]
                 (support/assert! (stable-keymap-identifiers? source)
                                  "Command ids are not stable keymap identifiers."
                                  {})
                 world))}

   {:pattern #"^command execution remains available through command ids$"
    :handler (fn [world _example _captures]
               (let [root (or (:root world) (support/repository-root))
                     source (support/source-file root "src/commands.ts")]
                 (support/assert! (command-id-execution? source)
                                  "Command execution is not available through command ids."
                                  {})
                 world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-08T20:58:19.705849876+02:00", :module-hash "1927912763", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1038821804"} {:id "def/command-fields", :kind "def", :line 7, :end-line nil, :hash "690572886"} {:id "defn/defined-fields", :kind "defn", :line 9, :end-line nil, :hash "-1662172251"} {:id "defn/listable-registry?", :kind "defn", :line 15, :end-line nil, :hash "1777837196"} {:id "defn/registered-command?", :kind "defn", :line 18, :end-line nil, :hash "-2114637731"} {:id "defn/command-has-behavior?", :kind "defn", :line 21, :end-line nil, :hash "-1623888695"} {:id "defn/separate-from-rendering?", :kind "defn", :line 28, :end-line nil, :hash "-1396950643"} {:id "def/forbidden-command-ui-patterns", :kind "def", :line 32, :end-line nil, :hash "-2023843326"} {:id "defn/forbidden-command-ui-findings", :kind "defn", :line 38, :end-line nil, :hash "-1818592575"} {:id "defn/forbidden-command-ui-findings-of-kind", :kind "defn", :line 41, :end-line nil, :hash "611004771"} {:id "defn-/run-command-with-node", :kind "defn-", :line 44, :end-line nil, :hash "-711241429"} {:id "defn-/read-node-json", :kind "defn-", :line 50, :end-line nil, :hash "1086192520"} {:id "def/handlers", :kind "def", :line 55, :end-line nil, :hash "-1793282294"}]}
;; clj-mutate-manifest-end
