(ns acceptance.steps.schema-relationship-tree
  (:require [acceptance.steps.support :as support]
            [aps.gherkin :as gherkin]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-side-panel-schema-relationship-tree.feature"
   "features/data-layer-side-panel-schema-relationship-tree-runtime.feature"])

(def entry-modes
  {"Shop is the active project" :model
   "the built extension is running with the production project repository, Flow graph projection, and established side-panel Schema editor" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- checked! [& command]
  (let [result (apply process/shell {:out :string :err :string} command)]
    (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)})
    result))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Schema relationship-tree model verification failed. "
   "node" "test/data-layer-schema-relationship-tree-test.mjs"))

(def authoritative-examples
  (set (for [feature-file feature-files
             scenario (:scenarios (gherkin/parse-file feature-file))
             example (:examples scenario)]
         example)))

(defn- validate-example! [_mode example]
  (when (seq example)
    (let [normalized (into {} (map (fn [[key value]] [(name key) value]) example))]
      (support/assert! (contains? authoritative-examples normalized)
                       "Schema relationship-tree example is not an authoritative contract row."
                       {:example normalized}))))

(defn- observe-browser! []
  (or @browser-observation
      (let [result (checked! "node" "test/browser-packs/schema-relationship-tree.mjs")
            payload-line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
            observed (:schemaRelationshipTree (json/parse-string payload-line true))]
        (reset! browser-observation observed))))

(def runtime-paths
  (set (concat [:installedBoundary] (map #(keyword (str "tree" (format "%03d" %))) (range 1 10)))))

(defn- assert-runtime! [evidence]
  (support/assert! (and (= runtime-paths (set (keys evidence)))
                        (every? true? (vals evidence)))
                   "Installed schema relationship-tree evidence is incomplete."
                   evidence))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-relationship-tree-mode
   verify-model! validate-example!
   observe-browser! assert-runtime!))
