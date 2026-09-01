(ns acceptance.bootstrap-session
  (:require [acceptance.pack-runtime :as packs]
            [acceptance.verification-support.bootstrap-fast-path-handlers :as bootstrap]))

(defn -main [generated ir]
  (when-not (and generated ir)
    (throw (ex-info "Provide the generated bootstrap entry point and IR" {})))
  (load-file generated)
  (let [run! (ns-resolve 'generated.acceptance-test 'run!)]
    (when-not run!
      (throw (ex-info "Generated bootstrap entry point has no run! function" {})))
    (with-redefs [packs/handlers-for-feature (fn [_] bootstrap/handlers)]
      (run! ir)))
  (println "acceptance passed"))
