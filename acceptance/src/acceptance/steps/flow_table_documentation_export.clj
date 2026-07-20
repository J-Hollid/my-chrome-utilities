(ns acceptance.steps.flow-table-documentation-export
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-flow-table-documentation-export.feature"
   "features/data-layer-flow-table-documentation-export-runtime.feature"])
(def entry-modes
  {"Checkout journey contains Cart page_view, Shipping add_shipping_info, Payment add_payment_info, and Confirmation purchase contexts" :model
   "the built extension is running with the production Flow editor, canonical compiler, table exporter, clipboard, and download adapter" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- checked! [message & command]
  (let [result (apply process/shell {:out :string :err :string} command)]
    (support/assert! (zero? (:exit result)) (str message " " (:err result)) {:out (:out result)})
    result))

(defn- verify-model! []
  (when-not @model-verified?
    (checked! "Flow documentation export model verification failed."
              "node" "test/data-layer-flow-table-documentation-export-test.mjs")
    (reset! model-verified? true)))

(defn- observe-browser! []
  (or @browser-observation
      (let [result (checked! "Flow documentation export browser adapter failed."
                             "node" "test/browser-packs/flow-table-documentation-export.mjs")
            line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
            observed (:flowExport (json/parse-string line true))]
        (support/assert! observed "Flow documentation export browser evidence is missing." {:out (:out result)})
        (reset! browser-observation observed))))

(def runtime-paths
  (set (concat [:installedBoundary]
               (map #(keyword (str "export" (format "%03d" %))) (range 1 15)))))

(defn- assert-runtime! [evidence]
  (support/assert! (and (= runtime-paths (set (keys evidence)))
                        (every? true? (vals evidence)))
                   "Installed Flow documentation export evidence is incomplete."
                   evidence))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :flow-documentation-export-mode
   verify-model! (fn [_mode _example] true)
   observe-browser! assert-runtime!))
