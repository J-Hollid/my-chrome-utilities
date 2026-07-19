(ns acceptance.steps.layered-schema
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-layered-schema-constraints.feature" "features/data-layer-layered-schema-constraints-runtime.feature"])
(def entry-modes {"Shop project contains Shared Profile Sitewide, Event Purchase, Page Group Checkout, Page Shipping, and Flow Checkout journey" :model
                  "the built extension is running with the production project repository, shared schema editor, compiler, assignment resolver, and per-Event validator" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- checked! [& command] (let [result (apply process/shell {:out :string :err :string} command)] (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)}) result))
(defn- verify-model! [] (when-not @model-verified? (checked! "node" "test/data-layer-layered-schema-test.mjs") (checked! "node" "test/data-layer-layered-schema-persistence-test.mjs") (checked! "node" "test/data-layer-layered-schema-adoption-test.mjs") (reset! model-verified? true)))
(defn- observe-browser! [] (or @browser-observation (let [result (checked! "node" "test/browser-packs/layered-schema.mjs") line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result)))) observed (:layeredSchema (json/parse-string line true))] (reset! browser-observation observed))))
(def runtime-paths (set (concat [:installedBoundary :consequential :persistenceReload :sidePanelParity] (map #(keyword (str "path" (format "%03d" %))) (range 1 11)))))
(defn- assert-runtime! [evidence] (support/assert! (and (= runtime-paths (set (keys evidence))) (every? true? (vals evidence))) "Installed layered-schema evidence is incomplete." evidence))
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :layered-schema-mode verify-model! (fn [_mode _example] true) observe-browser! assert-runtime!))
