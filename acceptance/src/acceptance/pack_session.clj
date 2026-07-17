(ns acceptance.pack-session
  (:require [acceptance.pack-runtime :as packs]))

(defn run-entrypoint! [{:keys [generated ir]}]
  (load-file generated)
  (if-let [run! (ns-resolve 'generated.acceptance-test 'run!)]
    (run! ir)
    (throw (ex-info "Generated acceptance entry point has no run! function"
                    {:generated generated :ir ir}))))

(defn run-session! [pack-id build-artifact entries run!]
  (binding [packs/*runtime-cache* (atom {:scope {:pack-id pack-id
                                                 :build-artifact build-artifact}
                                         :values {}})]
    (doseq [entry entries]
      (try
        (run! entry)
        (catch Throwable error
          (throw (ex-info (str "Acceptance pack session failed: " pack-id
                               ": " (:generated entry) ": " (ex-message error))
                          {:pack-id pack-id
                           :build-artifact build-artifact
                           :entry entry}
                          error)))))))

(defn- entries [paths]
  (when (or (empty? paths) (odd? (count paths)))
    (throw (ex-info "Provide generated-entrypoint/IR pairs" {:paths paths})))
  (mapv (fn [[generated ir]] {:generated generated :ir ir})
        (partition 2 paths)))

(defn -main [pack-id & paths]
  (when-not pack-id
    (throw (ex-info "Provide a verification pack id" {})))
  (run-session! pack-id
                (or (System/getenv "ACCEPTANCE_BUILD_ARTIFACT") "current-build")
                (entries paths)
                run-entrypoint!)
  (println "acceptance passed"))
