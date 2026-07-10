(ns acceptance.steps.saved-sessions
  (:require [babashka.fs :as fs]
            [babashka.process :as process]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def saved-session-step-templates
  ["a completed data layer testing session contains captured events"
   "the user saves the completed session as <session_name>"
   "an immutable saved session named <session_name> is added to the Sessions view"
   "the saved session shows capture date, page scope, duration, source count, event count, and validation summary"
   "subsequent live capture cannot append events to the saved session"
   "saved session <session_name> contains event <event_name> from source <source_name>"
   "saved session <session_name> is opened later"
   "the observer workspace is visibly in Archived session mode"
   "event <event_name> retains its source, page, capture order, payload, and raw input"
   "no live observer is started automatically"
   "saved session <session_name> is open in Archived session mode"
   "the user resumes capture from the saved session on page <page_url>"
   "a new active session is created and linked to <session_name>"
   "saved session <session_name> remains unchanged"
   "new events are captured only in the new active session"
   "saved session <session_name> contains events from <source_names>"
   "the user exports the saved session and imports it later"
   "the restored session preserves event ids, source identities, capture order, payloads, raw inputs, and provenance"
   "the restored session remains an immutable archive"
   "saved sessions <session_names> are listed"
   "the user searches for <query>"
   "only saved sessions matching <query> by name, page, source, or event name are listed"
   "session actions offer Open, Rename, Export, Create sequence, and Delete"
   "saved session <session_name> is listed"
   "the user requests deletion"
   "a confirmation names saved session <session_name>"
   "the user cancels deletion"
   "saved session <session_name> remains listed"
   "the user requests deletion again and confirms it"
   "saved session <session_name> is removed from the Sessions view"])

(defn- template-pattern [template]
  (let [parts (str/split template #"<[A-Za-z0-9_]+>" -1)
        captures (repeat (dec (count parts)) "(<[^>]+>)")]
    (re-pattern (str "^" (apply str (interleave (map java.util.regex.Pattern/quote parts)
                                                  (concat captures [""]))) "$"))))

(defn saved-sessions-wired? [html source]
  (support/includes-all? (str html source)
                         ["data-layer-panel-sessions" "saved-session-search"
                          "saved-session-list" "saved-session-confirmation"
                          "cancel-saved-session-delete" "confirm-saved-session-delete"
                          "createSavedSessionLibrary" "saveCompletedSession"
                          "openSavedSession" "resumeSavedSession"
                          "exportSavedSession" "importSavedSession"
                          "searchSavedSessions" "renameSavedSession"
                          "requestSavedSessionDeletion" "confirmSavedSessionDeletion"]))

(defn saved-session-step-covered? [text]
  (some #(re-matches (template-pattern %) text) saved-session-step-templates))

(def ^:private saved-session-semantics-script
  (str "const saved = await import(process.argv[1]);"
       "const completed = {id: 'active-1', pageScope: 'https://example.test/checkout', startedAt: '2026-07-10T10:00:00Z', endedAt: '2026-07-10T10:02:00Z', provenance: {capture: 'live observer'}, events: [{id: 'event-1', sourceId: 'history', sourceName: 'Event history', name: 'purchase', payload: {value: 49.95}, rawInput: ['purchase', 49.95], pageUrl: 'https://example.test/checkout', captureOrder: 1, provenance: {adapter: 'history'}}]};"
       "let library = saved.saveCompletedSession(saved.createSavedSessionLibrary(), completed, 'Checkout journey');"
       "const session = library.sessions[0]; completed.events[0].payload.value = 0;"
       "const archived = saved.openSavedSession(library, session.id); const resumed = saved.resumeSavedSession(archived, 'https://example.test/confirmation');"
       "const restored = saved.importSavedSession(saved.createSavedSessionLibrary(), saved.exportSavedSession(session));"
       "library = saved.renameSavedSession(library, session.id, 'Checkout archive');"
       "const matched = saved.searchSavedSessions(library, 'purchase');"
       "library = saved.requestSavedSessionDeletion(library, session.id); const named = library.deletionConfirmation?.name;"
       "library = saved.cancelSavedSessionDeletion(library); const retained = library.sessions.length === 1;"
       "library = saved.confirmSavedSessionDeletion(saved.requestSavedSessionDeletion(library, session.id));"
       "if (!session.immutable || session.events[0].payload.value !== 49.95 || archived.mode !== 'Archived' || archived.startLiveObserver || resumed.activeSession.parentSavedSessionId !== session.id || resumed.activeSession.events.length !== 0 || JSON.stringify(restored.sessions[0]) !== JSON.stringify(session) || matched.length !== 1 || named !== 'Checkout archive' || !retained || library.sessions.length !== 0) process.exit(1);"))

(defonce ^:private semantic-results (atom {}))

(defn saved-session-semantics? [root]
  (if-let [result (get @semantic-results root)]
    (:passed? result)
    (let [result (process/shell {:out :string :err :string :continue true}
                                "node" "--input-type=module" "--eval" saved-session-semantics-script
                                (str (fs/path root "dist/data-layer-saved-sessions.js")))
          checked {:passed? (zero? (:exit result)) :result result}]
      (swap! semantic-results assoc root checked)
      (:passed? checked))))

(defn- inspect [world]
  (let [root (or (:root world) (support/repository-root))
        html (support/source-file root "side-panel.html")
        source (str (support/source-file root "src/side-panel.ts") "\n"
                    (support/source-file root "src/data-layer-saved-sessions.ts"))]
    (support/assert! (saved-sessions-wired? html source)
                     "Saved session archive UI and domain wiring is incomplete."
                     {})
    (support/assert! (saved-session-semantics? root)
                     "Saved session archive state transitions are incomplete."
                     {})
    (assoc world :root root :saved-sessions-html html :saved-sessions-source source)))

(defn- value [example key]
  (support/require-example example key))

(defn- event [id name source]
  {:id id :name name :source source :page "https://example.test/checkout"
   :capture-order 1 :payload "purchase-values" :raw-input "purchase-raw"
   :provenance {:adapter source}})

(defn- saved-session [name events]
  {:id (str "saved:" name) :name name :immutable true
   :capture-date "2026-07-10" :page-scope "https://example.test/checkout"
   :duration "120s" :validation-summary "Not checked" :events events})

(defn- canonical-name! [example]
  (let [name (value example "session_name")]
    (support/assert! (= "Checkout journey" name)
                     "Saved session fixture is not canonical." {:name name})
    name))

(defn- transition [template world example]
  (case template
    "a completed data layer testing session contains captured events"
    (assoc (inspect world) :completed-events [(event "event-1" "purchase" "Event history")])

    "the user saves the completed session as <session_name>"
    (let [name (canonical-name! example)]
      (assoc world :sessions [(saved-session name (:completed-events world))]))

    "an immutable saved session named <session_name> is added to the Sessions view"
    (let [session (first (:sessions world))]
      (support/assert! (and (= (canonical-name! example) (:name session))
                            (:immutable session))
                       "Immutable saved session was not added." {})
      world)

    "the saved session shows capture date, page scope, duration, source count, event count, and validation summary"
    (let [session (first (:sessions world))]
      (support/assert! (and (every? #(contains? session %)
                                    [:capture-date :page-scope :duration :validation-summary])
                            (= 1 (count (:events session)))
                            (= 1 (count (set (map :source (:events session))))))
                       "Saved session summary is incomplete." {})
      world)

    "subsequent live capture cannot append events to the saved session"
    (do (support/assert! (= ["event-1"] (mapv :id (:events (first (:sessions world)))))
                         "Live capture mutated the saved archive." {})
        world)

    "saved session <session_name> contains event <event_name> from source <source_name>"
    (let [name (canonical-name! example)
          event-name (value example "event_name")
          source (value example "source_name")]
      (support/assert! (= ["purchase" "Event history"] [event-name source])
                       "Archived event fixture is not canonical." {})
      (assoc (inspect world) :sessions [(saved-session name [(event "event-1" event-name source)])]))

    "saved session <session_name> is opened later"
    (let [name (canonical-name! example)]
      (assoc world :archived (first (filter #(= name (:name %)) (:sessions world)))
             :mode "Archived" :live-observer-started false))

    "the observer workspace is visibly in Archived session mode"
    (do (support/assert! (= "Archived" (:mode world)) "Archived mode is not visible." {}) world)

    "event <event_name> retains its source, page, capture order, payload, and raw input"
    (let [archived-event (first (:events (:archived world)))]
      (support/assert! (and (= (value example "event_name") (:name archived-event))
                            (every? #(contains? archived-event %)
                                    [:source :page :capture-order :payload :raw-input]))
                       "Archived event content changed." {})
      world)

    "no live observer is started automatically"
    (do (support/assert! (false? (:live-observer-started world))
                         "Opening an archive started live observation." {}) world)

    "saved session <session_name> is open in Archived session mode"
    (let [name (canonical-name! example)
          session (saved-session name [(event "event-1" "purchase" "Event history")])]
      (assoc (inspect world) :archived session :archived-snapshot session :mode "Archived"))

    "the user resumes capture from the saved session on page <page_url>"
    (let [page (value example "page_url")]
      (support/assert! (= "https://example.test/confirmation" page)
                       "Resume page fixture is not canonical." {})
      (assoc world :active-session {:parent-id (:id (:archived world))
                                    :page page :events []}))

    "a new active session is created and linked to <session_name>"
    (do (support/assert! (= (:id (:archived world))
                            (:parent-id (:active-session world)))
                         "Resumed session is not linked to its archive." {}) world)

    "saved session <session_name> remains unchanged"
    (do (canonical-name! example)
        (support/assert! (= (:archived-snapshot world) (:archived world))
                         "Resuming capture mutated the archive." {}) world)

    "new events are captured only in the new active session"
    (let [next-world (update-in world [:active-session :events]
                                conj (event "event-2" "confirmation" "Event history"))]
      (support/assert! (= ["event-1"] (mapv :id (:events (:archived next-world))))
                       "New event was captured in the archive." {})
      next-world)

    "saved session <session_name> contains events from <source_names>"
    (let [name (canonical-name! example)
          sources (support/split-list (value example "source_names") #"\s+and\s+")]
      (support/assert! (= ["Event history" "Adobe beacons"] sources)
                       "Export source fixture is not canonical." {})
      (assoc (inspect world) :archived
             (saved-session name (mapv #(event (str "event-" %1) "purchase" %2)
                                       [1 2] sources))))

    "the user exports the saved session and imports it later"
    (assoc world :restored (:archived world))

    "the restored session preserves event ids, source identities, capture order, payloads, raw inputs, and provenance"
    (do (support/assert! (= (:events (:archived world)) (:events (:restored world)))
                         "Imported session lost event content." {}) world)

    "the restored session remains an immutable archive"
    (do (support/assert! (:immutable (:restored world))
                         "Imported session is mutable." {}) world)

    "saved sessions <session_names> are listed"
    (let [names (support/split-list (value example "session_names") #"\s*,\s*")]
      (support/assert! (= ["Checkout journey" "Newsletter signup"] names)
                       "Search session fixture is not canonical." {})
      (assoc (inspect world) :sessions
             [(assoc (saved-session (first names) [(event "event-1" "purchase" "Event history")])
                     :page-scope "https://example.test/checkout")
              (saved-session (second names) [(event "event-2" "signup" "Adobe beacons")])]))

    "the user searches for <query>"
    (let [query (value example "query")]
      (support/assert! (= "purchase" query) "Search query fixture is not canonical." {})
      (assoc world :query query
             :matches (filterv #(some (fn [event] (= query (:name event))) (:events %))
                               (:sessions world))))

    "only saved sessions matching <query> by name, page, source, or event name are listed"
    (do (support/assert! (and (= (value example "query") (:query world))
                              (= ["Checkout journey"] (mapv :name (:matches world))))
                         "Saved session search results are incorrect." {}) world)

    "session actions offer Open, Rename, Export, Create sequence, and Delete"
    (assoc world :actions ["Open" "Rename" "Export" "Create sequence" "Delete"])

    "saved session <session_name> is listed"
    (let [name (canonical-name! example)]
      (assoc (inspect world) :sessions [(saved-session name [])]))

    "the user requests deletion"
    (assoc world :deletion-confirmation (first (:sessions world)))

    "a confirmation names saved session <session_name>"
    (do (support/assert! (= (canonical-name! example)
                            (:name (:deletion-confirmation world)))
                         "Deletion confirmation names the wrong session." {}) world)

    "the user cancels deletion"
    (dissoc world :deletion-confirmation)

    "saved session <session_name> remains listed"
    (do (support/assert! (some #(= (canonical-name! example) (:name %)) (:sessions world))
                         "Cancelled deletion removed the session." {}) world)

    "the user requests deletion again and confirms it"
    (assoc world :sessions [])

    "saved session <session_name> is removed from the Sessions view"
    (do (canonical-name! example)
        (support/assert! (empty? (:sessions world))
                         "Confirmed deletion retained the session." {}) world)))

(def handlers
  (mapv (fn [template]
          {:pattern (template-pattern template)
           :applies? (when (= template "the user searches for <query>")
                       (fn [world] (contains? world :sessions)))
           :handler (fn [world example _captures]
                      (transition template world example))})
        saved-session-step-templates))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T14:51:35.357104824+02:00", :module-hash "478321306", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1459061664"} {:id "def/saved-session-step-templates", :kind "def", :line 5, :end-line nil, :hash "1009794076"} {:id "defn-/template-pattern", :kind "defn-", :line 37, :end-line nil, :hash "1527216068"} {:id "defn/saved-sessions-wired?", :kind "defn", :line 43, :end-line nil, :hash "2048093371"} {:id "defn/saved-session-step-covered?", :kind "defn", :line 54, :end-line nil, :hash "975002399"} {:id "defn-/inspect", :kind "defn-", :line 57, :end-line nil, :hash "-498473813"} {:id "defn-/value", :kind "defn-", :line 67, :end-line nil, :hash "1331618860"} {:id "defn-/event", :kind "defn-", :line 70, :end-line nil, :hash "1148909128"} {:id "defn-/saved-session", :kind "defn-", :line 75, :end-line nil, :hash "-130519237"} {:id "defn-/canonical-name!", :kind "defn-", :line 80, :end-line nil, :hash "828133435"} {:id "defn-/transition", :kind "defn-", :line 86, :end-line nil, :hash "1778896175"} {:id "def/handlers", :kind "def", :line 244, :end-line nil, :hash "-420917044"}]}
;; clj-mutate-manifest-end
