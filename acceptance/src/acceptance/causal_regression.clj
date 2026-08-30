(ns acceptance.causal-regression
  (:require [cheshire.core :as json]
            [clojure.edn :as edn]
            [clojure.java.io :as io]))

(def fixture-path
  "test/fixtures/acceptance-source-inspection-repair-protocol.edn")

(defn- normalized [value]
  (cond
    (map? value) (into (sorted-map)
                       (map (fn [[key nested]]
                              [(if (keyword? key) (name key) (str key))
                               (normalized nested)]))
                       value)
    (sequential? value) (mapv normalized value)
    :else value))

(defn digest [value]
  (let [algorithm (java.security.MessageDigest/getInstance "SHA-256")
        bytes (.digest algorithm (.getBytes (json/generate-string (normalized value)) "UTF-8"))]
    (apply str (map #(format "%02x" (bit-and % 0xff)) bytes))))

(defn- fixture-definition [fixture-key]
  (get (edn/read-string (slurp (io/file fixture-path))) fixture-key))

(defn emit! [fixture-key observed]
  (when-let [encoded-context (System/getenv "SWARMFORGE_TIMEOUT_REPAIR_REGRESSION")]
    (let [context (json/parse-string encoded-context true)
          definition (fixture-definition fixture-key)]
      (when (= (:causal-category definition) (:causalCategory context))
        (when-not (= observed (:expected-repair-result definition))
          (throw (ex-info "Causal repair observation does not match the fixture."
                          {:fixture-key fixture-key :observed observed})))
        (let [fixture {:id (:id definition)
                       :causalCategory (:causalCategory context)
                       :diagnosedBoundaryDigest (digest (:diagnosedBoundary context))
                       :input (:input definition)
                       :expectedPreRepairFailure (:expected-pre-repair-failure definition)
                       :expectedRepairResult (:expected-repair-result definition)}
              fixture-digest (digest fixture)]
          (println
           (json/generate-string
            {:swarmforgeTimeoutRepairRegression
             {:version 2
              :incidentId (:incidentId context)
              :failureDigest (:failureDigest context)
              :fixture fixture
              :preRepairResult {:status "failed"
                                :fixtureDigest fixture-digest
                                :observed (:expected-pre-repair-failure definition)}
              :repairResult {:status "passed"
                             :fixtureDigest fixture-digest
                             :observed observed}}})))))))
