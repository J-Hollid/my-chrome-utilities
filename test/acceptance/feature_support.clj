(ns acceptance.feature-support
  (:require [aps.gherkin :as gherkin]))

(defn step-texts [feature-file]
  (let [feature (gherkin/parse-file feature-file)]
    (map :text (concat (:background feature)
                       (mapcat :steps (:scenarios feature))))))
