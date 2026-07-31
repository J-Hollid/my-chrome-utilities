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
(defn- checked! [& command] (let [result (apply process/shell {:out :string :err :string} command)] (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)}) result))
(defn- verify-model! [] (when-not @model-verified? (checked! "node" "test/data-layer-selective-profile-inheritance-test.mjs") (reset! model-verified? true)))
(defn- observe-browser! [] (or @browser-observation (let [result (checked! "node" "test/browser-packs/selective-profile-inheritance.mjs") line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result)))) observed (:selectiveProfileInheritance (json/parse-string line true))] (reset! browser-observation observed))))
(def runtime-paths (set (map #(keyword (str "runtime" (format "%03d" %))) (range 1 17))))
(def authoritative-examples (set (for [feature-file feature-files scenario (:scenarios (gherkin/parse-file feature-file)) example (:examples scenario)] example)))
(defn- validate-example! [_mode example] (when (seq example) (let [normalized (into {} (map (fn [[key value]] [(name key) value]) example))] (support/assert! (contains? authoritative-examples normalized) "Scenario Outline example is not an authoritative contract row." {:example normalized}))))
(defn- assert-runtime! [evidence] (support/assert! (and (= runtime-paths (set (keys evidence))) (every? true? (vals evidence))) "Installed selective-profile-inheritance evidence is incomplete." evidence))
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :selective-profile-inheritance-mode verify-model! validate-example! observe-browser! assert-runtime!))
