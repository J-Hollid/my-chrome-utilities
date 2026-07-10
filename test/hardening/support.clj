(ns hardening.support
  (:require [acceptance.runtime :as runtime]
            [aps.json :as aps-json]))

(defn dispatch
  ([handlers world text]
   (dispatch handlers world {} text))
  ([handlers world example text]
   (runtime/execute-step! world
                          example
                          {:keyword "Then" :text text}
                          handlers)))

(defn run-features [paths handlers]
  (mapv (fn [path]
          (:status
           (runtime/run-feature! (aps-json/read-json-file path) handlers)))
        paths))
