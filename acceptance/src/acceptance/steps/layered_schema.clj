(ns acceptance.steps.layered-schema
  (:require [acceptance.steps.support :as support]
            [aps.gherkin :as gherkin]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-canonical-shared-profile-schema-authoring.feature"
                    "features/data-layer-canonical-shared-profile-schema-authoring-runtime.feature"
                    "features/data-layer-layered-schema-constraints.feature"
                    "features/data-layer-layered-schema-constraints-runtime.feature"
                    "features/data-layer-page-group-structural-authoring.feature"])
(def entry-modes {"Shop specification project is open" :model
                  "Shop project contains Shared Profiles Sitewide and Opened Article" :model
                  "Shop project contains Page Cart and Page Groups Checkout, Retail Checkout, Signed-in Checkout, and Trade Checkout" :runtime
                  "the built extension is running with production project storage and the production schema editor" :runtime
                  "the built extension is running with the production project repository, canonical schema editor, compiler, assignment resolver, and per-Event validator" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defonce core-observation (atom nil))
(defonce composition-observation (atom nil))
(defn- checked! [& command] (let [result (apply support/verified-command-result command)] (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)}) result))
(defn- verify-model! [] (when-not @model-verified? (checked! "node" "test/data-layer-canonical-schema-authoring-test.mjs") (checked! "node" "test/data-layer-journal-free-canonical-schema-test.mjs") (checked! "node" "test/data-layer-schema-property-concepts-test.mjs") (checked! "node" "test/data-layer-canonical-array-items-test.mjs") (checked! "node" "test/data-layer-canonical-migration-acknowledgement-test.mjs") (checked! "node" "test/data-layer-composed-schema-workspace-test.mjs") (checked! "node" "test/data-layer-layered-schema-test.mjs") (checked! "node" "test/data-layer-layered-schema-persistence-test.mjs") (checked! "node" "test/data-layer-layered-schema-adoption-test.mjs") (checked! "node" "test/data-layer-string-rule-validation-test.mjs") (reset! model-verified? true)))
(defn- observe-browser! [] (or @browser-observation (let [result (checked! "node" "test/browser-packs/layered-schema.mjs") line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result)))) observed (:layeredSchema (json/parse-string line true))] (reset! browser-observation observed))))
(defn- observe-target! [cache id observation-key]
  (support/cached-browser-observation!
   cache {:observation-id id
          :observation-key observation-key
          :runtime-error (str id " browser verification failed.")
          :missing-error (str id " browser evidence is missing.")}))
(defn- focused-evidence-valid? [evidence]
  (and (map? evidence)
       (every? true? (vals (dissoc evidence
                                   :unrelatedCompositionExecuted
                                   :unrelatedEditorExecuted
                                   :unrelatedPageGroupExecuted
                                   :unrelatedInheritanceExecuted)))
       (every? false? (vals (select-keys evidence
                                         [:unrelatedCompositionExecuted
                                          :unrelatedEditorExecuted
                                          :unrelatedPageGroupExecuted
                                          :unrelatedInheritanceExecuted])))))
(def runtime-paths (set (concat [:installedBoundary :consequential :persistenceReload :sidePanelParity]
                                (map #(keyword (str "authoring" (format "%03d" %))) (range 1 86))
                                (map #(keyword (str "layering" (format "%03d" %))) (range 1 32))
                                (map #(keyword (str "flowFacet" (format "%03d" %))) (range 1 5))
                                [:canonicalPresence :canonicalValues :canonicalConditions :canonicalRules :canonicalExample :canonicalPersisted
                                 :flowFacetOwnership001 :flowFacetOwnership002
                                 :flowStructural001 :flowStructural002 :flowStructural003
                                 :pageGroupStructural001 :pageGroupStructural002
                                 :pageGroupStructural003 :pageGroupStructural004
                                 :pageGroupStructural005 :pageGroupStructural006
                                 :pageGroupStructural007 :pageGroupStructural008
                                 :pageGroupStructural009])))
(def authoritative-examples
  (set (for [feature-file feature-files
             scenario (:scenarios (gherkin/parse-file feature-file))
             example (:examples scenario)]
         example)))
(defn- validate-example! [_mode example]
  (when (seq example)
    (let [normalized (into {} (map (fn [[key value]] [(name key) value]) example))]
      (support/assert! (contains? authoritative-examples normalized)
                       "Scenario Outline example is not an authoritative contract row."
                       {:example normalized}))))
(defn- assert-runtime! [evidence] (support/assert! (and (= runtime-paths (set (keys evidence))) (every? true? (vals evidence))) "Installed layered-schema evidence is incomplete." evidence))
(def handlers
  (vec
   (concat
    (support/verified-feature-mode-handlers
     ["features/data-layer-canonical-shared-profile-schema-authoring.feature"
      "features/data-layer-canonical-shared-profile-schema-authoring-runtime.feature"]
     entry-modes :layered-schema-mode verify-model! validate-example!
     #(observe-target! core-observation "LAYERED_SCHEMA_CORE_TARGET" :layeredSchemaCore)
     #(support/assert! (focused-evidence-valid? %) "Canonical core browser evidence is incomplete." %))
    (support/verified-feature-mode-handlers
     ["features/data-layer-layered-schema-constraints.feature"
      "features/data-layer-layered-schema-constraints-runtime.feature"]
     entry-modes :layered-schema-mode verify-model! validate-example!
     #(observe-target! composition-observation "LAYERED_SCHEMA_COMPOSITION_TARGET" :layeredSchemaComposition)
     #(support/assert! (focused-evidence-valid? %) "Layered composition browser evidence is incomplete." %))
    (support/verified-feature-mode-handlers
     ["features/data-layer-page-group-structural-authoring.feature"]
     entry-modes :layered-schema-mode verify-model! validate-example!
     observe-browser! assert-runtime!))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-06T04:40:09.725226749+02:00", :module-hash "725188374", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 6, :hash "-698030535"} {:id "def/feature-files", :kind "def", :line 8, :end-line 12, :hash "812142412"} {:id "def/entry-modes", :kind "def", :line 13, :end-line 17, :hash "-166762335"} {:id "form/3/defonce", :kind "defonce", :line 18, :end-line 18, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 19, :end-line 19, :hash "-1618529344"} {:id "form/5/defonce", :kind "defonce", :line 20, :end-line 20, :hash "-678568222"} {:id "form/6/defonce", :kind "defonce", :line 21, :end-line 21, :hash "-2063172456"} {:id "defn-/checked!", :kind "defn-", :line 22, :end-line 22, :hash "1504155082"} {:id "defn-/verify-model!", :kind "defn-", :line 23, :end-line 23, :hash "-1537388689"} {:id "defn-/observe-browser!", :kind "defn-", :line 24, :end-line 24, :hash "1525089788"} {:id "defn-/observe-target!", :kind "defn-", :line 25, :end-line 30, :hash "1489001908"} {:id "defn-/focused-evidence-valid?", :kind "defn-", :line 31, :end-line 42, :hash "-1161111778"} {:id "def/runtime-paths", :kind "def", :line 43, :end-line 54, :hash "1356428557"} {:id "def/authoritative-examples", :kind "def", :line 55, :end-line 59, :hash "-2126809929"} {:id "defn-/validate-example!", :kind "defn-", :line 60, :end-line 65, :hash "-154495481"} {:id "defn-/assert-runtime!", :kind "defn-", :line 66, :end-line 66, :hash "-1316725059"} {:id "def/handlers", :kind "def", :line 67, :end-line 85, :hash "-513183203"}]}
;; clj-mutate-manifest-end
