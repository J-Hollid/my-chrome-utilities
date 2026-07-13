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

(defn load-browser-observation!
  [{:keys [adapter-env observation-key runtime-error missing-error]}]
  (let [result (process/shell (assoc build-shell-options :env {adapter-env "1"})
                              "node" "test/side-panel-component-layout-runtime-test.mjs")
        line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
        payload (when line (json/parse-string line true))
        observation (get payload observation-key)]
    (assert! (zero? (:exit result)) runtime-error {:out (:out result) :err (:err result)})
    (assert! observation missing-error {:payload payload})
    observation))

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
;; {:version 1, :tested-at "2026-07-10T17:42:55.989279844+02:00", :module-hash "1186401311", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-316380013"} {:id "def/build-shell-options", :kind "def", :line 7, :end-line nil, :hash "-930688589"} {:id "defn/example-value", :kind "defn", :line 9, :end-line nil, :hash "-599943701"} {:id "defn/require-example-value!", :kind "defn", :line 13, :end-line nil, :hash "749498583"} {:id "defn/require-example", :kind "defn", :line 17, :end-line nil, :hash "-773092781"} {:id "defn/read-json", :kind "defn", :line 22, :end-line nil, :hash "1794933363"} {:id "defn/source-file", :kind "defn", :line 27, :end-line nil, :hash "-1939833971"} {:id "defn/source-file-map", :kind "defn", :line 30, :end-line nil, :hash "-254262717"} {:id "defn/source-files", :kind "defn", :line 36, :end-line nil, :hash "-888013632"} {:id "defn/includes-all?", :kind "defn", :line 43, :end-line nil, :hash "-1981627903"} {:id "defn/matches-all?", :kind "defn", :line 46, :end-line nil, :hash "1542092592"} {:id "defn/split-list", :kind "defn", :line 49, :end-line nil, :hash "-1368248159"} {:id "defn/template-pattern", :kind "defn", :line 55, :end-line nil, :hash "-1377922721"} {:id "defn/feature-step-specs", :kind "defn", :line 65, :end-line nil, :hash "839713030"} {:id "defn/capture-placeholder-keys", :kind "defn", :line 79, :end-line nil, :hash "894327579"} {:id "defn/semantic-handlers", :kind "defn", :line 85, :end-line nil, :hash "1419994062"} {:id "defn/record-semantic-observation", :kind "defn", :line 92, :end-line nil, :hash "913946176"} {:id "defn/pattern-findings", :kind "defn", :line 99, :end-line nil, :hash "1233155688"} {:id "defn/repository-root", :kind "defn", :line 106, :end-line nil, :hash "-1494942566"} {:id "defn/assert!", :kind "defn", :line 109, :end-line nil, :hash "866058476"} {:id "defn/validate-example-domain!", :kind "defn", :line 113, :end-line nil, :hash "1835395419"} {:id "defn/ensure-build-passed!", :kind "defn", :line 123, :end-line nil, :hash "934213542"} {:id "defn/run-build-command", :kind "defn", :line 132, :end-line nil, :hash "378996986"}]}
;; clj-mutate-manifest-end
