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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-17T16:55:27.14858271+02:00", :module-hash "-1882642103", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-57477308"} {:id "defn/run-entrypoint!", :kind "defn", :line 4, :end-line 9, :hash "1692666856"} {:id "defn/run-session!", :kind "defn", :line 11, :end-line 24, :hash "-1750034662"} {:id "defn-/entries", :kind "defn-", :line 26, :end-line 30, :hash "-710617747"} {:id "defn/-main", :kind "defn", :line 32, :end-line 39, :hash "-1636546623"}]}
;; clj-mutate-manifest-end
