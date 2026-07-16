(ns acceptance.steps.json-schema-export
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-json-schema-2020-12-export.feature"
   "features/data-layer-json-schema-2020-12-export-runtime.feature"
   "features/data-layer-schema-export-selection.feature"])

(def entry-modes
  {"Product detail revision 4 is a published Payload schema" :model
   "the built extension side panel is running with the production Schema Library and browser download boundary" :runtime
   "the Data Layer Schemas workspace contains published Product detail revision 4" :runtime})

(defonce ^:private unit-verification (atom nil))
(defonce ^:private browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   unit-verification
   "JSON Schema Draft 2020-12 focused verification failed. "
   "node" "test/data-layer-json-schema-export-test.mjs"))

(defn- observe-runtime! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "JSON_SCHEMA_EXPORT_BROWSER_ADAPTER"
    :observation-key :jsonSchemaExport
    :runtime-error "JSON Schema export browser runtime failed."
    :missing-error "JSON Schema export browser evidence is missing."}))

(defn- validate-example! [mode example]
  (when (= mode :runtime)
    (when-let [payload (support/example-value example "payload")]
      (let [key (cond
                  (str/includes? payload "undeclared root debug") :debug
                  (str/includes? payload "51-character") :long
                  (str/includes? payload "dynamic metadata") :metadata
                  (str/includes? payload "missing conditionally") :missing
                  :else :valid)
            expected (= "pass" (support/require-example example "validation_outcome"))
            observed (get-in (observe-runtime!) [:extensionOutcomes key])]
        (support/assert! (= expected observed)
                         "Extension and independent JSON Schema validation parity changed."
                         {:payload payload :expected expected :observed observed})))))

(defn- assert-runtime! [observed]
  (support/assert! (= 320 (:width observed)) "Export controls were not exercised at 320 CSS px." {:observed observed})
  (support/assert! (and (true? (get-in observed [:libraryChoices :open]))
                        (zero? (get-in observed [:libraryChoices :downloadCount])))
                   "Opening export choices unexpectedly downloaded a file." {:observed observed})
  (support/assert! (= 3 (count (get-in observed [:bundle :document :$defs])))
                   "The compound document did not contain the published resources." {:observed observed})
  (support/assert! (= ["schema-generic" "schema-product-detail"]
                      (mapv :id (:schemas (:extensionPackage observed))))
                   "The extension package dependency scope changed." {:observed observed})
  (support/assert! (= ["allowed-currency"] (mapv :id (:rules (:extensionPackage observed))))
                   "The extension package reusable-rule scope changed." {:observed observed})
  (support/assert! (and (:storedUnchanged observed) (:focusReturned observed))
                   "Export mutated storage or failed to restore focus." {:observed observed})
  (support/assert! (and (true? (get-in observed [:unpublished :standardDisabled]))
                        (str/includes? (get-in observed [:unpublished :reason]) "Publish the schema"))
                   "Unpublished standard export was not blocked with a reason." {:observed observed})
  (support/assert! (and (str/includes? (:productReview observed) "Partner contract at /metadata")
                        (some #{"Export without unsupported rules"} (:lossyActions observed))
                        (str/includes? (:status observed) "1 omitted rule"))
                   "Lossy export review or completion status changed." {:observed observed})
  (support/assert! (false? (get-in observed [:standardImport :review]))
                   "A standard schema was presented as extension configuration." {:observed observed}))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :json-schema-export-mode
   verify-model! validate-example! observe-runtime! assert-runtime!))
