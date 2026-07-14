(ns acceptance.steps.allowed-value-expansion
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-live-allowed-value-expansion.feature"
   "features/data-layer-live-allowed-value-expansion-runtime.feature"])

(def entry-modes
  {"captured event page_view is assigned to Otelo - Generic Pageview revision 2" :model
   "the built extension is running with production schema, validation, and Live event systems" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Allowed-value expansion model verification failed. "
   "node" "test/data-layer-allowed-value-expansion-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER"
    :observation-key :allowedValueExpansion
    :runtime-error "Allowed-value expansion browser runtime failed."
    :missing-error "Allowed-value expansion browser evidence is missing."}))

(defn- assert-runtime! [observed]
  (support/assert! (= [1 "stable-id-41" "1" "Validation failed, 1 error"
                       "Otelo - Generic Pageview version 2" "true"]
                      ((juxt :count :ruleId :ruleVersion :status :schema :expanded)
                       (:initial observed)))
                   "The quick action was not derived from the failed stable rule evidence."
                   observed)
  (support/assert! (and (str/includes? (get-in observed [:review :summary]) "/page_type")
                        (str/includes? (get-in observed [:review :summary]) "Known page types revision 1")
                        (str/includes? (get-in observed [:review :summary]) "string product_test")
                        (get-in observed [:review :publication])
                        (= "allowed-value-expansion-heading" (get-in observed [:review :focus]))
                        (get-in observed [:review :withinWidth]))
                   "The focused 320px review omitted its exact schema, rule, value, or unchanged-publication context."
                   observed)
  (support/assert! (= {:focused "stable-id-41" :expanded "true" :scroll 37}
                      (:cancelled observed))
                   "Cancel did not restore the originating Live property interaction state."
                   observed)
  (support/assert! (= ["product" "content" "product_test"]
                      (get-in observed [:afterConfirm :values]))
                   "The confirmed draft did not append the observed value exactly once and in order."
                   observed)
  (support/assert! (= ["Document checkout ownership"
                       "Allow string product_test for /page_type in Known page types (stable-id-41)"]
                      (get-in observed [:afterConfirm :pending]))
                   "The existing draft changes or the identity-specific pending change were not preserved."
                   observed)
  (support/assert! (= ["product,content" nil "consumer" "error" "Choose a known page type"]
                      ((juxt :publishedParameters :publishedValues :condition :severity :message)
                       (:afterConfirm observed)))
                   "The quick action mutated published or unrelated rule configuration."
                   observed)
  (support/assert! (and (:duplicateUnchanged observed)
                        (str/includes? (str/lower-case (:alreadyPending observed)) "already pending"))
                   "Repeated confirmation created duplicate draft evidence."
                   observed)
  (support/assert! (= {:schemaView "true" :editor true :focused "schema-editor-name"
                       :values ["product" "content" "product_test"]}
                      (:openedDraft observed))
                   "The existing working draft continuation was not available."
                   observed)
  (support/assert! (= {:event "page_view" :expanded "true" :scroll 37}
                      (:returned observed))
                   "Returning from the working draft lost the selected event or property state."
                   observed)
  (support/assert! (= [3 ["product" "content" "product_test"] 0
                       "Validation passed" "Otelo - Generic Pageview version 3"]
                      ((juxt :version :values :actionCount :status :schema)
                       (:afterPublish observed)))
                   "Publication did not revalidate the existing event or remove the obsolete quick action."
                   observed)
  (support/assert! (and (str/includes? (get-in observed [:afterPublish :feed]) "Valid")
                        (str/includes? (get-in observed [:afterPublish :raw]) "product_test")
                        (empty? (get-in observed [:afterPublish :defectStates])))
                   "Published feed, capture evidence, or defect presentation retained stale failure state."
                   observed)
  observed)

(def example-values
  {"evaluation_state" #{"failed Allowed values" "passed Allowed values" "Not applicable Allowed values" "failed Exact value"}
   "actual_value" #{"string product_test" "string product" "missing" "object value" "array value" "number 7"
                    "number 1" "string 1" "boolean false" "null" "string New York, NY"}
   "action_state" #{"available" "absent" "enabled"}
   "observed_value" #{"number 1" "string 1" "boolean false" "null" "string New York, NY"}
   "stored_value" #{"number 1" "string 1" "boolean false" "null" "string New York, NY" "1" "false" "New York, NY"}
   "different_value" #{"string 1" "number 1" "string false" "missing" "two values" "two strings"}
   "rule_identity" #{"stable id 41" "stable id 42" "stable id 43" "absent" "stable id 44"}
   "rule_origin" #{"local to assigned schema" "reusable rule attachment" "inherited from parent schema"
                   "local schema rule" "reusable rule revision" "inherited schema rule" "unresolved"}
   "origin_choices" #{"update assigned schema working draft"
                      "revise reusable rule or create assigned-schema override"
                      "edit parent working draft or create assigned-schema override"}
   "json_type" #{"number" "string" "boolean" "null"}
   "destination" #{"assigned schema draft" "parent schema draft" "assigned schema override" "reusable rule revision"}
   "expected_mutation" #{"widen stable rule 41 in the assigned schema working draft"
                         "widen stable rule 41 in the parent schema working draft"
                         "replace the inherited constraint with one widened local constraint"
                         "create the next reusable revision and stage its attachment update"
                         "replace the attachment constraint with one widened local constraint"}})

(defn- validate-example! [_mode example]
  (support/validate-example-domain!
   example-values example (filter #(support/example-value example %) (keys example-values))
   "Allowed-value expansion example value was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :allowed-value-expansion-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T20:36:42.234262583+02:00", :module-hash "-596882619", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-103545883"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "837571132"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "100342783"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 20, :hash "-1390430974"} {:id "defn-/runtime-observation!", :kind "defn-", :line 22, :end-line 28, :hash "1932120115"} {:id "defn-/assert-runtime!", :kind "defn-", :line 30, :end-line 87, :hash "694219855"} {:id "def/example-values", :kind "def", :line 89, :end-line 109, :hash "-178600960"} {:id "defn-/validate-example!", :kind "defn-", :line 111, :end-line 114, :hash "975921929"} {:id "def/handlers", :kind "def", :line 116, :end-line 119, :hash "-1137780686"}]}
;; clj-mutate-manifest-end
