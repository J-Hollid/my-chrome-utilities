(ns acceptance.steps.schema-property-type-editing
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-schema-property-type-editing.feature"
   "features/data-layer-schema-property-type-editing-runtime.feature"])

(def entry-modes
  {"Page view revision 3 has an open working draft" :model
   "the built extension side panel is running with the production Schema Library, property editor, validation, documentation, rules, inheritance, and persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Schema property type editing model verification failed. "
   "npm" "run" "test:unit:schema-property-type-editing"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_PROPERTY_TYPE_EDITING_BROWSER_ADAPTER"
    :observation-key :schemaPropertyTypeEditing
    :runtime-error "Schema property type editing browser runtime failed."
    :missing-error "Schema property type editing browser evidence is missing."}))

(defn- assert-runtime! [{:keys [review impactChoices descendantImpact remainingRules reusableUnchanged publication runtimeErrors] :as observed}]
  (support/assert!
   (and (str/includes? review "example value")
        (str/includes? review "conditional dependency order-condition")
        (= 3 (:count impactChoices))
        (:blocked impactChoices)
        (:resolved impactChoices)
        (:cancel impactChoices)
        (str/includes? (:review descendantImpact) "descendant required relationships")
        (:blocked descendantImpact)
        (:unchanged descendantImpact)
        (:focus descendantImpact)
        (= ["product-name-required" "order-condition"] remainingRules)
        reusableUnchanged
        (= 4 (:version publication))
        (:draftAbsent publication)
        (= "string" (get-in publication [:current :order]))
        (= "number" (get-in publication [:historical :order]))
        (= "ignore" (get-in publication [:current :priceTreatment]))
        (= "error" (get-in publication [:historical :priceTreatment]))
        (empty? runtimeErrors))
   "Production property type editing did not preserve impact and publication semantics."
   observed)
  observed)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-property-type-editing-mode
   verify-model! (fn [_ _] true) runtime-observation! assert-runtime!))
