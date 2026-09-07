(ns acceptance.steps.schema-context-export
  (:require [acceptance.steps.support :as support]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-schema-context-json-schema-export.feature"
   "features/data-layer-schema-context-json-schema-export-runtime.feature"])
(defonce ^:private model-cache (atom nil))
(defonce ^:private browser-cache (atom nil))

(defn model! []
  (support/cached-command-observation!
   model-cache {:command ["node" "test/schema-context-export-observation-test.mjs"]
                :observation-key :schemaContextExportModel
                :runtime-error "Schema context model checks failed."
                :missing-error "Schema context model output is missing."}))
(defn browser! []
  (support/cached-command-observation!
   browser-cache {:command ["node" "test/schema-context-export-browser-test.mjs"]
                  :observation-key :schemaContextExport
                  :runtime-error "Installed schema context checks failed."
                  :missing-error "Installed schema context output is missing."}))

(def source-hosts
  {"unpublished Saved Schema draft" ["Saved Schema Draft editor" "Draft" "draft"]
   "Saved Schema revision 4 with a newer draft" ["Saved Schema revision viewer" "revision 4" "published"]
   "Shared Profile Sitewide" ["Shared Profile" "Sitewide" "kind"]
   "Property Set Checkout" ["Property Set" "Checkout" "checkoutId"]
   "Page Cart with an inherited exclusion" ["Page" "Cart" "cartCode"]
   "Event Purchase" ["Event" "Purchase" "purchaseCode"]
   "Cart step in Flow Checkout" ["Flow Page instance" "Checkout" "amount"]
   "Purchase occurrence in Checkout Cart step" ["Event occurrence" "Checkout" "amount"]})

(defn- host! [observed host surface]
  (let [row (first (filter #(and (= host (:host %)) (= surface (:surface %))) (:hosts observed)))]
    (support/assert! row "The exact installed host was not exercised." {:host host :surface surface})
    row))

(defn assert-browser! [observed]
  (support/assert! (= 14 (count (:hosts observed))) "The host inventory is incomplete." {})
  (doseq [row (:hosts observed)]
    (support/assert! (and (= (:text row) (:clipboard row) (:fileText row) (get-in row [:downloaded :text]))
                          (:unchanged row) (:focusReturned row))
                     "Export text, completed download, repository, or focus changed." {:host (:host row)})
    (support/assert! (= "application/schema+json" (get-in row [:downloaded :mime])) "Wrong download media type." {}))
  (support/assert! (= [true false false true false false false] (get-in observed [:parity :production])) "Validator outcomes changed." {})
  (support/assert! (and (get-in observed [:edit :availableWithoutReload])
                        (get-in observed [:failures :stale :copyDisabled])
                        (get-in observed [:failures :stale :downloadDisabled])) "Edit or stale-snapshot guard failed." {})
  (support/assert! (and (= {:writes 0 :downloads 0} (get-in observed [:compatibility :cancelled]))
                        (get-in observed [:compatibility :unchanged])
                        (str/includes? (get-in observed [:compatibility :completion]) "1 omitted rule")) "Compatibility cancellation or output failed." {})
  (support/assert! (and (get-in observed [:longRevision :jsonScrolls])
                        (get-in observed [:longRevision :focusReturned])
                        (= 360 (get-in observed [:longRevision :width]))) "Long read-only keyboard export failed." {}))

(defn- assert-source-example! [model observed value]
  (when-let [source (value "source")]
      (let [[host identity property] (source-hosts source) row (host! observed host "Side panel")
            document (json/parse-string (:text row))]
        (support/assert! (and identity (str/includes? (:label row) identity) (get-in document ["properties" property]))
                         "Export substituted another context." {:source source :label (:label row)})
        (when (= host "Page") (support/assert! (nil? (get-in document ["properties" "tracking"])) "Page exclusion was lost." {})))))

(defn- assert-facet-example! [model observed value]
  (when-let [facet (value "facet")]
      (support/assert! (= (value "representation") (get-in model [:facets (keyword facet) :representation]))
                       "The requested standard representation was not verified." {:facet facet})))

(defn- assert-state-example! [model observed value]
  (when-let [state (value "state")]
      (let [result (get-in model [:states (keyword state)])]
        (support/assert! (and result (= (value "availability") (:availability result)) (seq (:reason result))) "Export readiness changed." {:state state}))))

(defn- assert-change-example! [model observed value]
  (when-let [change (value "change")]
      (support/assert! (= (value "availability") (get-in model [:changes (keyword change) :availability])) "Snapshot invalidation changed." {:change change})))

(defn- assert-compatibility-example! [model observed value]
  (when-let [kind (value "compatibility_case")]
      (let [result (get-in model [:compatibility (keyword kind)])]
        (support/assert! (and (:cancelled result) (:unchanged result) (= (parse-long (value "omitted_count")) (:omitted result))) "Compatibility outcome changed." {:kind kind}))))

(defn- assert-host-example! [model observed value]
  (when-let [host (value "schema_host")]
      (let [row (host! observed host (value "surface"))]
        (support/assert! (= (parse-long (value "width")) (:width row)) "Wrong host viewport." {:host host}))))

(defn- assert-payload-example! [model observed value]
  (when-let [payload (value "payload")]
      (let [input (json/parse-string payload true) index (.indexOf (get-in observed [:parity :payloads]) input)]
        (support/assert! (and (not (neg? index)) (= (= "pass" (value "outcome")) (get-in observed [:parity :production index]))) "Payload parity case changed." {:payload payload}))))

(defn- assert-boundary-example! [model observed value]
  (when-let [boundary (value "boundary")]
      (let [key ({"clipboard write" :clipboardFailure "browser download" :downloadFailure} boundary)
            result (get-in observed [:failures key])]
        (support/assert! (and (:otherEnabled result) (:previewOpen result) (str/includes? (:status result) "Try again")) "Boundary failure removed retry or the other action." {:boundary boundary}))))

(defn assert-example! [example]
  (let [model (model!) observed (browser!) value #(support/example-value example %)]
    (doseq [check [assert-source-example! assert-facet-example! assert-state-example!
                  assert-change-example! assert-compatibility-example! assert-host-example!
                  assert-payload-example! assert-boundary-example!]]
      (check model observed value))))

(def entry-modes
  {"Shop has accepted Draft schemas with inherited and local properties" :model
   "the built extension runs with its production schema repository and export controls" :runtime})

(def handlers
  (support/feature-mode-handlers
   feature-files entry-modes :schema-context-export-mode
   (fn [world example captures {:keys [text]}]
     (doseq [key (support/capture-placeholder-keys captures)] (support/require-example example key))
     (assert-example! example)
     (assert-browser! (browser!))
     (assoc world :schema-context-export-mode (or (entry-modes text) (:schema-context-export-mode world))))))
