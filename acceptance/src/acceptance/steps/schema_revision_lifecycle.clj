(ns acceptance.steps.schema-revision-lifecycle
  (:require [acceptance.steps.support :as support]))

(def feature-file "features/data-layer-schema-revision-lifecycle.feature")
(defonce ^:private browser-observation (atom nil))

(def ^:private entry-steps
  #{"schema Product listing has stable identity schema-product-listing, current revision 3, and no working draft"
    "the Product listing working draft is based on current revision 3 and contains a pending page_type rule"
    "schema Product listing has stable identity schema-product-listing and current revision 3"
    "Product listing has current revision 4 and historical revisions 1, 2, and 3"
    "assignment Product pages references schema-product-listing with version policy <version_policy>"
    "Product listing current revision 3 has a working draft with 3 pending changes"
    "legacy storage contains Product listing revisions 1, 2, 3, and 4 as separately selectable schemas"
    "a valid new-schema draft named Checkout has not been published"
    "the operator adds page_type to a Product listing working draft based on current revision 3"
    "Product listing revision 2 is selected in Revision history"
    "Product listing has current revision 4 and no working draft"
    "Product listing has current revision 4 and a working draft with 3 pending changes"})

(defn- load-observation! []
  (reset! browser-observation
          (support/load-browser-observation!
           {:adapter-env "SCHEMA_REVISION_LIFECYCLE_BROWSER_ADAPTER"
            :observation-key :schemaRevisionLifecycle
            :runtime-error "Schema revision lifecycle browser runtime failed."
            :missing-error "Schema revision lifecycle browser observation is missing."})))

(defn- observation! [] (or @browser-observation (load-observation!)))

(defn- assert-lifecycle! [example observation]
  (support/assert! (= {:identity "schema-product-listing"
                       :current 3
                       :base 3
                       :source 3
                       :twoPending ["Add page_type rule" "Add page_name rule"]
                       :pending ["Add page_type rule" "Add page_name rule" "Add Checkout assignment"]
                       :properties ["product_id" "page_type" "page_name"]
                       :durable true
                       :currentProperties ["product_id"]
                       :activeCheckout false
                       :sameIdentity true}
                      (:workingDraft observation))
                   "Working draft changes mutated the current schema or failed to survive storage." observation)
  (support/assert! (= {:identity "schema-product-listing"
                       :current 4
                       :history [3]
                       :draftCleared true
                       :properties ["product_id" "page_type" "page_name"]
                       :checkoutRevision 4
                       :choices ["Product listing"]}
                      (:publication observation))
                   "Publication did not advance one stable schema identity." observation)
  (support/assert! (= {:pinned 3 :latest 4 :recorded [3 4]} (:policies observation))
                   "Pinned and follow-latest assignments resolved the wrong revisions." observation)
  (support/assert! (= {:choices [3]
                       :selected 3
                       :duplicate {:name "Product listing revision 3 copy" :published false :assignable 0}
                       :restored {:current 4 :source 3 :pending ["Restore revision 3"] :discardCurrent 4}}
                      (:history observation))
                   "Historical duplication or restoration changed the current revision." observation)
  (support/assert! (= {:count 1
                       :identity "schema-product-listing"
                       :current 4
                       :history [3 2 1]
                       :assignments [{:schemaId "schema-product-listing" :schemaVersion 3 :versionPolicy "pinned"}
                                     {:schemaId "schema-product-listing" :schemaVersion nil :versionPolicy "follow latest"}]}
                      (:migration observation))
                   "Legacy revision rows did not migrate to one stable schema." observation)
  (support/assert! (= ["Add another property" "Review draft" "Publish revision"] (:completionActions observation))
                   "Guided draft completion actions are missing or unordered." observation)
  (when-let [policy (support/example-value example "version_policy")]
    (let [expected (support/example-value example "resolved_revision")
          observed (if (= policy "pinned to 3") (get-in observation [:policies :pinned]) (get-in observation [:policies :latest]))]
      (support/assert! (= expected (str "revision " observed)) "Assignment policy example resolved the wrong revision." {:example example :observation observation}))))

(defn- transition [world example _captures {:keys [text]}]
  (let [world (if (entry-steps text) (assoc world :schema-revision-lifecycle (observation!)) world)
        observation (:schema-revision-lifecycle world)]
    (support/assert! observation "Schema revision lifecycle browser adapter was not executed." {:step text})
    (assert-lifecycle! example observation)
    world))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world] (or (entry-steps (:text spec)) (:schema-revision-lifecycle world)))
           :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs [feature-file] #{})))
