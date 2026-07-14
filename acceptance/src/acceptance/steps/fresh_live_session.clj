(ns acceptance.steps.fresh-live-session
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-fresh-session.feature"])

(def entry-steps
  #{"the current Live feed is attached to target Checkout"})

(defonce ^:private observation (atom nil))

(defn- load-observation! []
  (reset! observation
          (support/load-browser-observation!
           {:adapter-env "FRESH_LIVE_SESSION_BROWSER_ADAPTER"
            :observation-key :freshLiveSession
            :runtime-error "Fresh Live session browser runtime failed."
            :missing-error "Fresh Live session browser observation is missing."})))

(defn- observation! [] (or @observation (load-observation!)))

(defn- assert-confirmation-and-cancel! [initial]
  (support/assert! (= {:events 12 :title "Checkout" :path "queue.history" :sources "Event history"}
                      (select-keys (:initial initial) [:events :title :path :sources]))
                   "The current Checkout session was not attached through the production observer." initial)
  (support/assert! (= {:query "11 of 12 events" :selected "add_to_cart" :scrollTop 120}
                      (:priorFeed initial))
                   "The pre-confirmation feed state was not established." initial)
  (support/assert! (= {:open true
                        :summary "3 unsaved events would be discarded."
                        :actions ["Save and start fresh" "Discard and start fresh" "Cancel"]}
                       (select-keys (:confirmation initial) [:open :summary :actions]))
                   "The three-unsaved-events confirmation changed." initial)
  (support/assert! (= {:id (get-in initial [:initial :id]) :events 12}
                      (get-in initial [:confirmation :unchanged]))
                   "Opening confirmation changed the current session." initial)
  (support/assert! (= (merge (:priorFeed initial) {:id (get-in initial [:initial :id]) :events 12})
                      (:cancelled initial))
                   "Cancel did not restore the same current session and feed state." initial))

(defn- assert-save-and-immediate-starts! [initial]
  (support/assert! (= {:open true
                        :heading "Save session before starting fresh"
                        :blankDisabled true
                        :eventCount 12
                        :sessionId (get-in initial [:initial :id])}
                       (:saveDialog initial))
                   "The named snapshot gate did not precede fresh-session creation." initial)
  (let [after-save (:afterSave initial)]
    (support/assert! (not= (get-in initial [:initial :id]) (:id after-save))
                     "Save and start fresh reused the prior session identity." initial)
    (support/assert! (= {:events 0
                         :snapshot {:name "Checkout before reset" :immutable true :events 12}
                         :retained {:title "Checkout" :path "queue.history" :sources "Event history" :schema true}
                         :reset {:query "0 of 0 events" :activeFilters false :inspectorHidden true :scrollTop 0}}
                        (select-keys after-save [:events :snapshot :retained :reset]))
                     "The snapshot, retained attachment, or reset feed state changed." after-save))
  (doseq [path [:zeroImmediate :allSavedImmediate]]
    (support/assert! (= {:distinct true :events 0 :confirmationOpen false :libraryUnchanged true}
                        (get initial path))
                     "An immediate fresh start changed saved sessions or reused the active identity."
                     {:path path :observed (get initial path)})))

(defn- assert-discard-boundary-and-reload! [observed]
  (let [initial (:initial observed)
        reload (:reload observed)
        before (:discardBefore initial)
        after (:discardAfter initial)]
    (support/assert! (= {:events 2 :summary "2 unsaved events would be discarded."}
                        (select-keys before [:events :summary]))
                     "The page_view/add_to_cart discard boundary was not presented." before)
    (support/assert! (and (not= (:id before) (:id after))
                          (= (:saved before) (:saved after))
                          (= {:events 0 :title "Checkout" :path "queue.history" :status "Connected"}
                             (select-keys after [:events :title :path :status])))
                     "Discard created an archive or detached the active Checkout observer." {:before before :after after})
    (support/assert! (= {:count 1 :names ["purchase"] :timeline 1}
                        (:purchase initial))
                     "The production history-push callback did not capture purchase exactly once after the new boundary."
                     (:purchase initial))
    (support/assert! (= {:id (:id after) :count "1" :names ["purchase"] :title "Checkout" :path "queue.history"}
                        (select-keys reload [:id :count :names :title :path]))
                     "Reload did not restore only the post-boundary purchase event." reload)
    (support/assert! (and (= 1 (count (:rendered reload)))
                          (str/includes? (first (:rendered reload)) "purchase")
                          (not-any? #(or (str/includes? % "page_view") (str/includes? % "add_to_cart"))
                                    (:rendered reload)))
                     "Pre-boundary queue entries reappeared in the rendered Live feed." reload)))

(defn- assert-read-only-archive! [initial]
  (support/assert! (= {:startDisabled true
                        :returnAvailable true
                        :returnLabel "Return to current Live feed"
                        :currentId (get-in initial [:discardAfter :id])
                        :unchanged true}
                       (:archive initial))
                   "The archive exposed fresh-session mutation or lost the return action." (:archive initial)))

(def immediate-start-examples
  {{:event_count "0" :save_state "nothing to save"} :zeroImmediate
   {:event_count "12" :save_state "all saved"} :allSavedImmediate})

(defn- assert-immediate-start-example! [example initial]
  (when-let [event-count (support/example-value example "event_count")]
    (let [save-state (support/require-example example "save_state")
          observation-key (get immediate-start-examples
                               {:event_count event-count :save_state save-state})]
      (support/assert! observation-key
                       "Unknown fresh-session immediate-start example."
                       {:event_count event-count :save_state save-state})
      (support/assert! (= {:distinct true :events 0 :confirmationOpen false :libraryUnchanged true}
                          (get initial observation-key))
                       "The immediate fresh-start example changed."
                       {:example example :observed (get initial observation-key)}))))

(defn- assert-observation!
  ([observed] (assert-observation! {} observed))
  ([example observed]
   (assert-confirmation-and-cancel! (:initial observed))
   (assert-save-and-immediate-starts! (:initial observed))
   (assert-discard-boundary-and-reload! observed)
   (assert-read-only-archive! (:initial observed))
   (assert-immediate-start-example! example (:initial observed))))

(defn- transition [world example _captures {:keys [text]}]
  (support/stateful-transition
   world example text entry-steps :fresh-live-session observation!
   "Fresh Live session browser adapter was not executed."
   assert-observation!))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-steps
   :fresh-live-session
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T12:57:11.949225984+02:00", :module-hash "-1575966602", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "478676903"} {:id "def/feature-files", :kind "def", :line 5, :end-line 5, :hash "2051227790"} {:id "def/entry-steps", :kind "def", :line 7, :end-line 8, :hash "-1039711001"} {:id "form/3/defonce", :kind "defonce", :line 10, :end-line 10, :hash "-1819867165"} {:id "defn-/load-observation!", :kind "defn-", :line 12, :end-line 18, :hash "2004277215"} {:id "defn-/observation!", :kind "defn-", :line 20, :end-line 20, :hash "-775394783"} {:id "defn-/assert-confirmation-and-cancel!", :kind "defn-", :line 22, :end-line 39, :hash "-371080887"} {:id "defn-/assert-save-and-immediate-starts!", :kind "defn-", :line 41, :end-line 62, :hash "-1902218024"} {:id "defn-/assert-discard-boundary-and-reload!", :kind "defn-", :line 64, :end-line 88, :hash "1507147952"} {:id "defn-/assert-read-only-archive!", :kind "defn-", :line 90, :end-line 97, :hash "90303784"} {:id "def/immediate-start-examples", :kind "def", :line 99, :end-line 101, :hash "-964723482"} {:id "defn-/assert-immediate-start-example!", :kind "defn-", :line 103, :end-line 114, :hash "-70025797"} {:id "defn-/assert-observation!", :kind "defn-", :line 116, :end-line 123, :hash "1375727255"} {:id "defn-/transition", :kind "defn-", :line 125, :end-line 129, :hash "-1532082332"} {:id "def/handlers", :kind "def", :line 131, :end-line 136, :hash "938376941"}]}
;; clj-mutate-manifest-end
