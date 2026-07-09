(ns acceptance.data-layer-timeline-steps-test
  (:require [acceptance.steps.data-layer-session :as session]
            [acceptance.steps.data-layer-timeline :as timeline]
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

(deftest captures-timeline-entry-in-active-session
  (let [session-state (session/run-start-command {}
                                                 {:tab-id 1
                                                  :url "https://example.test/"
                                                  :history-path "queue.history"})
        state (timeline/record-observed-entry
               {:session-state session-state}
               {:event-name "signup"
                :page-url "https://example.test/p/"
                :history-path "queue.history"
                :payload-label "signup-values"
                :raw-label "signup-raw"})
        entry (first (timeline/visible-timeline-entries state))]
    (is (= entry
           (last (get-in state [:session-state :session :timeline]))))))

(deftest nests-observed-events-under-page-loads
  (let [state (timeline/record-pageloads-with-events
               {}
               {:first-page-url "https://www.example.com/"
                :second-page-url "https://www.example.com/prodpage"
                :first-page-events "pageview, scroll"
                :second-page-events "pageview, add to cart"
                :history-path "event.history"})
        nested (timeline/nested-timeline state)]
    (is (= ["https://www.example.com/"
            "https://www.example.com/prodpage"]
           (map :url nested)))
    (is (= ["pageview" "scroll"]
           (map :name (:events (first nested)))))
    (is (= ["pageview" "add to cart"]
           (map :name (:events (second nested)))))
    (is (every? #(= "event.history" (:observer-path %))
                (mapcat :events nested)))))

(deftest expands-observed-event-payload-properties
  (let [state (timeline/record-observed-event-with-payload
               {}
               {:event-name "pageview"
                :payload-properties
                "page_name: \"example page_name\", page_type: \"homepage\", propertyx: \"example property\""})
        nested (timeline/nested-event-details state "pageview")]
    (is (= [{:name "page_name" :value "\"example page_name\""}
            {:name "page_type" :value "\"homepage\""}
            {:name "propertyx" :value "\"example property\""}]
           (:payload-properties nested)))))

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

(deftest filters-disallowed-timeline-capabilities-by-kind
  (let [files {"src/timeline-filter.ts" "timelineFilter.apply();"
               "src/timeline-search.ts" "timelineSearch('signup');"
               "src/validation-results.ts" "validationResults.render();"}]
    (is (= [{:kind :timeline-filtering :path "src/timeline-filter.ts"}]
           (vec (timeline/forbidden-timeline-capability-findings-of-kind
                 files
                 :timeline-filtering))))
    (is (= [{:kind :timeline-search :path "src/timeline-search.ts"}]
           (vec (timeline/forbidden-timeline-capability-findings-of-kind
                 files
                 :timeline-search))))
    (is (= [{:kind :validation-results :path "src/validation-results.ts"}]
           (vec (timeline/forbidden-timeline-capability-findings-of-kind
                 files
                 :validation-results))))))
