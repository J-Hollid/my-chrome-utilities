(ns acceptance.verification-support.modular-architecture-repository-inspection
  (:require [acceptance.steps.support :as support]
            [aps.json :as aps-json]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(def ^:private browser-adapter-modes
  #{"shared" "shared-wrapper" "integration" "compatibility"})

(defn enough-verification-packs? [registry]
  (>= (count registry) 6))

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
                     "src/data-layer-installed/runtime.ts"
                     "acceptance/src/acceptance/generator.clj" "scripts/verification-packs.mjs"
                     "scripts/report-verification-throughput.mjs" "scripts/run-focused-acceptance.mjs"
                     "scripts/verification-timing-ledger.mjs" "verification/timing-receipt-index.json"
                     "scripts/run-browser-observation.mjs" "test/support/headless-chrome.mjs"
                     "test/side-panel-component-layout-runtime-test.mjs"
                     "test/support/side-panel-browser-session.mjs"
                     "test/support/side-panel-browser-fixture-primitives.mjs"])}))

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
  (support/assert! (and (str/includes? (sources "src/side-panel.ts")
                                      "mountInstalledDataLayerRuntime")
                        (str/includes? (sources "src/data-layer-installed/runtime.ts")
                                       "registryApi.extensionShell.commands")
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
            ["runDirectSidePanelCompatibility"]
            "The direct component-layout command is not a thin compatibility launcher."]
           ["test/support/side-panel-browser-session.mjs"
            ["withLogicalTargetLifecycle" "runSidePanelBrowserSession"
             "runSidePanelBrowserFixture"]
            "The shared side-panel session lacks target lifecycle ownership."]
           ["test/support/side-panel-browser-fixture-primitives.mjs"
            ["SWARMFORGE_BROWSER_TARGET_IDS" "SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS"
             "Storage.clearDataForOrigin" "swarmforgeBrowserTargetResult"
             "swarmforgeBrowserTargetTiming"]
            "The shared browser program does not isolate or time logical targets."]]]
    (support/assert! (support/includes-all? (sources path) signals) message {})))

(defn- assert-owning-pack-batches! [registry]
  (doseq [[pack-id expected-count program]
          [["capture" 5 "test/browser-packs/side-panel-capture.mjs"]
           ["schemas" 46 "test/browser-packs/side-panel-schemas.mjs"]
           ["defects" 9 "test/browser-packs/side-panel-defects.mjs"]]]
    (let [pack (first (filter #(= pack-id (:id %)) registry))
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
    (support/assert! (= #{"test/browser-packs/side-panel-capture.mjs"
                          "test/browser-packs/side-panel-schemas.mjs"
                          "test/browser-packs/side-panel-defects.mjs"}
                        (set (map :path observation-batches)))
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

(defn inspect! [world]
  (if (:modular/inspected world)
    world
    (let [{:keys [registry adapter-classifications] :as context} (inspection-context)]
      (inspect-repository! context)
      (assoc world :modular/inspected true
             :modular/registry registry
             :modular/browser-adapter-modes adapter-classifications))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-27T18:17:37.711338816+02:00", :module-hash "-1633441218", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "1927640464"} {:id "def/browser-adapter-modes", :kind "def", :line 7, :end-line 8, :hash "549635039"} {:id "defn/enough-verification-packs?", :kind "defn", :line 10, :end-line 11, :hash "1002135556"} {:id "defn-/classified-browser-adapters", :kind "defn-", :line 13, :end-line 16, :hash "1447896627"} {:id "defn-/inspection-context", :kind "defn-", :line 18, :end-line 33, :hash "1018916722"} {:id "defn-/assert-pack-fields!", :kind "defn-", :line 35, :end-line 40, :hash "-687209790"} {:id "defn-/assert-adapter-classifications!", :kind "defn-", :line 42, :end-line 50, :hash "-950151277"} {:id "defn-/assert-registered-paths!", :kind "defn-", :line 52, :end-line 56, :hash "1363454567"} {:id "defn-/assert-shared-adapters!", :kind "defn-", :line 58, :end-line 62, :hash "-1460578147"} {:id "defn-/assert-source-signals!", :kind "defn-", :line 64, :end-line 123, :hash "197274989"} {:id "defn-/assert-owning-pack-batches!", :kind "defn-", :line 125, :end-line 137, :hash "1561918723"} {:id "defn-/assert-browser-batching!", :kind "defn-", :line 139, :end-line 153, :hash "2052404202"} {:id "defn-/assert-runtime-boundaries!", :kind "defn-", :line 155, :end-line 163, :hash "767574382"} {:id "defn-/inspect-repository!", :kind "defn-", :line 165, :end-line 173, :hash "-552939158"} {:id "defn/inspect!", :kind "defn", :line 175, :end-line 182, :hash "-1604167754"}]}
;; clj-mutate-manifest-end
