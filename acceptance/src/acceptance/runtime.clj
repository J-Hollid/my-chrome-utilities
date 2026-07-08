(ns acceptance.runtime
  (:require [clojure.string :as str]))

(defn- scenario-examples [scenario]
  (let [examples (:examples scenario)]
    (if (seq examples)
      examples
      [{}])))

(defn expand-executions [feature]
  (let [background (vec (:background feature))]
    (->> (:scenarios feature)
         (map-indexed
          (fn [scenario-index scenario]
            (map-indexed
             (fn [example-index example]
               {:name (format "%s/example_%d" (:name scenario) (inc example-index))
                :scenario-index scenario-index
                :example-index example-index
                :scenario scenario
                :example example
                :steps (vec (concat background (:steps scenario)))})
             (scenario-examples scenario))))
         (apply concat)
         vec)))

(defn- match-handler [text handlers]
  (some (fn [{:keys [pattern] :as handler}]
          (when-let [match (re-matches pattern text)]
            [handler (vec (rest match))]))
        handlers))

(defn execute-step! [world example step handlers]
  (if-let [[{:keys [handler]} captures] (match-handler (:text step) handlers)]
    (handler world example captures)
    (throw (ex-info (format "Unsupported acceptance step: %s %s"
                            (:keyword step)
                            (:text step))
                    {:step step}))))

(defn run-execution! [execution handlers]
  (reduce (fn [world step]
            (execute-step! world (:example execution) step handlers))
          {}
          (:steps execution)))

(defn run-feature! [feature handlers]
  (let [executions (expand-executions feature)]
    (doseq [execution executions]
      (try
        (run-execution! execution handlers)
        (catch Throwable t
          (throw (ex-info (format "Acceptance execution failed: %s: %s"
                                  (:name execution)
                                  (ex-message t))
                          {:execution (select-keys execution [:name :scenario-index :example-index])}
                          t))))))
  {:status :passed
   :executions (count (expand-executions feature))})

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-08T19:05:05.660002838+02:00", :module-hash "1883225232", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1940847213"} {:id "defn-/scenario-examples", :kind "defn-", :line 4, :end-line nil, :hash "2012220682"} {:id "defn/expand-executions", :kind "defn", :line 10, :end-line nil, :hash "551090886"} {:id "defn-/match-handler", :kind "defn-", :line 27, :end-line nil, :hash "-1656441359"} {:id "defn/execute-step!", :kind "defn", :line 33, :end-line nil, :hash "-680895386"} {:id "defn/run-execution!", :kind "defn", :line 41, :end-line nil, :hash "230445371"} {:id "defn/run-feature!", :kind "defn", :line 47, :end-line nil, :hash "-189293122"}]}
;; clj-mutate-manifest-end
