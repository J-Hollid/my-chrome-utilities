(ns acceptance.steps.flow-table-documentation-export
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-flow-table-documentation-export.feature"
   "features/data-layer-flow-table-documentation-export-runtime.feature"
   "features/data-layer-project-documentation-workspace.feature"
   "features/data-layer-project-documentation-workspace-runtime.feature"
   "features/data-layer-documentation-template-library.feature"
   "features/data-layer-documentation-template-library-runtime.feature"
   "features/data-layer-excel-documentation-templates.feature"
   "features/data-layer-excel-documentation-templates-runtime.feature"
   "features/data-layer-rich-page-documentation-templates.feature"
   "features/data-layer-rich-page-documentation-templates-runtime.feature"])
(def entry-modes
  {"Checkout journey relates Cart, Shipping, Payment, and Confirmation context-setting Page events" :model
   "the built extension is running with the production Flow editor, canonical compiler, table exporter, clipboard, and download adapter" :runtime
   "Shop contains Checkout journey and Article journey Flows" :model
   "the built extension is running with the production project repository, canonical compiler, documentation renderer, clipboard, and Excel adapter" :runtime
   "Shop has Documentation Set Client specification with Overview, two Flow sections, one Data capture matrix, and two Site Profile sections" :model
   "Shop has configured Overview, Flow, Data capture matrix, and Site Profile documentation sections" :model
   "the built extension is running with the production project repository, documentation compiler, template asset store, portable archive, clipboard, and download adapters" :runtime
   "the built extension is running with the production Documentation workspace, template parser, OOXML renderer, project asset store, and download adapter" :runtime
   "the built extension is running with the production Documentation workspace, rich template editor, renderer, clipboard, and project repository" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Flow documentation export model verification failed. "
   "node" "test/data-layer-documentation-template-acceptance-test.mjs"))

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
    :rows #{["Generic checkout page" "Customer details" "Payment" "Summary" "Confirmation"]}}
   {:keys ["scope" "checklist_state" "summary"]
    :rows #{["Current section" "hidden" "1 section — Checkout journey"]
            ["Choose sections" "shown" "2 sections — Checkout journey, Sitewide"]
            ["Complete Documentation Set" "hidden" "6 sections — the complete configured Documentation Set"]}}
   {:keys ["export_action" "output"]
    :rows #{["Copy rich documentation" "rich clipboard content"]
            ["Download Excel workbook" "an Excel workbook"]}}
   {:keys ["export_action" "output_evidence"]
    :rows #{["Copy rich documentation" "clipboard HTML and plain text"]
            ["Download Excel workbook" "parsed workbook headings"]}}
   {:keys ["viewport_width" "workspace_layout"]
    :rows #{["1280 pixels" "the Build outline and selected configuration are shown together"]
            ["360 pixels" "the Build outline and selected configuration open one at a time"]
            ["1280 pixels" "Build outline and selected configuration are simultaneously visible"]
            ["360 pixels" "Build outline and selected configuration are exposed as separate surfaces"]}}
   {:keys ["profile" "property_total" "selected_concept" "concept_total" "concept_included" "other_profile"]
    :rows #{["Sitewide" "312" "Commerce" "53" "47" "Opened Article"]
            ["Opened Article" "428" "Identity" "71" "64" "Sitewide"]}}
   {:keys ["template_name" "format" "kind"] :rows #{["Acme flow workbook" "Excel" "Flow"] ["Acme profile page" "Rich page" "Site Profile"]}}
   {:keys ["viewport_width" "library_layout"] :rows #{["1280 pixels" "the template list and selected detail appear together"] ["360 pixels" "the template list and selected detail open one at a time"]}}
   {:keys ["viewport_width" "rendered_layout"] :rows #{["1280 pixels" "list and detail are both visible"] ["360 pixels" "list and detail are mutually exclusive visible views"] ["1280 pixels" "outline and selected block detail are both visible"] ["360 pixels" "outline and selected block detail are exclusive views"]}}
   {:keys ["kind" "kind_key"] :rows #{["Overview" "overview"] ["Flow" "flow"] ["Data capture matrix" "matrix"] ["Site Profile" "profile"]}}
   {:keys ["invalid_content" "finding"] :rows #{["no tw:template Note" "Declare one Flow contract-version-1 template"] ["two worksheets" "Keep exactly one prototype worksheet"] ["an unknown root binding" "Identify the worksheet and cell binding"] ["a crossing repeat region" "Identify both conflicting directive cells"] ["a merge crossing a repeat boundary" "Keep the merge wholly inside or outside"] ["a formula" "Remove workbook formulas"] ["an external link or data connection" "Remove external workbook content"] ["a macro, add-in, embedded package, or linked object" "Use inert macro-free workbook content"]}}
   {:keys ["package_boundary" "diagnostic"] :rows #{["a source larger than 10 MiB" "The Excel template is too large"] ["more than 2000 ZIP entries" "The workbook has too many parts"] ["more than 50 MiB declared unpacked content" "The workbook expands beyond 50 MiB"] ["an unsafe or duplicate ZIP entry path" "The workbook package is unsafe"] ["encrypted or invalid OOXML content" "Choose a valid unencrypted .xlsx"] ["a broken or unsupported relationship" "Identify the unsupported workbook part"]}}
   {:keys ["invalid_boundary" "finding_location"] :rows #{["an unknown scoped binding" "its worksheet and cell"] ["crossing repeat rectangles" "both directive cells"] ["a formula and external workbook link" "the formula cell and relationship part"] ["an unsafe package entry and size overflow" "the package and violated limit"] ["encrypted or malformed OOXML" "the selected workbook"]}}
   {:keys ["kind"] :rows #{["Overview"] ["Flow"] ["Data capture matrix"] ["Site Profile"]}}
   {:keys ["kind" "visible_content"] :rows #{["Overview" "Name, Purpose, and Website fields in configured order"] ["Flow" "configured Flow columns, property rows, metadata, and literal values"] ["Data capture matrix" "configured contexts, concepts, property rows, presence marks, and legend"] ["Site Profile" "configured concepts, property rows, and selected Profile columns"]}}
   {:keys ["viewport_width" "editor_layout"] :rows #{["1280 pixels" "outline and selected block detail appear together"] ["360 pixels" "outline and selected block detail open one at a time"]}}])

(defn validate-example! [_mode example]
  (support/validate-example-relations!
   flow-export-example-relations example
   "Flow documentation export example columns describe an invalid result."))

(def runtime-paths
  (set (concat [:installedBoundary
                :headingLifecycleStart
                :orderingControls]
               [:documentationTemplates
                :documentationTemplateStarters
                :documentationTemplateExcel
                :documentationTemplateSample
                :documentationTemplateStale
                :documentationTemplateValidation
                :documentationTemplateRichEditor
                :documentationTemplateReload]
               (map #(keyword (str "export" (format "%03d" %))) (range 1 35)))))

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
;; {:version 1, :tested-at "2026-08-16T16:30:36.914355436+02:00", :module-hash "-452938051", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "44459659"} {:id "def/feature-files", :kind "def", :line 4, :end-line 8, :hash "-335733992"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 13, :hash "210832218"} {:id "form/3/defonce", :kind "defonce", :line 14, :end-line 14, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 15, :end-line 15, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 17, :end-line 21, :hash "-729194422"} {:id "defn-/observe-browser!", :kind "defn-", :line 23, :end-line 29, :hash "1774642844"} {:id "def/flow-export-example-relations", :kind "def", :line 31, :end-line 93, :hash "24754807"} {:id "defn/validate-example!", :kind "defn", :line 95, :end-line 98, :hash "1985321309"} {:id "def/runtime-paths", :kind "def", :line 100, :end-line 104, :hash "-1752141396"} {:id "defn-/assert-runtime!", :kind "defn-", :line 106, :end-line 110, :hash "234435999"} {:id "def/handlers", :kind "def", :line 112, :end-line 116, :hash "-915256383"}]}
;; clj-mutate-manifest-end
