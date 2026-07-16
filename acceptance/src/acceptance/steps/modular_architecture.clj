(ns acceptance.steps.modular-architecture
  (:require [acceptance.steps.support :as support]
            [aps.json :as aps-json]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(defn- inspect! [world]
  (if (:modular/inspected world)
    world
    (let [root (support/repository-root)
          registry (aps-json/read-json-file (str (fs/path root "verification/packs.json")))
          utility-registry (support/source-file root "src/utility-registry.ts")
          side-panel (support/source-file root "src/side-panel.ts")
          generator (support/source-file root "acceptance/src/acceptance/generator.clj")
          adapters (mapcat :browserAdapters registry)]
      (support/assert! (>= (count registry) 6) "Too few verification packs are registered." {})
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
