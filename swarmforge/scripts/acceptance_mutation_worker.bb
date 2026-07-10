#!/usr/bin/env bb

(ns acceptance-mutation-worker
  (:require [babashka.fs :as fs]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(defn- now-ns []
  (System/nanoTime))

(defn- command-from-generated-dir [generated-dir feature-json]
  (let [shell-runner (fs/path generated-dir "run-acceptance.sh")
        bb-runner (fs/path generated-dir "run_acceptance.bb")]
    (cond
      (fs/executable? shell-runner) [(str shell-runner) feature-json]
      (fs/regular-file? bb-runner) ["bb" (str bb-runner) feature-json])))

(defn- command-tokens [command]
  (str/split (str/trim command) #"\s+"))

(defn- runner-command [job]
  (if-let [command (not-empty (System/getenv "SWARMFORGE_ACCEPTANCE_MUTATION_COMMAND"))]
    (conj (vec (command-tokens command)) (:feature_json job))
    (command-from-generated-dir (:generated_dir job) (:feature_json job))))

(defn- runner-env [job]
  {"ACCEPTANCE_MUTATION_ID" (:id job)
   "ACCEPTANCE_FEATURE_JSON" (:feature_json job)
   "ACCEPTANCE_GENERATED_DIR" (:generated_dir job)
   "ACCEPTANCE_WORK_DIR" (:work_dir job)})

(defn- infrastructure-error [job started message]
  {:id (:id job)
   :outcome "infrastructure_error"
   :output ""
   :error message
   :duration (- (now-ns) started)})

(defn- run-job [job]
  (let [started (now-ns)]
    (if-let [command (runner-command job)]
      (let [result @(apply process/shell
                           {:continue true
                            :out :string
                            :err :string
                            :extra-env (runner-env job)}
                           command)
            exit (:exit result)
            outcome (case exit
                      0 "test_success"
                      1 "test_failure"
                      "infrastructure_error")]
        {:id (:id job)
         :outcome outcome
         :output (or (:out result) "")
         :error (or (:err result) "")
         :duration (- (now-ns) started)})
      (infrastructure-error
       job
       started
       (str "No acceptance mutation runner found. Set "
            "SWARMFORGE_ACCEPTANCE_MUTATION_COMMAND or generate "
            "run-acceptance.sh/run_acceptance.bb under generated_dir.")))))

(defn- write-response! [response]
  (println (json/generate-string response))
  (flush))

(defn- process-line [line]
  (let [job (json/parse-string line true)
        started (now-ns)]
    (try
      (write-response! (run-job job))
      (catch Exception e
        (write-response! (infrastructure-error job started (.getMessage e)))))))

(defn -main []
  (doseq [line (line-seq (java.io.BufferedReader. *in*))]
    (when-not (str/blank? line)
      (process-line line))))

(-main)
