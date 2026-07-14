(ns acceptance.steps.schema-documentation
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-schema-documentation.feature"
   "features/data-layer-schema-documentation-runtime.feature"])

(def entry-step-texts
  #{"the Schema Library contains schema Product detail"
    "the built extension side panel is running with production Schema Library persistence and Live inspection"})

(defonce browser-observation (atom nil))

(defn browser-observation! []
  (or @browser-observation
      (reset! browser-observation
              (support/load-browser-observation!
               {:adapter-env "SCHEMA_DOCUMENTATION_BROWSER_ADAPTER"
                :observation-key :schemaDocumentation
                :runtime-error "Schema documentation browser runtime failed."
                :missing-error "Schema documentation browser evidence is missing."}))))

(defn- require! [condition message data]
  (support/assert! condition message data))

(defn validate-browser-observation! [observation]
  (let [{:keys [editor presentation inheritance revisions lifecycle removal]} observation]
    (require! (= ["Product detail commerce event" 1 3]
                 [(:schemaDescription editor) (:ruleCount editor) (:currentVersion editor)])
              "The rendered editor did not preserve schema documentation separately from the current revision."
              editor)
    (require! (= [true true true 0 true true true true]
                 [(:mapped presentation) (:wildcard presentation) (:synthetic presentation) (:unmatchedControl presentation)
                  (:plainText presentation) (:focusPreview presentation) (:focusReturned presentation)
                  (:searchVisible presentation)])
              "The Live inspector did not expose safe, accessible, searchable documentation."
              presentation)
    (require! (= [["Inherited currency" "Generic commerce" true]
                  ["Local currency meaning" "Product detail" false]
                  ["Inherited currency" "Generic commerce"]]
                 [(:inherited inheritance) (:local inheritance) (:restored inheritance)])
              "Documentation inheritance or local override resolution was incorrect."
              inheritance)
    (require! (= ["Revision 3 description" "Revision 4 description"
                  "Product detail revision 3" "Product detail revision 4"]
                 [(:pinned revisions) (:current revisions) (:pinnedSource revisions) (:currentSource revisions)])
              "Revision-aware documentation resolution used the wrong source."
              revisions)
    (require! (and (nil? (:legacyDocumentation lifecycle))
                   (= [true true 0 false true 1 "Stable identifier used by fulfilment"]
                      [(:reviewShowsDocumentation removal)
                       (get-in removal [:removed :property])
                       (get-in removal [:removed :rules])
                       (get-in removal [:removed :documentation])
                       (get-in removal [:restored :property])
                       (get-in removal [:restored :rules])
                       (get-in removal [:restored :documentation])]))
              "Persistence compatibility or atomic documentation removal failed."
              {:lifecycle lifecycle :removal removal})
    observation))

(defn- example-value [example key]
  (support/example-value example key))

(defn- assert-example! [expected actual key example]
  (support/assert! (= expected actual)
                   (str "Schema documentation example did not match " key ".")
                   {:key key :example example :actual actual}))

(defn- matching-row [example rows key observed]
  (first (filter #(= (example-value example key) (observed %)) rows)))

(defn- validate-row-example! [example observation {:keys [rows match assertions]}]
  (let [[key observed] match
        row (matching-row example (rows observation) key observed)]
    (doseq [[assertion-key assertion-value] assertions]
      (when-let [expected (example-value example assertion-key)]
        (assert-example! expected (assertion-value row) assertion-key example)))))

(def example-validators
  [["interaction"
    {:rows :interactionCases
     :match ["interaction" :interaction]
     :assertions [["presentation" :presentation]]}]
   ["mapping_path"
    {:rows :mappingCases
     :match ["mapping_path" :mappingPath]
     :assertions [["event_property" :eventProperty]
                  ["rendered_path" :renderedPath]
                  ["presentation" :presentation]
                  ["documentation_result" :documentationResult]]}]
   ["event_context"
    {:rows :revisionCases
     :match ["event_context" :eventContext]
     :assertions [["expected_description" :description]
                  ["expected_source" :source]]}]])

(defn validate-example! [example observation]
  (some (fn [[key validation]]
          (when (example-value example key)
            (validate-row-example! example observation validation)
            true))
        example-validators)
  observation)

(defn- transition [world example _captures _spec]
  (let [observation (validate-browser-observation! (browser-observation!))]
    (validate-example! example observation)
    (assoc world :schema-documentation observation)))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-step-texts
   :schema-documentation
   transition))
