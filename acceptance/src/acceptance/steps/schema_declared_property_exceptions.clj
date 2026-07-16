(ns acceptance.steps.schema-declared-property-exceptions
  (:require [acceptance.steps.support :as support]))

(def feature-file "features/data-layer-schema-declared-property-exceptions.feature")
(def entry-step "a Payload schema working draft enables Only declared properties are allowed")
(defonce ^:private browser-observation (atom nil))

(defn- observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_DECLARED_PROPERTY_EXCEPTIONS_BROWSER_ADAPTER"
    :observation-key :schemaDeclaredPropertyExceptions
    :runtime-error "Schema declared-property exception browser runtime failed."
    :missing-error "Schema declared-property exception browser evidence is missing."}))

(def expected-paths
  [["/debug" "Undeclared property"]
   ["/metadata/category" "Type mismatch"]
   ["/metadata/settings/debug" "Undeclared property"]
   ["/commerce/internal" "Undeclared property"]
   ["/products/0/itemDebug" "Undeclared property"]])

(defn- assert-example! [example observed]
  (when-let [property-type (support/example-value example "property_type")]
    (support/assert! (= (support/require-example example "availability")
                        (get-in observed [:availability (keyword property-type)]))
                     "Declared-property exception compatibility changed." {:example example}))
  (support/assert! (= expected-paths (:paths observed))
                   "Declared-property exception changed recursive validation outcomes." observed)
  (support/assert! (and (:policy observed)
                        (= [{:propertyPath "/metadata" :enabled true}
                            {:propertyPath "/products/*/attributes" :enabled true}]
                           (get-in observed [:reopened :rules]))
                        (= (mapv first expected-paths) (get-in observed [:reopened :paths])))
                   "Declared-property exceptions did not persist without changing the schema policy." observed)
  (support/assert! (and (some #{"/metadata/source"} (:disabledPaths observed))
                        (not-any? #{"/metadata/source"} (map first (:paths observed)))
                        (not-any? #(re-find #"/attributes/(color|material)$" %) (map first (:paths observed))))
                   "Exception disablement or wildcard boundary behavior changed." observed))

(defn- transition [world example _captures {:keys [text]}]
  (let [[world observed] (support/stateful-observation world text #{entry-step} :schema-declared-property-exceptions observation!
                                                       "Schema declared-property exception browser adapter was not executed.")]
    (assert-example! example observed)
    world))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs [feature-file] #{})
   #{entry-step}
   :schema-declared-property-exceptions
   transition))
