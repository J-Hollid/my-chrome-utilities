(ns acceptance.verification-support.modular-architecture-process-evidence
  (:require [acceptance.steps.support :as support]
            [cheshire.core :as json]
            [clojure.string :as str]))

(defn load! [cache {:keys [command prepared-task fallback prefix key failure missing]}]
  (or @cache
      (let [result (support/verified-command-or-prepared-task-result command prepared-task fallback)
            line (first (filter #(str/starts-with? % prefix)
                                (str/split-lines (:out result))))]
        (support/assert! (zero? (:exit result)) failure
                         {:out (:out result) :err (:err result)})
        (support/assert! line missing {:out (:out result)})
        (let [parsed (json/parse-string line true)]
          (reset! cache (if key (get parsed key) parsed))))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-09T20:49:02.091767066+02:00", :module-hash "1593697358", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "755928804"} {:id "defn/load!", :kind "defn", :line 6, :end-line 14, :hash "-549822349"}]}
;; clj-mutate-manifest-end
