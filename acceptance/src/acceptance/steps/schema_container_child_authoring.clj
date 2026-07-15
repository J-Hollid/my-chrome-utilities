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
    (support/assert!
     (contains? (get-in observed [:reload :rows]) (keyword canonical-path))
     "Contextual child path was not restored from the working draft."
     {:example example :canonical-path canonical-path :reload (:reload observed)})))

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
