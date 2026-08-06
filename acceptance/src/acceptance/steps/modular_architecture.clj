(ns acceptance.steps.modular-architecture
  (:require [acceptance.steps.support :as support]
            [aps.json :as aps-json]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(defn- enough-verification-packs? [registry]
  (>= (count registry) 6))

(def ^:private browser-adapter-modes
  #{"shared" "shared-wrapper" "integration"})
(defonce ^:private throughput-verified? (atom false))
(declare inspect!)

(defn- verify-throughput! [world]
  (when-not @throughput-verified?
    (let [result (support/verified-command-result
                  "node" "test/verification-process-contract-test.mjs")]
      (support/assert! (zero? (:exit result))
                       "Verification throughput process contract failed."
                       {:err (:err result) :out (:out result)})
      (reset! throughput-verified? true)))
  (inspect! world))

(defn- parse-seconds [value]
  (when-let [[_ amount] (re-matches #"([0-9]+(?:\.[0-9]+)?) seconds" value)]
    (Double/parseDouble amount)))

(defn- bounded-worker-load [durations worker-limit]
  (loop [remaining durations
         loads (vec (repeat (min worker-limit (count durations)) 0.0))]
    (if-let [duration (first remaining)]
      (let [worker (apply min-key #(loads %) (range (count loads)))]
        (recur (next remaining) (update loads worker + duration)))
      (if (seq loads) (apply max loads) 0.0))))

(defn- parse-task-durations [description]
  (cond
    (= description "no tasks") []
    (re-matches #"one task lasting ([0-9]+) seconds" description)
    [(Double/parseDouble
      (second (re-matches #"one task lasting ([0-9]+) seconds" description)))]
    (re-matches #"tasks lasting ([0-9]+), ([0-9]+), and ([0-9]+) seconds" description)
    (mapv #(Double/parseDouble %)
          (rest (re-matches #"tasks lasting ([0-9]+), ([0-9]+), and ([0-9]+) seconds"
                            description)))))

(defn- bounded-stage-world [world ordered-tasks worker-limit]
  (let [durations (parse-task-durations ordered-tasks)
        workers (parse-long worker-limit)]
    (support/assert! (and (some? durations) (pos-int? workers))
                     "Bounded-stage acceptance fixture is invalid."
                     {:ordered-tasks ordered-tasks :worker-limit worker-limit})
    (assoc (verify-throughput! world)
           :throughput/expected-seconds (bounded-worker-load durations workers))))

(defn- timing-evidence [description]
  (cond
    (re-matches #"exact task median ([0-9]+) seconds plus target median ([0-9]+) seconds"
                description)
    (let [[_ exact] (re-matches
                     #"exact task median ([0-9]+) seconds plus target median ([0-9]+) seconds"
                     description)]
      {:seconds (Double/parseDouble exact) :source "exact task samples"})

    (re-matches #"target medians ([0-9]+) and ([0-9]+) seconds plus modeled session overhead ([0-9]+) seconds"
                description)
    (let [[_ first-target second-target overhead]
          (re-matches #"target medians ([0-9]+) and ([0-9]+) seconds plus modeled session overhead ([0-9]+) seconds"
                      description)]
      {:seconds (reduce + (map #(Double/parseDouble %)
                               [first-target second-target overhead]))
       :source "composed target samples"})

    (re-matches #"one target median ([0-9]+) seconds plus modeled session overhead ([0-9]+) seconds"
                description)
    (let [[_ target overhead]
          (re-matches #"one target median ([0-9]+) seconds plus modeled session overhead ([0-9]+) seconds"
                      description)]
      {:seconds (+ (Double/parseDouble target) (Double/parseDouble overhead))
       :source "composed target samples"})

    (re-matches #"no eligible task or target sample and explicit bootstrap ([0-9]+) seconds"
                description)
    (let [[_ fallback]
          (re-matches #"no eligible task or target sample and explicit bootstrap ([0-9]+) seconds"
                      description)]
      {:seconds (Double/parseDouble fallback) :source "bootstrap fallback"})))

(defn- timing-world [world description]
  (let [timing (timing-evidence description)]
    (support/assert! (some? timing) "Timing-evidence acceptance fixture is invalid."
                     {:timing-evidence description})
    (assoc (verify-throughput! world) :throughput/timing timing)))

(def ^:private report-row-estimates
  {"one 200-second observation task" 200.0
   "representative Flow workspace change" 26.2})

(defn- budget-world [world report-row corrected-estimate budget]
  (let [estimate (parse-seconds corrected-estimate)
        limit (parse-seconds budget)]
    (support/assert! (and (= (report-row-estimates report-row) estimate)
                          (number? limit))
                     "Performance-budget acceptance fixture is invalid."
                     {:report-row report-row
                      :corrected-estimate corrected-estimate
                      :budget budget})
    (assoc (verify-throughput! world)
           :throughput/budget-result (if (<= estimate limit) "pass" "fail"))))

(defn- assert-seconds! [world actual expected-key]
  (let [actual-seconds (parse-seconds actual)]
    (support/assert! (= (expected-key world) actual-seconds)
                     "Throughput estimate does not match its acceptance fixture."
                     {:actual actual :expected (expected-key world)})
    world))

(defn- assert-value! [world actual expected]
  (support/assert! (= expected actual)
                   "Throughput result does not match its acceptance fixture."
                   {:actual actual :expected expected})
  world)

(defn- example-values [example captures]
  (mapv #(support/require-example example %)
        (support/capture-placeholder-keys captures)))

(defn- classified-browser-adapters [registry]
  (into {}
        (map (juxt :path :mode))
        (mapcat :browserAdapterModes registry)))

(defn- inspection-context []
  (let [root (support/repository-root)
        registry (aps-json/read-json-file (str (fs/path root "verification/packs.json")))]
    {:root root
     :registry registry
     :adapter-classifications (classified-browser-adapters registry)
     :sources (support/source-file-map
               root ["src/utility-registry.ts" "src/side-panel.ts"
                     "acceptance/src/acceptance/generator.clj" "scripts/verification-packs.mjs"
                     "scripts/report-verification-throughput.mjs" "scripts/run-focused-acceptance.mjs"
                     "scripts/run-browser-observation.mjs" "test/support/headless-chrome.mjs"
                     "test/side-panel-component-layout-runtime-test.mjs"])}))

(defn- assert-pack-fields! [registry]
  (doseq [pack registry
          key [:source :dependencies :unit :property :features :handlers
               :browserAdapters :browserAdapterModes]]
    (support/assert! (vector? (get pack key)) "Verification pack field is not a vector."
                     {:pack (:id pack) :field key})))

(defn- assert-adapter-classifications! [registry]
  (doseq [pack registry]
    (let [pack-adapters (set (:browserAdapters pack))
          classifications (:browserAdapterModes pack)]
      (support/assert! (and (= (count pack-adapters) (count classifications))
                            (= pack-adapters (set (map :path classifications))))
                       "Browser adapters are not classified exactly once." {:pack (:id pack)})
      (support/assert! (every? #(browser-adapter-modes (:mode %)) classifications)
                       "Browser adapter mode is invalid." {:pack (:id pack)}))))

(defn- assert-registered-paths! [root registry]
  (doseq [path (mapcat #(mapcat % registry)
                       [#(:unit %) #(:property %) #(:features %) #(:handlers %) #(:browserAdapters %)])]
    (support/assert! (fs/exists? (fs/path root path)) "Verification pack path is missing."
                     {:path path})))

(defn- assert-shared-adapters! [root registry adapter-classifications]
  (doseq [adapter (filter #(= "shared" (adapter-classifications %))
                          (mapcat :browserAdapters registry))]
    (support/assert! (str/includes? (support/source-file root adapter) "shared-harness")
                     "Browser adapter does not use the shared harness." {:adapter adapter})))

(defn- assert-source-signals! [sources]
  (support/assert! (support/includes-all? (sources "src/utility-registry.ts")
                                         ["commandPaletteUtility" "hotkeysUtility"
                                          "dataLayerUtility" "composeUtilityShell"])
                   "Shell composition does not use all public utility entries." {})
  (support/assert! (and (str/includes? (sources "src/side-panel.ts") "extensionShell")
                        (not (str/includes? (sources "acceptance/src/acceptance/generator.clj")
                                            "acceptance.steps.all :as steps")))
                   "Production shell or generated acceptance wiring is not modular." {})
  (doseq [[path signals message]
          [["scripts/verification-packs.mjs"
            ["runtimeInputs" "verificationHelpers" "browserTargetIds" "sessionBatch"
             "browserAdapterPerformance" "impactBoundaries"]
            "Verification planning lacks precise consumer or browser-target boundaries."]
           ["scripts/report-verification-throughput.mjs"
            ["representative-change" "rejectedByReason" "checkVerificationPerformanceBudgets"
             "refreshVerificationPerformanceBudgets" "browserTargets"
             "defaultBrowserTargetMilliseconds" "boundedStageMilliseconds"
             "composed target samples" "bootstrap fallback"]
            "Verification throughput lacks complete rows or budget diagnostics."]
           ["scripts/run-focused-acceptance.mjs"
            ["checkpointPreflight" "resumeVerificationPlan"
             "SWARMFORGE_VERIFICATION_OUTPUT_DIRECTORY" "provenance:\"fresh\""]
            "Checkpoint preflight, resume, or isolated output routing is incomplete."]
           ["scripts/run-browser-observation.mjs"
            ["SWARMFORGE_BROWSER_TARGET_IDS" "SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS"
             "parseBrowserObservationBatchOutput" "completeBrowserObservationOutput"
             "swarmforgeBrowserTargetResult" "partialDocument"]
            "Browser observation batching loses isolation or independent evidence."]
           ["test/support/headless-chrome.mjs"
            ["removeChromeProfile" "EBUSY" "ENOTEMPTY" "targetId" "profile"]
            "Chrome profile cleanup lacks bounded contention diagnostics."]
           ["test/side-panel-component-layout-runtime-test.mjs"
            ["SWARMFORGE_BROWSER_TARGET_IDS" "SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS"
             "Storage.clearDataForOrigin" "swarmforgeBrowserTargetResult"
             "swarmforgeBrowserTargetTiming"]
            "The shared browser program does not isolate or time logical targets."]]]
    (support/assert! (support/includes-all? (sources path) signals) message {})))

(defn- assert-owning-pack-batches! [registry]
  (doseq [[pack-id expected-count] {"capture" 5 "schemas" 46 "defects" 9}]
    (let [pack (first (filter #(= pack-id (:id %)) registry))
          program "test/side-panel-component-layout-runtime-test.mjs"
          observations (filter #(= program (:path %)) (:browserObservations pack))
          batches (filter #(= program (:path %)) (:browserObservationBatches pack))]
      (support/assert! (and (= expected-count (count observations))
                            (= 1 (count batches))
                            (= expected-count (:observationCount (first batches))))
                       "Shared side-panel observations do not form one exact owning-pack batch."
                       {:pack pack-id :expected expected-count}))))

(defn- assert-browser-batching! [registry]
  (let [batched-observations (filter :sessionBatch (mapcat :browserObservations registry))
        observation-batches (mapcat :browserObservationBatches registry)]
    (support/assert! (and (seq batched-observations)
                          (some #(>= (count %) 2)
                                (vals (group-by (juxt :path :sessionBatch) batched-observations))))
                     "No compatible browser observations share a declared session batch." {})
    (support/assert! (seq (mapcat :browserAdapterPerformance registry))
                     "No slow browser adapter declares independently selectable targets." {})
    (support/assert! (= 3 (count (filter #(= "test/side-panel-component-layout-runtime-test.mjs"
                                             (:path %)) observation-batches)))
                     "Shared side-panel program batches are incomplete." {})
    (assert-owning-pack-batches! registry)))

(defn- assert-runtime-boundaries! [root registry]
  (doseq [pack registry input (:runtimeInputs pack)]
    (support/assert! (fs/exists? (fs/path root input))
                     "Runtime consumer input is missing." {:pack (:id pack) :path input}))
  (doseq [pack registry helper (:verificationHelpers pack)]
    (support/assert! (and (fs/exists? (fs/path root (:path helper)))
                          (seq (:consumers helper)))
                     "Verification helper declaration is incomplete."
                     {:pack (:id pack) :path (:path helper)})))

(defn- inspect-repository! [{:keys [root registry adapter-classifications sources]}]
  (support/assert! (enough-verification-packs? registry) "Too few verification packs are registered." {})
  (assert-pack-fields! registry)
  (assert-adapter-classifications! registry)
  (assert-registered-paths! root registry)
  (assert-shared-adapters! root registry adapter-classifications)
  (assert-source-signals! sources)
  (assert-browser-batching! registry)
  (assert-runtime-boundaries! root registry))

(defn- inspect! [world]
  (if (:modular/inspected world)
    world
    (let [{:keys [registry adapter-classifications] :as context} (inspection-context)]
      (inspect-repository! context)
      (assoc world :modular/inspected true
             :modular/registry registry
             :modular/browser-adapter-modes adapter-classifications))))

(def handlers
  [{:pattern #"^a bounded verification stage has (.+) and worker limit (.+)$"
    :handler (fn [world example captures]
               (apply bounded-stage-world world (example-values example captures)))}
   {:pattern #"^the timing ledger offers (.+) for a browser-observation task$"
    :handler (fn [world example captures]
               (apply timing-world world (example-values example captures)))}
   {:pattern #"^a verification plan contains (.+)$"
    :handler (fn [world _example _captures] (verify-throughput! world))}
   {:pattern #"^(.+) has corrected estimate (.+) and budget (.+)$"
    :handler (fn [world example captures]
               (apply budget-world world (example-values example captures)))}
   {:pattern #"^the stage estimate is (.+)$"
    :handler (fn [world example captures]
               (assert-seconds! world (first (example-values example captures))
                                :throughput/expected-seconds))}
   {:pattern #"^the task estimate is (.+)$"
    :handler (fn [world example captures]
               (assert-seconds! world (first (example-values example captures))
                                #(get-in % [:throughput/timing :seconds])))}
   {:pattern #"^its reported timing source is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (get-in world [:throughput/timing :source])))}
   {:pattern #"^the row result is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:throughput/budget-result world)))}
   {:pattern #"^.*$"
    :handler (fn [world _example _captures] (inspect! world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-06T16:25:31.78898073+02:00", :module-hash "-835458503", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-485998160"} {:id "defn-/enough-verification-packs?", :kind "defn-", :line 7, :end-line 8, :hash "380845414"} {:id "def/browser-adapter-modes", :kind "def", :line 10, :end-line 11, :hash "-1768145777"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "-951894673"} {:id "form/4/declare", :kind "declare", :line 13, :end-line 13, :hash "470981416"} {:id "defn-/verify-throughput!", :kind "defn-", :line 15, :end-line 23, :hash "-675172632"} {:id "defn-/parse-seconds", :kind "defn-", :line 25, :end-line 27, :hash "-309137656"} {:id "defn-/bounded-worker-load", :kind "defn-", :line 29, :end-line 35, :hash "-2029624008"} {:id "defn-/parse-task-durations", :kind "defn-", :line 37, :end-line 46, :hash "1259277085"} {:id "defn-/bounded-stage-world", :kind "defn-", :line 48, :end-line 55, :hash "-1428085136"} {:id "defn-/timing-evidence", :kind "defn-", :line 57, :end-line 88, :hash "528684167"} {:id "defn-/timing-world", :kind "defn-", :line 90, :end-line 94, :hash "1314606518"} {:id "def/report-row-estimates", :kind "def", :line 96, :end-line 98, :hash "-1582722125"} {:id "defn-/budget-world", :kind "defn-", :line 100, :end-line 110, :hash "78919961"} {:id "defn-/assert-seconds!", :kind "defn-", :line 112, :end-line 117, :hash "726379898"} {:id "defn-/assert-value!", :kind "defn-", :line 119, :end-line 123, :hash "356760800"} {:id "defn-/example-values", :kind "defn-", :line 125, :end-line 127, :hash "613161209"} {:id "defn-/classified-browser-adapters", :kind "defn-", :line 129, :end-line 132, :hash "1447896627"} {:id "defn-/inspection-context", :kind "defn-", :line 134, :end-line 145, :hash "-958601117"} {:id "defn-/assert-pack-fields!", :kind "defn-", :line 147, :end-line 152, :hash "-687209790"} {:id "defn-/assert-adapter-classifications!", :kind "defn-", :line 154, :end-line 162, :hash "1283499675"} {:id "defn-/assert-registered-paths!", :kind "defn-", :line 164, :end-line 168, :hash "-1045887639"} {:id "defn-/assert-shared-adapters!", :kind "defn-", :line 170, :end-line 174, :hash "1959980324"} {:id "defn-/assert-source-signals!", :kind "defn-", :line 176, :end-line 213, :hash "1724230972"} {:id "defn-/assert-owning-pack-batches!", :kind "defn-", :line 215, :end-line 225, :hash "791393763"} {:id "defn-/assert-browser-batching!", :kind "defn-", :line 227, :end-line 239, :hash "-2051603484"} {:id "defn-/assert-runtime-boundaries!", :kind "defn-", :line 241, :end-line 249, :hash "767574382"} {:id "defn-/inspect-repository!", :kind "defn-", :line 251, :end-line 259, :hash "-552939158"} {:id "defn-/inspect!", :kind "defn-", :line 261, :end-line 268, :hash "661987012"} {:id "def/handlers", :kind "def", :line 270, :end-line 299, :hash "142256401"}]}
;; clj-mutate-manifest-end
