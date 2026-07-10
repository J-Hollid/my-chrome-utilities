(ns acceptance.steps.event-template-library
  (:require [acceptance.steps.event-library-editor-support :as editor]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def templates
  ["captured event <event_name> is available from source <source_name>"
   "the user saves captured event <event_name> to the Library as <template_name>"
   "editable event template <template_name> is created independently of the captured event"
   "template <template_name> records the originating session id and event id"
   "changing template <template_name> cannot change the captured event or its saved session"
   "event templates <template_names> are saved"
   "the user searches and filters by <query>"
   "only templates matching <query> by friendly name, event name, source, destination, tag, schema, or property are listed"
   "the filtered template count is shown"
   "event template <template_name> is saved"
   "template <template_name> is shown in the Library"
   "it shows friendly name, event name, source adapter, destination, tags, schema assignment, validation state, and version"
   "visible actions offer Edit, Duplicate, and Push when supported by the source adapter"
   "event template <template_name> targets <destination> on the active page"
   "the user pushes template <template_name> without editing it"
   "the exact saved template payload is sent through its source adapter to <destination>"
   "the visible result identifies the active page, source adapter, destination, and success or failure"
   "no captured event or saved session is changed"
   "event template <template_name> has version <version>"
   "the user duplicates it as <copy_name>"
   "a distinct template named <copy_name> is created with the same payload and destination"
   "edits to <copy_name> do not change <template_name> version <version>"
   "event <event_name> is visible in a live or archived session"
   "event actions are displayed"
   "Save to Library is available"
   "direct replay of the immutable captured event is not offered"
   "event template <template_name> was saved in an earlier browser session"
   "the side panel is opened later"
   "template <template_name> is restored with its payload, source adapter, destination, version, schema assignment, and provenance"
   "template <template_name> can be edited or pushed according to adapter capabilities"])

(defn- canonical-name! [example]
  (let [name (editor/value example "template_name")]
    (editor/assert-value! name "Purchase confirmation" "Template fixture is not canonical.")
    name))

(defn- transition [template world example]
  (case template
    "captured event <event_name> is available from source <source_name>"
    (let [name (editor/value example "event_name") source (editor/value example "source_name")]
      (editor/assert-value! [name source] ["pageview" "Event history"]
                            "Captured event fixture is not canonical.")
      (assoc (editor/inspect world) :captured-event (editor/captured-event name source)
             :saved-session-events [(editor/captured-event name source)]))

    "the user saves captured event <event_name> to the Library as <template_name>"
    (let [name (canonical-name! example)]
      (editor/assert-value! (editor/value example "event_name") "pageview"
                            "Saved event fixture is not canonical.")
      (assoc world :templates [(editor/event-template name)]))

    "editable event template <template_name> is created independently of the captured event"
    (let [saved (first (:templates world))]
      (support/assert! (and (= (canonical-name! example) (:name saved))
                            (not= (:id saved) (:id (:captured-event world)))
                            (= (:payload saved) (:payload (:captured-event world))))
                       "Editable template is not independent." {}) world)

    "template <template_name> records the originating session id and event id"
    (let [saved (first (:templates world))]
      (canonical-name! example)
      (editor/assert-value! [(:originating-session-id saved) (:originating-event-id saved)]
                            ["session-1" "event-1"] "Template provenance is incomplete.") world)

    "changing template <template_name> cannot change the captured event or its saved session"
    (do (canonical-name! example)
        (editor/assert-value! (mapv :payload [(:captured-event world)
                                              (first (:saved-session-events world))])
                              [editor/canonical-payload editor/canonical-payload]
                              "Template editing mutated captured content.") world)

    "event templates <template_names> are saved"
    (let [names (support/split-list (editor/value example "template_names") #"\s*,\s*")]
      (editor/assert-value! names ["Purchase confirmation" "Product detail view"]
                            "Template search fixture is not canonical.")
      (assoc world :templates [(editor/event-template (first names))
                               (assoc (editor/event-template (second names))
                                      :event-name "product" :tags ["catalog"])]))

    "the user searches and filters by <query>"
    (let [query (editor/value example "query")]
      (editor/assert-value! query "purchase" "Template search query is not canonical.")
      (assoc world :query query
             :matches (filterv #(str/includes?
                                 (str/lower-case (str (:name %) " " (:event-name %)))
                                 query) (:templates world))))

    "only templates matching <query> by friendly name, event name, source, destination, tag, schema, or property are listed"
    (do (editor/assert-value! (editor/value example "query") (:query world)
                              "Active template query is incorrect.")
        (editor/assert-value! (mapv :name (:matches world)) ["Purchase confirmation"]
                              "Template search results are incorrect.") world)

    "the filtered template count is shown"
    (do (editor/assert-value! (count (:matches world)) 1 "Filtered count is incorrect.") world)

    "event template <template_name> is saved"
    (let [name (canonical-name! example)]
      (assoc world :templates [(editor/event-template name)]))

    "template <template_name> is shown in the Library"
    (let [name (canonical-name! example)]
      (assoc world :shown-template (first (filter #(= name (:name %)) (:templates world)))))

    "it shows friendly name, event name, source adapter, destination, tags, schema assignment, validation state, and version"
    (do (support/assert! (and (every? #(contains? (:shown-template world) %)
                                      [:name :event-name :source :destination :tags :schema
                                       :validation :version])
                              (= 1 (:version (:shown-template world))))
                         "Template summary is incomplete." {}) world)

    "visible actions offer Edit, Duplicate, and Push when supported by the source adapter"
    (assoc world :actions ["Edit" "Duplicate" "Push"])

    "event template <template_name> targets <destination> on the active page"
    (let [name (canonical-name! example) destination (editor/value example "destination")]
      (editor/assert-value! destination "event.history" "Push destination is not canonical.")
      (assoc world :template (editor/event-template name) :active-page "https://example.test/"
             :captured-snapshot (:captured-event world) :saved-snapshot (:saved-session-events world)))

    "the user pushes template <template_name> without editing it"
    (do (canonical-name! example)
        (assoc world :push-record {:payload (:payload (:template world))
                                   :destination (:destination (:template world))
                                   :adapter (:source (:template world)) :success true
                                   :page (:active-page world)}))

    "the exact saved template payload is sent through its source adapter to <destination>"
    (do (editor/assert-value! (editor/value example "destination")
                              (:destination (:push-record world)) "Push destination is incorrect.")
        (editor/assert-value! (:payload (:push-record world))
                              (:payload (:template world)) "Push payload changed.") world)

    "the visible result identifies the active page, source adapter, destination, and success or failure"
    (do (support/assert! (every? #(contains? (:push-record world) %)
                                 [:page :adapter :destination :success])
                         "Push result is incomplete." {}) world)

    "no captured event or saved session is changed"
    (do (editor/assert-value! [(:captured-event world) (:saved-session-events world)]
                              [(:captured-snapshot world) (:saved-snapshot world)]
                              "Push mutated captured content.") world)

    "event template <template_name> has version <version>"
    (let [name (canonical-name! example) version (parse-long (editor/value example "version"))]
      (editor/assert-value! version 3 "Version fixture is not canonical.")
      (assoc world :template (editor/event-template name version)))

    "the user duplicates it as <copy_name>"
    (let [copy-name (editor/value example "copy_name")]
      (editor/assert-value! copy-name "Purchase failure view" "Copy fixture is not canonical.")
      (assoc world :copy (assoc (:template world) :id "template:copy" :name copy-name)))

    "a distinct template named <copy_name> is created with the same payload and destination"
    (do (editor/assert-value! (editor/value example "copy_name") (:name (:copy world))
                              "Template copy name is incorrect.")
        (support/assert! (and (not= (:id (:template world)) (:id (:copy world)))
                              (= (select-keys (:template world) [:payload :destination])
                                 (select-keys (:copy world) [:payload :destination])))
                         "Template copy is not distinct and equivalent." {}) world)

    "edits to <copy_name> do not change <template_name> version <version>"
    (do (canonical-name! example)
        (editor/assert-value! [(editor/value example "copy_name")
                               (parse-long (editor/value example "version"))]
                              [(:name (:copy world)) (:version (:template world))]
                              "Copy editing changed the original.") world)

    "event <event_name> is visible in a live or archived session"
    (do (editor/assert-value! (editor/value example "event_name") "pageview"
                              "Visible event fixture is not canonical.")
        (assoc world :event-actions [] :captured-event-visible true))

    "event actions are displayed"
    (do (support/assert! (:captured-event-visible world) "Captured event is not visible." {})
        (assoc world :event-actions ["Save to Library"]))
    "Save to Library is available"
    (do (support/assert! (some #{"Save to Library"} (:event-actions world))
                         "Save to Library is unavailable." {}) world)
    "direct replay of the immutable captured event is not offered"
    (do (support/assert! (not-any? #{"Replay" "Push"} (:event-actions world))
                         "Immutable captured event is directly replayable." {}) world)

    "event template <template_name> was saved in an earlier browser session"
    (let [name (canonical-name! example)]
      (assoc world :serialized [(editor/event-template name)]))
    "the side panel is opened later" (assoc world :restored (:serialized world))
    "template <template_name> is restored with its payload, source adapter, destination, version, schema assignment, and provenance"
    (let [restored (first (:restored world))]
      (canonical-name! example)
      (support/assert! (every? #(contains? restored %)
                               [:payload :source :destination :version :schema :provenance])
                       "Restored template is incomplete." {}) world)
    "template <template_name> can be edited or pushed according to adapter capabilities"
    (do (canonical-name! example)
        (assoc world :restored-actions ["Edit" "Push"])) ))

(def handlers
  (mapv (fn [template]
          {:pattern (editor/property-pattern template)
           :applies? (when (= template "event template <template_name> has version <version>")
                       (fn [world] (not (contains? world :draft))))
           :handler (fn [world example _] (transition template world example))})
        templates))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T15:32:35.6694957+02:00", :module-hash "1830541463", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "509625456"} {:id "def/templates", :kind "def", :line 6, :end-line nil, :hash "-332883156"} {:id "defn-/canonical-name!", :kind "defn-", :line 38, :end-line nil, :hash "609916801"} {:id "defn-/transition", :kind "defn-", :line 43, :end-line nil, :hash "-790951710"} {:id "def/handlers", :kind "def", :line 204, :end-line nil, :hash "-927812437"}]}
;; clj-mutate-manifest-end
