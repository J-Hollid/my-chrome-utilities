(ns acceptance.steps.flow-table-documentation-export
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-flow-table-documentation-export.feature"
   "features/data-layer-flow-table-documentation-export-runtime.feature"])
(def entry-modes
  {"Checkout journey relates Cart, Shipping, Payment, and Confirmation context-setting Page events" :model
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

(def flow-export-example-relations
  [{:keys ["definition" "display" "detail"]
    :rows #{["fixed to checkout" "checkout" "exact effective value and provenance"]
            ["allowed to be guest or logged_in" "guest or logged_in" "both allowed values and provenance"]
            ["required without an expected value" "Required value not specified" "missing documentation value"]
            ["fixed to active when form_name exists" "active when form_name exists" "structured condition and provenance"]
            ["forbidden" "Not expected" "forbidden rule and provenance"]
            ["blocked by conflicting definitions" "Blocked conflicting definitions" "both contributors and direct repair links"]}}
   {:keys ["view" "heading_setting" "copy_mode" "output"]
    :rows #{["Flow value map" "selected" "Spreadsheet" "headed tab-separated plain text"]
            ["Flow value map" "cleared" "Spreadsheet" "unheaded tab-separated plain text"]
            ["Data capture matrix" "selected" "Rich table for Confluence or Jira" "semantic rich HTML and headed plain fallback"]
            ["Data capture matrix" "cleared" "Rich table for Confluence or Jira" "semantic rich HTML and unheaded plain fallback"]}}])

(defn validate-example! [_mode example]
  (support/validate-example-relations!
   flow-export-example-relations example
   "Flow documentation export example columns describe an invalid result."))

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
   verify-model! validate-example!
   observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-24T02:12:36.645489728+02:00", :module-hash "-238953540", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-1271057094"} {:id "def/feature-files", :kind "def", :line 7, :end-line 9, :hash "2122027433"} {:id "def/entry-modes", :kind "def", :line 10, :end-line 12, :hash "-769878090"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 16, :end-line 19, :hash "938963528"} {:id "defn-/verify-model!", :kind "defn-", :line 21, :end-line 25, :hash "-1344676620"} {:id "defn-/observe-browser!", :kind "defn-", :line 27, :end-line 34, :hash "1213556044"} {:id "def/flow-export-example-relations", :kind "def", :line 36, :end-line 48, :hash "564215971"} {:id "defn/validate-example!", :kind "defn", :line 50, :end-line 53, :hash "1985321309"} {:id "def/runtime-paths", :kind "def", :line 55, :end-line 57, :hash "4462164"} {:id "defn-/assert-runtime!", :kind "defn-", :line 59, :end-line 63, :hash "234435999"} {:id "def/handlers", :kind "def", :line 65, :end-line 69, :hash "-915256383"}]}
;; clj-mutate-manifest-end
