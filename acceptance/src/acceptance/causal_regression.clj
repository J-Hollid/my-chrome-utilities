(ns acceptance.causal-regression
  (:require [cheshire.core :as json]
            [clojure.edn :as edn]
            [clojure.java.io :as io]))

(def fixture-path
  "test/fixtures/acceptance-source-inspection-repair-protocol.edn")

(defonce ^:private emitted-fixtures (atom #{}))

(defn- first-emission? [fixture-key]
  (let [before @emitted-fixtures]
    (cond
      (contains? before fixture-key) false
      (compare-and-set! emitted-fixtures before (conj before fixture-key)) true
      :else (recur fixture-key))))

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
        (when (first-emission? fixture-key)
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
                               :observed observed}}}))))))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-30T20:09:09.129630954+02:00", :module-hash "-1764839564", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-802128419"} {:id "def/fixture-path", :kind "def", :line 6, :end-line 7, :hash "1122851198"} {:id "form/2/defonce", :kind "defonce", :line 9, :end-line 9, :hash "-1940213870"} {:id "defn-/first-emission?", :kind "defn-", :line 11, :end-line 16, :hash "802994043"} {:id "defn-/normalized", :kind "defn-", :line 18, :end-line 26, :hash "1201323371"} {:id "defn/digest", :kind "defn", :line 28, :end-line 31, :hash "497385748"} {:id "defn-/fixture-definition", :kind "defn-", :line 33, :end-line 34, :hash "139892494"} {:id "defn/emit!", :kind "defn", :line 36, :end-line 64, :hash "1882414509"}]}
;; clj-mutate-manifest-end
