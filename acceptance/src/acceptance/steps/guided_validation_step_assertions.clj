(ns acceptance.steps.guided-validation-step-assertions)

(defn step-assertions [& groups]
  (apply merge
         (map (fn [[step-texts assertion]]
                (zipmap step-texts (repeat assertion)))
              (partition 2 groups))))
