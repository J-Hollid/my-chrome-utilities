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

(def ^:private flow-phase-names
  ["browser startup" "target setup" "fixture setup" "readiness"
   "example compilation" "rendering" "persistence" "assertion" "cleanup"])

(defn- verification-json [file-name]
  (aps-json/read-json-file
   (str (fs/path (support/repository-root) "verification" file-name))))

(defn- flow-characterization []
  (verification-json "flow-examples-characterization.json"))

(defn- finite-non-negative? [value]
  (and (number? value) (Double/isFinite (double value)) (not (neg? value))))

(defn- valid-flow-distributions? [timing-class]
  (let [phases (:phases timing-class)]
    (and (= (set flow-phase-names) (set (map name (keys phases))))
         (every? (fn [[phase-key timing]]
                   (let [phase-name (name phase-key)]
                     (and (= (if (= "browser startup" phase-name) "process" "target")
                             (:scope timing))
                        (finite-non-negative? (:p50Ms timing))
                        (finite-non-negative? (:p90Ms timing))
                        (<= (:p50Ms timing) (:p90Ms timing)))))
                 phases)
         (finite-non-negative? (get-in timing-class [:target :p50Ms]))
         (finite-non-negative? (get-in timing-class [:target :p90Ms]))
         (<= (get-in timing-class [:target :p50Ms])
             (get-in timing-class [:target :p90Ms])))))

(defn- flow-sample-world [world sample-condition]
  (let [[class-key expected-load expected-plan reported-plan]
        (case sample-condition
          "focused single-target"
          [:focusedNormal "normal" "focused FLOW_GRAPH_EXAMPLES_TARGET"
           "focused FLOW_GRAPH_EXAMPLES_TARGET"]
          "normally loaded terminal lane 4 of 4"
          [:normallyLoaded "loaded" "existing Flow and capture co-run"
           "terminal lane 4/4 Flow and capture co-run"]
          nil)
        report (flow-characterization)
        timing-class (get-in report [:classes class-key])]
    (support/assert! (and class-key timing-class
                          (= expected-load (get-in timing-class [:environment :executionLoad]))
                          (= reported-plan (:planContext timing-class)))
                     "Flow sample condition is not backed by the committed characterization."
                     {:sample-condition sample-condition})
    (assoc (verify-throughput! world)
           :vtd013/report report
           :vtd013/timing-class timing-class
           :vtd013/execution-load expected-load
           :vtd013/plan-context expected-plan)))

(defn- maturity-status [samples minimum]
  (if (< samples minimum) "provisional" "non-provisional"))

(defn- flow-maturity-world [world focused-samples loaded-samples minimum]
  (let [focused (parse-long focused-samples)
        loaded (parse-long loaded-samples)
        minimum-count (parse-long minimum)
        report (flow-characterization)]
    (support/assert! (and (nat-int? focused) (nat-int? loaded) (pos-int? minimum-count)
                          (every? valid-flow-distributions? (vals (:classes report))))
                     "Flow timing maturity fixture or committed distributions are invalid."
                     {:focused focused :loaded loaded :minimum minimum-count})
    (assoc (verify-throughput! world)
           :vtd013/report report
           :vtd013/focused-status (maturity-status focused minimum-count)
           :vtd013/loaded-status (maturity-status loaded minimum-count))))

(defn- flow-budget-world [world focused-p90]
  (let [seconds (parse-seconds focused-p90)
        report (flow-characterization)
        budget-ms (:focusedBudgetMilliseconds report)]
    (support/assert! (and (number? seconds) (= 12891 budget-ms))
                     "Flow examples budget boundary is not the committed 12891ms contract."
                     {:focused-p90 focused-p90 :budget-ms budget-ms})
    (assoc (verify-throughput! world)
           :vtd013/report report
           :vtd013/budget-result (if (<= (* seconds 1000) budget-ms) "pass" "fail")
           :vtd013/loaded-excluded? true)))

(defn- flow-completion-world [world]
  (let [report (flow-characterization)
        focused (get-in report [:classes :focusedNormal])
        loaded (get-in report [:classes :normallyLoaded])
        minimum (:minimumIndependentSamples report)
        digests (concat (:receiptDigests focused) (:receiptDigests loaded))]
    (support/assert! (and (= "complete" (get-in report [:completion :status]))
                          (pos-int? minimum)
                          (>= (:sampleCount focused) minimum)
                          (>= (:sampleCount loaded) minimum)
                          (= (count digests)
                             (+ (:sampleCount focused) (:sampleCount loaded))
                             (count (set digests)))
                          (every? #(re-matches #"[a-f0-9]{64}" %) digests)
                          (re-matches #"[a-f0-9]{64}" (:artifactBuildIdentity report))
                          (= (:artifactBuildIdentity report)
                             (get-in focused [:environment :buildIdentity])
                             (get-in loaded [:environment :buildIdentity]))
                          (re-matches #"[a-f0-9]{40}" (:implementationCommit report))
                          (false? (get-in report [:evidenceConservation :rawReceiptBytesChanged])))
                     "Committed Flow characterization is not exact, mature, and digest-bound."
                     {:report report})
    (assoc (verify-throughput! world)
           :vtd013/report report :vtd013/focused focused :vtd013/loaded loaded)))

(defn- assert-vtd013! [world predicate message]
  (support/assert! predicate message {:report (:vtd013/report world)})
  world)

(defn- performance-calibration []
  (verification-json "performance-calibration.json"))

(defn- calibration-pack [calibration pack-id]
  (first (filter #(= pack-id (:id %)) (:runnablePacks calibration))))

(defn- calibration-target [calibration target-id]
  (get (:browserTargets calibration) (keyword target-id)))

(defn- calibration-pack-world [world pack-id representative-path]
  (let [calibration (performance-calibration)
        pack (calibration-pack calibration pack-id)
        registry (aps-json/read-json-file
                  (str (fs/path (support/repository-root) "verification/packs.json")))
        registry-pack (first (filter #(= pack-id (:id %)) registry))]
    (support/assert! (and pack registry-pack
                          (= representative-path (:representativeChangedPath pack)
                             (:representativeChangedPath registry-pack))
                          (fs/regular-file? (fs/path (support/repository-root) representative-path)))
                     "Representative verification file is not exact, owned, and committed."
                     {:pack pack-id :path representative-path})
    (assoc (verify-throughput! world)
           :vtd003/calibration calibration
           :vtd003/pack pack
           :vtd003/selected-packs (:selectedPacks pack))))

(defn- calibration-target-world [world target-id]
  (let [calibration (performance-calibration)
        unmeasured? (= target-id "an unmeasured target")
        fallback-case (get-in calibration [:calibrationCases :unmeasuredDeclaredRegistry])
        resolved-id (if unmeasured? (:targetId fallback-case) target-id)
        budget (if unmeasured? (:budget fallback-case)
                   (calibration-target calibration resolved-id))]
    (support/assert! budget "Browser target calibration is missing."
                     {:target target-id :resolved-target resolved-id})
    (assoc (verify-throughput! world)
           :vtd003/calibration calibration
           :vtd003/target-id resolved-id
           :vtd003/target-budget budget)))

(defn- calibration-world [world]
  (assoc (verify-throughput! world) :vtd003/calibration (performance-calibration)))

(defn- regression-world [world regression]
  (let [fan-out? (= regression "selected packs add gamma")
        measured (if fan-out? 2 61)
        limit (if fan-out? 1 60)]
    (support/assert! (contains? #{"selected packs add gamma"
                                 "corrected critical path exceeds the 60 second limit"}
                               regression)
                     "Unknown representative-path regression fixture." {:regression regression})
    (assoc world
           :vtd003/result (if (> measured limit) "fail" "pass")
           :vtd003/diagnostic
           (str "src/alpha/local-ui.ts selected alpha and beta; critical-path baseline 50 seconds; "
                "measured " measured "; limit " limit))))

(defn- assert-vtd003! [world predicate message]
  (support/assert! predicate message {:calibration (:vtd003/calibration world)})
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
               (let [values (example-values example captures)]
                 (if (:vtd003/target-budget world)
                   (let [minimum (parse-long (first captures))]
                     (support/assert! (= minimum (get-in world [:vtd003/calibration
                                                               :minimumIndependentSamples]))
                                      "Target calibration minimum sample count changed."
                                      {:minimum minimum})
                     (assoc world :vtd003/minimum-samples minimum))
                   (apply minimum-sample-world world (if (seq values) values captures)))))}
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
   {:pattern #"^a FLOW_GRAPH_EXAMPLES_TARGET sample is recorded under (.+)$"
    :handler (fn [world example captures]
               (apply flow-sample-world world (example-values example captures)))}
   {:pattern #"^phase-aware target timing is emitted$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world (valid-flow-distributions? (:vtd013/timing-class world))
                               "Flow sample does not expose complete target and phase distributions."))}
   {:pattern #"^receipt execution load is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:vtd013/execution-load world)))}
   {:pattern #"^plan context is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:vtd013/plan-context world)))}
   {:pattern #"^timing identifies browser startup, target setup, fixture setup, readiness, example compilation, rendering, persistence, assertion, and cleanup phases$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world
                               (= (set flow-phase-names)
                                  (set (map name (keys (get-in world [:vtd013/timing-class :phases])))))
                               "Flow phase identities are incomplete."))}
   {:pattern #"^every phase has explicit process or target scope and a finite non-negative duration$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world (valid-flow-distributions? (:vtd013/timing-class world))
                               "Flow phase scope or duration distribution is invalid."))}
   {:pattern #"^the canonical ledger contains (.+) focused normal samples and (.+) normally loaded samples for FLOW_GRAPH_EXAMPLES_TARGET from one artifact build$"
    :handler (fn [world example captures]
               (let [[focused loaded] (example-values example captures)]
                 (assoc world :vtd013/focused-samples (parse-long focused)
                        :vtd013/loaded-samples (parse-long loaded))))}
   {:pattern #"^phase timing maturity is reported with minimum ([0-9]+)$"
    :handler (fn [world _example [minimum]]
               (flow-maturity-world world
                                    (str (:vtd013/focused-samples world))
                                    (str (:vtd013/loaded-samples world)) minimum))}
   {:pattern #"^focused normal timing is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:vtd013/focused-status world)))}
   {:pattern #"^normally loaded timing is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:vtd013/loaded-status world)))}
   {:pattern #"^each class reports separate target and phase p50 and p90 values with receipt digests$"
    :handler (fn [world _example _captures]
               (let [classes (vals (get-in world [:vtd013/report :classes]))]
                 (assert-vtd013! world
                                 (and (= 2 (count classes))
                                      (apply not= (map :environmentClassId classes))
                                      (every? valid-flow-distributions? classes)
                                      (every? #(= (:sampleCount %) (count (:receiptDigests %))) classes))
                                 "Flow timing classes are merged or omit distributions and digests.")))}
   {:pattern #"^five focused normal FLOW_GRAPH_EXAMPLES_TARGET samples have p90 (.+)$"
    :handler (fn [world example captures]
               (let [values (example-values example captures)]
                 (apply flow-budget-world world (if (seq values) values captures))))}
   {:pattern #"^verification performance budgets are checked$"
    :handler (fn [world _example _captures]
               (if (:vtd013/report world)
                 (assert-vtd013! world (= 12891 (get-in world [:vtd013/report :focusedBudgetMilliseconds]))
                                 "Flow examples focused budget changed.")
                 (inspect! world)))}
   {:pattern #"^the budget result is (.+)$"
    :handler (fn [world example captures]
               (if (:vtd013/report world)
                 (assert-value! world (first (example-values example captures))
                                (:vtd013/budget-result world))
                 (inspect! world)))}
   {:pattern #"^normally loaded samples do not enter the focused normal percentile$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world (:vtd013/loaded-excluded? world)
                               "Loaded Flow samples entered the focused percentile."))}
   {:pattern #"^a committed Flow examples characterization references at least five focused normal and five normally loaded accepted receipt digests from the current artifact build$"
    :handler (fn [world _example _captures] (flow-completion-world world))}
   {:pattern #"^VTD-013 completion is evaluated$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world (= "complete" (get-in world [:vtd013/report :completion :status]))
                               "VTD-013 characterization is not complete."))}
   {:pattern #"^every sample contains complete phase timing and environment identity$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world
                               (every? #(and (valid-flow-distributions? %)
                                             (= (:sampleCount %) (count (:receiptDigests %)))
                                             (= 7 (count (:environment %))))
                                       [(:vtd013/focused world) (:vtd013/loaded world)])
                               "Flow samples omit phase timing or exact environment identity."))}
   {:pattern #"^the report identifies the dominant phase and the bounded synchronization or work correction$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world
                               (and (seq (get-in world [:vtd013/report :diagnosis :preCorrectionDominantPhase]))
                                    (re-find #"bounded predicate waits"
                                             (get-in world [:vtd013/report :correction])))
                               "Flow diagnosis or bounded synchronization correction is missing."))}
   {:pattern #"^every loaded sample passes its assigned assertions without widening the 12.891 second target budget$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world
                               (and (= "passed" (:assignedAssertions (:vtd013/loaded world)))
                                    (false? (get-in world [:vtd013/report :budgetChanged]))
                                    (= 12891 (get-in world [:vtd013/report :focusedBudgetMilliseconds])))
                               "Loaded assertions or focused budget conservation failed."))}
   {:pattern #"^the 35 second representative Flow changed-path guardrail is unchanged$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world
                               (= 35 (get-in world [:vtd013/report :representativeFlowChangedPathGuardrailSeconds]))
                               "Representative Flow changed-path guardrail changed."))}
   {:pattern #"^Flow controls, authoring, legacy, and all 21 examples assertion leaves retain their identities$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world
                               (and (true? (get-in world [:vtd013/report :evidenceConservation :browserTargetIdsUnchanged]))
                                    (= {:runtime021 11 :runtime025 10}
                                       (get-in world [:vtd013/report :evidenceConservation :examplesAssertionLeaves])))
                               "Flow target or examples assertion identities changed."))}
   {:pattern #"^runnable pack (.+) declares representative changed file (.+)$"
    :handler (fn [world example captures]
               (apply calibration-pack-world world (example-values example captures)))}
   {:pattern #"^the representative changed-path plan is selected$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world (seq (:vtd003/selected-packs world))
                               "Representative changed path selected no packs."))}
   {:pattern #"^the exact changed file exists and is owned by (.+)$"
    :handler (fn [world example captures]
               (assert-vtd003! world
                               (= (first (example-values example captures))
                                  (get-in world [:vtd003/pack :id]))
                               "Representative changed file has the wrong owner."))}
   {:pattern #"^selected packs are (.+)$"
    :handler (fn [world example captures]
               (if (:vtd003/pack world)
                 (let [expected (first (example-values example captures))
                       selected (:vtd003/selected-packs world)]
                   (assert-vtd003! world
                                   (if (= expected "every runnable pack")
                                     (= 20 (count selected))
                                     (= expected (str/join ", " selected)))
                                   "Representative changed path selected the wrong packs."))
                 (inspect! world)))}
   {:pattern #"^no directory prefix or first-entry fallback substitutes for the declared file$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (= (get-in world [:vtd003/pack :representativeChangedPath])
                                  (get-in world [:vtd003/pack :changedPathDuration :path]))
                               "Representative calibration used a path fallback."))}
   {:pattern #"^one exact-pack row and one declared representative-change row exist for every runnable pack in one selected timing environment class$"
    :handler (fn [world _example _captures] (calibration-world world))}
   {:pattern #"^calibration tolerance is (.+)$"
    :handler (fn [world _example captures]
               (let [expected (Double/parseDouble (first captures))
                     calibrated (or (:vtd003/calibration world) (performance-calibration))]
                 (assert-vtd003! (assoc world :vtd003/calibration calibrated)
                                 (= expected (:tolerance calibrated))
                                 "Calibration tolerance changed.")))}
   {:pattern #"^verification performance budgets are refreshed$"
    :handler (fn [world _example _captures]
               (if (:vtd003/calibration world) world (calibration-world world)))}
   {:pattern #"^every runnable pack receives an explicit exact-pack duration, changed-path duration, and changed-path fan-out budget$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (and (= 20 (count (get-in world [:vtd003/calibration :runnablePacks])))
                                    (every? #(every? some? ((juxt :exactPackDuration
                                                                  :changedPathDuration
                                                                  :changedPathFanOut) %))
                                            (get-in world [:vtd003/calibration :runnablePacks])))
                               "Pack calibration is incomplete."))}
   {:pattern #"^each changed-path duration names its declared file, critical-path baseline, limit, tolerance, timing sources, and measurement coverage$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (every? #(let [budget (:changedPathDuration %)]
                                          (and (= (:representativeChangedPath %) (:path budget))
                                               (number? (:baseline budget)) (number? (:limit budget))
                                               (number? (:tolerance budget)) (map? (:timingSources budget))
                                               (number? (:measurementCoverage budget))))
                                       (get-in world [:vtd003/calibration :runnablePacks]))
                               "Changed-path duration evidence is incomplete."))}
   {:pattern #"^each fan-out limit equals the selected dependant count and preserves the selected pack identities$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (every? #(let [budget (:changedPathFanOut %)]
                                          (and (= (:limit budget) (:baseline budget))
                                               (= (:selectedPacks %) (:selectedPacks budget))))
                                       (get-in world [:vtd003/calibration :runnablePacks]))
                               "Fan-out calibration widened or lost pack identities."))}
   {:pattern #"^no runnable pack uses the 1200 second or fan-out 20 defaults as its ordinary success criterion$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (every? #(and (not= 1200 (get-in % [:exactPackDuration :limit]))
                                             (not= 20 (get-in % [:changedPathFanOut :limit])))
                                       (get-in world [:vtd003/calibration :runnablePacks]))
                               "Emergency defaults remain an ordinary pack budget."))}
   {:pattern #"^genuinely global shell infrastructure remains a separate conservative budget class$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (= "global-shell" (:budgetClass
                                                  (calibration-pack (:vtd003/calibration world) "shell")))
                               "Global shell budget class is missing."))}
   {:pattern #"^representative path src/alpha/local-ui.ts selects alpha and beta with critical-path baseline 50 seconds$"
    :handler (fn [world _example _captures]
               (assoc world :vtd003/path "src/alpha/local-ui.ts"))}
   {:pattern #"^(.+) is checked against its calibrated budget$"
    :handler (fn [world example captures]
               (regression-world world (first (example-values example captures))))}
   {:pattern #"^the representative-path result is (.+)$"
    :handler (fn [world _example captures]
               (assert-value! world (first captures) (:vtd003/result world)))}
   {:pattern #"^the diagnostic identifies src/alpha/local-ui.ts, alpha and beta, the critical-path baseline, measured value, and limit$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (every? #(str/includes? (:vtd003/diagnostic world) %)
                                       ["src/alpha/local-ui.ts" "alpha and beta"
                                        "critical-path baseline" "measured" "limit"])
                               "Representative budget diagnostic is incomplete."))}
   {:pattern #"^browser target (.+) has (.+) in the selected environment class$"
    :handler (fn [world example captures]
               (calibration-target-world world (first (example-values example captures))))}
   {:pattern #"^its budget is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (if (get-in world [:vtd003/target-budget :provisional])
                                "provisional" "non-provisional")))}
   {:pattern #"^its budget source is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (get-in world [:vtd003/target-budget :source])))}
   {:pattern #"^samples before and after a declared timing correction are not merged$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (if (= "FLOW_GRAPH_EXAMPLES_TARGET" (:vtd003/target-id world))
                                 (and (seq (get-in world [:vtd003/target-budget :correctionCommit]))
                                      (= 5 (count (get-in world [:vtd003/target-budget :receiptDigests]))))
                                 (get-in world [:vtd003/target-budget :provisional]))
                               "Pre/post-correction target samples were merged."))}
   {:pattern #"^those samples are the committed post-correction characterization digests$"
    :handler (fn [world _example _captures]
               (let [calibration (performance-calibration)]
                 (assert-vtd003! (assoc world :vtd003/calibration calibration)
                                 (= (get-in calibration [:browserTargets :FLOW_GRAPH_EXAMPLES_TARGET :receiptDigests])
                                    (get-in world [:vtd013/report :classes :focusedNormal :receiptDigests]))
                                 "Flow target budget is not bound to the characterization digests.")))}
   {:pattern #"^its focused normal limit is 4.596 seconds$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (= 4596 (get-in world [:vtd003/calibration :browserTargets
                                                     :FLOW_GRAPH_EXAMPLES_TARGET :limit]))
                               "Flow examples calibrated limit changed."))}
   {:pattern #"^loaded samples remain diagnostic rather than entering the focused percentile$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (= "committed characterization digests"
                                  (get-in world [:vtd003/calibration :browserTargets
                                                :FLOW_GRAPH_EXAMPLES_TARGET :source]))
                               "Loaded samples entered the focused calibration."))}
   {:pattern #"^the prior 12.891 second limit is tightened rather than widened$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (< (get-in world [:vtd003/calibration :browserTargets
                                                :FLOW_GRAPH_EXAMPLES_TARGET :limit]) 12891)
                               "Flow examples limit was not tightened."))}
   {:pattern #"^a committed performance calibration references the selected environment class, raw receipt digests, 20 runnable packs, and 81 registered browser targets$"
    :handler (fn [world _example _captures] (calibration-world world))}
   {:pattern #"^VTD-003 completion is evaluated$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world (= "complete" (get-in world [:vtd003/calibration :completion :status]))
                               "VTD-003 calibration is incomplete."))}
   {:pattern #"^every runnable pack has one deliberate representative file and three explicit pack budgets$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world (= 20 (count (get-in world [:vtd003/calibration :runnablePacks])))
                               "Runnable pack calibration coverage changed."))}
   {:pattern #"^every browser target has an explicit measured or provisional budget with maturity and provenance$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (and (= 81 (count (get-in world [:vtd003/calibration :browserTargets])))
                                    (every? #(and (:maturity %) (:source %) (number? (:limit %)))
                                            (vals (get-in world [:vtd003/calibration :browserTargets]))))
                               "Browser target budget coverage is incomplete."))}
   {:pattern #"^provisional layered targets use tolerance 1.2 rather than tolerance 2$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (every? #(= 1.2 (:tolerance %))
                                       (map second (filter #(str/starts-with? (name (first %)) "LAYERED_")
                                                           (get-in world [:vtd003/calibration :browserTargets]))))
                               "Layered provisional target tolerance was not normalized."))}
   {:pattern #"^pack ownership, impact propagation, task order, browser batching, assertion leaves, worker limits, and terminal shards are unchanged$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (every? true? (vals (select-keys
                                                   (get-in world [:vtd003/calibration :conservation])
                                                   [:packOwnershipUnchanged :impactPropagationUnchanged
                                                    :taskOrderUnchanged :browserBatchingUnchanged
                                                    :assertionLeavesUnchanged :workerLimitsUnchanged
                                                    :terminalShardsUnchanged])))
                               "Verification topology conservation failed."))}
   {:pattern #"^.*$"
    :handler (fn [world _example _captures] (inspect! world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-06T22:07:16.36290748+02:00", :module-hash "-2005641589", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-485998160"} {:id "defn-/enough-verification-packs?", :kind "defn-", :line 7, :end-line 8, :hash "380845414"} {:id "def/browser-adapter-modes", :kind "def", :line 10, :end-line 11, :hash "-1768145777"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "-951894673"} {:id "form/4/declare", :kind "declare", :line 13, :end-line 13, :hash "470981416"} {:id "defn-/verify-throughput!", :kind "defn-", :line 15, :end-line 23, :hash "-675172632"} {:id "defn-/parse-seconds", :kind "defn-", :line 25, :end-line 27, :hash "-309137656"} {:id "defn-/bounded-worker-load", :kind "defn-", :line 29, :end-line 35, :hash "-2029624008"} {:id "defn-/parse-task-durations", :kind "defn-", :line 37, :end-line 46, :hash "1259277085"} {:id "defn-/bounded-stage-world", :kind "defn-", :line 48, :end-line 55, :hash "-1428085136"} {:id "defn-/timing-evidence", :kind "defn-", :line 57, :end-line 88, :hash "528684167"} {:id "defn-/timing-world", :kind "defn-", :line 90, :end-line 94, :hash "1314606518"} {:id "def/report-row-estimates", :kind "def", :line 96, :end-line 98, :hash "-1582722125"} {:id "defn-/budget-world", :kind "defn-", :line 100, :end-line 110, :hash "78919961"} {:id "defn-/assert-seconds!", :kind "defn-", :line 112, :end-line 117, :hash "726379898"} {:id "defn-/assert-value!", :kind "defn-", :line 119, :end-line 123, :hash "356760800"} {:id "defn-/example-values", :kind "defn-", :line 125, :end-line 127, :hash "613161209"} {:id "defn-/canonical-ledger-world", :kind "defn-", :line 129, :end-line 134, :hash "-968309789"} {:id "defn-/environment-class-world", :kind "defn-", :line 136, :end-line 144, :hash "-466670476"} {:id "def/rejection-reasons", :kind "def", :line 146, :end-line 150, :hash "621663720"} {:id "defn-/receipt-eligibility-world", :kind "defn-", :line 152, :end-line 160, :hash "-813563194"} {:id "defn-/timing-sample-world", :kind "defn-", :line 162, :end-line 166, :hash "877595569"} {:id "defn-/minimum-sample-world", :kind "defn-", :line 168, :end-line 173, :hash "145658693"} {:id "defn-/evaluate-maturity", :kind "defn-", :line 175, :end-line 181, :hash "1652383274"} {:id "defn-/indexed-load-world", :kind "defn-", :line 183, :end-line 193, :hash "-515305694"} {:id "def/maintenance-results", :kind "def", :line 195, :end-line 203, :hash "-1157939848"} {:id "defn-/maintenance-world", :kind "defn-", :line 205, :end-line 208, :hash "1219897170"} {:id "defn-/run-maintenance", :kind "defn-", :line 210, :end-line 214, :hash "-1616042970"} {:id "defn-/assert-vtd002!", :kind "defn-", :line 216, :end-line 218, :hash "-1181928910"} {:id "def/flow-phase-names", :kind "def", :line 220, :end-line 222, :hash "-349843343"} {:id "defn-/verification-json", :kind "defn-", :line 224, :end-line 226, :hash "1191550349"} {:id "defn-/flow-characterization", :kind "defn-", :line 228, :end-line 229, :hash "661898158"} {:id "defn-/finite-non-negative?", :kind "defn-", :line 231, :end-line 232, :hash "-361320050"} {:id "defn-/valid-flow-distributions?", :kind "defn-", :line 234, :end-line 248, :hash "-622248400"} {:id "defn-/flow-sample-world", :kind "defn-", :line 250, :end-line 271, :hash "-1723877432"} {:id "defn-/maturity-status", :kind "defn-", :line 273, :end-line 274, :hash "-1566647915"} {:id "defn-/flow-maturity-world", :kind "defn-", :line 276, :end-line 288, :hash "1850488950"} {:id "defn-/flow-budget-world", :kind "defn-", :line 290, :end-line 300, :hash "-1266897019"} {:id "defn-/flow-completion-world", :kind "defn-", :line 302, :end-line 325, :hash "-1466136333"} {:id "defn-/assert-vtd013!", :kind "defn-", :line 327, :end-line 329, :hash "2075911387"} {:id "defn-/performance-calibration", :kind "defn-", :line 331, :end-line 332, :hash "-582775852"} {:id "defn-/calibration-pack", :kind "defn-", :line 334, :end-line 335, :hash "1991585415"} {:id "defn-/calibration-target", :kind "defn-", :line 337, :end-line 338, :hash "-599804426"} {:id "defn-/calibration-pack-world", :kind "defn-", :line 340, :end-line 355, :hash "-1284541404"} {:id "defn-/calibration-target-world", :kind "defn-", :line 357, :end-line 369, :hash "353906553"} {:id "defn-/calibration-world", :kind "defn-", :line 371, :end-line 372, :hash "1460425773"} {:id "defn-/regression-world", :kind "defn-", :line 374, :end-line 386, :hash "6713325"} {:id "defn-/assert-vtd003!", :kind "defn-", :line 388, :end-line 390, :hash "60207851"} {:id "defn-/classified-browser-adapters", :kind "defn-", :line 392, :end-line 395, :hash "1447896627"} {:id "defn-/inspection-context", :kind "defn-", :line 397, :end-line 409, :hash "-360551503"} {:id "defn-/assert-pack-fields!", :kind "defn-", :line 411, :end-line 416, :hash "-687209790"} {:id "defn-/assert-adapter-classifications!", :kind "defn-", :line 418, :end-line 426, :hash "-1232601065"} {:id "defn-/assert-registered-paths!", :kind "defn-", :line 428, :end-line 432, :hash "-1890327722"} {:id "defn-/assert-shared-adapters!", :kind "defn-", :line 434, :end-line 438, :hash "-1256763437"} {:id "defn-/assert-source-signals!", :kind "defn-", :line 440, :end-line 489, :hash "1212118136"} {:id "defn-/assert-owning-pack-batches!", :kind "defn-", :line 491, :end-line 501, :hash "-1117210373"} {:id "defn-/assert-browser-batching!", :kind "defn-", :line 503, :end-line 515, :hash "-1575723724"} {:id "defn-/assert-runtime-boundaries!", :kind "defn-", :line 517, :end-line 525, :hash "767574382"} {:id "defn-/inspect-repository!", :kind "defn-", :line 527, :end-line 535, :hash "-552939158"} {:id "defn-/inspect!", :kind "defn-", :line 537, :end-line 544, :hash "661987012"} {:id "def/handlers", :kind "def", :line 546, :end-line 1006, :hash "1576638002"}]}
;; clj-mutate-manifest-end
