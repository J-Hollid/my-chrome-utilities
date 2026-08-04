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
   "Retail website's production baseline is Project 12, Sitewide 4, and Cart 7" :model
   "the current manifest assigns 12 to the Project and 4, 7, and 2 to Sitewide, Cart, and Purchase" :model
   "Retail website has Project revision 12 and the Draft returns to the same publishable content after edits are reversed" :model
   "immutable Cart publication 8 belongs to Project publication 13" :model
   "a project from an older extension has Project revision 3 and a canonical schema with edit revision 2847 and 2847 change entries" :model
   "the built extension is running with the production durable-project repository" :runtime
   "production IndexedDB has project-retail:flow-orphan in flowGraphs without a matching Flow entity" :runtime
   "production Retail website's baseline is Project 12, Sitewide 4, and Cart 7" :runtime
   "the stored manifest assigns 12 to the Project and 4, 7, and 2 to Sitewide, Cart, and Purchase" :runtime
   "production Retail website is at Project revision 12 and its Draft fingerprint returns to the production fingerprint" :runtime
   "immutable Cart publication 8 belongs to production Project publication 13" :runtime
   "production storage contains an older Project revision 3 whose canonical schema has edit revision 2847 and 2847 change entries" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- checked! [& command]
  (let [result (apply support/verified-command-result command)]
    (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)})
    result))
(defn- verify-model! []
  (when-not @model-verified?
    (checked! "node" "test/data-layer-durable-project-repository-test.mjs")
    (checked! "node" "test/data-layer-durable-project-runtime-test.mjs")
    (reset! model-verified? true)))
(defn- observe-browser! []
  (or @browser-observation
      (let [result (checked! "node" "test/browser-packs/durable-project-repository.mjs")
            line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
            observed (:durableProjectRepository (json/parse-string line true))]
        (support/assert! observed "Durable repository browser evidence is missing." {:out (:out result)})
        (reset! browser-observation observed))))
(def runtime-keys (set (map #(keyword (format "runtime%03d" %)) (range 1 19))))
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
(def authoritative-examples
  (support/authoritative-feature-examples feature-files))
(defn validate-example! [_mode example]
  (support/validate-authoritative-example!
   authoritative-examples
   example
   "Durable repository example is not an authoritative contract row.")
  (support/validate-example-domain!
   failure-example-values example
   (filter #(support/example-value example %) (keys failure-example-values))
   "Durable repository failure example was outside the specified contract."))
(def handlers
  (support/verified-feature-mode-handlers feature-files entry-modes :durable-project-repository-mode
                                          verify-model! validate-example!
                                          observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-04T11:33:29.531364522+02:00", :module-hash "632681613", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-976827486"} {:id "def/feature-files", :kind "def", :line 7, :end-line nil, :hash "-314391133"} {:id "def/entry-modes", :kind "def", :line 9, :end-line nil, :hash "426928939"} {:id "form/3/defonce", :kind "defonce", :line 24, :end-line nil, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 25, :end-line nil, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 26, :end-line nil, :hash "1504155082"} {:id "defn-/verify-model!", :kind "defn-", :line 30, :end-line nil, :hash "-379187691"} {:id "defn-/observe-browser!", :kind "defn-", :line 35, :end-line nil, :hash "-980948312"} {:id "def/runtime-keys", :kind "def", :line 42, :end-line nil, :hash "575369566"} {:id "def/required-keys", :kind "def", :line 43, :end-line nil, :hash "-627843649"} {:id "defn-/all-true?", :kind "defn-", :line 44, :end-line nil, :hash "-1681869564"} {:id "defn/complete-browser-evidence?", :kind "defn", :line 45, :end-line nil, :hash "-385744476"} {:id "defn-/assert-runtime!", :kind "defn-", :line 50, :end-line nil, :hash "217878866"} {:id "def/failure-example-values", :kind "def", :line 52, :end-line nil, :hash "-644280616"} {:id "def/authoritative-examples", :kind "def", :line 54, :end-line nil, :hash "1598887325"} {:id "defn/validate-example!", :kind "defn", :line 56, :end-line nil, :hash "559851829"} {:id "def/handlers", :kind "def", :line 65, :end-line nil, :hash "2100359538"}]}
;; clj-mutate-manifest-end
