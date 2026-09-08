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
           :inputValue (c/value example "value"))))
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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-08T18:20:30.659504192+02:00", :module-hash "-653400745", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-1101301382"} {:id "defn/invalid", :kind "defn", :line 4, :end-line 5, :hash "-768289108"} {:id "defn/filtered", :kind "defn", :line 6, :end-line 9, :hash "-524872799"} {:id "defn/unavailable", :kind "defn", :line 10, :end-line 13, :hash "-950265915"} {:id "defn/disabled", :kind "defn", :line 14, :end-line 15, :hash "-561377796"} {:id "defn/changed-path", :kind "defn", :line 16, :end-line 17, :hash "-1662240651"} {:id "defn/projects", :kind "defn", :line 18, :end-line 20, :hash "-1006101318"} {:id "defn/empty-settings", :kind "defn", :line 21, :end-line 24, :hash "-1291823792"} {:id "defn/required-field", :kind "defn", :line 25, :end-line 28, :hash "-1026340911"} {:id "def/resolvers", :kind "def", :line 30, :end-line 33, :hash "231614226"} {:id "defn/observed-row", :kind "defn", :line 34, :end-line 35, :hash "1555326614"}]}
;; clj-mutate-manifest-end
