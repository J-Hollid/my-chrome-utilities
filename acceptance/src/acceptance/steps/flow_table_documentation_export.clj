(ns acceptance.steps.flow-table-documentation-export
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-flow-table-documentation-export.feature"
   "features/data-layer-flow-table-documentation-export-runtime.feature"
   "features/data-layer-project-documentation-workspace.feature"
   "features/data-layer-project-documentation-workspace-runtime.feature"])
(def entry-modes
  {"Checkout journey relates Cart, Shipping, Payment, and Confirmation context-setting Page events" :model
   "the built extension is running with the production Flow editor, canonical compiler, table exporter, clipboard, and download adapter" :runtime
   "Shop contains Checkout journey and Article journey Flows" :model
   "the built extension is running with the production project repository, canonical compiler, documentation renderer, clipboard, and Excel adapter" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Flow documentation export model verification failed. "
   "node" "test/data-layer-project-documentation-workspace-test.mjs"))

(defn- observe-browser! []
  (support/cached-command-observation!
   browser-observation
   {:command ["node" "test/browser-packs/flow-table-documentation-export.mjs"]
    :observation-key :flowExport
    :runtime-error "Flow documentation export browser adapter failed."
    :missing-error "Flow documentation export browser evidence is missing."}))

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
            ["Data capture matrix" "cleared" "Rich table for Confluence or Jira" "semantic rich HTML and unheaded plain fallback"]}}
   {:keys ["export_scope" "expected_sheets"]
    :rows #{["current Checkout journey section" "Checkout journey"]
            ["selected Checkout journey and Sitewide sections" "Checkout journey, Sitewide"]
            ["complete Documentation Set" "Overview, Checkout journey, Article journey, Data capture matrix, Sitewide, Opened Article"]}}
   {:keys ["headings" "heading_result"]
    :rows #{["on" "rendered once before each non-empty concept"]
            ["off" "absent while concept filtering remains active"]
            ["on" "one heading for each non-empty included group"]
            ["off" "no headings"]}}
   {:keys ["image_type" "media_type"]
    :rows #{["PNG" "image/png"]
            ["JPEG" "image/jpeg"]
            ["GIF" "image/gif"]}}
   {:keys ["image_type" "export_scope"]
    :rows #{["PNG" "current section"]
            ["PNG" "selected sections"]
            ["PNG" "complete set"]
            ["JPEG" "complete set"]
            ["GIF" "complete set"]}}
   {:keys ["invalid_logo" "diagnostic"]
    :rows #{["an SVG file" "Choose a PNG, JPEG, or GIF image"]
            ["a file whose image data cannot be read" "The logo could not be read"]
            ["a file that produces an image-read failure" "The logo could not be read"]
            ["an image whose converted data URL exceeds 250000 characters" "The logo is too large"]}}
   {:keys ["declared_type" "diagnostic"]
    :rows #{["PNG" "Choose a valid PNG image"]
            ["JPEG" "Choose a valid JPEG image"]
            ["GIF" "Choose a valid GIF image"]}}
   {:keys ["instance_count" "source_page" "first_name" "second_name" "third_name" "fourth_name"]
    :rows #{["4" "Generic checkout page" "Customer details" "Payment" "Summary" "Confirmation"]}}
   {:keys ["source_page" "first_name" "second_name" "third_name" "fourth_name"]
    :rows #{["Generic checkout page" "Customer details" "Payment" "Summary" "Confirmation"]}}])

(defn validate-example! [_mode example]
  (support/validate-example-relations!
   flow-export-example-relations example
   "Flow documentation export example columns describe an invalid result."))

(def runtime-paths
  (set (concat [:installedBoundary
                :headingLifecycleStart
                :orderingControls]
               (map #(keyword (str "export" (format "%03d" %))) (range 1 31)))))

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
;; {:version 1, :tested-at "2026-08-04T10:52:21.358263089+02:00", :module-hash "1394112264", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "44459659"} {:id "def/feature-files", :kind "def", :line 4, :end-line nil, :hash "-335733992"} {:id "def/entry-modes", :kind "def", :line 9, :end-line nil, :hash "210832218"} {:id "form/3/defonce", :kind "defonce", :line 14, :end-line nil, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 15, :end-line nil, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 17, :end-line nil, :hash "-729194422"} {:id "defn-/observe-browser!", :kind "defn-", :line 23, :end-line nil, :hash "1774642844"} {:id "def/flow-export-example-relations", :kind "def", :line 31, :end-line nil, :hash "1720611054"} {:id "defn/validate-example!", :kind "defn", :line 77, :end-line nil, :hash "1985321309"} {:id "def/runtime-paths", :kind "def", :line 82, :end-line nil, :hash "1042883056"} {:id "defn-/assert-runtime!", :kind "defn-", :line 88, :end-line nil, :hash "234435999"} {:id "def/handlers", :kind "def", :line 94, :end-line nil, :hash "-915256383"}]}
;; clj-mutate-manifest-end
