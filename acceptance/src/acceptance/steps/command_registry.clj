(ns acceptance.steps.command-registry
  (:require [aps.json :as aps-json]
            [babashka.fs :as fs]
            [babashka.process :as process]
            [clojure.string :as str]))

(def build-shell-options {:out :string :err :string :continue true})

(def command-fields #{"id" "title" "description" "category" "run"})

(defn- example-value [example key]
  (or (get example key)
      (get example (keyword key))))

(defn- require-example [example key]
  (let [value (example-value example key)]
    (when (str/blank? value)
      (throw (ex-info (format "Missing example value: %s" key) {:key key})))
    value))

(defn- assert! [condition message data]
  (when-not condition
    (throw (ex-info message data))))

(defn- repository-root []
  (fs/cwd))

(defn- source-file [root path]
  (slurp (str (fs/path root path))))

(defn- source-files [root]
  (->> (file-seq (fs/file (fs/path root "src")))
       (filter fs/regular-file?)
       (map (fn [file]
              [(str (fs/relativize root file)) (slurp (str file))]))
       (into (sorted-map))))

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

(defn separate-from-rendering? [registry-source rendering-source]
  (and (every? #(contains? (defined-fields registry-source) %) command-fields)
       (not (re-find #"\b(id|title|description|category|run)\s*:" rendering-source))))

(def forbidden-command-ui-patterns
  [{:kind :command-palette
    :pattern #"(?i)commandPalette|command palette"}
   {:kind :keybindings
    :pattern #"(?i)keybindings|keyboard shortcut|addEventListener\(['\"]keydown"}])

(defn forbidden-command-ui-findings [files]
  (vec
   (for [{:keys [kind pattern]} forbidden-command-ui-patterns
         path (sort (keys files))
         :when (re-find pattern (get files path))]
     {:kind kind :path path})))

(defn- run-command-with-node [command-id]
  (let [script (format "import { runCommandById } from './dist/commands.js'; runCommandById(%s, { record: (entry) => console.log(JSON.stringify(entry)) });"
                       (pr-str command-id))]
    (process/shell {:out :string :err :string :continue true}
                   "node" "--input-type=module" "--eval" script)))

(defn- read-node-json [result]
  (let [path (fs/create-temp-file {:prefix "command-run" :suffix ".json"})]
    (spit (str path) (:out result))
    (aps-json/read-json-file (str path))))

(defn- run-build-command [world]
  (let [result (process/shell build-shell-options "npm run build")]
    (assoc world :build-result result)))

(defn- ensure-build-passed! [world]
  (let [result (:build-result world)]
    (assert! result "Build command has not been run." {})
    (assert! (zero? (:exit result))
             "Build command failed."
             {:exit (:exit result)
              :out (:out result)
              :err (:err result)})))

(def handlers
  [{:pattern #"^the command registry contract is inspected$"
    :handler (fn [world _example _captures]
               (let [root (or (:root world) (repository-root))]
                 (assoc world
                        :root root
                        :registry-source (source-file root "src/commands.ts")
                        :rendering-source (source-file root "src/side-panel.ts"))))}

   {:pattern #"^each command defines <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, and <([A-Za-z0-9_]+)>$"
    :handler (fn [world example field-keys]
               (let [expected (set (map #(require-example example %) field-keys))
                     actual (defined-fields (:registry-source world))]
                 (assert! (= expected actual)
                          "Command fields do not match the registry contract."
                          {:expected expected :actual actual})
                 world))}

   {:pattern #"^the registry can list commands$"
    :handler (fn [world _example _captures]
               (assert! (listable-registry? (:registry-source world))
                        "Registry does not expose a command list."
                        {})
               world)}

   {:pattern #"^command registry logic is separated from side panel rendering$"
    :handler (fn [world _example _captures]
               (assert! (separate-from-rendering? (:registry-source world)
                                                  (:rendering-source world))
                        "Command logic is mixed into side panel rendering."
                        {})
               world)}

   {:pattern #"^command <([A-Za-z0-9_]+)> is inspected$"
    :handler (fn [world example [command-key]]
               (let [root (or (:root world) (repository-root))
                     command-id (require-example example command-key)]
                 (assoc world
                        :root root
                        :command-id command-id
                        :registry-source (source-file root "src/commands.ts"))))}

   {:pattern #"^command <([A-Za-z0-9_]+)> is registered$"
    :handler (fn [world example [command-key]]
               (let [command-id (require-example example command-key)]
                 (assert! (registered-command? (:registry-source world) command-id)
                          "Command is not registered."
                          {:command-id command-id})
                 world))}

   {:pattern #"^command <([A-Za-z0-9_]+)> has a title, description, category, and run behavior$"
    :handler (fn [world example [command-key]]
               (let [command-id (require-example example command-key)]
                 (assert! (command-has-behavior? (:registry-source world) command-id)
                          "Command does not have the required behavior contract."
                          {:command-id command-id})
                 world))}

   {:pattern #"^command <([A-Za-z0-9_]+)> is run by id$"
    :handler (fn [world example [command-key]]
               (let [command-id (require-example example command-key)
                     world (run-build-command (assoc world :root (or (:root world) (repository-root))))]
                 (ensure-build-passed! world)
                 (let [result (run-command-with-node command-id)]
                   (assert! (zero? (:exit result))
                            "Command failed when run by id."
                            {:exit (:exit result)
                             :out (:out result)
                             :err (:err result)})
                   (assoc world
                          :command-id command-id
                          :command-run-record (read-node-json result)))))}

   {:pattern #"^visible app state or log records that command <([A-Za-z0-9_]+)> ran$"
    :handler (fn [world example [command-key]]
               (let [command-id (require-example example command-key)
                     record (:command-run-record world)]
                 (assert! (= command-id (:commandId record))
                          "Command run record does not identify the command."
                          {:expected command-id :actual (:commandId record)})
                 (assert! (str/includes? (:message record) command-id)
                          "Command run record does not expose visible command state."
                          {:record record})
                 world))}

   {:pattern #"^command features are inspected$"
    :handler (fn [world _example _captures]
               (let [root (or (:root world) (repository-root))]
                 (assoc world
                        :root root
                        :command-feature-files (source-files root))))}

   {:pattern #"^no command palette is present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :command-palette (:kind %))
                                      (forbidden-command-ui-findings (:command-feature-files world)))]
                 (assert! (empty? findings)
                          "Command palette implementation was found."
                          {:findings (vec findings)})
                 world))}

   {:pattern #"^no user-configurable keybindings are present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :keybindings (:kind %))
                                      (forbidden-command-ui-findings (:command-feature-files world)))]
                 (assert! (empty? findings)
                          "User-configurable keybindings were found."
                          {:findings (vec findings)})
                 world))}])
