(ns acceptance.steps.support
  (:require [aps.gherkin :as gherkin]
            [aps.json :as aps-json]
            [acceptance.pack-runtime :as packs]
            [babashka.fs :as fs]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def build-shell-options {:out :string :err :string :continue true})

(defn pack-runner-owns-js? []
  (= "1" (System/getenv "SWARMFORGE_PACK_RUNNER_OWNS_JS")))

(defn strict-verification-receipt? []
  (= "1" (System/getenv "SWARMFORGE_STRICT_VERIFICATION_RECEIPT")))

(defn- receipt-result [result]
  (when (= "passed" (get result "status"))
    {:exit 0
     :out (or (get result "output") "")
     :err (or (get result "stderr") "")
     :receipt true}))

(defn- task-command [result]
  (let [identity (get result "identity")]
    (into [(get identity "executable")] (get identity "args" []))))

(defn verification-receipt-result
  ([receipt command]
   (verification-receipt-result receipt nil command))
  ([receipt task-key command]
   (cond
     (= 2 (get receipt "version"))
     (let [tasks (get receipt "tasks")
           candidates (if task-key
                        [(get tasks task-key)]
                        (vals tasks))
           matches (filter #(and % (= (vec command) (task-command %))) candidates)]
       (when (> (count matches) 1)
         (throw (ex-info "Verification receipt contains duplicate command identities."
                         {:command (vec command) :task-key task-key})))
       (some-> (first matches) receipt-result))

     ;; Version 1 receipts remain readable outside strict orchestration so old
     ;; standalone acceptance helpers do not acquire a flag-day dependency.
     (= 1 (get receipt "version"))
     (when-not task-key
       (receipt-result (get-in receipt ["commands" (str/join " " command)])))

     :else nil)))

(defn verification-receipt-command
  ([command]
   (verification-receipt-command nil command))
  ([task-key command]
   (when-let [path (System/getenv "SWARMFORGE_VERIFICATION_RECEIPT")]
     (when (fs/exists? path)
       (verification-receipt-result
        (json/parse-string (slurp path)) task-key command)))))

(defn- command-result [task-key command]
  (or (verification-receipt-command task-key command)
      (if (or (pack-runner-owns-js?) (strict-verification-receipt?))
        (throw (ex-info "Verification command was not declared or did not pass before acceptance"
                        {:command (vec command)
                         :task-key task-key
                         :receipt (System/getenv "SWARMFORGE_VERIFICATION_RECEIPT")
                         :pack-runner-owns-js (pack-runner-owns-js?)
                         :strict-verification-receipt (strict-verification-receipt?)}))
        (apply process/shell build-shell-options command))))

(defn verified-command-result [& command]
  (command-result nil command))

(defn verified-task-result [task-key & command]
  (command-result task-key command))

(defn verified-command-or-prepared-task-result
  [command prepared-task-key prepared-command]
  (or (verification-receipt-command command)
      (if (or (pack-runner-owns-js?) (strict-verification-receipt?))
        (apply verified-task-result prepared-task-key prepared-command)
        (apply verified-command-result command))))

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

(defn source-files [root prefixes]
  (->> (file-seq (fs/file (fs/path root "src")))
       (filter fs/regular-file?)
       (map (fn [file]
              [(str (fs/relativize root file)) file]))
       (filter (fn [[path]]
                 (some #(or (= path %) (str/starts-with? path %)) prefixes)))
       (map (fn [[path file]] [path (slurp (str file))]))
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

(defn authoritative-feature-examples [feature-files]
  (set (for [feature-file feature-files
             scenario (:scenarios (gherkin/parse-file feature-file))
             example (:examples scenario)]
         example)))

(defn json-observation [output observation-key]
  (let [payload-line (->> (str/split-lines output)
                          (filter #(str/starts-with? % "{"))
                          last)]
    (get (json/parse-string payload-line true) observation-key)))

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

(defn validate-authoritative-example! [authoritative-examples example message]
  (when (seq example)
    (let [normalized (into {} (map (fn [[key value]] [(name key) value]) example))]
      (assert! (contains? authoritative-examples normalized)
               message
               {:example normalized}))))

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
  [{:keys [observation-id observation-key runtime-error missing-error]}]
  (assert! observation-id "Browser observation has no registered task id."
           {:observation-key observation-key})
  (let [task-key (str "browser-observation:" observation-id)
        result (verified-task-result task-key
                                     "node" "scripts/run-browser-observation.mjs"
                                     observation-id)
        line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
        payload (when line (json/parse-string line true))
        observation (get payload observation-key)]
    (assert! (zero? (:exit result)) (str runtime-error " " (:err result)) {:out (:out result) :err (:err result)})
    (assert! observation missing-error {:payload payload})
    observation))

(defn load-browser-observation!
  [{:keys [adapter-env] :as options}]
  (load-browser-observation-with-environment!
    (assoc options :observation-id (or (:observation-id options) adapter-env))))

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
                  (let [result (apply verified-command-result command)]
                    (assert! (zero? (:exit result))
                             (str error-message (:err result))
                             {:out (:out result) :err (:err result)})
                    (zero? (:exit result))))]
    (if packs/*runtime-cache*
      (packs/cached-runtime! [:command command] verify!)
      (when-not @cache (reset! cache (verify!))))))

(defn cached-command-observation!
  [cache {:keys [command observation-key runtime-error missing-error]}]
  (or @cache
      (let [result (apply verified-command-result command)
            line (last (filter #(str/starts-with? % "{")
                               (str/split-lines (:out result))))
            payload (when line (json/parse-string line true))
            observation (get payload observation-key)]
        (assert! (zero? (:exit result))
                 (str runtime-error " " (:err result))
                 {:out (:out result) :err (:err result)})
        (assert! observation missing-error {:out (:out result)})
        (reset! cache observation))))

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
  (let [result (verified-command-result "npm" "run" "build")]
    (assoc world :build-result result)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-04T11:33:29.408616672+02:00", :module-hash "-658288002", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1782816969"} {:id "def/build-shell-options", :kind "def", :line 10, :end-line nil, :hash "-930688589"} {:id "defn/verification-receipt-command", :kind "defn", :line 12, :end-line nil, :hash "-1423577451"} {:id "defn/verified-command-result", :kind "defn", :line 20, :end-line nil, :hash "-806024213"} {:id "defn/example-value", :kind "defn", :line 24, :end-line nil, :hash "-599943701"} {:id "defn/require-example-value!", :kind "defn", :line 28, :end-line nil, :hash "749498583"} {:id "defn/require-example", :kind "defn", :line 32, :end-line nil, :hash "-773092781"} {:id "defn/read-json", :kind "defn", :line 37, :end-line nil, :hash "1794933363"} {:id "defn/source-file", :kind "defn", :line 42, :end-line nil, :hash "-1939833971"} {:id "defn/source-file-map", :kind "defn", :line 45, :end-line nil, :hash "-254262717"} {:id "defn/source-files", :kind "defn", :line 51, :end-line nil, :hash "-888013632"} {:id "defn/includes-all?", :kind "defn", :line 58, :end-line nil, :hash "-1981627903"} {:id "defn-/strictly-increasing?", :kind "defn-", :line 61, :end-line nil, :hash "397463999"} {:id "defn/navigation-structure?", :kind "defn", :line 64, :end-line nil, :hash "-1435889438"} {:id "defn/matches-all?", :kind "defn", :line 78, :end-line nil, :hash "1542092592"} {:id "defn/split-list", :kind "defn", :line 81, :end-line nil, :hash "-1368248159"} {:id "defn/template-pattern", :kind "defn", :line 87, :end-line nil, :hash "-1377922721"} {:id "defn/feature-step-specs", :kind "defn", :line 97, :end-line nil, :hash "839713030"} {:id "defn/authoritative-feature-examples", :kind "defn", :line 111, :end-line nil, :hash "60493994"} {:id "defn/json-observation", :kind "defn", :line 117, :end-line nil, :hash "742140040"} {:id "defn/capture-placeholder-keys", :kind "defn", :line 123, :end-line nil, :hash "894327579"} {:id "defn/semantic-handlers", :kind "defn", :line 129, :end-line nil, :hash "1419994062"} {:id "defn/stateful-semantic-handlers", :kind "defn", :line 136, :end-line nil, :hash "-1312329710"} {:id "defn/feature-scoped-stateful-handlers", :kind "defn", :line 147, :end-line nil, :hash "1287639268"} {:id "defn/stateful-feature-handlers", :kind "defn", :line 161, :end-line nil, :hash "-1720293067"} {:id "defn/feature-mode-handlers", :kind "defn", :line 169, :end-line nil, :hash "860506238"} {:id "defn/record-semantic-observation", :kind "defn", :line 182, :end-line nil, :hash "913946176"} {:id "defn/pattern-findings", :kind "defn", :line 189, :end-line nil, :hash "1233155688"} {:id "defn/repository-root", :kind "defn", :line 196, :end-line nil, :hash "-1494942566"} {:id "defn/assert!", :kind "defn", :line 199, :end-line nil, :hash "866058476"} {:id "defn/validate-authoritative-example!", :kind "defn", :line 203, :end-line nil, :hash "1949564479"} {:id "defn/stateful-observation", :kind "defn", :line 210, :end-line nil, :hash "2038859766"} {:id "defn/stateful-transition", :kind "defn", :line 219, :end-line nil, :hash "-1459105983"} {:id "defn/load-browser-observation-with-environment!", :kind "defn", :line 227, :end-line nil, :hash "-59335991"} {:id "defn/load-browser-observation!", :kind "defn", :line 238, :end-line nil, :hash "-1416186719"} {:id "defn/cached-browser-observation!", :kind "defn", :line 243, :end-line nil, :hash "-1963526695"} {:id "defn/cached-command-verification!", :kind "defn", :line 251, :end-line nil, :hash "604261329"} {:id "defn/cached-command-observation!", :kind "defn", :line 263, :end-line nil, :hash "-756353594"} {:id "defn/mode-transition", :kind "defn", :line 277, :end-line nil, :hash "-212214197"} {:id "defn/verified-feature-mode-handlers", :kind "defn", :line 286, :end-line nil, :hash "-1989417952"} {:id "defn/validate-observation-example!", :kind "defn", :line 295, :end-line nil, :hash "38475456"} {:id "defn/validated-observation-transition", :kind "defn", :line 302, :end-line nil, :hash "1162907360"} {:id "defn/validate-example-domain!", :kind "defn", :line 308, :end-line nil, :hash "1835395419"} {:id "defn/validate-mode-example-domain!", :kind "defn", :line 318, :end-line nil, :hash "-178241025"} {:id "defn/validate-example-relations!", :kind "defn", :line 326, :end-line nil, :hash "-1150208791"} {:id "defn/validate-mode-example!", :kind "defn", :line 336, :end-line nil, :hash "-36916542"} {:id "defn/ensure-build-passed!", :kind "defn", :line 345, :end-line nil, :hash "934213542"} {:id "defn/run-build-command", :kind "defn", :line 354, :end-line nil, :hash "-1672970928"}]}
;; clj-mutate-manifest-end
