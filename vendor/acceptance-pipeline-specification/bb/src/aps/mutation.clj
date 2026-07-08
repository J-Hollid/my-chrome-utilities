(ns aps.mutation
  (:require [aps.gherkin :as gherkin]
            [aps.mutation.hash :as mutation-hash]
            [aps.mutation.metadata :as metadata]
            [aps.mutation.report :as mutation-report]
            [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.string :as str])
  (:import [java.io BufferedReader InputStreamReader OutputStreamWriter BufferedWriter]
           [java.nio.charset StandardCharsets]
           [java.lang ProcessBuilder$Redirect]
           [java.util.concurrent Executors TimeUnit Callable]))

(defn- fnv64a [& parts]
  (let [modulus (biginteger 18446744073709551616N)
        prime (biginteger 1099511628211N)]
    (reduce
     (fn [h b]
       (.mod (.multiply (.xor (biginteger h) (biginteger (bit-and b 0xff))) prime) modulus))
     (biginteger 14695981039346656037N)
     (mapcat #(concat (mutation-hash/utf8-bytes %) [0]) parts))))

(defn- parse-int [s]
  (try
    (when (seq s) (Long/parseLong s))
    (catch Exception _ nil)))

(defn- parse-float [s]
  (try
    (when (str/includes? s ".")
      (let [f (Double/parseDouble s)]
        (when (and (not (Double/isInfinite f)) (not (Double/isNaN f))) f)))
    (catch Exception _ nil)))

(declare mutate-value)

(defn- dither [path value]
  (if (empty? value)
    "x"
    (let [chars (vec value)
          index (int (mod (fnv64a path value) (count chars)))
          ch (chars index)
          replacement (cond
                        (<= (int \a) (int ch) (int \z)) (char (+ (int \A) (- (int ch) (int \a))))
                        (<= (int \A) (int ch) (int \Z)) (char (+ (int \a) (- (int ch) (int \A))))
                        :else \x)]
      (apply str (assoc chars index replacement)))))

(defn mutate-value [path value]
  (let [trimmed (str/trim value)
        lower (str/lower-case trimmed)
        seed (fnv64a path value)]
    (cond
      (str/includes? trimmed ",")
      (let [parts (mapv str/trim (str/split trimmed #","))
            index (int (mod seed (count parts)))]
        (str/join ", " (assoc parts index (mutate-value (str path "[]") (parts index)))))

      (= lower "true") "false"
      (= lower "false") "true"
      (#{"null" "nil" "none"} lower) "value"

      (some? (parse-int trimmed))
      (let [i (parse-int trimmed)
            delta (if (zero? (mod seed 2))
                    (- (inc (mod seed 9)))
                    (inc (mod seed 9)))]
        (str (+ i delta)))

      (some? (parse-float trimmed))
      (let [f (parse-float trimmed)
            delta (double (/ (+ (mod seed 900) 100) 100))
            delta (if (zero? (mod seed 2)) (- delta) delta)
            result (+ f delta)]
        (str result))

      :else (dither path value))))

(defn discover [feature]
  (vec
   (map-indexed
    (fn [i mutation] (assoc mutation :ID (str "m" (inc i))))
    (for [[scenario-index scenario] (map-indexed vector (:scenarios feature))
          [example-index example] (map-indexed vector (:examples scenario))
          key (sort (keys example))
          :let [original (get example key)
                path (format "$.scenarios[%d].examples[%d].%s" scenario-index example-index (name key))
                mutated (mutate-value path original)]
          :when (not= mutated original)]
      (array-map :Path path
                 :Description (format "%s: %s -> %s" path original mutated)
                 :Original original
                 :Mutated mutated
                 :scenario scenario-index
                 :example example-index
                 :key key)))))

(defn apply-mutation [feature mutation]
  (assoc-in feature [:scenarios (:scenario mutation) :examples (:example mutation) (:key mutation)]
            (:Mutated mutation)))

(defn- mutation-view [mutation]
  (array-map :ID (:ID mutation)
             :Path (:Path mutation)
             :Description (:Description mutation)
             :Original (:Original mutation)
             :Mutated (:Mutated mutation)))

(defn make-result [mutation runner-result]
  (let [status (case (:outcome runner-result)
                 "test_failure" "killed"
                 "test_success" "survived"
                 "infrastructure_error" "error"
                 "error")]
    (array-map :Mutation (mutation-view mutation)
               :Status status
               :Output (or (:output runner-result) "")
               :Error (or (:error runner-result) "")
               :Duration (long (or (:duration runner-result) 0)))))

(defn- write-feature-json! [path feature]
  (gherkin/write-json! path feature))

(defn- process-builder [command]
  (doto (ProcessBuilder. ^java.util.List command)
    (.redirectError ProcessBuilder$Redirect/INHERIT)))

(defn- start-worker [command]
  (let [process (.start (process-builder command))]
    {:process process
     :lock (Object.)
     :reader (BufferedReader. (InputStreamReader. (.getInputStream process) StandardCharsets/UTF_8))
     :writer (BufferedWriter. (OutputStreamWriter. (.getOutputStream process) StandardCharsets/UTF_8))}))

(defn- close-worker! [{:keys [process writer]}]
  (try (.close writer) (catch Exception _))
  (try (.waitFor process 100 TimeUnit/MILLISECONDS) (catch Exception _))
  (when (.isAlive process)
    (.destroy process)))

(defn- run-worker-job [worker job]
  (locking (:lock worker)
    (let [started (System/nanoTime)
          request (array-map :id (get-in job [:mutation :ID])
                             :feature_json (:feature-json job)
                             :generated_dir (:generated-dir job)
                             :work_dir (:work-dir job))]
      (try
        (.write (:writer worker) (json/generate-string request))
        (.newLine (:writer worker))
        (.flush (:writer worker))
        (if-let [line (.readLine (:reader worker))]
          (let [response (json/parse-string line true)
                duration (long (or (:duration response)
                                   (- (System/nanoTime) started)))]
            (if (= (:id response) (:id request))
              {:outcome (:outcome response)
               :output (or (:output response) "")
               :error (or (:error response) "")
               :duration duration}
              {:outcome "infrastructure_error"
               :error (format "worker response id %s does not match request id %s" (pr-str (:id response)) (pr-str (:id request)))
               :duration duration}))
          {:outcome "infrastructure_error"
           :error "worker exited without response"
           :duration (- (System/nanoTime) started)})
        (catch Exception e
          {:outcome "infrastructure_error"
           :error (.getMessage e)
           :duration (- (System/nanoTime) started)})))))

(defn write-mutation-metadata! [feature-path feature report implementation-hash level write-stamp?]
  (metadata/write-mutation-metadata! feature-path
                                     feature
                                     report
                                     implementation-hash
                                     level
                                     write-stamp?
                                     (discover feature)))

(defn write-text-report! [report]
  (mutation-report/write-text-report! report))

(defn write-json-report! [report]
  (mutation-report/write-json-report! report))

(defn resolve-implementation-hash [generated-dir feature-path override]
  (metadata/resolve-implementation-hash generated-dir feature-path override))

(defn- start-status-reporter
  [interval-ms started summary running done? skipped-scenarios skipped-mutations]
  (when (pos? interval-ms)
    (let [thread (Thread.
                  (fn []
                    (loop []
                      (Thread/sleep interval-ms)
                      (when-not @done?
                        (binding [*out* *err*]
                          (println (mutation-report/status-line started @summary @running skipped-scenarios skipped-mutations)))
                        (recur)))))]
      (.setDaemon thread true)
      (.start thread)
      thread)))

(defn run [cfg]
  (let [cfg (merge {:workers 1
                    :work-dir "build/acceptance-mutation"
                    :level "hard"
                    :generated-dir nil
                    :status-interval-ms 30000}
                   cfg)
        generated-dir (or (:generated-dir cfg) (str (io/file (:work-dir cfg) "generated")))
        mutations (discover (:feature cfg))
        skip (metadata/accepted-skips cfg mutations)
        executable-indexes (vec (keep-indexed (fn [i mutation] (when-not (skip (:scenario mutation)) i)) mutations))
        skipped-scenarios (count skip)
        skipped-mutations (- (count mutations) (count executable-indexes))
        summary0 (assoc (metadata/empty-summary) :Total (count executable-indexes))
        results (atom (vec (repeat (count executable-indexes) nil)))
        summary (atom summary0)
        running (atom 0)
        started (System/nanoTime)
        status-done? (atom false)
        workers (mapv start-worker (repeat (max 1 (:workers cfg)) (:runner-command cfg)))
        executor (Executors/newFixedThreadPool (max 1 (:workers cfg)))]
    (try
      (write-feature-json! (str (io/file (:work-dir cfg) "base" "feature.json")) (:feature cfg))
      (when (pos? (:status-interval-ms cfg))
        (binding [*out* *err*]
          (println (mutation-report/status-line started @summary @running skipped-scenarios skipped-mutations))))
      (start-status-reporter (:status-interval-ms cfg) started summary running status-done?
                             skipped-scenarios skipped-mutations)
      (let [futures
            (doall
             (map-indexed
              (fn [result-index mutation-index]
                (.submit executor
                         (reify Callable
                           (call [_]
                             (let [mutation (mutations mutation-index)
                                   mutation-work-dir (str (io/file (:work-dir cfg) "mutations" (:ID mutation)))
                                   feature-json (str (io/file mutation-work-dir "feature.json"))
                                   worker (workers (mod result-index (count workers)))]
                               (swap! running inc)
                               (try
                                 (write-feature-json! feature-json (apply-mutation (:feature cfg) mutation))
                                 (let [runner-result (run-worker-job worker {:mutation mutation
                                                                             :feature-json feature-json
                                                                             :generated-dir generated-dir
                                                                             :work-dir mutation-work-dir})
                                       result (make-result mutation runner-result)]
                                   (swap! results assoc result-index result)
                                   (swap! summary metadata/increment-summary (:Status result)))
                                 (catch Exception e
                                   (let [result (make-result mutation {:outcome "infrastructure_error"
                                                                       :error (.getMessage e)})]
                                     (swap! results assoc result-index result)
                                     (swap! summary metadata/increment-summary "error")))
                                 (finally
                                   (swap! running dec))))))))
              executable-indexes))]
        (doseq [f futures] (.get f)))
      (let [final-summary (cond-> @summary
                            (pos? skipped-scenarios) (assoc :SkippedScenarios skipped-scenarios)
                            (pos? skipped-mutations) (assoc :SkippedMutations skipped-mutations))
            report (array-map :summary final-summary :results (vec (remove nil? @results)))]
        (reset! status-done? true)
        (binding [*out* *err*]
          (when (pos? (:status-interval-ms cfg))
            (println (mutation-report/status-line started final-summary @running skipped-scenarios skipped-mutations))))
        report)
      (finally
        (reset! status-done? true)
        (.shutdown executor)
        (doseq [worker workers] (close-worker! worker))))))
