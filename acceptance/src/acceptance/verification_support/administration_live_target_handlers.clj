(ns acceptance.verification-support.administration-live-target-handlers
  (:require [acceptance.steps.support :as support]))

(def ^:private bridge-task
  "unit:test/verification-contracts/administration-acceptance-dependencies-test.mjs")

(defonce ^:private verified? (atom false))

(defn- verify! []
  (when-not @verified?
    (let [result (support/verified-task-result
                  bridge-task
                  "node" "test/verification-contracts/administration-acceptance-dependencies-test.mjs")]
      (support/assert! (zero? (:exit result))
                       "Live-target administration dependency contract failed."
                       {:out (:out result) :err (:err result)})
      (reset! verified? true))))

(defn- administration-scenario? [world]
  (contains? (set (map #(str "Modular verification packs " %) (range 199 207)))
             (:acceptance/scenario-name world)))

(def handlers
  [{:pattern #"^.+$"
    :applies? administration-scenario?
    :handler (fn [world _example _captures] (verify!) world)}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-01T22:27:38.340544102+02:00", :module-hash "556452690", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-274371770"} {:id "def/bridge-task", :kind "def", :line 4, :end-line 5, :hash "-210398905"} {:id "form/2/defonce", :kind "defonce", :line 7, :end-line 7, :hash "415811200"} {:id "defn-/verify!", :kind "defn-", :line 9, :end-line 17, :hash "1918571117"} {:id "defn-/administration-scenario?", :kind "defn-", :line 19, :end-line 21, :hash "304590698"} {:id "def/handlers", :kind "def", :line 23, :end-line 26, :hash "1855937543"}]}
;; clj-mutate-manifest-end
