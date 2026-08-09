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
        (reset! cache (get (json/parse-string line true) key)))))
