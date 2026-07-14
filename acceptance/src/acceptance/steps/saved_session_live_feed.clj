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

(defn- assert-initial-actions! [initial]
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
                   "Opening the archive did not create a read-only Live feed." initial))

(defn- assert-initial-banner! [initial]
  (let [banner (get-in initial [:open :banner])]
    (support/assert! (= [true true true true]
                        [(str/includes? banner "Checkout journey")
                         (str/includes? banner "Read-only archive")
                         (str/includes? banner "18 events")
                         (str/includes? banner "No observer was started")])
                     "Saved-session banner content changed." initial)))

(defn- assert-initial-analysis! [initial]
  (support/assert! (every? (set (:analysisActions initial))
                           ["Copy payload" "Save to Library" "Create schema"
                            "Add validation" "Create defect report" "Revalidate"])
                   "Saved events lost current-feed analysis actions." initial))

(defn- assert-initial-model! [initial]
  (let [model (:model initial)]
    (support/assert! (= {:background 4 :currentCount 18 :savedCount 18
                         :returnLabel "Return to current Live feed · 4 new events"}
                        (:productionBackground initial))
                     "Production live-history callback did not remain isolated behind the archive." initial)
    (support/assert! (= {:savedOrder (mapv #(str "saved-" %) (range 1 19))
                         :currentCount 18
                         :savedCount 18
                         :background 4
                         :currentSelected "purchase"
                         :currentFilter "purchase"
                         :currentScroll 480
                         :savedSelected "saved-18"
                         :savedScroll 275
                         :observerStarts false}
                        model)
                     "Saved/current feed isolation or persisted analysis state changed." model)))

(defn- assert-initial-linked-and-imported! [initial]
  (support/assert! (= {:parent "saved:checkout" :events 0 :savedEvents 18} (:linked initial))
                   "Linked capture did not start empty and preserve its parent archive." initial)
  (support/assert! (= {:ids (mapv #(str "saved-" %) (range 1 19))
                       :payload {:index 18}
                       :rawInput ["purchase" 18]
                       :pageUrl "https://example.test/checkout"
                       :provenance {:adapter "history" :imported true}}
                      (select-keys (:imported initial) [:ids :payload :rawInput :pageUrl :provenance]))
                   "Imported saved event identity or evidence changed." initial))

(defn- assert-initial! [initial]
  (assert-initial-actions! initial)
  (assert-initial-banner! initial)
  (assert-initial-analysis! initial)
  (assert-initial-model! initial)
  (assert-initial-linked-and-imported! initial))

(defn- assert-reload! [reload]
  (support/assert! (= {:mode "saved-session"
                        :banner "Checkout journey · Read-only archive · 18 events · captured 2026-07-12"
                        :background "Live capture continues in the background · 4 new events"
                        :returnLabel "Return to current Live feed · 4 new events"
                        :selected "purchase"
                        :scrollTop 275
                        :observer "Disconnected"}
                       (select-keys (:restored reload) [:mode :banner :background :returnLabel :selected :scrollTop :observer]))
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
  (let [[world observed]
        (support/stateful-observation
         world text entry-steps :saved-session-live-feed observation!
         "Saved session Live feed browser adapter was not executed.")]
    (assert-observation! observed)
    world))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-steps
   :saved-session-live-feed
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T12:56:41.39191335+02:00", :module-hash "1587225832", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1178839830"} {:id "def/feature-files", :kind "def", :line 5, :end-line 8, :hash "705456916"} {:id "def/entry-steps", :kind "def", :line 10, :end-line 18, :hash "-2107388724"} {:id "form/3/defonce", :kind "defonce", :line 20, :end-line 20, :hash "-1819867165"} {:id "defn-/load-observation!", :kind "defn-", :line 22, :end-line 28, :hash "-547569961"} {:id "defn-/observation!", :kind "defn-", :line 30, :end-line 30, :hash "-775394783"} {:id "defn-/assert-initial-actions!", :kind "defn-", :line 32, :end-line 43, :hash "-2076566139"} {:id "defn-/assert-initial-banner!", :kind "defn-", :line 45, :end-line 52, :hash "-1985464640"} {:id "defn-/assert-initial-analysis!", :kind "defn-", :line 54, :end-line 58, :hash "1517765428"} {:id "defn-/assert-initial-model!", :kind "defn-", :line 60, :end-line 77, :hash "303666394"} {:id "defn-/assert-initial-linked-and-imported!", :kind "defn-", :line 79, :end-line 88, :hash "-1154742300"} {:id "defn-/assert-initial!", :kind "defn-", :line 90, :end-line 95, :hash "2026495002"} {:id "defn-/assert-reload!", :kind "defn-", :line 97, :end-line 124, :hash "2145638317"} {:id "defn-/assert-observation!", :kind "defn-", :line 126, :end-line 128, :hash "406949664"} {:id "defn-/transition", :kind "defn-", :line 130, :end-line 136, :hash "-925368461"} {:id "def/handlers", :kind "def", :line 138, :end-line 143, :hash "1266819586"}]}
;; clj-mutate-manifest-end
