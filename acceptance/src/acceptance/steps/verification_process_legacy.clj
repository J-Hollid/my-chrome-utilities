(ns acceptance.steps.verification-process-legacy
  (:require [acceptance.steps.modular-architecture :as modular-architecture]
            [acceptance.verification-support.administration-preflight-handlers :as administration-preflight]))

(def handlers (vec (concat modular-architecture/handlers administration-preflight/handlers)))
