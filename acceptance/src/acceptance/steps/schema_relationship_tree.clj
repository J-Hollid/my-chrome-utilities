(ns acceptance.steps.schema-relationship-tree
  (:require [acceptance.causal-regression :as causal-regression]
            [acceptance.steps.support :as support]
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
  (let [result (apply support/verified-command-result command)]
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
  (set (concat [:installedBoundary :viewPersisted]
               (map #(keyword (str "tree" (format "%03d" %))) (range 1 10)))))

(defn- assert-runtime! [evidence]
  (support/assert! (and (= runtime-paths (set (keys evidence)))
                        (every? true? (vals evidence)))
                   "Installed schema relationship-tree evidence is incomplete."
                   evidence)
  (causal-regression/emit!
   :schema-relationship-tree
   {:required-paths-recognized true
    :view-persistence-recognized true}))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-relationship-tree-mode
   verify-model! validate-example!
   observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-30T20:41:53.004366806+02:00", :module-hash "-1283797969", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-228166640"} {:id "def/feature-files", :kind "def", :line 6, :end-line 8, :hash "974857929"} {:id "def/entry-modes", :kind "def", :line 10, :end-line 12, :hash "-1865986730"} {:id "form/3/defonce", :kind "defonce", :line 14, :end-line 14, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 15, :end-line 15, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 17, :end-line 20, :hash "1504155082"} {:id "defn-/verify-model!", :kind "defn-", :line 22, :end-line 26, :hash "-318502176"} {:id "def/authoritative-examples", :kind "def", :line 28, :end-line 29, :hash "1598887325"} {:id "defn-/validate-example!", :kind "defn-", :line 31, :end-line 35, :hash "1685655197"} {:id "defn-/observe-browser!", :kind "defn-", :line 37, :end-line 41, :hash "1202190363"} {:id "def/runtime-paths", :kind "def", :line 43, :end-line 45, :hash "653826976"} {:id "defn-/assert-runtime!", :kind "defn-", :line 47, :end-line 55, :hash "-1588896213"} {:id "def/handlers", :kind "def", :line 57, :end-line 61, :hash "583264689"}]}
;; clj-mutate-manifest-end
