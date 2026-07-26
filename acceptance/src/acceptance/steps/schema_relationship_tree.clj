(ns acceptance.steps.schema-relationship-tree
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]))

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
  (support/authoritative-feature-examples feature-files))

(defn- validate-example! [_mode example]
  (support/validate-authoritative-example!
   authoritative-examples
   example
   "Schema relationship-tree example is not an authoritative contract row."))

(defn- observe-browser! []
  (or @browser-observation
      (let [result (checked! "node" "test/browser-packs/schema-relationship-tree.mjs")
            observed (support/json-observation (:out result) :schemaRelationshipTree)]
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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-26T21:17:00.47445618+02:00", :module-hash "-2115752035", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1892969934"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "974857929"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-1865986730"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 16, :end-line 19, :hash "-148274062"} {:id "defn-/verify-model!", :kind "defn-", :line 21, :end-line 25, :hash "-318502176"} {:id "def/authoritative-examples", :kind "def", :line 27, :end-line 28, :hash "1598887325"} {:id "defn-/validate-example!", :kind "defn-", :line 30, :end-line 34, :hash "1685655197"} {:id "defn-/observe-browser!", :kind "defn-", :line 36, :end-line 40, :hash "1202190363"} {:id "def/runtime-paths", :kind "def", :line 42, :end-line 43, :hash "-884551932"} {:id "defn-/assert-runtime!", :kind "defn-", :line 45, :end-line 49, :hash "-787973846"} {:id "def/handlers", :kind "def", :line 51, :end-line 55, :hash "583264689"}]}
;; clj-mutate-manifest-end
