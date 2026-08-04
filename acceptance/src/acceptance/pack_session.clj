(ns acceptance.pack-session
  (:require [acceptance.pack-runtime :as packs]
            [clojure.string :as str]))

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
    (let [failures (atom [])]
    (doseq [entry entries]
      (try
        (run! entry)
        (catch Throwable error
          (swap! failures conj {:entry entry :message (ex-message error) :error error}))))
    (when (seq @failures)
      (throw (ex-info
              (str "Acceptance pack session failed in " (count @failures)
                   " feature(s): " pack-id ": "
                   (str/join "; "
                                        (map (fn [{:keys [entry message]}]
                                               (str (:generated entry) ": " message))
                                             @failures)))
              {:pack-id pack-id
               :build-artifact build-artifact
               :failures (mapv #(dissoc % :error) @failures)}
              (:error (first @failures))))))))

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
;; {:version 1, :tested-at "2026-08-04T11:33:29.365825845+02:00", :module-hash "1514196895", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-2140623998"} {:id "defn/run-entrypoint!", :kind "defn", :line 5, :end-line nil, :hash "1692666856"} {:id "defn/run-session!", :kind "defn", :line 12, :end-line nil, :hash "1444155882"} {:id "defn-/entries", :kind "defn-", :line 35, :end-line nil, :hash "-710617747"} {:id "defn/-main", :kind "defn", :line 41, :end-line nil, :hash "-1636546623"}]}
;; clj-mutate-manifest-end
