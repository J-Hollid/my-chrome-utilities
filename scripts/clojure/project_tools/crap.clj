(ns project-tools.crap
  (:require [clojure.java.io :as io]
            [clojure.string :as str]
            [crap4clj.core :as core]
            [crap4clj.coverage :as coverage]
            [crap4clj.crap :as crap]))

(def source-root "acceptance/src")

(defn source-files []
  (->> (file-seq (io/file source-root))
       (filter #(and (.isFile %)
                     (re-find #"\.cljc?$" (.getName %))))
       (map #(.getPath %))
       sort))

(defn selected-sources [filters]
  (let [sources (source-files)]
    (if (seq filters)
      (filter #(some (fn [fragment] (str/includes? % fragment)) filters) sources)
      sources)))

(defn run-coverage! []
  (core/delete-coverage-dir "target/coverage")
  (let [status (core/run-coverage "clj -M:cov --lcov")]
    (when-not (zero? status)
      (binding [*out* *err*]
        (println (str "Coverage failed (exit " status ")")))
      (System/exit status))))

(defn report [filters]
  (let [lcov (coverage/load-lcov "target/coverage/lcov.info")
        entries (mapcat #(core/analyze-file % lcov)
                        (selected-sources filters))]
    (crap/format-report (crap/sort-by-crap entries))))

(defn -main [& filters]
  (if (some #{"-h" "--help"} filters)
    (println "Usage: crap4clj [acceptance-source-path-fragment ...]")
    (do
      (run-coverage!)
      (println (report filters)))))
