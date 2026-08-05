(ns acceptance.steps.property-set-flow-sections
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]))

(def feature-files
  ["features/data-layer-property-set-and-flow-section-separation.feature"
   "features/data-layer-property-set-and-flow-section-separation-runtime.feature"])

(def entry-modes
  {"Shop contains Shared Profiles Sitewide and Commerce" :model
   "saved legacy Cart applies Checkout base then Retail commerce" :model
   "the built extension is running with the production project repository, schema compiler, and Flow canvas" :runtime
   "production IndexedDB contains a previous-version project whose Cart memberships are Checkout base then Retail commerce" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- checked! [& command]
  (let [result (apply support/verified-command-result command)]
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
               (map #(keyword (str "runtime" (format "%03d" %))) (range 1 13)))))

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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-04T11:33:29.619716753+02:00", :module-hash "-1506306015", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1117519402"} {:id "def/feature-files", :kind "def", :line 5, :end-line nil, :hash "-339792063"} {:id "def/entry-modes", :kind "def", :line 9, :end-line nil, :hash "-1600061933"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line nil, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line nil, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 16, :end-line nil, :hash "1504155082"} {:id "defn-/verify-model!", :kind "defn-", :line 21, :end-line nil, :hash "-363026210"} {:id "def/authoritative-examples", :kind "def", :line 27, :end-line nil, :hash "1598887325"} {:id "defn-/validate-example!", :kind "defn-", :line 30, :end-line nil, :hash "-68312048"} {:id "defn-/observe-browser!", :kind "defn-", :line 36, :end-line nil, :hash "1197638688"} {:id "def/runtime-paths", :kind "def", :line 42, :end-line nil, :hash "1473358027"} {:id "defn-/assert-runtime!", :kind "defn-", :line 46, :end-line nil, :hash "-864839930"} {:id "def/handlers", :kind "def", :line 52, :end-line nil, :hash "1771714116"}]}
;; clj-mutate-manifest-end
