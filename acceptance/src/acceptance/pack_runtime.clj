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

(defn handlers-for-feature [feature-path]
  (let [registered (seq (registered-handler-namespaces feature-path))
        namespaces (when registered
                     (distinct (concat ['acceptance.steps.project-skeleton
                                        'acceptance.steps.side-panel]
                                       registered)))]
    (when-not namespaces
      (throw (ex-info "Feature is not assigned to a verification pack" {:feature feature-path})))
    (let [handlers (vec
                    (mapcat (fn [namespace]
                              (require namespace)
                              (concat (or (some-> (ns-resolve namespace 'priority-handlers) deref) [])
                                      (or (some-> (ns-resolve namespace 'handlers) deref) [])))
                            namespaces))]
      (when (empty? handlers)
        (throw (ex-info "Verification pack has no acceptance handlers" {:feature feature-path})))
      handlers)))
