(ns acceptance.steps.schema-publication-refresh-support
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- fresh-model-cache [] (atom false))

(defonce model-verified? (fresh-model-cache))
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
  (support/assert! (= {:optionalHidden true
                       :summary "Validation passed"
                       :schema "Product listing version 3"}
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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-17T17:10:08.028616048+02:00", :module-hash "-194968940", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1153825862"} {:id "defn-/fresh-model-cache", :kind "defn-", :line 5, :end-line 5, :hash "952154096"} {:id "form/2/defonce", :kind "defonce", :line 7, :end-line 7, :hash "-1970171764"} {:id "form/3/defonce", :kind "defonce", :line 8, :end-line 8, :hash "-1618529344"} {:id "defn/verify-model!", :kind "defn", :line 10, :end-line 14, :hash "-211511028"} {:id "defn/runtime-observation!", :kind "defn", :line 16, :end-line 22, :hash "815893559"} {:id "defn/assert-runtime!", :kind "defn", :line 24, :end-line 67, :hash "1632925945"} {:id "defn/transition!", :kind "defn", :line 69, :end-line 73, :hash "1963867828"}]}
;; clj-mutate-manifest-end
