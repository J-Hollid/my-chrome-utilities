(ns acceptance.fresh-live-session-steps-test
  (:require [acceptance.steps.fresh-live-session :as fresh-live-session]
            [clojure.test :refer [deftest is]]))

(def valid-observation
  {:initial
   {:initial {:id "session:before" :events 12 :title "Checkout" :path "queue.history" :sources "Event history"}
    :priorFeed {:query "11 of 12 events" :selected "add_to_cart" :scrollTop 120}
    :confirmation {:open true
                   :summary "3 unsaved events would be discarded."
                   :actions ["Save and start fresh" "Discard and start fresh" "Cancel"]
                   :unchanged {:id "session:before" :events 12}}
    :cancelled {:id "session:before" :events 12 :query "11 of 12 events" :selected "add_to_cart" :scrollTop 120}
    :saveDialog {:open true
                 :heading "Save session before starting fresh"
                 :blankDisabled true
                 :eventCount 12
                 :sessionId "session:before"}
    :afterSave {:id "session:after-save"
                :events 0
                :snapshot {:name "Checkout before reset" :immutable true :events 12}
                :retained {:title "Checkout" :path "queue.history" :sources "Event history" :schema true}
                :reset {:query "0 of 0 events" :activeFilters false :inspectorHidden true :scrollTop 0}}
    :zeroImmediate {:distinct true :events 0 :confirmationOpen false :libraryUnchanged true}
    :allSavedImmediate {:distinct true :events 0 :confirmationOpen false :libraryUnchanged true}
    :discardBefore {:id "session:discard-before" :events 2 :saved 3 :summary "2 unsaved events would be discarded."}
    :discardAfter {:id "session:discard-after" :events 0 :saved 3 :title "Checkout" :path "queue.history" :status "Connected"}
    :purchase {:count 1 :names ["purchase"] :timeline 1}
    :archive {:startDisabled true
              :returnAvailable true
              :returnLabel "Return to current Live feed"
              :currentId "session:discard-after"
              :unchanged true}}
   :reload {:id "session:discard-after"
            :count "1"
            :names ["purchase"]
            :title "Checkout"
            :path "queue.history"
            :rendered ["purchase"]}})

(deftest accepts-a-complete-fresh-session-browser-observation
  (is (nil? (#'fresh-live-session/assert-observation! valid-observation)))
  (is (nil? (#'fresh-live-session/assert-observation!
             {:event_count "0" :save_state "nothing to save"}
             valid-observation)))
  (is (nil? (#'fresh-live-session/assert-observation!
             {:event_count "12" :save_state "all saved"}
             valid-observation))))
