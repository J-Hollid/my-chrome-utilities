(ns acceptance.steps.schema-specification-builder-customization
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-schema-specification-builder-customization.feature"
   "features/data-layer-schema-specification-builder-customization-runtime.feature"
   "features/data-layer-schema-specification-example-selection.feature"
   "features/data-layer-schema-specification-example-selection-runtime.feature"])
(def entry-modes
  {"the specification builder is open for Generic pageview revision 4" :model
   "the built extension side panel is running with the production specification builder and clipboard controls" :runtime
   "the built extension side panel is running with the production specification builder, rules, documentation, and clipboard controls" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- verify-model! [] (support/cached-command-verification! model-verified? "Specification builder UI model verification failed. " "npm" "run" "test:unit:schema-specification-builder-ui"))
(defn- runtime-observation! [] (support/cached-browser-observation! browser-observation {:adapter-env "SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER" :observation-key :schemaSpecificationBuilderCustomization :runtime-error "Specification customization browser runtime failed." :missing-error "Specification customization browser evidence is missing."}))
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :schema-specification-builder-customization-mode verify-model! (fn [_ _] true) runtime-observation! identity))
