(ns acceptance.steps.schema-specification-builder
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/data-layer-schema-specification-builder.feature"
                    "features/data-layer-schema-specification-builder-runtime.feature"])
(def entry-modes
  {"Generic pageview revision 4 declares documented root, nested object, and object-array properties" :model
   "the built extension side panel is running with the production Schema Library, schema editor, documentation, validation rules, inheritance, and clipboard controls" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Schema specification builder model verification failed. "
   "npm" "run" "test:unit:schema-specification-builder"))
(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_SPECIFICATION_BUILDER_BROWSER_ADAPTER"
    :observation-key :schemaSpecificationBuilder
    :runtime-error "Schema specification builder browser runtime failed."
    :missing-error "Schema specification builder browser evidence is missing."}))

(def model-values
  {"schema_surface" #{"Schema Library revision 4" "schema editor working draft" "revision history revision 2"}
   "source_label" #{"published revision 4" "working draft based on revision 4" "historical revision 2"}
   "canonical_path" #{"/page_type" "/commerce/currency" "/products" "/products/*/product_name"
                      "/products/*/duration" "/site_id inherited from Base event"
                      "/tracking_context without a type"}
   "property_name" #{"page_type" "commerce.currency" "products" "products[].product_name"
                     "products[].duration" "site_id" "tracking_context"}
   "description" #{"Page classification" "Transaction currency" "Products in the event"
                   "Displayed product name" "Contract duration in months" "Site identifier"
                   "Tracking integration context"}
   "mandatory" #{"Yes" "Yes when commerce exists" "No" "Yes when a products item exists"
                 "Yes when price_monthly exists for the same products item"}
   "data_type" #{"String" "Array of Object" "Number" "Unspecified"}
   "example_value" #{"product_detail" "EUR" "blank" "Phone" "24" "otelo"}
   "allowed_values" #{"product_detail and product_list" "EUR and GBP" "no values" "12 and 24"
                      "otelo, hollandsnieuwe, and ben"}
   "comments" #{"Used for page routing" "ISO 4217 code" "One row per product"
                "Customer-facing label" "Whole months" "Shared across events" "blank"}})

(def runtime-values
  {"entry_point" #{"Schema Library" "working-draft schema editor" "revision history"}
   "source_label" #{"published revision 4" "working draft based on revision 4" "historical revision 2"}
   "canonical_path" #{"/page_type" "/commerce/currency" "/products" "/products/*/duration" "/tracking_context"}
   "property_name" #{"page_type" "commerce.currency" "products" "products[].duration" "tracking_context"}
   "mandatory" #{"Yes" "Yes when commerce exists" "No"
                 "Yes when price_monthly exists for the same products item"}
   "data_type" #{"String" "Array of Object" "Number" "Unspecified"}
   "allowed_values" #{"product_detail and product_list" "EUR and GBP" "no values" "12 and 24"}
   "comments" #{"Used for page routing" "ISO 4217 code" "One row per product" "Whole months" "blank"}})

(defn- validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode runtime-values model-values example
   "Schema specification builder example is outside the verified contract."))

(defn- assert-runtime! [{:keys [entryPoints headings defaults hierarchy filtered selection cases completeness clipboard fallback selectionUnchanged unchanged runtimeErrors] :as observed}]
  (support/assert!
   (and (every? true? (mapcat (fn [[_ {:keys [visible focus]}]] [visible focus]) entryPoints))
        (= "published revision 4" (get-in entryPoints [:library :source]))
        (= "working draft based on revision 4" (get-in entryPoints [:editor :source]))
        (= "historical revision 2" (get-in entryPoints [:historical :source]))
        (some #{"/draft_only"} (get-in entryPoints [:editor :paths]))
        (some #{"/legacy"} (get-in entryPoints [:historical :paths])))
   "The production entry points did not expose their immutable schema surfaces or restore focus."
   entryPoints)
  (support/assert!
   (and (= ["Property name" "Description" "Mandatory" "Type" "Example value" "Allowed values" "Comments"] headings)
        (= {:leaves [true true true] :containers [false false]} defaults)
        (= "/products" (:durationParent hierarchy))
        (:legacyAbsent hierarchy)
        (= ["/products" "/products/*/duration"] filtered)
        (= ["/products"] (:containerOnly selection))
        (= ["/products/*/duration"] (:descendantOnly selection)))
   "The production selector did not preserve hierarchy, defaults, filtering, or independent selection."
   observed)
  (support/assert!
   (and (= ["page_type" "Page classification" "Yes" "String" "product_detail" "product_detail | product_list" "Used for page routing"] (:pageType cases))
        (= "Yes when commerce exists" (get-in cases [:currency 2]))
        (= "ISO 4217 code" (get-in cases [:currency 6]))
        (= "Yes when a products item exists" (get-in cases [:productName 2]))
        (= "Yes when price_monthly exists for the same products item" (get-in cases [:duration 2]))
        (= "Whole months" (get-in cases [:duration 6]))
        (= "Unspecified" (get-in cases [:tracking 3]))
        (= "otelo | hollandsnieuwe | ben" (get-in cases [:site 5]))
        (re-find #"Conflict" (get-in cases [:conflict 5]))
        (re-find #"1 missing examples" completeness))
   "The production preview did not derive effective documentation, rules, types, conflicts, or completeness."
   observed)
  (support/assert!
   (and (= ["text/html" "text/plain"] (:types clipboard))
        (re-find #"<table>" (:html clipboard))
        (re-find #"<br>" (:html clipboard))
        (re-find #"&lt;tag &amp; &quot;quote&quot;&gt;" (:html clipboard))
        (= (:plain clipboard) (:plain fallback))
        (re-find #"copied plain text" (:feedback fallback))
        selectionUnchanged unchanged (empty? runtimeErrors))
   "Clipboard output, fallback, immutability, or browser runtime behavior was incorrect."
   observed)
  observed)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-specification-builder-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T10:56:28.191033399+02:00", :module-hash "-105857437", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-817787331"} {:id "def/feature-files", :kind "def", :line 4, :end-line 5, :hash "-929386589"} {:id "def/entry-modes", :kind "def", :line 6, :end-line 8, :hash "2017366871"} {:id "form/3/defonce", :kind "defonce", :line 9, :end-line 9, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 10, :end-line 10, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 11, :end-line 15, :hash "1166323297"} {:id "defn-/runtime-observation!", :kind "defn-", :line 16, :end-line 22, :hash "-980239240"} {:id "def/model-values", :kind "def", :line 24, :end-line 42, :hash "88513631"} {:id "def/runtime-values", :kind "def", :line 44, :end-line 53, :hash "-1777363436"} {:id "defn-/validate-example!", :kind "defn-", :line 55, :end-line 58, :hash "520558861"} {:id "defn-/assert-runtime!", :kind "defn-", :line 60, :end-line 103, :hash "-1465174977"} {:id "def/handlers", :kind "def", :line 105, :end-line 108, :hash "1565602464"}]}
;; clj-mutate-manifest-end
