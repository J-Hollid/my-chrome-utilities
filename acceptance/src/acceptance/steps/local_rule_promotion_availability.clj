(ns acceptance.steps.local-rule-promotion-availability
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-local-rule-promotion-availability-hardening.feature"
   "features/data-layer-local-rule-promotion-availability-hardening-runtime.feature"])

(def entry-modes
  {"Page view revision 3 contains local rule Known page types at /page_type" :model
   "the built extension side panel is running with production schema editing, local-rule promotion, Rule Library, and persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Local-rule promotion availability model verification failed. "
   "node" "test/data-layer-local-rule-promotion-availability-hardening-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "LOCAL_RULE_PROMOTION_AVAILABILITY_BROWSER_ADAPTER"
    :observation-key :localRulePromotionAvailability
    :runtime-error "Local-rule promotion availability browser runtime failed."
    :missing-error "Local-rule promotion availability browser evidence is missing."}))

(defn- assert-runtime! [{:keys [initial cancelled failure promoted reopened newSchema] :as observed}]
  (support/assert! (= {:controlCount 1 :noWorkingDraft true :canonicalRows 1 :identity "local-41" :path "/page_type"}
                      initial)
                   "The current-revision local rule was not immediately promotable without creating a draft."
                   initial)
  (support/assert! (and (:storageUnchanged cancelled)
                        (:noWorkingDraft cancelled)
                        (= 1 (:reopenedCount cancelled)))
                   "Cancel mutated storage or lost current-revision promotion eligibility."
                   cancelled)
  (support/assert! (and (:storageUnchanged failure)
                        (:controlRetained failure)
                        (:noDraft failure)
                        (str/includes? (:assistance failure) "simulated availability failure"))
                   "Atomic persistence failure left partial state or removed retry eligibility."
                   failure)
  (support/assert! (and (str/includes? (:review promoted) "revision 3 source for a new working draft")
                        (:workingDraft promoted)
                        (= ["reusable-51" "local-42"] (:draftIds promoted))
                        (= ["reusable-51"] (:libraryIds promoted))
                        (:sameIdentity promoted)
                        (:publishedUnchanged promoted)
                        (= 1 (:canonicalRows promoted))
                        (false? (:reusableControl promoted)))
                   "Confirmation did not create one isolated draft replacement and reusable identity."
                   promoted)
  (support/assert! (= {:version 4 :local42Count 1 :reusableCount 0 :noWorkingDraftBeforeAction true}
                      reopened)
                   "Publication and reopening did not recompute local versus reusable eligibility."
                   reopened)
  (support/assert! (and (str/starts-with? (:localId newSchema) "local-rule:")
                        (= 1 (:promotedCount newSchema))
                        (empty? (:standaloneAttachments newSchema))
                        (:schemaStorageUnchanged newSchema)
                        (:provisionalAbsent newSchema))
                   "Discarding a promoted new-schema draft left a provisional schema or dangling attachment."
                   newSchema)
  observed)

(def model-example-values
  {"rule_context" #{"local rule in the current revision"
                     "local rule in an existing working draft"
                     "newly created local rule"
                     "local rule in a new unpublished schema"
                     "reusable Rule Library attachment"
                     "inherited local rule from a parent"
                     "local rule in a historical revision"}
   "editor_context" #{"editable current schema"
                       "editable working draft"
                       "editable new-schema draft"
                       "editable child schema"
                       "read-only revision comparison"}
   "action_state" #{"available" "absent"}})

(def runtime-example-values
  {"resolved_origin" #{"current-revision local identity without a draft"
                        "working-draft local identity"
                        "reusable identity present in Rule Library"
                        "inherited identity from parent schema"
                        "historical read-only local identity"}
   "promotion_control_count" #{"1" "0"}})

(defn- validate-example! [mode example]
  (let [domains (if (= mode :runtime) runtime-example-values model-example-values)]
    (support/validate-example-domain!
     domains example
     (filter #(support/example-value example %) (keys domains))
     "Local-rule promotion availability example value was outside the specified contract.")))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :local-rule-promotion-availability-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))
