(ns acceptance.steps.support
  (:require [aps.gherkin :as gherkin]
            [aps.json :as aps-json]
            [acceptance.pack-runtime :as packs]
            [babashka.fs :as fs]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def build-shell-options {:out :string :err :string :continue true})

(defn example-value [example key]
  (or (get example key)
      (get example (keyword key))))

(defn require-example-value! [key value]
  (when (str/blank? value)
    (throw (ex-info (format "Missing example value: %s" key) {:key key}))))

(defn require-example [example key]
  (let [value (example-value example key)]
    (require-example-value! key value)
    value))

(defn read-json [path]
  (when-not (fs/exists? path)
    (throw (ex-info (format "Missing file: %s" path) {:path path})))
  (aps-json/read-json-file (str path)))

(defn source-file [root path]
  (slurp (str (fs/path root path))))

(defn source-file-map [root paths]
  (into {}
        (map (fn [path]
               [path (source-file root path)])
             paths)))

(defn source-files [root]
  (->> (file-seq (fs/file (fs/path root "src")))
       (filter fs/regular-file?)
       (map (fn [file]
              [(str (fs/relativize root file)) (slurp (str file))]))
       (into (sorted-map))))

(defn includes-all? [source snippets]
  (every? #(str/includes? source %) snippets))

(defn- strictly-increasing? [values]
  (every? neg? (map compare values (rest values))))

(defn navigation-structure? [html css]
  (let [header-index (.indexOf html "id=\"application-header\"")
        primary-index (.indexOf html "id=\"workspace-tabs\"")
        secondary-index (.indexOf html "id=\"data-layer-views\"")
        live-index (.indexOf html "id=\"data-layer-panel-live\"")]
    (and (every? #(not (neg? %))
                 [header-index primary-index secondary-index live-index])
         (strictly-increasing? [header-index primary-index secondary-index live-index])
         (str/includes? html "role=\"tablist\" aria-label=\"Workspace\"")
         (str/includes? html "role=\"tablist\" aria-label=\"Data Layer views\"")
         (str/includes? css
                        "#side-panel-content { display:grid; grid-template-rows:auto auto minmax(0,1fr)")
         (str/includes? css "[role=tab] { background:transparent"))))

(defn matches-all? [source patterns]
  (every? #(re-find % source) patterns))

(defn split-list [text separator-pattern]
  (->> (str/split text separator-pattern)
       (map str/trim)
       (remove str/blank?)
       vec))

(defn template-pattern [template]
  (let [parts (str/split template #"<[A-Za-z0-9_]+>" -1)
        captures (repeat (dec (count parts)) "(<[^>]+>)")]
    (re-pattern
     (str "^"
          (apply str
                 (interleave (map java.util.regex.Pattern/quote parts)
                             (concat captures [""])))
          "$"))))

(defn feature-step-specs [feature-files excluded-texts]
  (->> feature-files
       (mapcat #(str/split-lines (slurp %)))
       (keep (fn [line]
               (when-let [[_ keyword text]
                          (re-matches #"\s*(Given|When|Then|And) (.+)" line)]
                 {:keyword keyword :text text})))
       (remove #(contains? excluded-texts (:text %)))
       (reduce (fn [specs spec]
                 (assoc specs (:text spec) spec))
               (sorted-map))
       vals
       vec))

(defn capture-placeholder-keys [captures]
  (->> captures
       (filter string?)
       (filter #(re-matches #"<[^>]+>" %))
       (mapv #(subs % 1 (dec (count %))))))

(defn semantic-handlers [step-specs transition]
  (mapv (fn [spec]
          {:pattern (template-pattern (:text spec))
           :handler (fn [world example captures]
                      (transition world example captures spec))})
        step-specs))

(defn stateful-semantic-handlers
  [step-specs entry-step? state-key transition]
  (mapv (fn [spec]
          {:pattern (template-pattern (:text spec))
           :applies? (fn [world]
                       (or (entry-step? (:text spec))
                           (get world state-key)))
           :handler (fn [world example captures]
                      (transition world example captures spec))})
        step-specs))

(defn feature-scoped-stateful-handlers
  [feature-files entry-step? state-key transition]
  (let [feature-names (set (map (comp :name gherkin/parse-file) feature-files))]
    (mapv (fn [{:keys [applies?] :as handler}]
            (assoc handler :applies? (fn [world]
                                       (and (contains? feature-names
                                                       (:acceptance/feature-name world))
                                            (boolean (applies? world))))))
          (stateful-semantic-handlers
           (feature-step-specs feature-files #{})
           entry-step?
           state-key
           transition))))

(defn stateful-feature-handlers
  [feature-file entry-step state-key transition]
  (stateful-semantic-handlers
   (feature-step-specs [feature-file] #{})
   #{entry-step}
   state-key
   transition))

(defn feature-mode-handlers
  [feature-files entry-modes state-key transition]
  (let [feature-names (set (map (comp :name gherkin/parse-file) feature-files))]
    (mapv (fn [spec]
            {:pattern (template-pattern (:text spec))
             :applies? (fn [world]
                         (or (and (contains? entry-modes (:text spec))
                                  (contains? feature-names (:acceptance/feature-name world)))
                             (get world state-key)))
             :handler (fn [world example captures]
                        (transition world example captures spec))})
          (feature-step-specs feature-files #{}))))

(defn record-semantic-observation
  [world action-key observations-key fallback-text text example]
  (let [action (or (get world action-key)
                   {:text fallback-text :example example})]
    (update world observations-key (fnil conj [])
            {:text text :example example :action action})))

(defn pattern-findings [patterns files]
  (vec
   (for [{:keys [kind pattern]} patterns
         path (sort (keys files))
         :when (re-find pattern (get files path))]
     {:kind kind :path path})))

(defn repository-root []
  (fs/cwd))

(defn assert! [condition message data]
  (when-not condition
    (throw (ex-info message data))))

(defn stateful-observation
  [world text entry-step? state-key observation! missing-message]
  (let [world (if (entry-step? text)
                (assoc world state-key (observation!))
                world)
        observed (get world state-key)]
    (assert! observed missing-message {:step text})
    [world observed]))

(defn stateful-transition
  [world example text entry-step? state-key observation! missing-message assert-observation!]
  (let [[world observed]
        (stateful-observation
         world text entry-step? state-key observation! missing-message)]
    (assert-observation! example observed)
    world))

(defn load-browser-observation-with-environment!
  [{:keys [environment observation-key runtime-error missing-error]}]
  (let [result (process/shell (assoc build-shell-options :env (merge (into {} (System/getenv)) environment))
                              "node" "test/side-panel-component-layout-runtime-test.mjs")
        line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
        payload (when line (json/parse-string line true))
        observation (get payload observation-key)]
    (assert! (zero? (:exit result)) (str runtime-error " " (:err result)) {:out (:out result) :err (:err result)})
    (assert! observation missing-error {:payload payload})
    observation))

(defn load-browser-observation!
  [{:keys [adapter-env] :as options}]
  (load-browser-observation-with-environment!
    (assoc options :environment {adapter-env "1"})))

(defn cached-browser-observation!
  [cache options]
  (if packs/*runtime-cache*
    (packs/cached-runtime! [:browser (select-keys options [:adapter-env :observation-key])]
                           #(load-browser-observation! options))
    (or @cache
        (reset! cache (load-browser-observation! options)))))

(defn cached-command-verification!
  [cache error-message & command]
  (let [verify! (fn []
                  (let [result (apply process/shell build-shell-options command)]
                    (assert! (zero? (:exit result))
                             (str error-message (:err result))
                             {:out (:out result) :err (:err result)})
                    (zero? (:exit result))))]
    (if packs/*runtime-cache*
      (packs/cached-runtime! [:command command] verify!)
      (when-not @cache (reset! cache (verify!))))))

(defn mode-transition
  [world example text entry-modes state-key verify! validate-example! runtime-boundary!]
  (let [mode (or (entry-modes text) (get world state-key))]
    (assert! mode "Scenario did not establish its acceptance mode." {:step text :state-key state-key})
    (verify!)
    (validate-example! mode example)
    (when (= mode :runtime) (runtime-boundary!))
    (assoc world state-key mode)))

(defn verified-feature-mode-handlers
  [feature-files entry-modes state-key verify! validate-example! runtime-observation! assert-runtime!]
  (feature-mode-handlers
   feature-files entry-modes state-key
   (fn [world example _captures {:keys [text]}]
     (mode-transition world example text entry-modes state-key
                      verify! validate-example!
                      #(assert-runtime! (runtime-observation!))))))

(defn validate-observation-example!
  [example observation validators validate-row!]
  (doseq [[key validation] validators
          :when (example-value example key)]
    (validate-row! example observation validation))
  observation)

(defn validated-observation-transition
  [world example state-key observation! validate-observation! validate-example!]
  (let [observation (validate-observation! (observation!))]
    (validate-example! example observation)
    (assoc world state-key observation)))

(defn validate-example-domain!
  [canonical-values example keys message]
  (doseq [key keys]
    (let [value (require-example example key)
          allowed (get canonical-values key)]
      (assert! (and allowed (contains? allowed value))
               message
               {:key key :value value :allowed allowed})))
  example)

(defn validate-mode-example-domain!
  [mode runtime-values model-values example message]
  (let [domains (if (= mode :runtime) runtime-values model-values)]
    (validate-example-domain!
     domains example
     (filter #(example-value example %) (keys domains))
     message)))

(defn validate-example-relations!
  [relations example message]
  (doseq [{:keys [keys rows]} relations
          :when (every? #(example-value example %) keys)]
    (let [row (mapv #(example-value example %) keys)]
      (assert! (contains? rows row)
               message
               {:keys keys :row row :allowed rows})))
  example)

(defn validate-mode-example!
  [mode runtime-values model-values runtime-relations model-relations
   example domain-message relation-message]
  (validate-mode-example-domain!
   mode runtime-values model-values example domain-message)
  (validate-example-relations!
   (if (= mode :runtime) runtime-relations model-relations)
   example relation-message))

(defn ensure-build-passed! [world]
  (let [result (:build-result world)]
    (assert! result "Build command has not been run." {})
    (assert! (zero? (:exit result))
             "Build command failed."
             {:exit (:exit result)
              :out (:out result)
              :err (:err result)})))

(defn run-build-command [world]
  (let [result (process/shell build-shell-options "npm run build")]
    (assoc world :build-result result)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-17T17:13:06.946367063+02:00", :module-hash "-403416543", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 8, :hash "-1782816969"} {:id "def/build-shell-options", :kind "def", :line 10, :end-line 10, :hash "-930688589"} {:id "defn/example-value", :kind "defn", :line 12, :end-line 14, :hash "-599943701"} {:id "defn/require-example-value!", :kind "defn", :line 16, :end-line 18, :hash "749498583"} {:id "defn/require-example", :kind "defn", :line 20, :end-line 23, :hash "-773092781"} {:id "defn/read-json", :kind "defn", :line 25, :end-line 28, :hash "1794933363"} {:id "defn/source-file", :kind "defn", :line 30, :end-line 31, :hash "-1939833971"} {:id "defn/source-file-map", :kind "defn", :line 33, :end-line 37, :hash "-254262717"} {:id "defn/source-files", :kind "defn", :line 39, :end-line 44, :hash "-888013632"} {:id "defn/includes-all?", :kind "defn", :line 46, :end-line 47, :hash "-280066464"} {:id "defn-/strictly-increasing?", :kind "defn-", :line 49, :end-line 50, :hash "397463999"} {:id "defn/navigation-structure?", :kind "defn", :line 52, :end-line 64, :hash "1586471099"} {:id "defn/matches-all?", :kind "defn", :line 66, :end-line 67, :hash "-623138115"} {:id "defn/split-list", :kind "defn", :line 69, :end-line 73, :hash "-1368248159"} {:id "defn/template-pattern", :kind "defn", :line 75, :end-line 83, :hash "-1377922721"} {:id "defn/feature-step-specs", :kind "defn", :line 85, :end-line 97, :hash "-1076030599"} {:id "defn/capture-placeholder-keys", :kind "defn", :line 99, :end-line 103, :hash "794044306"} {:id "defn/semantic-handlers", :kind "defn", :line 105, :end-line 110, :hash "1419994062"} {:id "defn/stateful-semantic-handlers", :kind "defn", :line 112, :end-line 121, :hash "-1312329710"} {:id "defn/feature-scoped-stateful-handlers", :kind "defn", :line 123, :end-line 135, :hash "1287639268"} {:id "defn/stateful-feature-handlers", :kind "defn", :line 137, :end-line 143, :hash "-1720293067"} {:id "defn/feature-mode-handlers", :kind "defn", :line 145, :end-line 156, :hash "860506238"} {:id "defn/record-semantic-observation", :kind "defn", :line 158, :end-line 163, :hash "913946176"} {:id "defn/pattern-findings", :kind "defn", :line 165, :end-line 170, :hash "1233155688"} {:id "defn/repository-root", :kind "defn", :line 172, :end-line 173, :hash "-1494942566"} {:id "defn/assert!", :kind "defn", :line 175, :end-line 177, :hash "866058476"} {:id "defn/stateful-observation", :kind "defn", :line 179, :end-line 186, :hash "2038859766"} {:id "defn/stateful-transition", :kind "defn", :line 188, :end-line 194, :hash "-1459105983"} {:id "defn/load-browser-observation-with-environment!", :kind "defn", :line 196, :end-line 205, :hash "-41201157"} {:id "defn/load-browser-observation!", :kind "defn", :line 207, :end-line 210, :hash "-1416186719"} {:id "defn/cached-browser-observation!", :kind "defn", :line 212, :end-line 218, :hash "-1963526695"} {:id "defn/cached-command-verification!", :kind "defn", :line 220, :end-line 230, :hash "1036339390"} {:id "defn/mode-transition", :kind "defn", :line 232, :end-line 239, :hash "-212214197"} {:id "defn/verified-feature-mode-handlers", :kind "defn", :line 241, :end-line 248, :hash "-1989417952"} {:id "defn/validate-observation-example!", :kind "defn", :line 250, :end-line 255, :hash "38475456"} {:id "defn/validated-observation-transition", :kind "defn", :line 257, :end-line 261, :hash "1162907360"} {:id "defn/validate-example-domain!", :kind "defn", :line 263, :end-line 271, :hash "1835395419"} {:id "defn/validate-mode-example-domain!", :kind "defn", :line 273, :end-line 279, :hash "-642266968"} {:id "defn/validate-example-relations!", :kind "defn", :line 281, :end-line 289, :hash "1404555231"} {:id "defn/validate-mode-example!", :kind "defn", :line 291, :end-line 298, :hash "-36916542"} {:id "defn/ensure-build-passed!", :kind "defn", :line 300, :end-line 307, :hash "934213542"} {:id "defn/run-build-command", :kind "defn", :line 309, :end-line 311, :hash "378996986"}]}
;; clj-mutate-manifest-end
