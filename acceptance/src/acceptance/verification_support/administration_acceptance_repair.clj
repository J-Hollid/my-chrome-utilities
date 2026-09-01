(ns acceptance.verification-support.administration-acceptance-repair
  (:require [acceptance.causal-regression :as causal-regression]))

(def ^:private fixture-definition
  {:id "administration-acceptance-command-closure-fixture-v1"
   :causal-category "other:acceptance-command-closure"
   :expected-pre-repair-failure {:commandState "undeclared"}
   :expected-repair-result {:commandState "declared-in-pack-bridge"}})

(defn emit! []
  (causal-regression/emit!
   :administration-acceptance-command-closure
   (:expected-repair-result fixture-definition)
   fixture-definition))
