(ns acceptance.steps.schema-renaming
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-schema-renaming.feature"
   "features/data-layer-schema-renaming-runtime.feature"])
(def entry-steps
  #{"schema Page view has stable identity schema-page-view and current revision 3"
    "the built extension side panel is running with the production Schema Library, schema editor, revisions, assignments, inheritance, Event Library attachments, and persistence"})
(defonce ^:private observation (atom nil))

(defn- browser-observation! []
  (support/cached-browser-observation!
   observation
   {:adapter-env "SCHEMA_RENAMING_BROWSER_ADAPTER"
    :observation-key :schemaRenaming
    :runtime-error "Schema renaming browser runtime failed."
    :missing-error "Schema renaming browser observation is missing."}))

(defn- assert-example! [example observed]
  (when-let [proposed (support/example-value example "proposed_name")]
    (let [key (keyword (if (= proposed "empty") "empty" proposed))
          state (get-in observed [:invalidAndDiscard :invalid key])]
      (support/assert!
       (= {:disabled true :assistance (support/require-example example "assistance")} state)
       "Rename collision readiness changed."
       {:example example :state state}))))

(defn- assert-observation! [example observed]
  (let [{:keys [draft published invalidAndDiscard]} observed
        publication (:published published)]
    (support/assert!
     (= {:proposed "Generic page view" :current "Page view"
         :pending ["Rename schema from Page view to Generic page view"] :version 3}
        draft)
     "Rename proposal was not isolated in revision 3's working draft." observed)
    (support/assert!
     (= ["Generic page view" ["Rename schema from Page view to Generic page view"]]
        [(get-in published [:restored :name]) (get-in published [:restored :pending])])
     "Pending rename did not survive editor close and reload." observed)
    (support/assert!
     (and (get-in published [:review :unchanged])
          (str/includes? (get-in published [:review :text]) "Rename schema from Page view to Generic page view")
          (str/includes? (get-in published [:review :text]) "Change additional-property policy"))
     "Publish review changed storage or omitted pending changes." observed)
    (support/assert!
     (= {:id "schema-page-view" :name "Generic page view" :version 4
         :workingDraftAbsent true :history [{:name "Page view" :version 3}]
         :otherEdit true :count 1}
        (dissoc publication :rows))
     "Rename publication changed stable identity, history, or companion edits." observed)
    (support/assert!
     (and (str/includes? (:rows publication) "Generic page view · current revision 4")
          (not (str/includes? (:rows publication) "Page view · current revision 3")))
     "Schema Library did not render the renamed current schema." observed)
    (support/assert!
     (= #{"schema-page-view"} (set (vals (:refs published))))
     "A live reference stopped using the stable schema identity." observed)
    (support/assert!
     (= [{:name "Generic page view" :version 4} {:name "Page view" :version 3}]
        [(:latest published) (:pinned published)])
     "Follow-latest or pinned validation rename semantics changed." observed)
    (support/assert!
     (= ["schema-page-view" "schema-product-detail"] (:identities invalidAndDiscard))
     "Invalid rename merged or overwrote schema identities." observed)
    (support/assert!
     (= {:draftAbsent true :current "Page view" :rendered "Page view"}
        (:discarded invalidAndDiscard))
     "Discard did not restore the published schema name." observed)
    (assert-example! example observed)))

(defn- transition [world example _captures {:keys [text]}]
  (let [world (if (entry-steps text) (assoc world :schema-renaming (browser-observation!)) world)
        observed (:schema-renaming world)]
    (support/assert! observed "Schema renaming browser adapter was not executed." {:step text})
    (assert-observation! example observed)
    world))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-steps
   :schema-renaming
   transition))
