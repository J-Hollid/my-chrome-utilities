(ns acceptance.steps.support
  (:require [aps.gherkin :as gherkin]
            [aps.json :as aps-json]
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
  (or @cache
      (reset! cache (load-browser-observation! options))))

(defn cached-command-verification!
  [cache error-message & command]
  (when-not @cache
    (let [result (apply process/shell build-shell-options command)]
      (assert! (zero? (:exit result))
               (str error-message (:err result))
               {:out (:out result) :err (:err result)})
      (reset! cache true))))

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
  (some (fn [[key validation]]
          (when (example-value example key)
            (validate-row! example observation validation)
            true))
        validators)
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
;; {:version 1, :tested-at "2026-07-16T20:40:44.937898827+02:00", :module-hash "-73937646", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 7, :hash "-1956739868"} {:id "def/build-shell-options", :kind "def", :line 9, :end-line 9, :hash "-930688589"} {:id "defn/example-value", :kind "defn", :line 11, :end-line 13, :hash "-599943701"} {:id "defn/require-example-value!", :kind "defn", :line 15, :end-line 17, :hash "749498583"} {:id "defn/require-example", :kind "defn", :line 19, :end-line 22, :hash "-773092781"} {:id "defn/read-json", :kind "defn", :line 24, :end-line 27, :hash "1794933363"} {:id "defn/source-file", :kind "defn", :line 29, :end-line 30, :hash "-1939833971"} {:id "defn/source-file-map", :kind "defn", :line 32, :end-line 36, :hash "-254262717"} {:id "defn/source-files", :kind "defn", :line 38, :end-line 43, :hash "-888013632"} {:id "defn/includes-all?", :kind "defn", :line 45, :end-line 46, :hash "-280066464"} {:id "defn/matches-all?", :kind "defn", :line 48, :end-line 49, :hash "1057399970"} {:id "defn/split-list", :kind "defn", :line 51, :end-line 55, :hash "-1368248159"} {:id "defn/template-pattern", :kind "defn", :line 57, :end-line 65, :hash "-1377922721"} {:id "defn/feature-step-specs", :kind "defn", :line 67, :end-line 79, :hash "1281948553"} {:id "defn/capture-placeholder-keys", :kind "defn", :line 81, :end-line 85, :hash "-1096824432"} {:id "defn/semantic-handlers", :kind "defn", :line 87, :end-line 92, :hash "1419994062"} {:id "defn/stateful-semantic-handlers", :kind "defn", :line 94, :end-line 103, :hash "-1312329710"} {:id "defn/stateful-feature-handlers", :kind "defn", :line 105, :end-line 111, :hash "-1720293067"} {:id "defn/feature-mode-handlers", :kind "defn", :line 113, :end-line 124, :hash "860506238"} {:id "defn/record-semantic-observation", :kind "defn", :line 126, :end-line 131, :hash "913946176"} {:id "defn/pattern-findings", :kind "defn", :line 133, :end-line 138, :hash "1233155688"} {:id "defn/repository-root", :kind "defn", :line 140, :end-line 141, :hash "-1494942566"} {:id "defn/assert!", :kind "defn", :line 143, :end-line 145, :hash "866058476"} {:id "defn/stateful-observation", :kind "defn", :line 147, :end-line 154, :hash "2038859766"} {:id "defn/stateful-transition", :kind "defn", :line 156, :end-line 162, :hash "-1459105983"} {:id "defn/load-browser-observation-with-environment!", :kind "defn", :line 164, :end-line 173, :hash "-984393520"} {:id "defn/load-browser-observation!", :kind "defn", :line 175, :end-line 178, :hash "-1416186719"} {:id "defn/cached-browser-observation!", :kind "defn", :line 180, :end-line 183, :hash "1951769240"} {:id "defn/cached-command-verification!", :kind "defn", :line 185, :end-line 192, :hash "-1738870113"} {:id "defn/mode-transition", :kind "defn", :line 194, :end-line 201, :hash "-212214197"} {:id "defn/verified-feature-mode-handlers", :kind "defn", :line 203, :end-line 210, :hash "-1989417952"} {:id "defn/validate-observation-example!", :kind "defn", :line 212, :end-line 219, :hash "-753516880"} {:id "defn/validated-observation-transition", :kind "defn", :line 221, :end-line 225, :hash "1162907360"} {:id "defn/validate-example-domain!", :kind "defn", :line 227, :end-line 235, :hash "1835395419"} {:id "defn/validate-mode-example-domain!", :kind "defn", :line 237, :end-line 243, :hash "1966660584"} {:id "defn/validate-example-relations!", :kind "defn", :line 245, :end-line 253, :hash "-357138992"} {:id "defn/validate-mode-example!", :kind "defn", :line 255, :end-line 262, :hash "-36916542"} {:id "defn/ensure-build-passed!", :kind "defn", :line 264, :end-line 271, :hash "934213542"} {:id "defn/run-build-command", :kind "defn", :line 273, :end-line 275, :hash "378996986"}]}
;; clj-mutate-manifest-end
