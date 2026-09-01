(ns acceptance.steps.verification-process-legacy
  (:require [acceptance.steps.modular-architecture :as modular-architecture]
            [acceptance.verification-support.administration-live-target-handlers :as live-target]
            [acceptance.verification-support.administration-preflight-handlers :as administration-preflight]))

(def handlers (vec (concat administration-preflight/handlers
                           live-target/handlers
                           modular-architecture/handlers)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-01T22:27:59.446576682+02:00", :module-hash "713904620", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "575712535"} {:id "def/handlers", :kind "def", :line 6, :end-line 8, :hash "665218619"}]}
;; clj-mutate-manifest-end
