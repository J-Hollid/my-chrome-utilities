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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-08T18:15:39.595687977+02:00", :module-hash "-1291947803", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-39747477"} {:id "defn/activation", :kind "defn", :line 4, :end-line 6, :hash "1724303261"} {:id "defn/unavailable", :kind "defn", :line 7, :end-line 9, :hash "801856448"} {:id "defn/edited", :kind "defn", :line 10, :end-line 14, :hash "1521830655"} {:id "defn/transition", :kind "defn", :line 15, :end-line 16, :hash "-1536757857"} {:id "defn/aliases", :kind "defn", :line 17, :end-line 18, :hash "104105793"} {:id "defn/disposal", :kind "defn", :line 19, :end-line 21, :hash "-1379634859"} {:id "defn/empty-settings", :kind "defn", :line 22, :end-line 24, :hash "1886742148"} {:id "def/resolvers", :kind "def", :line 26, :end-line 29, :hash "-772047404"} {:id "defn/observed-row", :kind "defn", :line 30, :end-line 31, :hash "1555326614"}]}
;; clj-mutate-manifest-end
