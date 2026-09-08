(ns acceptance.steps.repository-retrieval
  (:require [cheshire.core :as json]
            [acceptance.steps.support :as support]))

(def feature-files ["features/repository-retrieval-defaults.feature"])
(defonce observations (atom {}))
(defn- observe! [input]
  (let [key (json/generate-string input)]
    (or (get @observations key)
        (let [result (support/verified-command-result "node" "test/repository-retrieval/contract-probe.mjs" key)
              value (support/json-observation (:out result) :retrievalContract)]
          (support/assert! (and (zero? (:exit result)) (seq value))
                           "Repository retrieval contract failed." {:input input :result result})
          (when-let [expected (get input "result")]
            (support/assert! (= expected (:result value)) "Input result differs from the contract." value))
          (swap! observations assoc key value)
          value))))

(defn- transition [world example captures spec]
  (doseq [key (support/capture-placeholder-keys captures)] (support/require-example example key))
  (if (= (:text spec) "an isolated repository fixture uses the production retrieval helper and instruction adapter")
    (assoc world :repository-retrieval/active true)
    (let [input (or (:repository-retrieval/example world)
                    (when (seq example) example)
                    {"case" (if (re-find #"required instruction" (:text spec)) "full" "pending")})
          observation (observe! input)]
      (assoc world :repository-retrieval/active true
             :repository-retrieval/example input
             :repository-retrieval/observation observation))))

(def handlers
  (support/feature-scoped-stateful-handlers feature-files
    #{"an isolated repository fixture uses the production retrieval helper and instruction adapter"}
    :repository-retrieval/active transition))
