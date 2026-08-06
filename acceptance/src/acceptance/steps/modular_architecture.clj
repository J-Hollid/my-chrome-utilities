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

(defn- inspect! [world]
  (if (:modular/inspected world)
    world
    (let [root (support/repository-root)
          registry (aps-json/read-json-file (str (fs/path root "verification/packs.json")))
          utility-registry (support/source-file root "src/utility-registry.ts")
          side-panel (support/source-file root "src/side-panel.ts")
          generator (support/source-file root "acceptance/src/acceptance/generator.clj")
          verification-planner (support/source-file root "scripts/verification-packs.mjs")
          throughput-reporter (support/source-file root "scripts/report-verification-throughput.mjs")
          observation-runner (support/source-file root "scripts/run-browser-observation.mjs")
          component-layout-runner (support/source-file root "test/side-panel-component-layout-runtime-test.mjs")
          adapters (mapcat :browserAdapters registry)
          adapter-classifications (classified-browser-adapters registry)
          batched-observations (filter :sessionBatch (mapcat :browserObservations registry))
          performance-declarations (mapcat :browserAdapterPerformance registry)]
      (support/assert! (enough-verification-packs? registry) "Too few verification packs are registered." {})
      (doseq [pack registry
              key [:source :dependencies :unit :property :features :handlers
                   :browserAdapters :browserAdapterModes]]
        (support/assert! (vector? (get pack key)) "Verification pack field is not a vector."
                         {:pack (:id pack) :field key}))
      (doseq [pack registry]
        (let [pack-adapters (set (:browserAdapters pack))
              classifications (:browserAdapterModes pack)]
          (support/assert! (and (= (count pack-adapters) (count classifications))
                                (= pack-adapters (set (map :path classifications))))
                           "Browser adapters are not classified exactly once."
                           {:pack (:id pack)})
          (support/assert! (every? #(browser-adapter-modes (:mode %)) classifications)
                           "Browser adapter mode is invalid."
                           {:pack (:id pack)})))
      (doseq [path (mapcat #(mapcat % registry)
                           [#(:unit %) #(:property %) #(:features %) #(:handlers %) #(:browserAdapters %)])]
        (support/assert! (fs/exists? (fs/path root path)) "Verification pack path is missing."
                         {:path path}))
      (support/assert! (support/includes-all? utility-registry
                                             ["commandPaletteUtility" "hotkeysUtility"
                                              "dataLayerUtility" "composeUtilityShell"])
                       "Shell composition does not use all public utility entries." {})
      (support/assert! (and (str/includes? side-panel "extensionShell")
                            (not (str/includes? generator "acceptance.steps.all :as steps")))
                       "Production shell or generated acceptance wiring is not modular." {})
      (doseq [adapter (filter #(= "shared" (adapter-classifications %)) adapters)]
        (support/assert! (str/includes? (support/source-file root adapter) "shared-harness")
                         "Browser adapter does not use the shared harness." {:adapter adapter}))
      (support/assert! (support/includes-all? verification-planner
                                             ["runtimeInputs" "verificationHelpers"
                                              "browserTargetIds" "sessionBatch"
                                              "browserAdapterPerformance" "impactBoundaries"])
                       "Verification planning lacks precise consumer or browser-target boundaries." {})
      (support/assert! (support/includes-all? throughput-reporter
                                             ["representative-change" "rejectedByReason"
                                              "checkVerificationPerformanceBudgets"
                                              "browserTargets"
                                              "defaultBrowserTargetMilliseconds"])
                       "Verification throughput lacks complete rows or budget diagnostics." {})
      (support/assert! (support/includes-all? observation-runner
                                             ["SWARMFORGE_BROWSER_TARGET_IDS"
                                              "SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS"
                                              "parseBrowserObservationBatchOutput"
                                              "partialDocument"])
                       "Browser observation batching loses isolation or independent evidence." {})
      (support/assert! (and (seq batched-observations)
                            (some #(>= (count %) 2)
                                  (vals (group-by (juxt :path :sessionBatch) batched-observations))))
                       "No compatible browser observations share a declared session batch." {})
      (support/assert! (seq performance-declarations)
                       "No slow browser adapter declares independently selectable targets." {})
      (support/assert! (support/includes-all? component-layout-runner
                                             ["SWARMFORGE_BROWSER_TARGET_IDS"
                                              "SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS"
                                              "Storage.clearDataForOrigin"
                                              "swarmforgeBrowserTargetTiming"])
                       "The shared browser program does not isolate or time logical targets." {})
      (doseq [pack registry
              input (:runtimeInputs pack)]
        (support/assert! (fs/exists? (fs/path root input))
                         "Runtime consumer input is missing." {:pack (:id pack) :path input}))
      (doseq [pack registry
              helper (:verificationHelpers pack)]
        (support/assert! (and (fs/exists? (fs/path root (:path helper)))
                              (seq (:consumers helper)))
                         "Verification helper declaration is incomplete."
                         {:pack (:id pack) :path (:path helper)}))
      (assoc world
             :modular/inspected true
             :modular/registry registry
             :modular/browser-adapter-modes adapter-classifications))))

(def handlers
  [{:pattern #"^.*$"
    :handler (fn [world _example _captures] (inspect! world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-06T02:44:37.184462683+02:00", :module-hash "464313931", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-485998160"} {:id "defn-/enough-verification-packs?", :kind "defn-", :line 7, :end-line 8, :hash "380845414"} {:id "def/browser-adapter-modes", :kind "def", :line 10, :end-line 11, :hash "-1768145777"} {:id "defn-/classified-browser-adapters", :kind "defn-", :line 13, :end-line 16, :hash "1447896627"} {:id "defn-/inspect!", :kind "defn-", :line 18, :end-line 106, :hash "1115867079"} {:id "def/handlers", :kind "def", :line 108, :end-line 110, :hash "1432102857"}]}
;; clj-mutate-manifest-end
