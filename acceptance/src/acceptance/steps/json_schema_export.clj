(ns acceptance.steps.json-schema-export
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
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

(def ^:private payload-outcome-keys
  {"valid product detail with 50-character title" :valid
   "product detail with undeclared root debug" :debug
   "product detail with 51-character title" :long
   "product detail with dynamic metadata source" :metadata
   "product detail missing conditionally required currency" :missing})

(def ^:private validation-outcomes {"pass" true "fail" false})

(defn- validate-example! [mode example]
  (if (= mode :model)
    (when (some #(support/example-value example %) ["extension_rule" "rule_type" "trigger"])
      (let [result (process/shell {:out :string :err :string :continue true}
                                  "node" "test/helpers/json-schema-export-example-adapter.mjs"
                                  (json/generate-string example))]
        (support/assert! (zero? (:exit result))
                         "JSON Schema export example was not connected to production behavior."
                         {:example example :error (:err result)})))
    (when-let [payload (support/example-value example "payload")]
      (let [expected (validation-outcomes (support/require-example example "validation_outcome"))
            observed (get-in (observe-runtime!) [:extensionOutcomes (payload-outcome-keys payload)])]
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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T21:23:07.959611159+02:00", :module-hash "-1255930000", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-2052016979"} {:id "def/feature-files", :kind "def", :line 7, :end-line 10, :hash "-1037594166"} {:id "def/entry-modes", :kind "def", :line 12, :end-line 15, :hash "1127128657"} {:id "form/3/defonce", :kind "defonce", :line 17, :end-line 17, :hash "-1230011345"} {:id "form/4/defonce", :kind "defonce", :line 18, :end-line 18, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 20, :end-line 24, :hash "197442733"} {:id "defn-/observe-runtime!", :kind "defn-", :line 26, :end-line 32, :hash "-515549719"} {:id "def/payload-outcome-keys", :kind "def", :line 34, :end-line 39, :hash "-1110575773"} {:id "def/validation-outcomes", :kind "def", :line 41, :end-line 41, :hash "-1500422192"} {:id "defn-/validate-example!", :kind "defn-", :line 43, :end-line 57, :hash "-89336422"} {:id "defn-/assert-runtime!", :kind "defn-", :line 59, :end-line 81, :hash "287841777"} {:id "def/handlers", :kind "def", :line 83, :end-line 86, :hash "862766899"}]}
;; clj-mutate-manifest-end
