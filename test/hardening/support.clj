(ns hardening.support
  (:require [acceptance.runtime :as runtime]))

(defn dispatch
  ([handlers world text]
   (dispatch handlers world {} text))
  ([handlers world example text]
   (runtime/execute-step! world
                          example
                          {:keyword "Then" :text text}
                          handlers)))
