(ns acceptance.steps.support
  (:require [aps.json :as aps-json]
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

(defn feature-mode-handlers
  [feature-files entry-modes state-key transition]
  (stateful-semantic-handlers
   (feature-step-specs feature-files #{})
   #(contains? entry-modes %)
   state-key
   transition))

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
;; {:version 1, :tested-at "2026-07-14T19:47:10.96395411+02:00", :module-hash "-824218041", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 6, :hash "-1787441374"} {:id "def/build-shell-options", :kind "def", :line 8, :end-line 8, :hash "-930688589"} {:id "defn/example-value", :kind "defn", :line 10, :end-line 12, :hash "-599943701"} {:id "defn/require-example-value!", :kind "defn", :line 14, :end-line 16, :hash "749498583"} {:id "defn/require-example", :kind "defn", :line 18, :end-line 21, :hash "-773092781"} {:id "defn/read-json", :kind "defn", :line 23, :end-line 26, :hash "1794933363"} {:id "defn/source-file", :kind "defn", :line 28, :end-line 29, :hash "-1939833971"} {:id "defn/source-file-map", :kind "defn", :line 31, :end-line 35, :hash "-254262717"} {:id "defn/source-files", :kind "defn", :line 37, :end-line 42, :hash "-888013632"} {:id "defn/includes-all?", :kind "defn", :line 44, :end-line 45, :hash "-280066464"} {:id "defn/matches-all?", :kind "defn", :line 47, :end-line 48, :hash "1057399970"} {:id "defn/split-list", :kind "defn", :line 50, :end-line 54, :hash "-1368248159"} {:id "defn/template-pattern", :kind "defn", :line 56, :end-line 64, :hash "-1377922721"} {:id "defn/feature-step-specs", :kind "defn", :line 66, :end-line 78, :hash "1281948553"} {:id "defn/capture-placeholder-keys", :kind "defn", :line 80, :end-line 84, :hash "-1096824432"} {:id "defn/semantic-handlers", :kind "defn", :line 86, :end-line 91, :hash "1419994062"} {:id "defn/stateful-semantic-handlers", :kind "defn", :line 93, :end-line 102, :hash "-1312329710"} {:id "defn/feature-mode-handlers", :kind "defn", :line 104, :end-line 110, :hash "-1722462953"} {:id "defn/record-semantic-observation", :kind "defn", :line 112, :end-line 117, :hash "913946176"} {:id "defn/pattern-findings", :kind "defn", :line 119, :end-line 124, :hash "1233155688"} {:id "defn/repository-root", :kind "defn", :line 126, :end-line 127, :hash "-1494942566"} {:id "defn/assert!", :kind "defn", :line 129, :end-line 131, :hash "866058476"} {:id "defn/stateful-observation", :kind "defn", :line 133, :end-line 140, :hash "2038859766"} {:id "defn/stateful-transition", :kind "defn", :line 142, :end-line 148, :hash "-1459105983"} {:id "defn/load-browser-observation-with-environment!", :kind "defn", :line 150, :end-line 159, :hash "-41201157"} {:id "defn/load-browser-observation!", :kind "defn", :line 161, :end-line 164, :hash "-1416186719"} {:id "defn/cached-browser-observation!", :kind "defn", :line 166, :end-line 169, :hash "1951769240"} {:id "defn/cached-command-verification!", :kind "defn", :line 171, :end-line 178, :hash "-1738870113"} {:id "defn/mode-transition", :kind "defn", :line 180, :end-line 187, :hash "-212214197"} {:id "defn/validate-observation-example!", :kind "defn", :line 189, :end-line 196, :hash "-753516880"} {:id "defn/validated-observation-transition", :kind "defn", :line 198, :end-line 202, :hash "1162907360"} {:id "defn/validate-example-domain!", :kind "defn", :line 204, :end-line 212, :hash "1835395419"} {:id "defn/ensure-build-passed!", :kind "defn", :line 214, :end-line 221, :hash "934213542"} {:id "defn/run-build-command", :kind "defn", :line 223, :end-line 225, :hash "378996986"}]}
;; clj-mutate-manifest-end
