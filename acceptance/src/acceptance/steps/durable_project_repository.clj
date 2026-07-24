(ns acceptance.steps.durable-project-repository
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-durable-project-repository.feature"
                    "features/data-layer-durable-project-repository-runtime.feature"])
(def entry-modes
  {"the durable project repository contains active Retail website with Saved Draft and Published revision 3" :model
   "Retail website durably contains Flow graph flow-orphan whose owning Flow entity is absent" :model
   "the built extension is running with the production durable-project repository" :runtime
   "production IndexedDB has project-retail:flow-orphan in flowGraphs without a matching Flow entity" :runtime})
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
(def runtime-keys (set (map #(keyword (format "runtime%03d" %)) (range 1 14))))
(def required-keys (conj runtime-keys :installedBoundary))
(defn- all-true? [value] (boolean (and (map? value) (seq value) (every? true? (vals value)))))
(defn complete-browser-evidence? [evidence]
  (boolean (and (map? evidence)
                (= required-keys (set (keys evidence)))
                (true? (:installedBoundary evidence))
                (every? #(all-true? (get evidence %)) runtime-keys))))
(defn- assert-runtime! [evidence]
  (support/assert! (complete-browser-evidence? evidence) "Installed durable repository evidence is incomplete." evidence))
(def failure-example-values
  {"failure" #{"quota exceeded" "transaction aborted" "repository unavailable"}})
(defn validate-example! [_mode example]
  (support/validate-example-domain!
   failure-example-values example
   (filter #(support/example-value example %) (keys failure-example-values))
   "Durable repository failure example was outside the specified contract."))
(def handlers
  (support/verified-feature-mode-handlers feature-files entry-modes :durable-project-repository-mode
                                          verify-model! validate-example!
                                          observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-24T09:54:56.531496432+02:00", :module-hash "597568411", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-976827486"} {:id "def/feature-files", :kind "def", :line 7, :end-line 8, :hash "-314391133"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 13, :hash "-1931573454"} {:id "form/3/defonce", :kind "defonce", :line 14, :end-line 14, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 15, :end-line 15, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 16, :end-line 19, :hash "-148274062"} {:id "defn-/verify-model!", :kind "defn-", :line 20, :end-line 25, :hash "1173849277"} {:id "defn-/observe-browser!", :kind "defn-", :line 26, :end-line 32, :hash "-1924535678"} {:id "def/runtime-keys", :kind "def", :line 33, :end-line 33, :hash "1245277033"} {:id "def/required-keys", :kind "def", :line 34, :end-line 34, :hash "-627843649"} {:id "defn-/all-true?", :kind "defn-", :line 35, :end-line 35, :hash "-1681869564"} {:id "defn/complete-browser-evidence?", :kind "defn", :line 36, :end-line 40, :hash "-2131545939"} {:id "defn-/assert-runtime!", :kind "defn-", :line 41, :end-line 42, :hash "217878866"} {:id "def/failure-example-values", :kind "def", :line 43, :end-line 44, :hash "-644280616"} {:id "defn/validate-example!", :kind "defn", :line 45, :end-line 49, :hash "1731629357"} {:id "def/handlers", :kind "def", :line 50, :end-line 53, :hash "2100359538"}]}
;; clj-mutate-manifest-end
