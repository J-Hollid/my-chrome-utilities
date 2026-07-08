(ns acceptance.data-layer-observer-steps-test
  (:require [acceptance.steps.data-layer-observer :as observer]
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
  (is (nil? (:page-error (observer/attach-observer {} {:history-path "queue.value"
                                                       :page-url "https://example.test/"})))))

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
