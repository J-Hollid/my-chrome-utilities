(ns acceptance.data-layer-observer-steps-test
  (:require [acceptance.steps.data-layer-observer :as observer]
            [acceptance.steps.data-layer-session :as session]
            [clojure.test :refer [deftest is]]))

(deftest records-observed-history-entry-with-metadata
  (let [state (-> {}
                  (observer/attach-observer {:history-path "queue.history"
                                             :page-url "https://example.test/p/"})
                  (observer/page-push "signup" "signup-values"))
        entry (observer/last-observed-entry state)]
    (is (= 1 (:push-return state)))
    (is (= "observed" (:type entry)))
    (is (= "https://example.test/p/" (:url entry)))
    (is (string? (:timestamp entry)))
    (is (= "queue.history" (:observer-path entry)))
    (is (= "signup" (:name entry)))
    (is (= "signup-values" (:payload entry)))
    (is (= {:event "signup" :payload {:label "signup-values"}}
           (:raw-value entry)))))

(deftest preserves-page-push-behavior
  (let [state (-> {}
                  (observer/attach-observer {:history-path "queue.history"
                                             :page-url "https://example.test/"})
                  (observer/page-push "signup" "signup-values"))]
    (is (= 1 (:push-return state)))
    (is (= [{:event "signup" :payload {:label "signup-values"}}]
           (get-in state [:page-object :queue :history])))
    (is (nil? (:page-error state)))))

(deftest reinstalls-observer-without-duplicates
  (let [state (-> {}
                  (observer/attach-observer {:history-path "queue.history"
                                             :page-url "https://example.test/"})
                  (observer/reinstall-observer {:history-path "queue.history"
                                                :page-url "https://example.test/p/"})
                  (observer/page-push "signup" "signup-values"))
        matching-entries (filter #(= "https://example.test/p/" (:url %))
                                 (:observed-entries state))]
    (is (= 1 (get-in state [:observer :active-count])))
    (is (= 1 (count matching-entries)))))

(deftest reports-unobservable-paths-without-page-error
  (is (= "path missing"
         (get-in (observer/attach-observer {} {:history-path "missing.path"
                                               :page-url "https://example.test/"})
                 [:observer :status])))
  (is (= "not an array"
         (get-in (observer/attach-observer {} {:history-path "queue.value"
                                               :page-url "https://example.test/"})
                 [:observer :status])))
  (is (= 0
         (get-in (observer/attach-observer {} {:history-path "queue.value"
                                               :page-url "https://example.test/"})
                 [:observer :active-count])))
  (is (nil? (:page-error (observer/attach-observer {} {:history-path "queue.value"
                                                       :page-url "https://example.test/"})))))

(deftest observes-active-page-window-object
  (let [page-object {:test_obj {:history []}}
        state (observer/attach-observer {} {:history-path "test_obj.history"
                                            :page-url "https://example.test/p/"
                                            :page-object page-object})]
    (is (= "ready" (get-in state [:observer :status])))
    (is (= page-object (:page-object state)))))

(deftest reports-missing-path-from-active-page-window-object
  (let [state (observer/attach-observer {} {:history-path "queue.history"
                                            :page-url "https://example.test/p/"
                                            :page-object {}})]
    (is (= "path missing" (get-in state [:observer :status])))
    (is (= 0 (get-in state [:observer :active-count])))))

(deftest preserves-page-owned-history-array-contents
  (let [state (-> {}
                  (observer/attach-observer {:history-path "test_obj.history"
                                             :page-url "https://example.test/p/"
                                             :page-object {:test_obj {:history []}}})
                  (observer/page-push "signup" "signup-values"))]
    (is (= [{:event "signup" :payload {:label "signup-values"}}]
           (get-in state [:page-object :test_obj :history])))))

(deftest side-panel-source-uses-active-page-window-observation
  (is (observer/active-page-window-observation-wired?
       {"src/side-panel.ts" (slurp "src/side-panel.ts")
        "src/active-page-observation.ts" (slurp "src/active-page-observation.ts")
        "manifest.json" (slurp "manifest.json")})))

(deftest reads-non-empty-active-page-history-result
  (let [state (-> {}
                  (assoc :history-path "test_obj.history")
                  (observer/define-active-page-window-with-entry
                   {:page-url "https://example.test/p/"
                    :history-path "test_obj.history"
                    :event-name "signup"})
                  (observer/read-active-page-history-path "test_obj.history"))]
    (is (observer/active-page-read-succeeded? state))
    (is (observer/active-page-read-result-includes-path? state "test_obj.history"))
    (is (observer/active-page-read-result-not-empty? state))
    (is (= "ready" (get-in state [:observer :status])))))

(deftest reports-active-page-access-unavailable
  (let [state (-> {}
                  (assoc :history-path "test_obj.history")
                  (observer/define-unreadable-active-page
                   {:page-url "https://example.test/p/"})
                  observer/start-active-page-observation)]
    (is (= "page access unavailable" (:page-access-status state)))
    (is (not= "path missing" (get-in state [:observer :status])))
    (is (observer/no-empty-page-object-used-as-successful-read? state))))

(deftest captures-observed-entry-in-active-session
  (let [session-state (session/run-start-command {}
                                                 {:tab-id 1
                                                  :url "https://example.test/"
                                                  :history-path "queue.history"})
        state (-> {:session-state session-state}
                  (observer/attach-observer {:history-path "queue.history"
                                             :page-url "https://example.test/p/"})
                  (observer/page-push "signup" "signup-values"))
        entry (observer/last-observed-entry state)]
    (is (= entry
           (last (get-in state [:session-state :session :timeline]))))))

(deftest starts-live-capture-for-active-page-pushes
  (let [state (-> {}
                  (assoc :history-path "dataLayerHistory")
                  (observer/define-active-page-window
                   {:page-url "https://www.example.com/"
                    :history-path "dataLayerHistory"})
                  observer/start-side-panel-live-capture
                  (observer/page-push "signup" "signup-values"))
        timeline (get-in state [:session-state :session :timeline])
        entry (observer/last-observed-entry state)]
    (is (= [{:type "page" :url "https://www.example.com/"}
            entry]
           timeline))
    (is (= "https://www.example.com/" (:url entry)))
    (is (= "dataLayerHistory" (:observer-path entry)))
    (is (= "signup-values" (:payload entry)))))

(deftest captures-queued-active-page-entry-when-live-capture-starts
  (let [state (-> {}
                  (assoc :history-path "dataLayerHistory")
                  (observer/define-active-page-window-with-entry
                   {:page-url "https://www.example.com/"
                    :history-path "dataLayerHistory"
                    :event-name "signup"
                    :payload-label "signup-payload"})
                  observer/start-side-panel-live-capture)
        timeline (get-in state [:session-state :session :timeline])
        entry (observer/last-observed-entry state)]
    (is (= [{:type "page" :url "https://www.example.com/"}
            entry]
           timeline))
    (is (= "signup" (:name entry)))
    (is (= "https://www.example.com/" (:url entry)))
    (is (= "dataLayerHistory" (:observer-path entry)))
    (is (= "signup-payload" (:payload entry)))))

(deftest side-panel-source-uses-live-history-push-capture
  (is (observer/live-history-push-capture-wired?
       {"src/side-panel.ts" (slurp "src/side-panel.ts")
        "src/data-layer-observer.ts" (slurp "src/data-layer-observer.ts")
        "src/data-layer-live-observation.ts" (slurp "src/data-layer-live-observation.ts")})))

(deftest reports-disallowed-observer-capabilities
  (is (empty?
       (observer/forbidden-observer-capability-findings
        {"src/data-layer-observer.ts" "attachHistoryArrayObserver();"})))
  (is (= [{:kind :object-push-events :path "src/object-observer.ts"}
          {:kind :analytics-beacons :path "src/beacon.ts"}
          {:kind :object-snapshots :path "src/snapshot.ts"}]
         (observer/forbidden-observer-capability-findings
          {"src/object-observer.ts" "objectPushEventsWithEventFields();"
           "src/beacon.ts" "navigator.sendBeacon('/analytics');"
           "src/snapshot.ts" "captureObjectSnapshot(window.dataLayer);"}))))

(deftest filters-disallowed-observer-capabilities-by-kind
  (let [files {"src/object-observer.ts" "objectPushEventsWithEventFields();"
               "src/beacon.ts" "navigator.sendBeacon('/analytics');"
               "src/snapshot.ts" "captureObjectSnapshot(window.dataLayer);"}]
    (is (= [{:kind :object-push-events :path "src/object-observer.ts"}]
           (vec (observer/forbidden-observer-capability-findings-of-kind
                 files
                 :object-push-events))))
    (is (= [{:kind :analytics-beacons :path "src/beacon.ts"}]
           (vec (observer/forbidden-observer-capability-findings-of-kind
                 files
                 :analytics-beacons))))
    (is (= [{:kind :object-snapshots :path "src/snapshot.ts"}]
           (vec (observer/forbidden-observer-capability-findings-of-kind
                 files
                 :object-snapshots))))))
