(ns acceptance.pack-runtime
  (:require [aps.json :as aps-json]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(defn- repository-root [] (fs/cwd))

(def ^:dynamic *runtime-cache* nil)

(defn cached-runtime! [key create!]
  (if-not *runtime-cache*
    (create!)
    (if (contains? (:values @*runtime-cache*) key)
      (get-in @*runtime-cache* [:values key])
      (let [value (create!)]
        (swap! *runtime-cache* assoc-in [:values key] value)
        value))))

(defn- handler-namespace [path]
  (-> path
      (str/replace #"^acceptance/src/" "")
      (str/replace #"\.clj$" "")
      (str/replace "/" ".")
      (str/replace "_" "-")
      symbol))

(defn- registered-handler-namespaces [feature-path]
  (let [registry (aps-json/read-json-file
                  (str (fs/path (repository-root) "verification/packs.json")))
        initial (set (map :id (filter #(some #{feature-path} (:features %)) registry)))
        selected (loop [ids initial]
                   (let [expanded (into ids (mapcat :dependencies
                                                    (filter #(contains? ids (:id %)) registry)))]
                     (if (= ids expanded) ids (recur expanded))))]
    (->> registry
         (filter #(contains? selected (:id %)))
         (mapcat :handlers)
         (map handler-namespace)
         distinct
         vec)))

(defn- namespace-handlers [namespace]
  (require namespace)
  (concat (or (some-> (ns-resolve namespace 'priority-handlers) deref) [])
          (or (some-> (ns-resolve namespace 'handlers) deref) [])))

(defn- load-handlers [feature-path namespaces]
  (let [handlers (vec (mapcat namespace-handlers namespaces))]
    (when (empty? handlers)
      (throw (ex-info "Verification pack has no acceptance handlers" {:feature feature-path})))
    handlers))

(def shared-handler-namespaces
  ['acceptance.steps.project-skeleton
   'acceptance.steps.side-panel
   'acceptance.steps.operator-interface])

(defn handlers-for-feature [feature-path]
  (let [registered (seq (registered-handler-namespaces feature-path))]
    (when-not registered
      (throw (ex-info "Feature is not assigned to a verification pack" {:feature feature-path})))
    (load-handlers
     feature-path
     (distinct (concat shared-handler-namespaces registered)))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-17T16:54:33.889593767+02:00", :module-hash "-1807069731", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-1162041876"} {:id "defn-/repository-root", :kind "defn-", :line 6, :end-line 6, :hash "-1385156089"} {:id "def/*runtime-cache*", :kind "def", :line 8, :end-line 8, :hash "-2018825370"} {:id "defn/cached-runtime!", :kind "defn", :line 10, :end-line 17, :hash "-1624468342"} {:id "defn-/handler-namespace", :kind "defn-", :line 19, :end-line 25, :hash "2043517374"} {:id "defn-/registered-handler-namespaces", :kind "defn-", :line 27, :end-line 40, :hash "1147614593"} {:id "defn-/namespace-handlers", :kind "defn-", :line 42, :end-line 45, :hash "791621491"} {:id "defn-/load-handlers", :kind "defn-", :line 47, :end-line 51, :hash "593457772"} {:id "def/shared-handler-namespaces", :kind "def", :line 53, :end-line 56, :hash "216436219"} {:id "defn/handlers-for-feature", :kind "defn", :line 58, :end-line 64, :hash "507782334"}]}
;; clj-mutate-manifest-end
