(ns acceptance.steps.saved-session-live-feed
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-saved-session-live-feed-restore.feature"
   "features/data-layer-session-save-snapshot.feature"
   "features/data-layer-saved-session-library.feature"])

(def entry-steps
  #{"saved session Checkout journey contains 18 captured events in original capture order"
    "the current session contains 18 captured events"
    "a completed data layer testing session contains captured events"
    "saved session <session_name> contains event <event_name> from source <source_name>"
    "saved session <session_name> is selected in Sessions"
    "saved session <session_name> contains events from <source_names>"
    "saved sessions <session_names> are listed"
    "saved session <session_name> is listed"})

(defonce ^:private observation (atom nil))

(defn- load-observation! []
  (reset! observation
          (support/load-browser-observation!
           {:adapter-env "SAVED_SESSION_LIVE_FEED_BROWSER_ADAPTER"
            :observation-key :savedSessionLiveFeed
            :runtime-error "Saved session Live feed browser runtime failed."
            :missing-error "Saved session Live feed browser observation is missing."})))

(defn- observation! [] (or @observation (load-observation!)))

(defn- assert-initial! [initial]
  (support/assert! (= ["Open in Live feed" "Start linked capture" "Rename" "Export" "Create sequence" "Delete"]
                      (:actions initial))
                   "Saved session action hierarchy changed." initial)
  (support/assert! (= {:liveSelected true
                        :mode "saved-session"
                        :eventCount "18"
                        :observer "Disconnected"
                        :captureDisabled [true true true]
                        :storedCount 18}
                       (select-keys (:open initial) [:liveSelected :mode :eventCount :observer :captureDisabled :storedCount]))
                   "Opening the archive did not create a read-only Live feed." initial)
  (support/assert! (and (str/includes? (get-in initial [:open :banner]) "Checkout journey")
                        (str/includes? (get-in initial [:open :banner]) "Read-only archive")
                        (str/includes? (get-in initial [:open :banner]) "18 events")
                        (str/includes? (get-in initial [:open :banner]) "No observer was started"))
                   "Saved-session banner content changed." initial)
  (support/assert! (every? (set (:analysisActions initial))
                           ["Copy payload" "Save to Library" "Create schema"
                            "Create validation from this event" "Create defect report" "Revalidate"])
                   "Saved events lost current-feed analysis actions." initial)
  (let [model (:model initial)]
    (support/assert! (and (= (mapv #(str "saved-" %) (range 1 19)) (:savedOrder model))
                          (= 18 (:currentCount model))
                          (= 18 (:savedCount model))
                          (= 4 (:background model))
                          (= "purchase" (:currentSelected model))
                          (= "purchase" (:currentFilter model))
                          (= 480 (:currentScroll model))
                          (= "saved-18" (:savedSelected model))
                          (= 275 (:savedScroll model))
                          (false? (:observerStarts model)))
                     "Saved/current feed isolation or persisted analysis state changed." model))
  (support/assert! (= {:parent "saved:checkout" :events 0 :savedEvents 18} (:linked initial))
                   "Linked capture did not start empty and preserve its parent archive." initial)
  (support/assert! (and (= (mapv #(str "saved-" %) (range 1 19)) (get-in initial [:imported :ids]))
                        (= {:index 18} (get-in initial [:imported :payload]))
                        (= ["purchase" 18] (get-in initial [:imported :rawInput]))
                        (= "https://example.test/checkout" (get-in initial [:imported :pageUrl]))
                        (= {:adapter "history" :imported true} (get-in initial [:imported :provenance])))
                   "Imported saved event identity or evidence changed." initial))

(defn- assert-reload! [reload]
  (support/assert! (= {:mode "saved-session"
                        :banner "Checkout journey · Read-only archive · 18 events · captured 2026-07-12"
                        :background "Live capture continues in the background · 4 new events"
                        :returnLabel "Return to current Live feed · 4 new events"
                        :selected "purchase"
                        :observer "Disconnected"}
                       (select-keys (:restored reload) [:mode :banner :background :returnLabel :selected :observer]))
                   "Reload did not restore the selected saved feed and background status." reload)
  (support/assert! (and (str/includes? (:comparison reload) "revisions 3 and 4")
                        (str/includes? (:comparison reload) "original results unchanged")
                        (= 3 (get-in reload [:original :version])))
                   "Saved-session schema comparison mutated or lost the original revision." reload)
  (support/assert! (= {:count "18" :selected "purchase" :query "1 of 18 events"
                        :hasSavedEvent false :message "Returned to current Live feed with 4 new events."}
                       (:returned reload))
                   "Return to the current feed lost its prior state or merged archive events." reload)
  (support/assert! (= {:open true :focused true
                        :summary "https://example.test/current · 18 events · 1 sources · Not checked"
                        :blankDisabled true :namedEnabled true :persisted 18}
                       (:save reload))
                   "Focused immutable snapshot save flow changed." reload)
  (support/assert! (= {:count "0"
                        :message "Linked capture started from Checkout journey; 0 events in the new session."
                        :savedCount 18 :parent "saved:checkout" :active "active"}
                       (:linked reload))
                   "Browser linked-capture action mutated or copied the saved archive." reload))

(defn- assert-observation! [observed]
  (assert-initial! (:initial observed))
  (assert-reload! (:reload observed)))

(defn- transition [world _example _captures {:keys [text]}]
  (let [world (if (entry-steps text) (assoc world :saved-session-live-feed (observation!)) world)
        observed (:saved-session-live-feed world)]
    (support/assert! observed "Saved session Live feed browser adapter was not executed." {:step text})
    (assert-observation! observed)
    world))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world] (or (entry-steps (:text spec)) (:saved-session-live-feed world)))
           :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))
