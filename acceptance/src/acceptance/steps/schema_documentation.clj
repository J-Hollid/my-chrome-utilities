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
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_DOCUMENTATION_BROWSER_ADAPTER"
    :observation-key :schemaDocumentation
    :runtime-error "Schema documentation browser runtime failed."
    :missing-error "Schema documentation browser evidence is missing."}))

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
     :assertions [["display_name" :displayName]
                  ["description" :description]
                  ["payload_state" :payloadState]
                  ["event_property" :eventProperty]
                  ["rendered_path" :renderedPath]
                  ["presentation" :presentation]
                  ["documentation_result" :documentationResult]]}]
   ["event_context"
    {:rows :revisionCases
     :match ["event_context" :eventContext]
     :assertions [["expected_description" :description]
                  ["expected_source" :source]]}]])

(defn validate-example! [example observation]
  (support/validate-observation-example!
   example observation example-validators validate-row-example!))

(defn- transition [world example _captures _spec]
  (support/validated-observation-transition
   world example :schema-documentation
   browser-observation! validate-browser-observation! validate-example!))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-step-texts
   :schema-documentation
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T15:46:13.813530117+02:00", :module-hash "-1287966778", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "1559077087"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "408470076"} {:id "def/entry-step-texts", :kind "def", :line 8, :end-line 10, :hash "-1032966563"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "-1618529344"} {:id "defn/browser-observation!", :kind "defn", :line 14, :end-line 20, :hash "-870121229"} {:id "defn-/require!", :kind "defn-", :line 22, :end-line 23, :hash "-2090315788"} {:id "defn/validate-browser-observation!", :kind "defn", :line 25, :end-line 59, :hash "-462236105"} {:id "defn-/example-value", :kind "defn-", :line 61, :end-line 62, :hash "369719940"} {:id "defn-/assert-example!", :kind "defn-", :line 64, :end-line 67, :hash "1087626945"} {:id "defn-/matching-row", :kind "defn-", :line 69, :end-line 70, :hash "-1482700621"} {:id "defn-/validate-row-example!", :kind "defn-", :line 72, :end-line 77, :hash "29449947"} {:id "def/example-validators", :kind "def", :line 79, :end-line 98, :hash "-719167331"} {:id "defn/validate-example!", :kind "defn", :line 100, :end-line 102, :hash "1286172312"} {:id "defn-/transition", :kind "defn-", :line 104, :end-line 107, :hash "-2144339220"} {:id "def/handlers", :kind "def", :line 109, :end-line 114, :hash "-1429198756"}]}
;; clj-mutate-manifest-end
