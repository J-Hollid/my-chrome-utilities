(ns acceptance.steps.project-observation-sources.common
  (:require [acceptance.steps.support :as support]
            [cheshire.core :as json]))

(defn value [example key] (support/require-example example key))
(defn values [example keys]
  (into {} (map (fn [key] [(keyword key) (value example key)]) keys)))
(defn matching [records expected]
  (first (filter #(every? (fn [[key value]] (= value (get % key))) expected) records)))
(defn input-row [records expected]
  (first (filter #(matching [(:input %)] expected) records)))
(defn keyboard [example observed runtime?]
  (matching (:keyboard observed)
    (cond-> (values example ["name" "path"])
      runtime? (assoc :width (parse-long (value example "width"))))))
(defn evidence [example observed runtime?]
  (let [payload (json/parse-string (value example "payload") true)]
    (matching (:evidence observed)
      (if runtime? {:payload payload :source (value example "source")}
        {:payload (assoc payload :event (value example "event_name"))}))))
(defn portability [example observed]
  (matching (:portability observed)
    {:path (value example "path") :pushPath (value example "push_path")}))
(defn push [example observed]
  (matching (:push observed) {:source (value example "source")}))
(defn settings [_ observed] (:settings observed))
