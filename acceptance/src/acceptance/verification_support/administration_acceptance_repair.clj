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
