(ns acceptance.steps.schema-specification-example-selection
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/data-layer-schema-specification-example-selection.feature" "features/data-layer-schema-specification-example-selection-runtime.feature"])
(def entry-modes {"the specification builder is open for Generic pageview revision 4" :model "the built extension side panel is running with the production specification builder, rules, documentation, and clipboard controls" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(def model-values
  {"source_choice" #{"Documentation 24" "Allowed value 12" "Allowed value 24" "Custom value 18" "Blank"}
   "preview_value" #{"24" "12" "18" "blank"}
   "selected_source" #{"Documentation 24" "Allowed value 12" "Allowed value 24" "Custom value" "Blank"}})

(def runtime-values
  {"source_choice" #{"Documentation 24" "Allowed value 12" "Custom value 18" "Blank"}
   "preview_value" #{"24" "12" "18" "an empty cell"}})

(def model-relations
  [{:keys ["source_choice" "preview_value" "selected_source"]
    :rows #{["Documentation 24" "24" "Documentation 24"]
            ["Allowed value 12" "12" "Allowed value 12"]
            ["Allowed value 24" "24" "Allowed value 24"]
            ["Custom value 18" "18" "Custom value"]
            ["Blank" "blank" "Blank"]}}])

(def runtime-relations
  [{:keys ["source_choice" "preview_value"]
    :rows #{["Documentation 24" "24"]
            ["Allowed value 12" "12"]
            ["Custom value 18" "18"]
            ["Blank" "an empty cell"]}}])

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified? "Specification example selection model verification failed. "
   "npm" "run" "test:unit:schema-specification-example-selection"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_SPECIFICATION_EXAMPLE_SELECTION_BROWSER_ADAPTER"
    :observation-key :schemaSpecificationExampleSelection
    :runtime-error "Specification example selection browser runtime failed."
    :missing-error "Specification example selection browser evidence is missing."}))

(defn- validate-example! [mode example]
  (support/validate-mode-example!
   mode runtime-values model-values runtime-relations model-relations example
   "Specification example selection value is outside the approved domain."
   "Specification example selection columns describe an invalid relation."))

(defn- assert-runtime! [observed]
  (support/assert!
   (and (= {:open true :focused true :handled true} (:keyboardActivation observed))
        (true? (:radioKeyNotTrapped observed))
        (true? (:unchanged observed))
        (empty? (:runtimeErrors observed)))
   "Specification example selection browser evidence was incomplete."
   observed)
  observed)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-specification-example-selection-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T16:15:48.882911337+02:00", :module-hash "29821282", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "32393143"} {:id "def/feature-files", :kind "def", :line 4, :end-line 4, :hash "-1646265169"} {:id "def/entry-modes", :kind "def", :line 5, :end-line 5, :hash "-739199593"} {:id "form/3/defonce", :kind "defonce", :line 6, :end-line 6, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 7, :end-line 7, :hash "-1618529344"} {:id "def/model-values", :kind "def", :line 9, :end-line 12, :hash "-1179393329"} {:id "def/runtime-values", :kind "def", :line 14, :end-line 16, :hash "-1474659293"} {:id "def/model-relations", :kind "def", :line 18, :end-line 24, :hash "1452687130"} {:id "def/runtime-relations", :kind "def", :line 26, :end-line 31, :hash "-664632975"} {:id "defn-/verify-model!", :kind "defn-", :line 33, :end-line 36, :hash "1408423012"} {:id "defn-/runtime-observation!", :kind "defn-", :line 38, :end-line 44, :hash "2022594984"} {:id "defn-/validate-example!", :kind "defn-", :line 46, :end-line 50, :hash "-1661675977"} {:id "defn-/assert-runtime!", :kind "defn-", :line 52, :end-line 60, :hash "-1965228408"} {:id "def/handlers", :kind "def", :line 62, :end-line 65, :hash "-1375593612"}]}
;; clj-mutate-manifest-end
