(ns acceptance.steps.modular-architecture
  (:require [acceptance.steps.support :as support]
            [aps.json :as aps-json]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(defn- enough-verification-packs? [registry]
  (>= (count registry) 6))

(def ^:private browser-adapter-modes
  #{"shared" "shared-wrapper" "integration"})

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
             "defaultBrowserTargetMilliseconds"]
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
  [{:pattern #"^.*$"
    :handler (fn [world _example _captures] (inspect! world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-06T04:38:57.476542633+02:00", :module-hash "733532786", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-485998160"} {:id "defn-/enough-verification-packs?", :kind "defn-", :line 7, :end-line 8, :hash "380845414"} {:id "def/browser-adapter-modes", :kind "def", :line 10, :end-line 11, :hash "-1768145777"} {:id "defn-/classified-browser-adapters", :kind "defn-", :line 13, :end-line 16, :hash "1447896627"} {:id "defn-/inspect!", :kind "defn-", :line 18, :end-line 119, :hash "983658983"} {:id "def/handlers", :kind "def", :line 121, :end-line 123, :hash "1432102857"}]}
;; clj-mutate-manifest-end
