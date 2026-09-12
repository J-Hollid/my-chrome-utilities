(ns acceptance.verification-support.modular-architecture-vtd015-admission-transaction-handlers
  (:require [acceptance.steps.support :as support]))

(defonce ^:private evidence (atom nil))

(defn- prepared [world]
  (when-not @evidence
    (let [command ["node" "test/verification-contracts/reliability-admission-contract-test.mjs"]
          result (support/verified-command-or-prepared-task-result
                  command
                  "unit:test/verification-contracts/reliability-admission-contract-test.mjs"
                  command)]
      (support/assert! (zero? (:exit result))
                       "Review admission transaction contracts failed."
                       {:out (:out result) :err (:err result)})
      (reset! evidence true)))
  (assoc world :vtd015/admission-transaction-evidence @evidence))

(defn handlers []
  [{:pattern #"^(?:a completed review-evidence receipt contains valid eligible-repair admissions and fresh package proof|eligible-repair admission recording has one committed exact transaction|a completed review-evidence receipt contains valid confirmed-flaky admissions, fresh governed coverage, and fresh package proof|a confirmed-flaky admission has one committed exact transaction and remains unresolved)$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^(?:review-ready evidence is recorded|review-ready and QA-ready handoffs validate that candidate|the same record-review command is invoked with the exact receipt, base, task, and candidate|.+ occurs during explicitly requested master integration)$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^(?:eligible-repair recording was interrupted with .+|confirmed-flaky recording was interrupted with .+|transaction recovery produces .+|the terminal result is .+)$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^(?:one durable transaction binds the receipt, review-ready record, and terminal-verification-deferred disposition for every admitted incident|recording revalidates the exact candidate, repair digests, selected coverage, fresh task results, plan, toolchain, artifact, and package identities under one canonical lock order|recording revalidates the exact candidate, diagnostic classification and receipt, selected fresh coverage, plan, toolchain, artifact, environment, deadlines, and package identities under one canonical lock order|the transaction is committed only when the review-ready record and every matching incident disposition are durable|each incident remains unresolved with its immutable failure and repair history intact|each incident remains unresolved with its immutable failure and diagnostic history intact|handoff validation performs no late incident mutation|review-ready and QA-ready handoffs remain blocked until the transaction is committed|recovery never duplicates an incident transition or review-ready record|both routes require the matching review-ready evidence, transaction id, and terminal-verification-deferred dispositions|they remain focused claims that permit only the next review or QA fast-forward|no coder, refactorer, or feature-mode architect can request an all-runnable-pack fallback through admission|the incident is resolved only by the passing canonical all-runnable-pack properties and package checkpoint during explicitly requested master integration|each confirmed-flaky disposition records its diagnostic basis without inventing a causal repair or repair digest|the immutable feature failure and diagnostic history remain auditable)$"
    :handler (fn [world _ _] (prepared world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-12T17:44:39.267864158+02:00", :module-hash "871848586", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-1682600983"} {:id "form/1/defonce", :kind "defonce", :line 4, :end-line 4, :hash "701185655"} {:id "defn-/prepared", :kind "defn-", :line 6, :end-line 17, :hash "-1646547473"} {:id "defn/handlers", :kind "defn", :line 19, :end-line 27, :hash "-446787638"}]}
;; clj-mutate-manifest-end
