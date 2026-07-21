(ns acceptance.steps.durable-project-repository
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-durable-project-repository.feature"
                    "features/data-layer-durable-project-repository-runtime.feature"])
(def entry-modes
  {"the durable project repository contains active Retail website with Saved Draft and Published revision 3" :model
   "the built extension is running with the production durable-project repository" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- checked! [& command]
  (let [result (apply process/shell {:out :string :err :string} command)]
    (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)})
    result))
(defn- verify-model! []
  (when-not @model-verified?
    (checked! "node" "test/data-layer-durable-project-repository-test.mjs")
    (checked! "node" "test/data-layer-durable-project-runtime-test.mjs")
    (checked! "node" "test/data-layer-durable-project-repository-property-test.mjs")
    (reset! model-verified? true)))
(defn- observe-browser! []
  (or @browser-observation
      (let [result (checked! "node" "test/browser-packs/durable-project-repository.mjs")
            line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
            observed (:durableProjectRepository (json/parse-string line true))]
        (support/assert! observed "Durable repository browser evidence is missing." {:out (:out result)})
        (reset! browser-observation observed))))
(def runtime-keys (set (map #(keyword (format "runtime%03d" %)) (range 1 13))))
(def required-keys (conj runtime-keys :installedBoundary))
(defn- all-true? [value] (boolean (and (map? value) (seq value) (every? true? (vals value)))))
(defn complete-browser-evidence? [evidence]
  (boolean (and (map? evidence)
                (= required-keys (set (keys evidence)))
                (true? (:installedBoundary evidence))
                (every? #(all-true? (get evidence %)) runtime-keys))))
(defn- assert-runtime! [evidence]
  (support/assert! (complete-browser-evidence? evidence) "Installed durable repository evidence is incomplete." evidence))
(def handlers
  (support/verified-feature-mode-handlers feature-files entry-modes :durable-project-repository-mode
                                          verify-model! (fn [_mode _example] true)
                                          observe-browser! assert-runtime!))
