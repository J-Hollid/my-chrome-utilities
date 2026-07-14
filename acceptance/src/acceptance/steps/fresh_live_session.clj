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

(defn- assert-observation! [observed]
  (assert-confirmation-and-cancel! (:initial observed))
  (assert-save-and-immediate-starts! (:initial observed))
  (assert-discard-boundary-and-reload! observed)
  (assert-read-only-archive! (:initial observed)))

(defn- transition [world _example _captures {:keys [text]}]
  (let [world (if (entry-steps text) (assoc world :fresh-live-session (observation!)) world)
        observed (:fresh-live-session world)]
    (support/assert! observed "Fresh Live session browser adapter was not executed." {:step text})
    (assert-observation! observed)
    world))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world] (or (entry-steps (:text spec)) (:fresh-live-session world)))
           :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))
