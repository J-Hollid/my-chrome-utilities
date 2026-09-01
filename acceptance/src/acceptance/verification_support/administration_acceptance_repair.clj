(ns acceptance.verification-support.administration-acceptance-repair
  (:require [acceptance.causal-regression :as causal-regression]))

(def ^:private fixture-definitions
  [{:key :administration-acceptance-command-closure
    :id "administration-acceptance-command-closure-fixture-v1"
    :causal-category "other:acceptance-command-closure"
    :expected-pre-repair-failure {:commandState "undeclared"}
    :expected-repair-result {:commandState "declared-in-pack-bridge"}}
   {:key :administration-live-target-command-closure
    :id "administration-live-target-command-closure-fixture-v1"
    :causal-category "other:acceptance-live-target-command-closure"
    :expected-pre-repair-failure {:commandState "undeclared"}
    :expected-repair-result {:commandState "declared-slice-prerequisite"}}
   {:key :administration-contract-conservation
    :id "administration-contract-conservation-fixture-v1"
    :causal-category "other:contract-conservation-fixture-identity"
    :expected-pre-repair-failure {:sourceDigest "stale"}
    :expected-repair-result {:sourceDigest "current-generation"}}])

(defn emit! []
  (doseq [{:keys [key expected-repair-result] :as definition} fixture-definitions]
    (causal-regression/emit! key expected-repair-result (dissoc definition :key))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-01T22:52:54.398649508+02:00", :module-hash "-431042229", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-779386969"} {:id "def/fixture-definitions", :kind "def", :line 4, :end-line 19, :hash "-695675038"} {:id "defn/emit!", :kind "defn", :line 21, :end-line 23, :hash "-181562350"}]}
;; clj-mutate-manifest-end
