(ns acceptance.steps.selective-profile-inheritance
  (:require [acceptance.steps.support :as support]
            [aps.gherkin :as gherkin]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files ["features/specification-studio-selective-profile-inheritance.feature"
                    "features/specification-studio-selective-profile-inheritance-runtime.feature"])
(def entry-modes {"Master is a Shared Profile with hundreds of canonical properties grouped by concepts" :model
                  "the built extension is running with production Specification Studio and durable project storage" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- checked! [& command] (let [result (apply support/verified-command-result command)] (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)}) result))
(defn- verify-model! [] (when-not @model-verified? (checked! "node" "test/data-layer-selective-profile-inheritance-test.mjs") (reset! model-verified? true)))
(defn- observe-browser! [] (or @browser-observation (let [result (checked! "node" "test/browser-packs/selective-profile-inheritance.mjs") line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result)))) observed (:selectiveProfileInheritance (json/parse-string line true))] (reset! browser-observation observed))))
(def runtime-paths (set (map #(keyword (str "runtime" (format "%03d" %))) (range 1 23))))
(def authoritative-examples (set (for [feature-file feature-files scenario (:scenarios (gherkin/parse-file feature-file)) example (:examples scenario)] example)))
(defn- validate-example! [_mode example] (when (seq example) (let [normalized (into {} (map (fn [[key value]] [(name key) value]) example))] (support/assert! (contains? authoritative-examples normalized) "Scenario Outline example is not an authoritative contract row." {:example normalized}))))
(defn- assert-runtime! [evidence] (support/assert! (and (= runtime-paths (set (keys evidence))) (every? true? (vals evidence))) "Installed selective-profile-inheritance evidence is incomplete." evidence))
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :selective-profile-inheritance-mode verify-model! validate-example! observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-04T11:33:29.792653074+02:00", :module-hash "-1992487090", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1219657973"} {:id "def/feature-files", :kind "def", :line 8, :end-line nil, :hash "2022211930"} {:id "def/entry-modes", :kind "def", :line 10, :end-line nil, :hash "1254300539"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line nil, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 13, :end-line nil, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 14, :end-line nil, :hash "1504155082"} {:id "defn-/verify-model!", :kind "defn-", :line 15, :end-line nil, :hash "784662512"} {:id "defn-/observe-browser!", :kind "defn-", :line 16, :end-line nil, :hash "-1551087999"} {:id "def/runtime-paths", :kind "def", :line 17, :end-line nil, :hash "-1741936893"} {:id "def/authoritative-examples", :kind "def", :line 18, :end-line nil, :hash "-2126809929"} {:id "defn-/validate-example!", :kind "defn-", :line 19, :end-line nil, :hash "-154495481"} {:id "defn-/assert-runtime!", :kind "defn-", :line 20, :end-line nil, :hash "2049424878"} {:id "def/handlers", :kind "def", :line 21, :end-line nil, :hash "-1407196209"}]}
;; clj-mutate-manifest-end
