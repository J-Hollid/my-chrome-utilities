(ns acceptance.steps.schema-specification-preview-layout
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/data-layer-schema-specification-preview-layout.feature" "features/data-layer-schema-specification-preview-layout-runtime.feature"])
(def entry-modes {"the specification builder is open with selected properties across all seven preview columns" :model "the built extension side panel is running with the production specification builder and stylesheet" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- verify-model! [] (support/cached-command-verification! model-verified? "Specification preview layout model verification failed. " "npm" "run" "test:unit:schema-specification-preview-layout"))
(defn- runtime-observation! [] (support/cached-browser-observation! browser-observation {:adapter-env "SCHEMA_SPECIFICATION_PREVIEW_LAYOUT_BROWSER_ADAPTER" :observation-key :schemaSpecificationPreviewLayout :runtime-error "Specification preview layout browser runtime failed." :missing-error "Specification preview layout browser evidence is missing."}))
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :schema-specification-preview-layout-mode verify-model! (fn [_ _] true) runtime-observation! identity))
