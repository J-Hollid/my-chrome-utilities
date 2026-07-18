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

(defn- match-handler [world text handlers]
  (some (fn [{:keys [pattern applies?] :as handler}]
          (when-let [match (and (or (nil? applies?) (applies? world))
                                (re-matches pattern text))]
            [handler (vec (rest match))]))
        handlers))

(defn execute-step! [world example step handlers]
  (if-let [[{:keys [handler]} captures] (match-handler world (:text step) handlers)]
    (handler world example captures)
    (throw (ex-info (format "Unsupported acceptance step: %s %s"
                            (:keyword step)
                            (:text step))
                    {:step step}))))

(defn run-execution!
  ([execution handlers]
   (run-execution! execution handlers {}))
  ([execution handlers initial-world]
   (reduce (fn [world step]
             (execute-step! world (:example execution) step handlers))
           initial-world
           (:steps execution))))

(defn run-feature! [feature handlers]
  (let [executions (expand-executions feature)]
    (doseq [execution executions]
      (try
        (run-execution! execution handlers
                        {:acceptance/feature-name (:name feature)
                         :acceptance/scenario-name (get-in execution [:scenario :name])
                         :acceptance/scenario-index (:scenario-index execution)
                         :acceptance/scenario-steps (mapv :text (get-in execution [:scenario :steps]))})
        (catch Throwable t
          (throw (ex-info (format "Acceptance execution failed: %s: %s"
                                  (:name execution)
                                  (ex-message t))
                          {:execution (select-keys execution [:name :scenario-index :example-index])}
                          t))))))
  {:status :passed
   :executions (count (expand-executions feature))})

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T16:11:30.865332991+02:00", :module-hash "1946156868", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-1940847213"} {:id "defn-/scenario-examples", :kind "defn-", :line 4, :end-line 8, :hash "2012220682"} {:id "defn/expand-executions", :kind "defn", :line 10, :end-line 25, :hash "551090886"} {:id "defn-/match-handler", :kind "defn-", :line 27, :end-line 32, :hash "2055343244"} {:id "defn/execute-step!", :kind "defn", :line 34, :end-line 40, :hash "292110057"} {:id "defn/run-execution!", :kind "defn", :line 42, :end-line 49, :hash "281791651"} {:id "defn/run-feature!", :kind "defn", :line 51, :end-line 63, :hash "1113291075"}]}
;; clj-mutate-manifest-end
