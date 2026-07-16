(ns acceptance.steps.schema-specification-builder-customization
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-schema-specification-builder-customization.feature"
   "features/data-layer-schema-specification-builder-customization-runtime.feature"])
(def entry-modes
  {"the specification builder is open for Generic pageview revision 4" :model
   "the built extension side panel is running with the production specification builder and clipboard controls" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(def model-values
  {"heading_setting" #{"selected" "cleared"}
   "first_line" #{"the current preview headings" "the first selected property row without headings"}
   "table_style" #{"Plain" "Bordered" "Bordered with highlighted headings"}
   "presentation" #{"no added borders or heading highlight"
                    "visible table and cell borders with readable cell padding"
                    "visible borders and padding plus bold shaded column headings"}
   "example_choice" #{"Documentation" "Allowed value 12" "Custom value 18" "Blank"}
   "preview_value" #{"24" "12" "18" "blank"}})

(def runtime-values
  {"copy_mode" #{"Spreadsheet" "Rich table for Confluence or Jira"}
   "heading_setting" #{"selected" "cleared"}
   "clipboard_output" #{"tab-separated plain text beginning with headings"
                        "tab-separated plain text beginning with the first row"
                        "rich HTML and matching headed plain-text fallback"
                        "rich HTML and matching unheaded plain-text fallback"}
   "table_style" #{"Plain" "Bordered" "Bordered with highlighted headings"}
   "style_evidence" #{"semantic table markup without added presentation"
                      "inline borders and cell padding"
                      "inline borders, padding, and emphasized headings"}
   "example_choice" #{"Documentation" "Allowed value 12" "Custom value 18" "Blank"}
   "preview_value" #{"24" "12" "18" "an empty cell"}})

(def model-relations
  [{:keys ["heading_setting" "first_line"]
    :rows #{["selected" "the current preview headings"]
            ["cleared" "the first selected property row without headings"]}}
   {:keys ["table_style" "presentation"]
    :rows #{["Plain" "no added borders or heading highlight"]
            ["Bordered" "visible table and cell borders with readable cell padding"]
            ["Bordered with highlighted headings" "visible borders and padding plus bold shaded column headings"]}}
   {:keys ["example_choice" "preview_value"]
    :rows #{["Documentation" "24"]
            ["Allowed value 12" "12"]
            ["Custom value 18" "18"]
            ["Blank" "blank"]}}])

(def runtime-relations
  [{:keys ["copy_mode" "heading_setting" "clipboard_output"]
    :rows #{["Spreadsheet" "selected" "tab-separated plain text beginning with headings"]
            ["Spreadsheet" "cleared" "tab-separated plain text beginning with the first row"]
            ["Rich table for Confluence or Jira" "selected" "rich HTML and matching headed plain-text fallback"]
            ["Rich table for Confluence or Jira" "cleared" "rich HTML and matching unheaded plain-text fallback"]}}
   {:keys ["table_style" "style_evidence"]
    :rows #{["Plain" "semantic table markup without added presentation"]
            ["Bordered" "inline borders and cell padding"]
            ["Bordered with highlighted headings" "inline borders, padding, and emphasized headings"]}}
   {:keys ["example_choice" "preview_value"]
    :rows #{["Documentation" "24"]
            ["Allowed value 12" "12"]
            ["Custom value 18" "18"]
            ["Blank" "an empty cell"]}}])

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified? "Specification builder UI model verification failed. "
   "npm" "run" "test:unit:schema-specification-builder-ui"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER"
    :observation-key :schemaSpecificationBuilderCustomization
    :runtime-error "Specification customization browser runtime failed."
    :missing-error "Specification customization browser evidence is missing."}))

(defn- validate-example! [mode example]
  (support/validate-mode-example!
   mode runtime-values model-values runtime-relations model-relations example
   "Specification customization example value is outside the approved domain."
   "Specification customization example columns describe an invalid relation."))

(defn- assert-runtime! [observed]
  (support/assert!
   (and (= {:spreadsheet true :headings true :styleHidden true :bars 1} (:defaults observed))
        (= "12" (:example observed))
        (true? (:unchanged observed))
        (true? (get-in observed [:extended :previewStillVisible]))
        (empty? (:runtimeErrors observed))
        (empty? (get-in observed [:extended :runtimeErrors])))
   "Specification customization browser evidence was incomplete."
   observed)
  observed)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-specification-builder-customization-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T16:15:28.463430386+02:00", :module-hash "1586449233", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "1542045251"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-235259142"} {:id "def/entry-modes", :kind "def", :line 7, :end-line 9, :hash "-892751608"} {:id "form/3/defonce", :kind "defonce", :line 10, :end-line 10, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 11, :end-line 11, :hash "-1618529344"} {:id "def/model-values", :kind "def", :line 13, :end-line 21, :hash "-450344569"} {:id "def/runtime-values", :kind "def", :line 23, :end-line 35, :hash "226255940"} {:id "def/model-relations", :kind "def", :line 37, :end-line 49, :hash "-1726031884"} {:id "def/runtime-relations", :kind "def", :line 51, :end-line 65, :hash "827915800"} {:id "defn-/verify-model!", :kind "defn-", :line 67, :end-line 70, :hash "-1111990631"} {:id "defn-/runtime-observation!", :kind "defn-", :line 72, :end-line 78, :hash "85583756"} {:id "defn-/validate-example!", :kind "defn-", :line 80, :end-line 84, :hash "736620270"} {:id "defn-/assert-runtime!", :kind "defn-", :line 86, :end-line 96, :hash "-1518630636"} {:id "def/handlers", :kind "def", :line 98, :end-line 101, :hash "-2021988731"}]}
;; clj-mutate-manifest-end
