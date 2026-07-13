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

(def ^:private expected-working-draft
  {:identity "schema-product-listing"
   :current 3
   :base 3
   :source 3
   :twoPending ["Add page_type rule" "Add page_name rule"]
   :pending ["Add page_type rule" "Add page_name rule" "Add Checkout assignment"]
   :properties ["product_id" "page_type" "page_name"]
   :durable true
   :currentProperties ["product_id"]
   :activeCheckout false
   :sameIdentity true})

(def ^:private expected-publication
  {:identity "schema-product-listing"
   :current 4
   :history [3]
   :draftCleared true
   :properties ["product_id" "page_type" "page_name"]
   :checkoutRevision 4
   :choices ["Product listing"]})

(def ^:private expected-history
  {:choices [3]
   :selected 3
   :duplicate {:name "Product listing revision 3 copy" :published false :assignable 0}
   :restored {:current 4 :source 3 :pending ["Restore revision 3"] :discardCurrent 4}})

(def ^:private expected-migration
  {:count 1
   :identity "schema-product-listing"
   :current 4
   :history [3 2 1]
   :assignments [{:schemaId "schema-product-listing" :schemaVersion 3 :versionPolicy "pinned"}
                 {:schemaId "schema-product-listing" :schemaVersion nil :versionPolicy "follow latest"}]})

(def ^:private expected-ui
  {:history
   {:options ["Revision 3" "Revision 2" "Revision 1"]
    :comparison "Revision 2 compared with current revision 4. 1 historical properties; 1 current properties."
    :actions ["Duplicate from revision" "Restore this revision"]
    :separateRows 0
    :assignmentChoices ["Product listing version 4"]
    :openedWithoutMutation true
    :status "Working draft based on revision 4 · 3 pending changes"}
   :duplication
   {:name "Product listing revision 2 copy"
    :published false
    :version 1
    :assignments 0
    :sourceUnchanged 4
    :assignableChoices ["Product listing version 4"]}
   :restoration
   {:review "Product listing revision 2 will replace 3 pending draft changes and create a working draft. Current revision 4 remains active; publication will create revision 5."
    :cancel {:dialogClosed true :draftUnchanged true :current 4}
    :confirmed {:current 4 :source 2 :pending ["Restore revision 2"]}}
   :publication
   {:review "Product listing working draft will be compared with current revision 4; confirmation publishes revision 5."
    :current 5
    :history [1 2 3 4]
    :draftCleared true}})

(def ^:private policy-keys
  {"pinned to 3" :pinned
   "follow latest" :latest})

(defn- policy-revision [policy observation]
  (get-in observation [:policies (get policy-keys policy)]))

(defn- assert-policy-example! [example observation]
  (when-let [policy (support/example-value example "version_policy")]
    (let [expected (support/example-value example "resolved_revision")
          observed (policy-revision policy observation)]
      (support/assert! (= expected (str "revision " observed))
                       "Assignment policy example resolved the wrong revision."
                       {:example example :observation observation}))))

(defn- assert-lifecycle! [example observation]
  (support/assert! (= expected-working-draft (:workingDraft observation))
                   "Working draft changes mutated the current schema or failed to survive storage." observation)
  (support/assert! (= expected-publication (:publication observation))
                   "Publication did not advance one stable schema identity." observation)
  (support/assert! (= {:pinned 3 :latest 4 :recorded [3 4]} (:policies observation))
                   "Pinned and follow-latest assignments resolved the wrong revisions." observation)
  (support/assert! (= expected-history (:history observation))
                   "Historical duplication or restoration changed the current revision." observation)
  (support/assert! (= expected-migration (:migration observation))
                   "Legacy revision rows did not migrate to one stable schema." observation)
  (support/assert! (= expected-ui (:ui observation))
                   "Revision history UI changed lifecycle state or exposed an assignable draft or historical row." observation)
  (support/assert! (= ["Add another property" "Review draft" "Publish revision"] (:completionActions observation))
                   "Guided draft completion actions are missing or unordered." observation)
  (assert-policy-example! example observation))

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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-13T23:07:30.770828267+02:00", :module-hash "481485422", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "854328778"} {:id "def/feature-file", :kind "def", :line 4, :end-line nil, :hash "1100543844"} {:id "form/2/defonce", :kind "defonce", :line 5, :end-line nil, :hash "-1618529344"} {:id "def/entry-steps", :kind "def", :line 7, :end-line nil, :hash "63856129"} {:id "defn-/load-observation!", :kind "defn-", :line 21, :end-line nil, :hash "1102314959"} {:id "defn-/observation!", :kind "defn-", :line 29, :end-line nil, :hash "204904339"} {:id "def/expected-working-draft", :kind "def", :line 31, :end-line nil, :hash "547774403"} {:id "def/expected-publication", :kind "def", :line 44, :end-line nil, :hash "29558741"} {:id "def/expected-history", :kind "def", :line 53, :end-line nil, :hash "168465605"} {:id "def/expected-migration", :kind "def", :line 59, :end-line nil, :hash "1243713517"} {:id "def/expected-ui", :kind "def", :line 67, :end-line nil, :hash "-116718411"} {:id "def/policy-keys", :kind "def", :line 93, :end-line nil, :hash "-2123497748"} {:id "defn-/policy-revision", :kind "defn-", :line 97, :end-line nil, :hash "1831898148"} {:id "defn-/assert-policy-example!", :kind "defn-", :line 100, :end-line nil, :hash "558105691"} {:id "defn-/assert-lifecycle!", :kind "defn-", :line 108, :end-line nil, :hash "1872329838"} {:id "defn-/transition", :kind "defn-", :line 125, :end-line nil, :hash "-813049935"} {:id "def/handlers", :kind "def", :line 132, :end-line nil, :hash "350285377"}]}
;; clj-mutate-manifest-end
