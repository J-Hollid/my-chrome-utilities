(ns acceptance.steps.schema-property-comments
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-schema-property-comments.feature"
   "features/data-layer-schema-property-comments-runtime.feature"])

(def entry-modes
  {"Product detail revision 3 declares /products/*/product_id and /page_type" :model
   "the built extension side panel is running with production schema documentation, Live inspection, specification building, and clipboard controls" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Schema property comments model verification failed. "
   "npm" "run" "test:unit:schema-property-comments"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_PROPERTY_COMMENTS_BROWSER_ADAPTER"
    :observation-key :schemaPropertyComments
    :runtime-error "Schema property comments browser runtime failed."
    :missing-error "Schema property comments browser evidence is missing."}))

(defn- assert-runtime! [{:keys [saved reopened publishedUnchanged headings cells clipboard runtimeErrors removalWorkflow lifecycle live specification] :as observed}]
  (support/assert!
   (and (= "Sent by checkout\nDo not derive from position" saved reopened)
        publishedUnchanged
        (= "Comments" (last headings))
        (= saved (last cells))
        (str/includes? (:html clipboard) "Sent by checkout<br>Do not derive from position")
        (str/includes? (:plain clipboard) "Allowed values\tComments"))
   "The production documentation editor did not preserve canonical multiline comments or builder output."
   observed)
  (support/assert!
   (and (:requested removalWorkflow)
        (str/includes? (:summary removalWorkflow) "property and validation rules remain unchanged")
        (= "Only local comment" (get-in removalWorkflow [:cancelled :retained]))
        (nil? (get-in removalWorkflow [:confirmed :removed]))
        (= "number" (get-in removalWorkflow [:confirmed :propertyType]))
        (get-in removalWorkflow [:confirmed :rulesUnchanged]))
   "Comments-only removal did not use the existing confirmation and cancellation boundary."
   removalWorkflow)
  (support/assert!
   (and (= {:local "Checkout currency exception"
            :localOwner "Product detail"
            :restored "Shared currency convention"
            :restoredOwner "Generic commerce"
            :restoredInherited true
            :parentUnchanged true
            :pathCount 1}
           (:inheritance lifecycle))
        (= "Current routing input" (get-in lifecycle [:revisions :current]))
        (= "Legacy routing input" (get-in lifecycle [:revisions :historical]))
        (= 4 (get-in lifecycle [:revisions :currentVersion]))
        (= 3 (get-in lifecycle [:revisions :historicalVersion]))
        (= saved (get-in lifecycle [:duplicate :local]))
        (= saved (get-in lifecycle [:copy :stored]))
        (= saved (get-in lifecycle [:removal :restored]))
        (= "" (get-in lifecycle [:persistence :legacyBlank])))
   "Comment inheritance, revisions, duplication, copy, persistence, removal, or Undo lost provenance."
   lifecycle)
  (support/assert!
   (and (:searchMatched live)
        (= "/products/2/product_name" (:wildcardPath live))
        (:collapsedUnchanged live)
        (:inert live)
        (:payloadUnchanged live)
        (:validationUnchanged live)
        (= "/products/2/product_id" (get-in live [:missing :path]))
        (str/includes? (get-in live [:missing :comments]) "Missing identifier comment"))
   "Live observed or missing wildcard comments changed presentation, payload, or validation semantics."
   live)
  (support/assert!
   (and (= "Working page comment" (get-in specification [:working :page]))
        (= "Inherited site comment" (get-in specification [:working :inherited]))
        (= "Historical legacy comment" (get-in specification [:historical :legacy]))
        (= ["Property name" "Description" "Mandatory" "Type" "Comments" "Example value" "Allowed values"] (:reordered specification))
        (= (:reordered specification) (:afterMode specification) (:afterExample specification))
        (= ["Property name" "Description" "Mandatory" "Type" "Example value" "Allowed values" "Comments"] (:reset specification))
        (str/includes? (get-in specification [:headed :html]) "First line<br>Second")
        (not (str/includes? (get-in specification [:headed :html]) "<script>"))
        (not (str/includes? (get-in specification [:unheaded :html]) "<thead>"))
        (str/includes? (:fallback specification) "Type\tComments\tExample value")
        (:inert specification)
        (empty? (:runtimeErrors specification))
        (empty? runtimeErrors))
   "Specification comments, column order, headings, escaping, or clipboard fallback were incorrect."
   specification)
  observed)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-property-comments-mode
   verify-model! (fn [_ _] true) runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T10:55:57.759346209+02:00", :module-hash "-1895915855", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1950240290"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "728336328"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-1427549410"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 20, :hash "838611685"} {:id "defn-/runtime-observation!", :kind "defn-", :line 22, :end-line 28, :hash "-127244502"} {:id "defn-/assert-runtime!", :kind "defn-", :line 30, :end-line 95, :hash "2097001855"} {:id "def/handlers", :kind "def", :line 97, :end-line 100, :hash "-354253571"}]}
;; clj-mutate-manifest-end
