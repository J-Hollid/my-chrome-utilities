(ns acceptance.steps.schema-workspace-runtime
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-file "features/data-layer-schema-workspace-runtime-completion.feature")

(defn- browser-workspace! [world]
  (if (:browser-observation world)
    world
    (let [result (process/shell (assoc support/build-shell-options :env {"SCHEMA_WORKSPACE_BROWSER_ADAPTER" "1"}) "node" "test/side-panel-component-layout-runtime-test.mjs")
          line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
          payload (when line (json/parse-string line true))]
      (support/assert! (zero? (:exit result)) "Schema workspace browser runtime verification failed."
                       {:out (:out result) :err (:err result)})
      (support/assert! (true? (get-in payload [:schemaWorkspace :mounted])) "Production Schema workspace did not mount." {:payload payload})
      (support/assert! (= "Order complete schema" (get-in payload [:schemaWorkspace :sourceCreation :name]))
                       "Library Create schema did not invoke the production source callback." {:payload payload})
      (support/assert! (= "schema-library-v1.json" (get-in payload [:schemaWorkspace :transfer :downloadName]))
                       "Schema Library export did not produce the versioned download." {:payload payload})
      (support/assert! (true? (get-in payload [:schemaWorkspace :transfer :review]))
                       "Schema Library import did not open its review dialog." {:payload payload})
      (support/assert! (re-find #"Valid|issues" (str (get-in payload [:schemaWorkspace :validation :validation])))
                       "Live Validate did not produce a validation state." {:payload payload})
      (assoc world :browser-observation (:schemaWorkspace payload)))))

(defn- require! [world key message]
  (support/assert! (get world key) message {:required key}) world)

(defn- transition [world example _captures {:keys [text]}]
  (let [world (if (= text "the rendered Data Layer Schemas workspace is displayed")
                (assoc (browser-workspace! world) :schema-workspace-runtime? true)
                world)]
    (require! world :browser-observation "Schema workspace browser adapter was not executed.")
    (update world :schema-workspace-runtime-steps (fnil conj []) text)))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (= "the rendered Data Layer Schemas workspace is displayed" (:text spec))
                           (:schema-workspace-runtime? world)))
           :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs [feature-file] #{})))
