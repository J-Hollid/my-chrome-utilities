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
          (= 1 (count (re-seq #"Rename schema from Page view to Generic page view"
                              (get-in published [:review :text]))))
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
  (support/stateful-transition
   world example text entry-steps :schema-renaming browser-observation!
   "Schema renaming browser adapter was not executed."
   assert-observation!))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-steps
   :schema-renaming
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T17:42:08.783003817+02:00", :module-hash "-997397041", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1997548993"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "-1617945967"} {:id "def/entry-steps", :kind "def", :line 8, :end-line 10, :hash "-133233111"} {:id "form/3/defonce", :kind "defonce", :line 11, :end-line 11, :hash "-1819867165"} {:id "defn-/browser-observation!", :kind "defn-", :line 13, :end-line 19, :hash "974220279"} {:id "defn-/assert-example!", :kind "defn-", :line 21, :end-line 28, :hash "-254938457"} {:id "defn-/assert-observation!", :kind "defn-", :line 30, :end-line 72, :hash "-1175196536"} {:id "defn-/transition", :kind "defn-", :line 74, :end-line 78, :hash "1468419091"} {:id "def/handlers", :kind "def", :line 80, :end-line 85, :hash "-352418415"}]}
;; clj-mutate-manifest-end
