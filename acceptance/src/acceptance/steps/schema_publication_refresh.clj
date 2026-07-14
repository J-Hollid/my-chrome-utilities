(ns acceptance.steps.schema-publication-refresh
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-schema-publication-live-revalidation.feature"
   "features/data-layer-schema-publication-live-revalidation-runtime.feature"
   "features/data-layer-non-applicable-property-visibility.feature"
   "features/data-layer-non-applicable-property-visibility-runtime.feature"])

(def entry-modes
  {"a current Live testing session contains captured events" :model
   "the built extension side panel is running with production Live capture, Schema Library, validation, query, and Defect Library modules" :runtime
   "a captured event with an assigned schema is open in the Live inspector" :model
   "the built extension Live inspector is running with production validation and property-tree rendering" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Schema publication refresh model verification failed. "
   "node" "test/data-layer-schema-publication-refresh-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_PUBLICATION_REFRESH_BROWSER_ADAPTER"
    :observation-key :schemaPublicationRefresh
    :runtime-error "Schema publication refresh browser runtime failed."
    :missing-error "Schema publication refresh browser evidence is missing."}))

(defn- assert-runtime! [observed]
  (support/assert! (= {:summary "Validation passed"
                       :schema "Product listing version 3"
                       :optionalHidden true}
                      (:before observed))
                   "The pre-publication inspector did not use revision 3 evidence." observed)
  (support/assert! (= "1 of 2 events" (:queryBefore observed))
                   "The runtime did not establish a query-hidden current event." observed)
  (support/assert! (and (get-in observed [:control :order])
                        (= "Hide non-applicable properties" (get-in observed [:control :revealed :label]))
                        (= "true" (get-in observed [:control :revealed :pressed]))
                        (= "Missing" (get-in observed [:control :revealed :value]))
                        (= "neutral" (get-in observed [:control :revealed :treatment]))
                        (str/includes? (str/lower-case (get-in observed [:control :revealed :status])) "not applicable")
                        (not= (get-in observed [:control :revealed :missingColor])
                              (get-in observed [:control :revealed :dangerColor])))
                   "The rendered non-applicable control or neutral Missing treatment diverged." observed)
  (support/assert! (and (get-in observed [:publication :savedUnchanged])
                        (str/includes? (get-in observed [:publication :result])
                                       "Published Product listing revision 4. Revalidated 2 current Live events."))
                   "Publication did not refresh current events while preserving the saved archive." observed)
  (support/assert! (= {:query "1 of 2 events"
                       :count "2"
                       :selected "page_view"
                       :summary "Validation failed, 1 error"
                       :schema "Product listing version 4"
                       :show "true"
                       :optionalExpanded "true"
                       :pageType "! 1 error"
                       :focused "/test"}
                      (select-keys (:after observed)
                                   [:query :count :selected :summary :schema :show
                                    :optionalExpanded :pageType :focused]))
                   "Feed, inspector, rule evidence, or interaction state did not refresh coherently." observed)
  (support/assert! (and (= 1 (get-in observed [:after :politeAnnouncements]))
                        (= 1 (count (get-in observed [:after :feed])))
                        (some #{"Review required"} (:defectStates observed)))
                   "Query membership, polite completion, or defect triage retained stale evidence." observed)
  (support/assert! (= {:refreshed ["pre:1" "pre:2"]
                       :ids ["pre:1" "pre:2" "post:1"]
                       :revisions [4 4 4]}
                      (:boundary observed))
                   "The publication/capture boundary duplicated, omitted, or mixed event revisions." observed)
  observed)

(def example-values
  {"previous_result" #{"Valid" "1 error"}
   "revision_change" #{"add a failing Required rule" "relax the failing Allowed values rule" "add a failing warning-severity rule"}
   "published_result" #{"1 error" "Valid" "1 warning"}
   "schema_selection" #{"follow-latest assignment" "assignment pinned to revision 3" "manual Product listing override" "manual Checkout override"}
   "resolved_schema" #{"Product listing revision 4" "Product listing revision 3" "Checkout current revision"}
   "rule_evidence" #{"revision 4 rules" "retained revision 3 rules" "Checkout rules"}
   "resolved_revision" #{"Product listing revision 4" "Product listing revision 3" "Checkout current revision"}
   "property_state" #{"missing" "present with value" "present with null"}
   "rule_state" #{"optional Allowed values Not applicable" "Required failed" "conditional rule Not applicable" "Allowed values failed"
                  "Allowed values not applicable" "conditional rule not applicable"}
   "row_visibility" #{"hidden" "visible"}
   "property_outcome" #{"neutral Not applicable" "error Required" "neutral No applicable rules" "error with actual null"}
   "treatment" #{"neutral when revealed" "error" "neutral"}})

(defn- validate-example! [_mode example]
  (support/validate-example-domain!
   example-values example (filter #(support/example-value example %) (keys example-values))
   "Schema publication refresh example value was outside the specified contract."))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   #(contains? entry-modes %)
   :schema-publication-refresh-mode
   (fn [world example _captures {:keys [text]}]
     (support/mode-transition
      world example text entry-modes :schema-publication-refresh-mode
      verify-model! validate-example! #(assert-runtime! (runtime-observation!))))))
