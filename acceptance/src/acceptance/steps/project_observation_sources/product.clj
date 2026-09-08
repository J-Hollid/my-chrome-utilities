(ns acceptance.steps.project-observation-sources.product
  (:require [acceptance.steps.project-observation-sources.common :as c]))

(defn invalid [example observed]
  (c/matching (get-in observed [:settings :invalid]) (c/values example ["name" "path" "error"])))
(defn filtered [example observed]
  (c/input-row (:filter observed)
    (assoc (c/values example ["receipt_order" "selected_source"])
           :count (parse-long (c/value example "count")))))
(defn unavailable [example observed]
  (c/matching (:unavailable observed)
    (assoc (c/values example ["event" "status"])
           :value (if (= "missing" (c/value example "value")) "absent" "a scalar"))))
(defn disabled [example observed]
  (c/input-row (:edits observed) (assoc (c/values example ["first" "later"]) :action "disable")))
(defn changed-path [example observed]
  (c/input-row (:edits observed) (assoc (c/values example ["first" "name" "path"]) :action "change path")))
(defn projects [example observed]
  (when (contains? #{"project switching" "durable extension reload"} (c/value example "route"))
    (:projects observed)))
(defn empty-settings [_ observed]
  (when (and (empty? (get-in observed [:settings :empty]))
             (zero? (get-in observed [:projects :closed :sources])))
    (:settings observed)))
(defn required-field [example observed]
  (c/matching (get-in observed [:settings :invalid])
    (assoc (case (c/value example "field") "Name" {:name ""} "Path" {:path ""})
           :error (c/value example "error"))))

(def resolvers
  {1 #(c/keyboard %1 %2 false), 2 invalid, 3 filtered, 4 unavailable,
   5 #(c/evidence %1 %2 false), 6 disabled, 7 changed-path, 8 projects,
   9 c/portability, 10 c/push, 11 empty-settings, 12 c/settings, 13 required-field})
(defn observed-row [number example observed]
  (when-let [resolve (get resolvers number)] (resolve example observed)))
