(ns project-tools.crap-test
  (:require [clojure.test :refer [deftest is run-tests]]
            [project-tools.crap :as subject]))

(deftest reports-fresh-coverage-even-when-the-suite-fails
  (with-redefs [subject/run-coverage! (constantly 48)
                subject/coverage-available? (constantly true)
                subject/report (constantly "CRAP report")]
    (is (= {:status 48 :report "CRAP report"}
           (subject/analyze! ["layered_schema"])))))

(deftest refuses-to-report-when-coverage-was-not-generated
  (with-redefs [subject/run-coverage! (constantly 1)
                subject/coverage-available? (constantly false)
                subject/report (fn [_] (throw (ex-info "must not run" {})))]
    (is (= {:status 1 :report nil}
           (subject/analyze! [])))))

(defn -main [& _]
  (let [{:keys [fail error]} (run-tests 'project-tools.crap-test)]
    (when (pos? (+ fail error))
      (System/exit 1))))
