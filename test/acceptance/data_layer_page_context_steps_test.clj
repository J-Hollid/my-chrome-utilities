(ns acceptance.data-layer-page-context-steps-test
  (:require [acceptance.steps.data-layer-page-context :as page-context]
            [clojure.test :refer [deftest is]]))

(def side-panel-url "chrome-extension://extension/side-panel.html")

(deftest starts-session-with-active-tab-url
  (let [state (-> {}
                  (page-context/open-side-panel side-panel-url)
                  (page-context/set-active-tab-url "https://example.test/p/")
                  (page-context/run-side-panel-command "data-layer.start-testing"))]
    (is (= "https://example.test/p/"
           (get-in state [:session-state :session :current-url])))
    (is (not (page-context/timeline-uses-url? state side-panel-url)))))

(deftest records-observed-entry-with-active-page-url
  (let [state (-> {}
                  (page-context/open-side-panel side-panel-url)
                  (page-context/set-active-tab-url "https://example.test/p/")
                  (page-context/start-active-session "queue.history")
                  (page-context/page-appends-history-entry
                   {:page-url "https://example.test/p/"
                    :event-name "signup"
                    :payload-label "signup-values"}))]
    (is (= "https://example.test/p/"
           (:url (page-context/timeline-entry state "signup"))))
    (is (not (page-context/timeline-uses-url? state side-panel-url)))))

(deftest records-entry-after-navigation-with-active-page-url
  (let [state (-> {}
                  (page-context/open-side-panel side-panel-url)
                  (page-context/start-active-session "queue.history")
                  (page-context/navigate-active-tab
                   {:start-url "https://example.test/"
                    :page-url "https://example.test/cart/"})
                  (page-context/page-appends-history-entry
                   {:page-url "https://example.test/cart/"
                    :event-name "purchase"
                    :payload-label "purchase-values"}))]
    (is (= "https://example.test/cart/"
           (:url (page-context/timeline-entry state "purchase"))))
    (is (not (page-context/timeline-uses-url? state side-panel-url)))))

(deftest side-panel-source-uses-active-tab-page-context
  (is (page-context/side-panel-uses-active-tab-page-context?
       {"src/side-panel.ts" (slurp "src/side-panel.ts")
        "src/active-page-observation.ts" (slurp "src/active-page-observation.ts")})))
