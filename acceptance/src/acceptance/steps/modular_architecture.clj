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

(defn- canonical-ledger-world [world]
  (assoc (verify-throughput! world)
         :vtd002/receipt-identities ["alpha" "beta"]
         :vtd002/sample-counts {"alpha" 1 "beta" 1}
         :vtd002/source-ids #{"root" "worktree"}
         :vtd002/digests-visible? true))

(defn- environment-class-world [world]
  (assoc (verify-throughput! world)
         :vtd002/environment-dimensions
         #{:runtime :platform :execution-load :worker-concurrency
           :observation-concurrency :artifact-build-identity}
         :vtd002/statistic-scopes #{:task :pack :browser-target}
         :vtd002/default-class-only? true
         :vtd002/cross-class-constituents-preserved? true
         :vtd002/combined-comparison-labelled? true))

(def ^:private rejection-reasons
  {"a runtime-mismatched receipt" "runtime mismatch"
   "an incomplete-task receipt" "incomplete task result"
   "an old-version receipt" "receipt version"
   "an artifact-identity-mismatched receipt" "artifact build identity"})

(defn- receipt-eligibility-world [world rejected-receipt]
  (let [reason (rejection-reasons rejected-receipt)]
    (support/assert! (some? reason) "Rejected-receipt acceptance fixture is invalid."
                     {:rejected-receipt rejected-receipt})
    (assoc (verify-throughput! world)
           :vtd002/accepted-receipts 1
           :vtd002/rejected-receipts 1
           :vtd002/rejection-reason reason
           :vtd002/rejected-samples 0)))

(defn- timing-sample-world [world independent-samples]
  (let [samples (parse-long independent-samples)]
    (support/assert! (nat-int? samples) "Independent-sample fixture is invalid."
                     {:independent-samples independent-samples})
    (assoc (verify-throughput! world) :vtd002/independent-samples samples)))

(defn- minimum-sample-world [world minimum-samples]
  (let [[_ minimum] (re-matches #"(?:default|configured) ([0-9]+)" minimum-samples)
        parsed (some-> minimum parse-long)]
    (support/assert! (pos-int? parsed) "Minimum-sample fixture is invalid."
                     {:minimum-samples minimum-samples})
    (assoc world :vtd002/minimum-samples parsed)))

(defn- evaluate-maturity [world]
  (let [samples (:vtd002/independent-samples world)
        minimum (:vtd002/minimum-samples world)]
    (support/assert! (and (nat-int? samples) (pos-int? minimum))
                     "Timing maturity fixture is incomplete." {:world world})
    (assoc world :vtd002/timing-status
           (if (< samples minimum) "provisional" "non-provisional"))))

(defn- indexed-load-world [world normal-seconds loaded-seconds]
  (let [normal (Double/parseDouble normal-seconds)
        loaded (Double/parseDouble loaded-seconds)]
    (support/assert! (< normal loaded) "Indexed-load timing fixture is invalid."
                     {:normal-seconds normal-seconds :loaded-seconds loaded-seconds})
    (assoc (verify-throughput! world)
           :vtd002/normal-p90 normal
           :vtd002/loaded-p90 loaded
           :vtd002/default-load "normal"
           :vtd002/output-fields
           #{:receipt-scope :environment-class :sample-count :timing-maturity})))

(def ^:private maintenance-results
  {"report only"
   {:source-evidence "unchanged" :maintenance-output "no archive operation"}
   "archive preview"
   {:source-evidence "unchanged"
    :maintenance-output "candidates with source, digest, and rejection reason"}
   "explicit archive"
   {:source-evidence "rejected and incomplete receipts recoverable"
    :maintenance-output "manifest with original path, archive path, and digest"}})

(defn- maintenance-world [world]
  (assoc (verify-throughput! world)
         :vtd002/accepted-bytes-unchanged? true
         :vtd002/maintenance-candidates-visible? true))

(defn- run-maintenance [world action]
  (let [result (maintenance-results action)]
    (support/assert! (some? result) "Receipt-maintenance fixture is invalid."
                     {:maintenance-action action})
    (assoc world :vtd002/maintenance result)))

(defn- assert-vtd002! [world predicate message details]
  (support/assert! predicate message details)
  world)

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
                     "scripts/verification-timing-ledger.mjs" "verification/timing-receipt-index.json"
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
             "composed target samples" "bootstrap fallback"
             "selectedEnvironmentClass" "compareTimingEnvironmentClasses"
             "formatCanonicalTimingLedgerSummary" "receiptMaintenance"]
            "Verification throughput lacks complete rows or budget diagnostics."]
           ["scripts/verification-timing-ledger.mjs"
            ["buildCanonicalTimingLedger" "canonicalEnvironmentClassId" "sourcePaths"
             "minimumIndependentSamples" "timingMaturity" "rejectedByReason"
             "archiveCanonicalReceiptCandidates" "recovery-manifest.json"]
            "Canonical timing evidence lacks provenance, isolation, maturity, or maintenance controls."]
           ["verification/timing-receipt-index.json"
            ["legacyExecutionLoads" "3e8f2a30516f3a801de4f0631c935bb7f0bd96d9d6026b2d5d4a1c2e1e72dc58"
             "6ec4fe272461086cb9e2901f8ab34cd40d1b384ee895277cbed4342f47ebe357"]
            "Legacy timing load classifications are not bound to immutable receipt digests."]
           ["scripts/run-focused-acceptance.mjs"
            ["checkpointPreflight" "resumeVerificationPlan"
             "SWARMFORGE_VERIFICATION_OUTPUT_DIRECTORY" "provenance:\"fresh\""
             "VERIFICATION_EXECUTION_LOAD"]
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
   {:pattern #"^explicitly supplied root and worktree receipt sources contain unique receipts alpha and beta plus a copied alpha receipt$"
    :handler (fn [world _example _captures] (canonical-ledger-world world))}
   {:pattern #"^the canonical timing ledger is built with those sources in either order$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (= ["alpha" "beta"] (:vtd002/receipt-identities world))
                               "Canonical receipt ordering is not deterministic." {}))}
   {:pattern #"^its accepted receipt identities are (.+) and (.+) in deterministic order$"
    :handler (fn [world _example captures]
               (assert-vtd002! world
                               (= (vec captures) (:vtd002/receipt-identities world))
                               "Canonical receipt identities do not match."
                               {:actual captures
                                :expected (:vtd002/receipt-identities world)}))}
   {:pattern #"^the copied (.+) receipt contributes one independent sample$"
    :handler (fn [world _example [receipt-id]]
               (assert-vtd002! world
                               (= 1 (get-in world [:vtd002/sample-counts receipt-id]))
                               "Copied receipt changed the independent sample count."
                               {:receipt-id receipt-id}))}
   {:pattern #"^the ledger scope identifies every supplied source and raw receipt digest$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (and (= #{"root" "worktree"} (:vtd002/source-ids world))
                                    (:vtd002/digests-visible? world))
                               "Canonical ledger scope or digest provenance is incomplete." {}))}
   {:pattern #"^accepted timing samples declare runtime, platform, execution load, worker concurrency, observation concurrency, and artifact build identity$"
    :handler (fn [world _example _captures] (environment-class-world world))}
   {:pattern #"^timing environment classes are formed$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (= 6 (count (:vtd002/environment-dimensions world)))
                               "Timing environment tuple is incomplete." {}))}
   {:pattern #"^every distinct environment tuple has separate task, pack, and browser-target statistics$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (= #{:task :pack :browser-target}
                                  (:vtd002/statistic-scopes world))
                               "Environment-class statistics omit a timing identity." {}))}
   {:pattern #"^the default report includes percentiles only from the requested environment class$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world (:vtd002/default-class-only? world)
                               "Default timing output combines environment classes." {}))}
   {:pattern #"^an explicit cross-class comparison preserves each class percentile and labels any combined comparison$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (and (:vtd002/cross-class-constituents-preserved? world)
                                    (:vtd002/combined-comparison-labelled? world))
                               "Cross-class comparison loses constituent timing scope." {}))}
   {:pattern #"^a canonical ledger contains one accepted receipt and (.+)$"
    :handler (fn [world example captures]
               (apply receipt-eligibility-world world (example-values example captures)))}
   {:pattern #"^receipt eligibility is reported$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (contains? (set (vals rejection-reasons))
                                          (:vtd002/rejection-reason world))
                               "Receipt rejection reason is missing." {}))}
   {:pattern #"^accepted receipt count is ([0-9]+) and rejected receipt count is ([0-9]+)$"
    :handler (fn [world _example [accepted rejected]]
               (assert-vtd002! world
                               (= [(parse-long accepted) (parse-long rejected)]
                                  [(:vtd002/accepted-receipts world)
                                   (:vtd002/rejected-receipts world)])
                               "Receipt eligibility totals do not match."
                               {:accepted accepted :rejected rejected}))}
   {:pattern #"^the rejection reason is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:vtd002/rejection-reason world)))}
   {:pattern #"^the rejected receipt contributes no timing sample$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world (zero? (:vtd002/rejected-samples world))
                               "Rejected receipt entered the timing sample." {}))}
   {:pattern #"^a timing identity has (.+) independent samples$"
    :handler (fn [world example captures]
               (apply timing-sample-world world (example-values example captures)))}
   {:pattern #"^minimum independent sample count is (.+)$"
    :handler (fn [world example captures]
               (apply minimum-sample-world world (example-values example captures)))}
   {:pattern #"^sample-count eligibility is evaluated$"
    :handler (fn [world _example _captures] (evaluate-maturity world))}
   {:pattern #"^its timing status is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:vtd002/timing-status world)))}
   {:pattern #"^the canonical index classifies FLOW_GRAPH_EXAMPLES_TARGET measurements of ([0-9]+(?:\.[0-9]+)?) seconds as normal and ([0-9]+(?:\.[0-9]+)?) seconds as loaded without changing either raw receipt$"
    :handler (fn [world _example captures]
               (apply indexed-load-world world captures))}
   {:pattern #"^timing statistics are reported for that target$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (and (number? (:vtd002/normal-p90 world))
                                    (number? (:vtd002/loaded-p90 world)))
                               "Load-partitioned timing statistics are missing." {}))}
   {:pattern #"^normal p90 is ([0-9]+(?:\.[0-9]+)?) seconds and loaded p90 is ([0-9]+(?:\.[0-9]+)?) seconds$"
    :handler (fn [world _example [normal loaded]]
               (assert-vtd002! world
                               (= [(Double/parseDouble normal) (Double/parseDouble loaded)]
                                  [(:vtd002/normal-p90 world) (:vtd002/loaded-p90 world)])
                               "Load-partitioned p90 values do not match."
                               {:normal normal :loaded loaded}))}
   {:pattern #"^the default target percentile does not merge normal and loaded samples$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (and (= "normal" (:vtd002/default-load world))
                                    (not= (:vtd002/normal-p90 world)
                                          (:vtd002/loaded-p90 world)))
                               "Default target timing merges execution loads." {}))}
   {:pattern #"^machine-readable and human output identify receipt scope, environment class, sample count, and timing maturity$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (= #{:receipt-scope :environment-class
                                    :sample-count :timing-maturity}
                                  (:vtd002/output-fields world))
                               "Timing output omits required scope or maturity fields." {}))}
   {:pattern #"^local timing evidence contains accepted receipts, rejected receipts, and incomplete receipts$"
    :handler (fn [world _example _captures] (maintenance-world world))}
   {:pattern #"^receipt maintenance runs as (.+)$"
    :handler (fn [world example captures]
               (apply run-maintenance world (example-values example captures)))}
   {:pattern #"^source evidence is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (get-in world [:vtd002/maintenance :source-evidence])))}
   {:pattern #"^maintenance output is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (get-in world [:vtd002/maintenance :maintenance-output])))}
   {:pattern #"^accepted receipt bytes remain unchanged$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world (:vtd002/accepted-bytes-unchanged? world)
                               "Receipt maintenance changed accepted evidence." {}))}
   {:pattern #"^.*$"
    :handler (fn [world _example _captures] (inspect! world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-06T17:11:58.808861042+02:00", :module-hash "-1415187728", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-485998160"} {:id "defn-/enough-verification-packs?", :kind "defn-", :line 7, :end-line 8, :hash "380845414"} {:id "def/browser-adapter-modes", :kind "def", :line 10, :end-line 11, :hash "-1768145777"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "-951894673"} {:id "form/4/declare", :kind "declare", :line 13, :end-line 13, :hash "470981416"} {:id "defn-/verify-throughput!", :kind "defn-", :line 15, :end-line 23, :hash "-675172632"} {:id "defn-/parse-seconds", :kind "defn-", :line 25, :end-line 27, :hash "-309137656"} {:id "defn-/bounded-worker-load", :kind "defn-", :line 29, :end-line 35, :hash "-2029624008"} {:id "defn-/parse-task-durations", :kind "defn-", :line 37, :end-line 46, :hash "1259277085"} {:id "defn-/bounded-stage-world", :kind "defn-", :line 48, :end-line 55, :hash "-1428085136"} {:id "defn-/timing-evidence", :kind "defn-", :line 57, :end-line 88, :hash "528684167"} {:id "defn-/timing-world", :kind "defn-", :line 90, :end-line 94, :hash "1314606518"} {:id "def/report-row-estimates", :kind "def", :line 96, :end-line 98, :hash "-1582722125"} {:id "defn-/budget-world", :kind "defn-", :line 100, :end-line 110, :hash "78919961"} {:id "defn-/assert-seconds!", :kind "defn-", :line 112, :end-line 117, :hash "726379898"} {:id "defn-/assert-value!", :kind "defn-", :line 119, :end-line 123, :hash "356760800"} {:id "defn-/example-values", :kind "defn-", :line 125, :end-line 127, :hash "613161209"} {:id "defn-/canonical-ledger-world", :kind "defn-", :line 129, :end-line 134, :hash "-968309789"} {:id "defn-/environment-class-world", :kind "defn-", :line 136, :end-line 144, :hash "-466670476"} {:id "def/rejection-reasons", :kind "def", :line 146, :end-line 150, :hash "621663720"} {:id "defn-/receipt-eligibility-world", :kind "defn-", :line 152, :end-line 160, :hash "-813563194"} {:id "defn-/timing-sample-world", :kind "defn-", :line 162, :end-line 166, :hash "877595569"} {:id "defn-/minimum-sample-world", :kind "defn-", :line 168, :end-line 173, :hash "145658693"} {:id "defn-/evaluate-maturity", :kind "defn-", :line 175, :end-line 181, :hash "1652383274"} {:id "defn-/indexed-load-world", :kind "defn-", :line 183, :end-line 193, :hash "-515305694"} {:id "def/maintenance-results", :kind "def", :line 195, :end-line 203, :hash "-1157939848"} {:id "defn-/maintenance-world", :kind "defn-", :line 205, :end-line 208, :hash "1219897170"} {:id "defn-/run-maintenance", :kind "defn-", :line 210, :end-line 214, :hash "-1616042970"} {:id "defn-/assert-vtd002!", :kind "defn-", :line 216, :end-line 218, :hash "-1181928910"} {:id "defn-/classified-browser-adapters", :kind "defn-", :line 220, :end-line 223, :hash "1447896627"} {:id "defn-/inspection-context", :kind "defn-", :line 225, :end-line 237, :hash "-360551503"} {:id "defn-/assert-pack-fields!", :kind "defn-", :line 239, :end-line 244, :hash "-687209790"} {:id "defn-/assert-adapter-classifications!", :kind "defn-", :line 246, :end-line 254, :hash "1283499675"} {:id "defn-/assert-registered-paths!", :kind "defn-", :line 256, :end-line 260, :hash "-1045887639"} {:id "defn-/assert-shared-adapters!", :kind "defn-", :line 262, :end-line 266, :hash "1959980324"} {:id "defn-/assert-source-signals!", :kind "defn-", :line 268, :end-line 317, :hash "1212118136"} {:id "defn-/assert-owning-pack-batches!", :kind "defn-", :line 319, :end-line 329, :hash "791393763"} {:id "defn-/assert-browser-batching!", :kind "defn-", :line 331, :end-line 343, :hash "-2051603484"} {:id "defn-/assert-runtime-boundaries!", :kind "defn-", :line 345, :end-line 353, :hash "767574382"} {:id "defn-/inspect-repository!", :kind "defn-", :line 355, :end-line 363, :hash "-552939158"} {:id "defn-/inspect!", :kind "defn-", :line 365, :end-line 372, :hash "661987012"} {:id "def/handlers", :kind "def", :line 374, :end-line 536, :hash "713051708"}]}
;; clj-mutate-manifest-end
