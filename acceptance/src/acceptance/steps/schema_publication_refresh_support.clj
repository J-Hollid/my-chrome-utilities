(ns acceptance.steps.schema-publication-refresh-support
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Schema publication refresh model verification failed. "
   "node" "test/data-layer-schema-publication-refresh-test.mjs"))

(defn runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_PUBLICATION_REFRESH_BROWSER_ADAPTER"
    :observation-key :schemaPublicationRefresh
    :runtime-error "Schema publication refresh browser runtime failed."
    :missing-error "Schema publication refresh browser evidence is missing."}))

(defn assert-runtime! [observed]
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

(defn transition! [world example text entry-modes mode-key validate-example!]
  (support/mode-transition
   world example text entry-modes mode-key
   verify-model! validate-example!
   #(assert-runtime! (runtime-observation!))))
