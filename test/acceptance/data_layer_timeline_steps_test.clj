(ns acceptance.data-layer-timeline-steps-test
  (:require [acceptance.steps.data-layer-timeline :as timeline]
            [clojure.test :refer [deftest is]]))

(deftest orders-observed-events-for-timeline
  (let [state (-> {}
                  (timeline/record-observed-entry
                   {:event-name "signup"
                    :page-url "https://example.test/signup"
                    :history-path "queue.history"
                    :payload-label "signup-values"
                    :raw-label "signup-raw"})
                  (timeline/record-observed-entry
                   {:event-name "checkout"
                    :page-url "https://example.test/checkout"
                    :history-path "queue.history"
                    :payload-label "checkout-values"
                    :raw-label "checkout-raw"}))]
    (is (= ["signup" "checkout"]
           (map :name (timeline/visible-timeline-entries state))))))

(deftest summarizes-visible-timeline-entry
  (let [state (timeline/record-observed-entry
               {}
               {:event-name "signup"
                :page-url "https://example.test/p/"
                :history-path "queue.history"
                :payload-label "signup-values"
                :raw-label "signup-raw"})
        summary (timeline/timeline-summary (first (timeline/visible-timeline-entries state)))]
    (is (= "signup" (:name summary)))
    (is (= "https://example.test/p/" (:url summary)))
    (is (string? (:timestamp summary)))
    (is (= "queue.history" (:observer-path summary)))))

(deftest expands-visible-timeline-entry
  (let [state (timeline/record-observed-entry
               {}
               {:event-name "signup"
                :page-url "https://example.test/p/"
                :history-path "queue.history"
                :payload-label "signup-values"
                :raw-label "signup-raw"})
        expanded (timeline/expanded-entry (first (timeline/visible-timeline-entries state)))]
    (is (= "signup" (:name expanded)))
    (is (= "https://example.test/p/" (:url expanded)))
    (is (= "queue.history" (:observer-path expanded)))
    (is (= "signup-values" (:payload expanded)))
    (is (= "signup-raw" (:raw-value expanded)))))

(deftest reports-disallowed-timeline-capabilities
  (is (empty?
       (timeline/forbidden-timeline-capability-findings
        {"src/side-panel.ts" "renderTimelineEntry();"})))
  (is (= [{:kind :timeline-filtering :path "src/timeline-filter.ts"}
          {:kind :timeline-search :path "src/timeline-search.ts"}
          {:kind :validation-results :path "src/validation-results.ts"}]
         (timeline/forbidden-timeline-capability-findings
          {"src/timeline-filter.ts" "timelineFilter.apply();"
           "src/timeline-search.ts" "timelineSearch('signup');"
           "src/validation-results.ts" "validationResults.render();"}))))
