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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-08T18:11:16.494955439+02:00", :module-hash "-1794530497", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1290917024"} {:id "defn/value", :kind "defn", :line 5, :end-line 5, :hash "1659070196"} {:id "defn/values", :kind "defn", :line 6, :end-line 7, :hash "967502675"} {:id "defn/matching", :kind "defn", :line 8, :end-line 9, :hash "-1927882742"} {:id "defn/input-row", :kind "defn", :line 10, :end-line 11, :hash "1367902814"} {:id "defn/keyboard", :kind "defn", :line 12, :end-line 15, :hash "2135965421"} {:id "defn/evidence", :kind "defn", :line 16, :end-line 20, :hash "1541267275"} {:id "defn/portability", :kind "defn", :line 21, :end-line 23, :hash "-1458943115"} {:id "defn/push", :kind "defn", :line 24, :end-line 25, :hash "553202919"} {:id "defn/settings", :kind "defn", :line 26, :end-line 26, :hash "-269006604"}]}
;; clj-mutate-manifest-end
