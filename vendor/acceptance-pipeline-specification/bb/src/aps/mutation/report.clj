(ns aps.mutation.report
  (:require [aps.json :as aps-json]))

(defn completed [summary]
  (+ (:Killed summary 0) (:Survived summary 0) (:Errors summary 0)))

(defn status-line [started summary running skipped-scenarios skipped-mutations]
  (let [elapsed-ms (quot (- (System/nanoTime) started) 1000000)]
    (str "status elapsed=" elapsed-ms "ms"
         " total=" (:Total summary)
         " completed=" (completed summary)
         " running=" running
         " killed=" (:Killed summary)
         " survived=" (:Survived summary)
         " errors=" (:Errors summary)
         (when (or (pos? skipped-scenarios) (pos? skipped-mutations))
           (str " skipped_scenarios=" skipped-scenarios
                " skipped_mutations=" skipped-mutations)))))

(defn- report-text [report]
  (let [summary (:summary report)
        header (str "total=" (:Total summary)
                    " killed=" (:Killed summary)
                    " survived=" (:Survived summary)
                    " errors=" (:Errors summary)
                    (when (or (pos? (:SkippedScenarios summary 0))
                              (pos? (:SkippedMutations summary 0)))
                      (str " skipped_scenarios=" (:SkippedScenarios summary 0)
                           " skipped_mutations=" (:SkippedMutations summary 0))))]
    (str header "\n"
         (apply str
                (for [result (:results report)]
                  (str (format "%-8s %s\n" (:Status result) (get-in result [:Mutation :Description]))
                       (when (or (= "survived" (:Status result)) (= "error" (:Status result)))
                         (str (when (seq (:Error result))
                                (str "  error: " (:Error result) "\n"))
                              (when (seq (:Output result))
                                (str "  output:\n" (:Output result) "\n"))))))))))

(defn write-text-report! [report]
  (print (report-text report)))

(defn write-json-report! [report]
  (aps-json/write-pretty-out! (aps-json/strip-empty-keys #{:SkippedScenarios :SkippedMutations} report)))
