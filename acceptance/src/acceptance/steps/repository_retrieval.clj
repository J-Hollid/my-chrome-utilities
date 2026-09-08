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
          (when-let [expected (or (get input "result") (:result input))]
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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-08T16:02:54.640294159+02:00", :module-hash "-1697715168", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-441163863"} {:id "def/feature-files", :kind "def", :line 5, :end-line 5, :hash "1614615731"} {:id "form/2/defonce", :kind "defonce", :line 6, :end-line 6, :hash "1770433453"} {:id "defn-/observe!", :kind "defn-", :line 7, :end-line 17, :hash "-357905622"} {:id "defn-/transition", :kind "defn-", :line 19, :end-line 29, :hash "-1499922823"} {:id "def/handlers", :kind "def", :line 31, :end-line 34, :hash "191348079"}]}
;; clj-mutate-manifest-end
