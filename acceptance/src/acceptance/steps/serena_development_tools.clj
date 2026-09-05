(ns acceptance.steps.serena-development-tools
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/swarmforge-serena-development-tools.feature"])
(def relations
  [{:keys ["role" "worktree"] :rows #{["specifier" "/repo"]
    ["coder" "/repo/.worktrees/coder"]
    ["refactorer" "/repo/.worktrees/refactorer"]
    ["architect" "/repo/.worktrees/architect"]}}
   {:keys ["condition" "exploration"] :rows #{["pinned tools are present and ready" "Serena and ordinary tools"]
    ["the Serena executable is missing" "ordinary tools with a missing-tool reason"]
    ["the language server cannot start" "ordinary tools with a server-failure reason"]
    ["MCP startup times out" "ordinary tools with a timeout reason"]}}
   {:keys ["capability" "availability"] :rows #{["symbol overview and targeted symbol bodies" "enabled"]
    ["symbol references" "enabled"]
    ["symbolic edits" "disabled"]
    ["duplicate shell and whole-file tools" "disabled"]
    ["memories and onboarding" "disabled"]
    ["usage reporting" "disabled"]}}
   {:keys ["path" "route"] :rows #{["src/example.ts" "current symbol queries through the TypeScript server"]
    ["scripts/example.mjs" "current symbol queries through the TypeScript server"]
    ["test/example.mjs" "current symbol queries through the TypeScript server"]
    ["swarmforge/scripts/example.mjs" "current symbol queries through the TypeScript server"]
    ["acceptance/src/example.clj" "Clojure symbol queries when provisioned, otherwise ordinary tools"]
    ["swarmforge/scripts/example.bb" "ordinary tools"]}}
   {:keys ["change"] :rows #{["an external edit"]
    ["a task checkout"]}}
   {:keys ["area" "selection"] :rows #{["authored product code" "available"]
    ["authored tests and process code" "available"]
    ["nested worker worktrees" "excluded"]
    ["dependencies and vendored source" "excluded"]
    ["generated output, caches, and runtime receipts" "excluded"]}}])
(def expected
  {:serenaLaunch {:roles 4 :worktreeBound true :optional true :fallback true :languages true}
   :serenaLaunchRuntime {:roles 4 :realSpawn true :taskDelivery true :offlineFallback true :configBinding true}
   :serenaServer {:optionalFailure true :noDownloads true :usageReporting false}
   :serenaProvider {:offline true :missing true :pinMismatch true :digestMismatch true}
   :serenaUsage {:routes true :currentFallback true :observations true :exclusions true}})
(defonce evidence (atom nil))
(defn- verify! []
  (or @evidence
      (reset! evidence
        (into {} (for [[file key] [["test/serena-launch-test.mjs" :serenaLaunch] ["test/serena-launch-runtime-test.mjs" :serenaLaunchRuntime] ["test/serena-server-test.mjs" :serenaServer] ["test/serena-provider-test.mjs" :serenaProvider] ["test/serena-usage-rule-test.mjs" :serenaUsage]]]
                   (let [result (support/verified-command-result "node" file)
                         value (support/json-observation (:out result) key)]
                     (support/assert! (and (zero? (:exit result)) (seq value)
                                          (= (get expected key) (select-keys value (keys (get expected key)))))
                                      "Pilot behavior check failed." {:file file :result result})
                     [key value]))))))
(defn- transition [world example captures _]
  (verify!)
  (doseq [key (support/capture-placeholder-keys captures)] (support/require-example example key))
  (support/validate-example-relations! relations example "Unsupported pilot relation.")
  (assoc world :serena-development-tools/active true))
(def handlers
  (support/feature-scoped-stateful-handlers feature-files
   #(= % "the Serena pilot uses local stdio and the Codex context")
   :serena-development-tools/active transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-05T23:17:57.287449387+02:00", :module-hash "1417100592", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-1740765345"} {:id "def/feature-files", :kind "def", :line 4, :end-line 4, :hash "-49613965"} {:id "def/relations", :kind "def", :line 5, :end-line 32, :hash "86239629"} {:id "def/expected", :kind "def", :line 33, :end-line 38, :hash "488977200"} {:id "form/4/defonce", :kind "defonce", :line 39, :end-line 39, :hash "701185655"} {:id "defn-/verify!", :kind "defn-", :line 40, :end-line 49, :hash "75220579"} {:id "defn-/transition", :kind "defn-", :line 50, :end-line 54, :hash "-856290936"} {:id "def/handlers", :kind "def", :line 55, :end-line 58, :hash "414055170"}]}
;; clj-mutate-manifest-end
