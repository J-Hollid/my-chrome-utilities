(ns acceptance.steps.schema-container-child-authoring
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-schema-container-child-authoring.feature"
   "features/data-layer-schema-container-child-authoring-runtime.feature"])

(def background-steps
  #{"schema Page view has current revision 3"
    "its working draft is open in the schema editor"})

(def entry-steps
  #{"the working draft contains object /commerce"
    "the built extension side panel is running with the production Schema Library, schema editor, working drafts, and persistence"})

(defonce ^:private observation (atom nil))

(def ^:private contextual-example-relations
  [{:keys ["action" "container_path" "parent_path" "child_name" "value_type" "canonical_path"]
    :rows #{["Add child property" "/commerce" "/commerce" "order" "object" "/commerce/order"]
            ["Add item property" "/products" "/products/*" "product_id" "number" "/products/*/product_id"]
            ["Add child property" "/products/*" "/products/*" "product_sku" "string" "/products/*/product_sku"]}}
   {:keys ["container_path" "child_name" "value_type" "canonical_path"]
    :rows #{["/commerce" "order" "object" "/commerce/order"]
            ["/products" "product_id" "number" "/products/*/product_id"]
            ["/products/*" "product_sku" "string" "/products/*/product_sku"]}}])

(defn- browser-observation! []
  (support/cached-browser-observation!
   observation
   {:adapter-env "SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER"
    :observation-key :schemaContainerChild
    :runtime-error "Schema container child authoring browser runtime failed."
    :missing-error "Schema container child authoring browser observation is missing."}))

(defn- assert-example! [example observed]
  (when-let [entered-path (support/example-value example "entered_path")]
    (let [state (get-in observed [:interaction :fullPaths (keyword entered-path)])]
      (support/assert!
       (and (:canAdd state)
            (:siblings state)
            (= "Ready to add" (:assistance state))
            (str/includes? (:preview state) "Normalized path: /products/*/product_id"))
       "Full-path object-item authoring changed."
       {:example example :state state})))
  (when-let [canonical-path (support/example-value example "canonical_path")]
    (let [value-type (support/require-example example "value_type")]
      (support/validate-example-relations!
       contextual-example-relations example
       "Schema container child example row was outside the specified relationship.")
      (support/assert!
       (= (str "Manual · type " value-type)
          (get-in observed [:reload :rows (keyword canonical-path)]))
       "Contextual child path and type were not restored from the working draft."
       {:example example :canonical-path canonical-path :reload (:reload observed)}))))

(defn- assert-observation! [example observed]
  (let [{:keys [initial context duplicate contextual recursive fullPaths conserved]} (:interaction observed)
        reload (:reload observed)]
    (support/assert!
     (= {:commerce "Add child property" :products "Add item property" :item "Add child property"
         :leaf true :tags true :root "Add property"}
        initial)
     "Container child actions changed." observed)
    (support/assert!
     (= {:open true :focused true :parent "Parent path: /products/*" :noEditablePath true} context)
     "Contextual child form lost its fixed parent or focus." observed)
    (support/assert!
     (= {:blocked true
         :assistance "Go to existing property /products/*/product_name"
         :recovery "Go to existing property /products/*/product_name"
         :unchanged true
         :cancelFocus true}
        duplicate)
     "Duplicate child recovery changed persistence or focus." observed)
    (support/assert!
     (= [{:type "number" :propertyOrigin "manual"} true true]
        [(:stored contextual) (:selected contextual) (:publishedUnchanged contextual)])
     "Contextual item-property addition changed." observed)
    (support/assert!
     (and (= "object" (:orderType recursive))
          (= "array" (get-in recursive [:array :type]))
          (= "object" (get-in recursive [:array :items :type]))
          (= {:type "string" :propertyOrigin "manual"} (:sku recursive))
          (= "Add item property" (:recursiveAction recursive)))
     "Recursive container authoring changed." observed)
    (support/assert!
     (every? #(and (:canAdd %) (:siblings %) (= "Ready to add" (:assistance %))) (vals fullPaths))
     "A supported wildcard path syntax was rejected." observed)
    (support/assert!
     (= {:productName true :productConstraints true :rule true
         :documentation "Existing product documentation" :currentVersion 3 :publishedUnchanged true}
        conserved)
     "Container child addition failed to conserve existing schema data." observed)
    (support/assert!
     (and (= 3 (:version reload))
          (false? (:publishedProductId reload))
          (every? #(str/starts-with? % "Manual · type ") (vals (:rows reload))))
     "Reload did not restore manual children while preserving current revision 3." observed)
    (assert-example! example observed)))

(defn- transition [world example _captures {:keys [text]}]
  (let [world (if (entry-steps text) (assoc world :schema-container-child (browser-observation!)) world)
        observed (:schema-container-child world)]
    (support/assert! observed "Schema container child browser adapter was not executed." {:step text})
    (assert-observation! example observed)
    world))

(def handlers
  (vec
   (concat
    (support/semantic-handlers
     (filterv #(background-steps (:text %))
              (support/feature-step-specs feature-files #{}))
     (fn [world _example _captures _spec] world))
    (support/stateful-semantic-handlers
     (support/feature-step-specs feature-files background-steps)
     entry-steps
     :schema-container-child
     transition))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T17:03:15.481943503+02:00", :module-hash "43745305", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "342629581"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "1804555183"} {:id "def/background-steps", :kind "def", :line 9, :end-line 11, :hash "242332076"} {:id "def/entry-steps", :kind "def", :line 13, :end-line 15, :hash "754066455"} {:id "form/4/defonce", :kind "defonce", :line 17, :end-line 17, :hash "-1819867165"} {:id "def/contextual-example-relations", :kind "def", :line 19, :end-line 27, :hash "1461809842"} {:id "defn-/browser-observation!", :kind "defn-", :line 29, :end-line 35, :hash "1687675505"} {:id "defn-/assert-example!", :kind "defn-", :line 37, :end-line 56, :hash "858060643"} {:id "defn-/assert-observation!", :kind "defn-", :line 58, :end-line 101, :hash "-1404461627"} {:id "defn-/transition", :kind "defn-", :line 103, :end-line 108, :hash "-1663964979"} {:id "def/handlers", :kind "def", :line 110, :end-line 121, :hash "-172274975"}]}
;; clj-mutate-manifest-end
