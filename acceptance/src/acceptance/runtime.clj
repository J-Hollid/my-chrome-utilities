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
