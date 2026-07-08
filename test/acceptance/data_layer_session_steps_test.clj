(ns acceptance.data-layer-session-steps-test
  (:require [acceptance.steps.data-layer-session :as session]
            [clojure.test :refer [deftest is]]))

(deftest starts-and-ends-active-tab-session
  (let [state (session/start-session {} {:tab-id 7
                                         :url "https://example.test/"
                                         :history-path "queue.history"})]
    (is (= "active" (get-in state [:session :status])))
    (is (= 7 (get-in state [:session :tab-id])))
    (is (= "queue.history" (get-in state [:session :history-path])))
    (is (= "active-tab journey" (session/session-scope state)))
    (is (= "ended" (get-in (session/end-session state) [:session :status])))))

(deftest preserves-session-through-navigation-and-restore
  (let [state (-> {}
                  (session/start-session {:tab-id 7
                                          :url "https://example.test/"
                                          :history-path "queue.history"})
                  (session/capture-entry {:type "page" :url "https://example.test/"})
                  (session/navigate-session "https://example.test/p/"))
        restored (session/restore-session (session/persisted-session state))]
    (is (= "active" (get-in state [:session :status])))
    (is (= "https://example.test/p/" (get-in state [:session :current-url])))
    (is (= [{:type "page" :url "https://example.test/"}]
           (get-in restored [:session :timeline])))))

(deftest duplicate-start-warns-without-changing-session
  (let [state (session/run-start-command {} {:tab-id 7
                                             :url "https://example.test/"
                                             :history-path "queue.history"})
        duplicate (session/run-start-command state {:tab-id 7
                                                    :url "https://example.test/p/"
                                                    :history-path "other.path"})]
    (is (= "active session already exists" (:warning duplicate)))
    (is (= (:session state) (:session duplicate)))))

(deftest ended-session-does-not-capture-new-page-entries
  (let [ended (-> {}
                  (session/start-session {:tab-id 7
                                          :url "https://example.test/"
                                          :history-path "queue.history"})
                  session/end-session)
        after-capture (session/capture-entry ended {:type "page" :url "https://example.test/p/"})]
    (is (= "ended" (get-in after-capture [:session :status])))
    (is (empty? (get-in after-capture [:session :timeline])))))

(deftest reports-disallowed-session-scope
  (is (empty?
       (session/forbidden-session-scope-findings
        {"src/data-layer-session.ts" "startDataLayerTestingSession();"})))
  (is (= [{:kind :multi-profile-session-manager :path "src/profiles.ts"}
          {:kind :event-replay :path "src/replay.ts"}]
         (session/forbidden-session-scope-findings
          {"src/profiles.ts" "multiProfileSessionManager();"
           "src/replay.ts" "eventReplay();"}))))
