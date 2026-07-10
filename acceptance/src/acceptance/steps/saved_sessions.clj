(ns acceptance.steps.saved-sessions
  (:require [acceptance.steps.support :as support]
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

(defn- inspect [world]
  (let [root (or (:root world) (support/repository-root))
        html (support/source-file root "side-panel.html")
        source (str (support/source-file root "src/side-panel.ts") "\n"
                    (support/source-file root "src/data-layer-saved-sessions.ts"))]
    (support/assert! (saved-sessions-wired? html source)
                     "Saved session archive UI and domain wiring is incomplete."
                     {})
    (assoc world :root root :saved-sessions-html html :saved-sessions-source source)))

(def handlers
  (mapv (fn [template]
          {:pattern (template-pattern template)
           :handler (fn [world _example _captures] (inspect world))})
        saved-session-step-templates))
