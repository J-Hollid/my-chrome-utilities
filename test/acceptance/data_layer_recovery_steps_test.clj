(ns acceptance.data-layer-recovery-steps-test
  (:require [acceptance.steps.data-layer-recovery :as recovery]
            [acceptance.steps.data-layer-session :as session]
            [clojure.test :refer [deftest is]]))

(deftest restores-active-session-after-navigation
  (let [state (-> {}
                  (session/start-session {:tab-id 7
                                          :url "https://example.test/"
                                          :history-path "queue.history"})
                  (recovery/capture-observed-event {:event-name "signup"
                                                    :page-url "https://example.test/p/"
                                                    :history-path "queue.history"})
                  (recovery/reopen-after-navigation "https://example.test/cart/"))]
    (is (= "signup" (:name (recovery/timeline-entry state "signup"))))
    (is (= "queue.history" (recovery/restored-history-path state)))
    (is (= "https://example.test/p/"
           (:url (recovery/timeline-entry state "signup"))))))

(deftest reports-refresh-observer-status-and-restart
  (is (= "attached"
         (:observer-status (recovery/refresh-active-session {} "attached"))))
  (is (= "needs sync"
         (:observer-status (recovery/refresh-active-session {} "needs sync"))))
  (is (= "attached"
         (:observer-status
          (recovery/restart-observation
           (recovery/refresh-active-session {} "needs sync"))))))

(deftest ended-session-does-not-reattach-observer
  (let [state (-> {}
                  (session/start-session {:tab-id 7
                                          :url "https://example.test/"
                                          :history-path "queue.history"})
                  session/end-session
                  recovery/reopen-side-panel)]
    (is (= "ended" (get-in state [:session :status])))
    (is (false? (:observer-reattached? state)))))

(deftest reports-disallowed-recovery-capabilities
  (is (empty?
       (recovery/forbidden-recovery-capability-findings
        {"src/data-layer-session.ts" "restoreSession();"})))
  (is (= [{:kind :cross-device-sync :path "src/sync.ts"}
          {:kind :automatic-every-tab-monitoring :path "src/all-tabs.ts"}]
         (recovery/forbidden-recovery-capability-findings
          {"src/sync.ts" "crossDeviceSync();"
           "src/all-tabs.ts" "monitorEveryTabInBackground();"}))))
