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

(defn validate-example! [example observation]
  (cond
    (example-value example "interaction")
    (let [row (first (filter #(= (example-value example "interaction") (:interaction %))
                             (:interactionCases observation)))]
      (assert-example! (example-value example "presentation") (:presentation row) "presentation" example))

    (example-value example "mapping_path")
    (let [row (first (filter #(= (example-value example "mapping_path") (:mappingPath %))
                             (:mappingCases observation)))]
      (when-let [event-property (example-value example "event_property")]
        (assert-example! event-property (:eventProperty row) "event_property" example))
      (when-let [rendered-path (example-value example "rendered_path")]
        (assert-example! rendered-path (:renderedPath row) "rendered_path" example))
      (when-let [presentation (example-value example "presentation")]
        (assert-example! presentation (:presentation row) "presentation" example))
      (when-let [result (example-value example "documentation_result")]
        (assert-example! result (:documentationResult row) "documentation_result" example)))

    (example-value example "event_context")
    (let [row (first (filter #(= (example-value example "event_context") (:eventContext %))
                             (:revisionCases observation)))]
      (assert-example! (example-value example "expected_description") (:description row) "expected_description" example)
      (assert-example! (example-value example "expected_source") (:source row) "expected_source" example)))
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
