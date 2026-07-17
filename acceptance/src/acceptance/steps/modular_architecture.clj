(ns acceptance.steps.modular-architecture
  (:require [acceptance.steps.support :as support]
            [aps.json :as aps-json]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(defn- enough-verification-packs? [registry]
  (>= (count registry) 6))

(defn- inspect! [world]
  (if (:modular/inspected world)
    world
    (let [root (support/repository-root)
          registry (aps-json/read-json-file (str (fs/path root "verification/packs.json")))
          utility-registry (support/source-file root "src/utility-registry.ts")
          side-panel (support/source-file root "src/side-panel.ts")
          generator (support/source-file root "acceptance/src/acceptance/generator.clj")
          adapters (mapcat :browserAdapters registry)]
      (support/assert! (enough-verification-packs? registry) "Too few verification packs are registered." {})
      (doseq [pack registry
              key [:source :dependencies :unit :property :features :handlers :browserAdapters]]
        (support/assert! (vector? (get pack key)) "Verification pack field is not a vector."
                         {:pack (:id pack) :field key}))
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
      (doseq [adapter adapters]
        (support/assert! (str/includes? (support/source-file root adapter) "shared-harness")
                         "Browser adapter does not use the shared harness." {:adapter adapter}))
      (assoc world :modular/inspected true :modular/registry registry))))

(def handlers
  [{:pattern #"^.*$"
    :handler (fn [world _example _captures] (inspect! world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-17T17:05:35.247263191+02:00", :module-hash "-571912471", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-485998160"} {:id "defn-/enough-verification-packs?", :kind "defn-", :line 7, :end-line 8, :hash "380845414"} {:id "defn-/inspect!", :kind "defn-", :line 10, :end-line 38, :hash "-295830725"} {:id "def/handlers", :kind "def", :line 40, :end-line 42, :hash "1432102857"}]}
;; clj-mutate-manifest-end
