(ns acceptance.steps.schema-property-filter-sort
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-schema-property-filtering-sorting.feature"
   "features/data-layer-schema-property-filtering-sorting-runtime.feature"])
(def entry-steps
  #{"schema Page view working draft is open in the schema editor"
    "its property tree contains page_type, commerce.order.id, and products"
    "the built extension side panel is running with the production Schema Library, schema editor, property tree, rules, documentation, and persistence"})
(defonce ^:private observation (atom nil))

(defn- browser-observation! []
  (support/cached-browser-observation!
   observation
   {:adapter-env "SCHEMA_PROPERTY_FILTER_SORT_BROWSER_ADAPTER"
    :observation-key :schemaPropertyFilterSort
    :runtime-error "Schema property filtering and sorting browser runtime failed."
    :missing-error "Schema property filtering and sorting browser observation is missing."}))

(defn- comma-values [value]
  (if (= value "none") [] (str/split value #",\s*")))

(defn- assert-filter-example! [example observed]
  (when-let [query (support/example-value example "query")]
    (let [view (get-in observed [:filtered (keyword query)])
          expected-matches (comma-values (support/require-example example "matching_rows"))
          expected-contexts (comma-values (support/require-example example "context_rows"))]
      (support/assert!
       (= [(vec (concat expected-contexts expected-matches))
           expected-contexts
           (support/require-example example "result_status")
           0]
          [(:paths view) (:contexts view) (:status view) (:hiddenActions view)])
       "Filtered canonical rows, context, status, or hidden actions changed."
       {:example example :view view}))))

(defn- canonical-roots [value]
  (mapv #(str "/" %) (comma-values value)))

(defn- canonical-items [value]
  (mapv #(str "/products/*/" %) (comma-values value)))

(defn- assert-sort-example! [example observed]
  (when-let [sort-order (support/example-value example "sort_order")]
    (let [view (get-in observed [:sorted (keyword sort-order)])]
      (support/assert!
       (= [(canonical-roots (support/require-example example "root_order"))
           (canonical-items (support/require-example example "item_property_order"))
           9]
          [(:roots view) (:items view) (count (:paths view))])
       "Hierarchical property sorting changed sibling order or row identity."
       {:example example :view view}))))

(defn- assert-observation! [example observed]
  (support/assert!
   (= {:filter "" :sort "Schema order" :status "9 of 9 properties"
       :count 9 :add true :controlsAbove true}
      (:initial observed))
   "Initial property view controls changed." observed)
  (support/assert!
   (= {:status "0 of 9 properties"
       :message "No properties match missing_property"
       :clearReachable true :restored 9 :focus true}
      (:empty observed))
   "No-match recovery changed." observed)
  (support/assert! (:storageUnchanged observed)
                   "Filtering or sorting changed production schema storage." observed)
  (support/assert!
   (= {:filter "product_" :sort "Name A-Z"
       :paths ["/products" "/products/*" "/products/*/product_id" "/products/*/product_name"]
       :contexts ["/products" "/products/*"]
       :selected "true" :focus "Add rule for products.*.product_id" :scroll 37
       :documentUnchanged true
       :pending ["Document schema owner" "Attach Required product id to products.*.product_id"]
       :rules [["rule:product-id" "/products/*/product_id"]]}
      (:refreshed observed))
   "Property-tree refresh did not preserve its view state or isolated rule change." observed)
  (support/assert! (:noOverflow observed)
                   "Property controls caused horizontal side-panel overflow." observed)
  (assert-filter-example! example observed)
  (assert-sort-example! example observed))

(defn- transition [world example _captures {:keys [text]}]
  (support/stateful-transition
   world example text entry-steps :schema-property-filter-sort browser-observation!
   "Schema property filter/sort adapter was not executed."
   assert-observation!))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-steps
   :schema-property-filter-sort
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T17:57:12.124000646+02:00", :module-hash "-283732875", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1084286674"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "-715635428"} {:id "def/entry-steps", :kind "def", :line 8, :end-line 11, :hash "-648812964"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "-1819867165"} {:id "defn-/browser-observation!", :kind "defn-", :line 14, :end-line 20, :hash "1106172071"} {:id "defn-/comma-values", :kind "defn-", :line 22, :end-line 23, :hash "-1075159739"} {:id "defn-/assert-filter-example!", :kind "defn-", :line 25, :end-line 37, :hash "790258531"} {:id "defn-/canonical-roots", :kind "defn-", :line 39, :end-line 40, :hash "46854778"} {:id "defn-/canonical-items", :kind "defn-", :line 42, :end-line 43, :hash "-2006770380"} {:id "defn-/assert-sort-example!", :kind "defn-", :line 45, :end-line 54, :hash "629466541"} {:id "defn-/assert-observation!", :kind "defn-", :line 56, :end-line 83, :hash "737699622"} {:id "defn-/transition", :kind "defn-", :line 85, :end-line 89, :hash "-1020513698"} {:id "def/handlers", :kind "def", :line 91, :end-line 96, :hash "-891744499"}]}
;; clj-mutate-manifest-end
