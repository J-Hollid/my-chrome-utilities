(ns acceptance.steps.schema-specification-builder
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/data-layer-schema-specification-builder.feature"
                    "features/data-layer-schema-specification-builder-runtime.feature"])
(def entry-modes
  {"Generic pageview revision 4 declares documented root, nested object, and object-array properties" :model
   "the built extension side panel is running with the production Schema Library, schema editor, documentation, validation rules, inheritance, and clipboard controls" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- verify-model! [] (support/cached-command-verification! model-verified? "Schema specification builder model verification failed. " "node" "test/data-layer-schema-specification-builder-test.mjs"))
(defn- runtime-observation! [] (support/cached-browser-observation! browser-observation {:adapter-env "SCHEMA_SPECIFICATION_BUILDER_BROWSER_ADAPTER" :observation-key :schemaSpecificationBuilder :runtime-error "Schema specification builder browser runtime failed." :missing-error "Schema specification builder browser evidence is missing."}))
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :schema-specification-builder-mode verify-model! (fn [_ _] true) runtime-observation! (fn [observed] observed)))
