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
(defn- checked! [& command] (let [result (apply process/shell {:out :string :err :string} command)] (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)}) result))
(defn- verify-model! [] (when-not @model-verified? (checked! "node" "test/data-layer-canonical-schema-authoring-test.mjs") (checked! "node" "test/data-layer-schema-property-concepts-test.mjs") (checked! "node" "test/data-layer-canonical-array-items-test.mjs") (checked! "node" "test/data-layer-canonical-migration-acknowledgement-test.mjs") (checked! "node" "test/data-layer-composed-schema-workspace-test.mjs") (checked! "node" "test/data-layer-layered-schema-test.mjs") (checked! "node" "test/data-layer-layered-schema-persistence-test.mjs") (checked! "node" "test/data-layer-layered-schema-adoption-test.mjs") (checked! "node" "test/data-layer-string-rule-validation-test.mjs") (reset! model-verified? true)))
(defn- observe-browser! [] (or @browser-observation (let [result (checked! "node" "test/browser-packs/layered-schema.mjs") line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result)))) observed (:layeredSchema (json/parse-string line true))] (reset! browser-observation observed))))
(def runtime-paths (set (concat [:installedBoundary :consequential :persistenceReload :sidePanelParity]
                                (map #(keyword (str "authoring" (format "%03d" %))) (range 1 77))
                                (map #(keyword (str "layering" (format "%03d" %))) (range 1 25))
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
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :layered-schema-mode verify-model! validate-example! observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-31T00:52:53.927286692+02:00", :module-hash "-754301623", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 6, :hash "-698030535"} {:id "def/feature-files", :kind "def", :line 8, :end-line 12, :hash "812142412"} {:id "def/entry-modes", :kind "def", :line 13, :end-line 17, :hash "-166762335"} {:id "form/3/defonce", :kind "defonce", :line 18, :end-line 18, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 19, :end-line 19, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 20, :end-line 20, :hash "-148274062"} {:id "defn-/verify-model!", :kind "defn-", :line 21, :end-line 21, :hash "-900871097"} {:id "defn-/observe-browser!", :kind "defn-", :line 22, :end-line 22, :hash "1525089788"} {:id "def/runtime-paths", :kind "def", :line 23, :end-line 32, :hash "-2052612977"} {:id "def/authoritative-examples", :kind "def", :line 33, :end-line 37, :hash "-2126809929"} {:id "defn-/validate-example!", :kind "defn-", :line 38, :end-line 43, :hash "-154495481"} {:id "defn-/assert-runtime!", :kind "defn-", :line 44, :end-line 44, :hash "-1316725059"} {:id "def/handlers", :kind "def", :line 45, :end-line 45, :hash "-211988156"}]}
;; clj-mutate-manifest-end
