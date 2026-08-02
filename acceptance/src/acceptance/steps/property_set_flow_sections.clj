(ns acceptance.steps.property-set-flow-sections
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]))

(def feature-files
  ["features/data-layer-property-set-and-flow-section-separation.feature"
   "features/data-layer-property-set-and-flow-section-separation-runtime.feature"])

(def entry-modes
  {"Shop contains Shared Profiles Sitewide and Commerce" :model
   "the built extension is running with the production project repository, schema compiler, and Flow canvas" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- checked! [& command]
  (let [result (apply process/shell {:out :string :err :string} command)]
    (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)})
    result))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Property Set and Flow Section model verification failed. "
   "node" "test/data-layer-property-set-flow-section-test.mjs"))

(def authoritative-examples
  (support/authoritative-feature-examples feature-files))

(defn- validate-example! [_mode example]
  (support/validate-authoritative-example!
   authoritative-examples
   example
   "Property Set and Flow Section example is not an authoritative contract row."))

(defn- observe-browser! []
  (or @browser-observation
      (let [result (checked! "node" "test/browser-packs/property-set-flow-sections.mjs")
            observed (support/json-observation (:out result) :propertySetFlowSections)]
        (reset! browser-observation observed))))

(def runtime-paths
  (set (concat [:installedBoundary :preservedGraph]
               (map #(keyword (str "runtime" (format "%03d" %))) (range 1 12)))))

(defn- assert-runtime! [evidence]
  (support/assert! (and (= runtime-paths (set (keys evidence)))
                        (every? true? (vals evidence)))
                   "Installed Property Set and Flow Section evidence is incomplete."
                   evidence))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :property-set-flow-sections-mode
   verify-model! validate-example!
   observe-browser! assert-runtime!))
