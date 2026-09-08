(ns acceptance.steps.project-observation-sources.runtime
  (:require [acceptance.steps.project-observation-sources.common :as c]))

(defn activation [example observed]
  (c/input-row (:activation observed)
    (c/values example ["marketing_before" "application_before" "handoff" "live"])))
(defn unavailable [example observed]
  (c/matching (:unavailable observed)
    {:value (c/value example "unavailable") :event "A1" :status (c/value example "status")}))
(defn edited [example observed]
  (c/input-row (:edits observed)
    (if (= "change path to analyticsQueue" (c/value example "action"))
      {:action "change path" :path "analyticsQueue"}
      {:action (c/value example "action")})))
(defn transition [example observed]
  (c/matching (:transitions observed) {:transition (c/value example "transition")}))
(defn aliases [example observed]
  (c/matching (:aliases observed) {:relation (c/value example "array_relation")}))
(defn disposal [example observed]
  (if (= "switch to another project" (c/value example "action")) (:projects observed)
    (c/matching (:disposal observed) {:action (c/value example "action")})))
(defn empty-settings [_ observed]
  (when (empty? (get-in observed [:settings :empty]))
    (c/input-row (:edits observed) {:first "M1" :later "M2, M3" :action "disable"})))

(def resolvers
  {1 #(c/keyboard %1 %2 true), 2 activation, 3 unavailable, 4 #(c/evidence %1 %2 true),
   5 edited, 6 transition, 7 aliases, 8 c/push, 9 disposal, 10 c/portability,
   11 empty-settings, 12 c/settings})
(defn observed-row [number example observed]
  (when-let [resolve (get resolvers number)] (resolve example observed)))
