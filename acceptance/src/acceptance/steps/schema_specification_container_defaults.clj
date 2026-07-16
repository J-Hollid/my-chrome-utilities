(ns acceptance.steps.schema-specification-container-defaults
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-schema-specification-container-defaults.feature"
   "features/data-layer-schema-specification-container-defaults-runtime.feature"])

(def entry-modes
  {"Generic pageview declares commerce as Object, products as Array of Object, and products[].attributes as Object" :model
   "the built extension side panel is running with the production specification builder" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Specification container defaults model verification failed. "
   "npm" "run" "test:unit:schema-specification-container-defaults"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_SPECIFICATION_CONTAINER_DEFAULTS_BROWSER_ADAPTER"
    :observation-key :schemaSpecificationContainerDefaults
    :runtime-error "Specification container defaults browser runtime failed."
    :missing-error "Specification container defaults browser evidence is missing."}))

(defn- assert-runtime! [{:keys [initial afterContainer afterDescendant retained reset cleared selected unchanged runtimeErrors] :as observed}]
  (support/assert!
   (and (:all initial)
        (:unique initial)
        (not-any? #(.endsWith ^String % "/*") (:available initial))
        (= (:paths initial) (:available initial))
        (every? (set (:available initial)) ["/products" "/products/*/duration" "/site_id"])
        (false? (:container afterContainer))
        (:descendant afterContainer)
        (not (some #{"/products"} (:paths afterContainer)))
        (some #{"/products/*/duration"} (:paths afterContainer))
        (= {:container false :descendant false} afterDescendant)
        (= {:products false :duration false} retained)
        (:all reset)
        (= (set (:paths reset)) (set (:available reset)))
        (= {:checked 0 :rows 0} cleared)
        (:all selected)
        (= (:rows selected) (:controls selected))
        unchanged
        (empty? runtimeErrors))
   "Production container defaults, independent toggles, reset, or bulk selection were incorrect."
   observed)
  observed)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-specification-container-defaults-mode
   verify-model! (fn [_ _] true) runtime-observation! assert-runtime!))
