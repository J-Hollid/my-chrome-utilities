(ns acceptance.pack-runtime
  (:require [aps.json :as aps-json]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(defn- repository-root [] (fs/cwd))

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
        namespaces (if registered
                     (distinct (concat ['acceptance.steps.project-skeleton
                                        'acceptance.steps.side-panel]
                                       registered))
                     ['acceptance.steps.all])]
    (vec
     (mapcat (fn [namespace]
               (require namespace)
               (or (some-> (ns-resolve namespace 'handlers) deref)
                   (throw (ex-info "Acceptance handler namespace has no handlers"
                                   {:namespace namespace :feature feature-path}))))
             namespaces))))
