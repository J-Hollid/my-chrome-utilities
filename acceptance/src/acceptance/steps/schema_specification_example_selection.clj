(ns acceptance.steps.schema-specification-example-selection
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/data-layer-schema-specification-example-selection.feature" "features/data-layer-schema-specification-example-selection-runtime.feature"])
(def entry-modes {"the specification builder is open for Generic pageview revision 4" :model "the built extension side panel is running with the production specification builder, rules, documentation, and clipboard controls" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- verify-model! [] (support/cached-command-verification! model-verified? "Specification example selection model verification failed. " "npm" "run" "test:unit:schema-specification-example-selection"))
(defn- runtime-observation! [] (support/cached-browser-observation! browser-observation {:adapter-env "SCHEMA_SPECIFICATION_EXAMPLE_SELECTION_BROWSER_ADAPTER" :observation-key :schemaSpecificationExampleSelection :runtime-error "Specification example selection browser runtime failed." :missing-error "Specification example selection browser evidence is missing."}))
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :schema-specification-example-selection-mode verify-model! (fn [_ _] true) runtime-observation! identity))
