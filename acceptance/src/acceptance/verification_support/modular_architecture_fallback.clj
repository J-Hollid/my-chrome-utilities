(ns acceptance.verification-support.modular-architecture-fallback)

(def feature-name "Modular verification packs")

(defn handlers [inspect!]
  [{:pattern #"^.*$"
    :applies? (fn [world]
                (= feature-name (:acceptance/feature-name world)))
    :handler (fn [world _example _captures] (inspect! world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-12T08:04:48.728083473+02:00", :module-hash "-1974490399", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 1, :hash "1592806034"} {:id "def/feature-name", :kind "def", :line 3, :end-line 3, :hash "316846869"} {:id "defn/handlers", :kind "defn", :line 5, :end-line 9, :hash "-925957443"}]}
;; clj-mutate-manifest-end
