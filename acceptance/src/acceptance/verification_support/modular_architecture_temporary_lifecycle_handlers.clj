(ns acceptance.verification-support.modular-architecture-temporary-lifecycle-handlers
  (:require [acceptance.causal-regression :as causal-regression]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defonce ^:private verified-targets (atom #{}))

(def ^:private feature-files
  ["features/verification-temporary-storage-lifecycle.feature"
   "features/verification-receipt-retention-lifecycle.feature"])

(def ^:private authoritative-examples
  (support/authoritative-feature-examples feature-files))

(defn- lifecycle-scenario? [world]
  (let [scenario (:acceptance/scenario-name world "")]
    (or (str/starts-with? scenario "Verification temporary storage lifecycle ")
        (str/starts-with? scenario "Verification receipt retention lifecycle "))))

(defn- lifecycle-targets [world]
  (if (str/starts-with? (:acceptance/scenario-name world "")
                        "Verification receipt retention lifecycle ")
    ["test/verification-contracts/receipt-retention-lifecycle-test.mjs"]
    ["test/verification-contracts/temporary-storage-lifecycle-test.mjs"
     "test/swarmforge-workspace-lifecycle-test.mjs"]))

(defn- verify-lifecycle! [world]
  (let [targets (lifecycle-targets world)]
    (doseq [target (remove @verified-targets targets)]
      (let [result (support/verified-task-result (str "unit:" target) "node" target)]
        (support/assert! (zero? (:exit result))
                         "Verification lifecycle contract failed."
                         {:target target :out (:out result) :err (:err result)}))
      (swap! verified-targets conj target))
    (when (= targets ["test/verification-contracts/receipt-retention-lifecycle-test.mjs"])
      (causal-regression/emit!
       :receipt-lifecycle-task-key-binding
       {:task-key-bound true :family-scoped true}
       {:id "receipt-lifecycle-task-key-binding-v1"
        :causal-category "other:receipt lifecycle task-key binding"
        :input {:family "receipt retention" :lookup "version-2 task identity"}
        :expected-pre-repair-failure {:task-key-bound false :family-scoped false}
        :expected-repair-result {:task-key-bound true :family-scoped true}}))))

(defn handlers []
  [{:pattern #"^(.+)$"
    :applies? lifecycle-scenario?
    :handler (fn [world example _captures]
               (support/validate-authoritative-example!
                authoritative-examples example
                "Verification lifecycle example is not authoritative.")
               (verify-lifecycle! world)
            world)}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-31T15:02:31.529651771+02:00", :module-hash "-1595101027", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "434175495"} {:id "form/1/defonce", :kind "defonce", :line 5, :end-line 5, :hash "415811200"} {:id "def/feature-files", :kind "def", :line 7, :end-line 9, :hash "1804838978"} {:id "def/authoritative-examples", :kind "def", :line 11, :end-line 12, :hash "1598887325"} {:id "defn-/lifecycle-scenario?", :kind "defn-", :line 14, :end-line 17, :hash "486088880"} {:id "defn-/verify-lifecycle!", :kind "defn-", :line 19, :end-line 28, :hash "177854835"} {:id "defn/handlers", :kind "defn", :line 30, :end-line 38, :hash "-1801593060"}]}
;; clj-mutate-manifest-end
