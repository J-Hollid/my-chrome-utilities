(ns acceptance.lossless-observation-activation-steps-test
  (:require [acceptance.steps.lossless-observation-activation :as lossless]
            [acceptance.runtime :as runtime]
            [aps.gherkin :as gherkin]
            [clojure.test :refer [deftest is]]))

(deftest covers-every-lossless-observation-step-with-regex-handlers
  (let [feature (gherkin/parse-file lossless/feature-file)
        texts (map :text (concat (:background feature)
                                 (mapcat :steps (:scenarios feature))))]
    (doseq [text texts
            :when (not (lossless/excluded-steps text))]
      (is (some #(re-matches (:pattern %) text) lossless/handlers) text))))

(deftest binds-every-scenario-example-to-browser-observations
  (let [feature (gherkin/parse-file lossless/feature-file)
        observation (lossless/browser-observation!)]
    (doseq [{:keys [example]} (runtime/expand-executions feature)]
      (is (= observation (lossless/validate-example! example observation))))))

(deftest validates-production-browser-boundary-observation
  (is (map? (lossless/validate-browser-observation!
             {:first {:feed ["event-1" "event-2" "event-3" "event-4" "event-5" "event-6"]
                      :array ["event-1" "event-2" "event-3" "event-4" "event-5" "event-6"]
                      :registryArray ["event-1" "event-2" "event-3" "event-4" "event-5" "event-6"]
                      :pushReturns [101 102 103 104 105 106] :originalReceivers true :originalCallCount 6 :activeChannels 1}
              :second {:feed ["event-1" "event-2" "event-3" "event-4" "event-5"]}
              :delayed {:feed ["event-1" "event-2" "event-3" "event-4" "event-5" "event-6"]}
              :navigation [{:name "home-view" :pageLoadId "load-4" :pageUrl "https://example.test/home"}
                           {:name "event-1" :pageLoadId "load-5" :pageUrl "https://example.test/checkout"}
                           {:name "event-2" :pageLoadId "load-5" :pageUrl "https://example.test/checkout"}
                           {:name "event-3" :pageLoadId "load-5" :pageUrl "https://example.test/checkout"}
                           {:name "event-4" :pageLoadId "load-5" :pageUrl "https://example.test/checkout"}
                           {:name "event-5" :pageLoadId "load-5" :pageUrl "https://example.test/checkout"}
                           {:name "event-6" :pageLoadId "load-5" :pageUrl "https://example.test/checkout"}]
              :reload {:feed ["pageview" "purchase" "pageview" "purchase"]
                       :pageLoadIds ["load-6" "load-6" "load-7" "load-7"]
                       :identities ["1" "2" "3" "4"]}
              :repeat {:feed ["event-1" "event-2" "event-3"] :channels 1 :originalCalls 1 :pushReturn 3}
              :stale {:feed ["current-view" "purchase"] :pageLoadIds ["generation-2" "generation-2"]
                      :channels 1 :currentGeneration true :staleGeneration false}}))))
