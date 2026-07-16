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
    (support/assert! (= {:propertyType property-type
                         :availability (support/require-example example "availability")}
                        (get-in observed [:properties (keyword (support/require-example example "property_path"))]))
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
  (support/stateful-transition
   world example text #{entry-step} :schema-declared-property-exceptions observation!
   "Schema declared-property exception browser adapter was not executed." assert-example!))

(def handlers
  (support/stateful-feature-handlers
   feature-file entry-step :schema-declared-property-exceptions transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T20:49:11.385695738+02:00", :module-hash "169725230", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-1988327146"} {:id "def/feature-file", :kind "def", :line 4, :end-line 4, :hash "-66393019"} {:id "def/entry-step", :kind "def", :line 5, :end-line 5, :hash "2024680023"} {:id "form/3/defonce", :kind "defonce", :line 6, :end-line 6, :hash "-1618529344"} {:id "defn-/observation!", :kind "defn-", :line 8, :end-line 14, :hash "426190826"} {:id "def/expected-paths", :kind "def", :line 16, :end-line 21, :hash "1921200982"} {:id "defn-/assert-example!", :kind "defn-", :line 23, :end-line 40, :hash "1450756527"} {:id "defn-/transition", :kind "defn-", :line 42, :end-line 45, :hash "845770574"} {:id "def/handlers", :kind "def", :line 47, :end-line 49, :hash "1709713794"}]}
;; clj-mutate-manifest-end
