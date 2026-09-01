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
    :expected-repair-result {:commandState "declared-slice-prerequisite"}}])

(defn emit! []
  (doseq [{:keys [key expected-repair-result] :as definition} fixture-definitions]
    (causal-regression/emit! key expected-repair-result (dissoc definition :key))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-01T22:28:05.219113321+02:00", :module-hash "-104394069", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-779386969"} {:id "def/fixture-definitions", :kind "def", :line 4, :end-line 14, :hash "496105331"} {:id "defn/emit!", :kind "defn", :line 16, :end-line 18, :hash "-181562350"}]}
;; clj-mutate-manifest-end
