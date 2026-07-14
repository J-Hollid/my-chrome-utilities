(ns acceptance.feature-support
  (:require [acceptance.runtime :as runtime]
            [aps.gherkin :as gherkin]
            [clojure.set :as set]
            [clojure.test :refer [is]]))

(defn step-texts [feature-file]
  (let [feature (gherkin/parse-file feature-file)]
    (map :text (concat (:background feature)
                       (mapcat :steps (:scenarios feature))))))

(defn unhandled-step-texts [feature-files handlers]
  (remove (fn [text]
            (some #(re-matches (:pattern %) text) handlers))
          (mapcat step-texts feature-files)))

(defn verify-feature-suite!
  [feature-files handlers all-handlers]
  (is (set/subset? (set handlers) (set all-handlers)))
  (doseq [feature-file feature-files]
    (is (= :passed
           (:status (runtime/run-feature! (gherkin/parse-file feature-file)
                                          handlers)))
        feature-file)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T19:47:30.123382628+02:00", :module-hash "-161699485", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-1302047083"} {:id "defn/step-texts", :kind "defn", :line 7, :end-line 10, :hash "-277524189"} {:id "defn/unhandled-step-texts", :kind "defn", :line 12, :end-line 15, :hash "505131278"} {:id "defn/verify-feature-suite!", :kind "defn", :line 17, :end-line 24, :hash "40765152"}]}
;; clj-mutate-manifest-end
