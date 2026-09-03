(ns acceptance.verification-support.administration-preflight-handlers
  (:require [acceptance.causal-regression :as causal-regression]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/verification-administration-preflight.feature"])

(defonce ^:private verified (atom false))
(defonce ^:private receipt-verified (atom false))

(defn- verify-contract! []
  (when-not @verified
    (let [result (support/verified-command-result
                  "node" "test/verification-contracts/administration-preflight-contract-test.mjs")]
      (support/assert! (zero? (:exit result))
                       "Verification administration preflight contracts failed."
                       {:err (:err result) :out (:out result)})
      (reset! verified true))))

(defn- transition [world _example _captures _spec]
  (verify-contract!)
  (assoc world :verification-administration-preflight/active true))

(defn- receipt-scenario? [world]
  (str/starts-with? (:acceptance/scenario-name world "")
                    "Verification receipt retention lifecycle "))

(defn- verify-receipt-lifecycle! []
  (when-not @receipt-verified
    (let [target "test/verification-contracts/receipt-retention-lifecycle-test.mjs"
          result (support/verified-task-result (str "unit:" target) "node" target)]
      (support/assert! (zero? (:exit result))
                       "Verification receipt lifecycle contract failed."
                       {:target target :out (:out result) :err (:err result)}))
    (reset! receipt-verified true))
  (causal-regression/emit!
   :receipt-lifecycle-task-key-binding
   {:task-key-bound true :family-scoped true}
   {:id "receipt-lifecycle-task-key-binding-v1"
    :causal-category "other:receipt lifecycle task-key binding"
    :input {:family "receipt retention" :lookup "version-2 task identity"}
    :expected-pre-repair-failure {:task-key-bound false :family-scoped false}
    :expected-repair-result {:task-key-bound true :family-scoped true}}))

(def ^:private receipt-handlers
  [{:pattern #"^(.+)$"
    :applies? receipt-scenario?
    :handler (fn [world _example _captures]
               (verify-receipt-lifecycle!)
               world)}])

(def handlers
  (vec
   (concat
    receipt-handlers
    (support/feature-scoped-stateful-handlers
     feature-files
     #(or (= % "an exact committed candidate has a canonical review-evidence plan")
          (re-matches #"the declared .+ does not equal its current canonical value" %)
          (re-matches #".+ prevents one canonical .+ from being derived" %)
          (= % "the blocked-aggregate consumer plan and Phase 2 succession destination have current canonical identities")
          (= % "an exact plan does not select verification_process or consume either governed identity"))
     :verification-administration-preflight/active
     transition))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-01T22:27:44.295130296+02:00", :module-hash "792648172", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "2079947283"} {:id "def/feature-files", :kind "def", :line 4, :end-line 5, :hash "648182986"} {:id "form/2/defonce", :kind "defonce", :line 7, :end-line 7, :hash "199862300"} {:id "defn-/verify-contract!", :kind "defn-", :line 9, :end-line 16, :hash "432917391"} {:id "defn-/transition", :kind "defn-", :line 18, :end-line 20, :hash "-64220723"} {:id "def/handlers", :kind "def", :line 22, :end-line 27, :hash "-743058950"}]}
;; clj-mutate-manifest-end
