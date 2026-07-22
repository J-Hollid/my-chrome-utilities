(ns acceptance.steps.flow-graph
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-directional-flow-specification-graph.feature"
   "features/data-layer-directional-flow-specification-graph-runtime.feature"])
(def entry-modes
  {"Shop project contains Page Groups Checkout, Delivery, and Confirmation" :model
   "the built extension is running with the production project repository and Specification Flow editor" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- checked-command! [message & command]
  (let [result (apply process/shell {:out :string :err :string} command)]
    (support/assert! (zero? (:exit result)) (str message " " (:err result)) {:out (:out result)})
    result))
(defn- verify-model! []
  (when-not @model-verified?
    (checked-command! "Flow graph projection verification failed." "node" "test/data-layer-flow-graph-test.mjs")
    (checked-command! "Flow graph persistence verification failed." "node" "test/data-layer-flow-graph-persistence-test.mjs")
    (checked-command! "Flow Page-context model verification failed." "node" "test/data-layer-flow-page-context-model-test.mjs")
    (reset! model-verified? true)))
(defn- observe-browser! []
  (or @browser-observation
      (let [result (checked-command! "Flow graph browser adapter failed." "node" "test/browser-packs/flow-graph.mjs")
            line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
            observed (:flowGraph (json/parse-string line true))]
        (support/assert! observed "Flow graph browser evidence is missing." {:out (:out result)})
        (reset! browser-observation observed))))
(def runtime-evidence-keys
  (set (map #(keyword (format "runtime%03d" %)) (range 1 22))))
(def required-evidence-keys (conj runtime-evidence-keys :installedBoundary))
(def runtime009-examples
  {["Customer details Page" "Payment Page" "Page context progression"] :pageContextProgression
   ["Customer details Page" "Customer details add_payment_info" "Event expected within the Page"] :eventExpectedWithinPage
   ["Customer details add_payment_info" "Payment Page" "Event leads to the next Page"] :eventLeadsToNextPage
   ["Customer details page_view" "Customer details add_payment_info" "Event interaction progression"] :eventInteractionProgression})
(defn runtime009-example-key [example]
  (let [row (mapv #(support/example-value example %) ["source" "target" "meaning"])]
    (when (some identity row)
      (support/assert! (contains? runtime009-examples row) "Unknown runtime009 endpoint example." {:row row})
      (get runtime009-examples row))))
(defn validate-example! [_mode example]
  (runtime009-example-key example)
  true)
(defn all-true? [values]
  (boolean (and (map? values) (seq values) (every? true? (vals values)))))
(defn complete-browser-evidence? [evidence]
  (boolean
   (and (map? evidence)
        (= required-evidence-keys (set (keys evidence)))
        (true? (:installedBoundary evidence))
        (every? #(all-true? (get evidence %)) runtime-evidence-keys))))
(defn- assert-runtime! [evidence]
  (support/assert! (complete-browser-evidence? evidence) "Installed graph evidence is incomplete or contains a false value." evidence)
  (doseq [runtime-key (sort runtime-evidence-keys)]
    (support/assert! (all-true? (get evidence runtime-key))
                     (str "Installed graph evidence failed for " (name runtime-key) ".")
                     (get evidence runtime-key))))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :flow-graph-mode
   verify-model! validate-example!
   observe-browser! assert-runtime!))
