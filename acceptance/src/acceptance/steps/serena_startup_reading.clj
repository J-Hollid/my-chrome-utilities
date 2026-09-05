(ns acceptance.steps.serena-startup-reading
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/swarmforge-serena-startup-reading.feature"])
(def relations
  [{:keys ["role" "role_prompt"] :rows #{["specifier" "swarmforge/roles/specifier.prompt"]
    ["coder" "swarmforge/roles/coder.prompt"]
    ["refactorer" "swarmforge/roles/refactorer.prompt"]
    ["architect" "swarmforge/roles/architect.prompt"]}}
   {:keys ["reference" "treatment"] :rows #{["an explicit required instruction file" "read it or report that the required file is missing"]
    ["the selected task program and contracts" "read for the selected task"]
    ["the current scope and applicable mode rules" "read when selecting the task"]
    ["a completed task history link" "do not read from that link alone"]
    ["an example source path or command argument" "inspect only when the task needs it"]
    ["another role prompt with no explicit required include" "do not load it at startup"]}}
   {:keys ["question" "route"] :rows #{["a filename or literal configuration value" "ordinary file search"]
    ["an unfamiliar module structure" "a scoped symbol overview"]
    ["a changed public function and its callers" "targeted symbol bodies and references"]
    ["verification ownership and required consumers" "the canonical ownership query helper"]
    ["a complete architecture review" "the full candidate diff with targeted follow-up queries"]}}
   {:keys ["effect" "observation"] :rows #{["a targeted query avoided an unnecessary module read" "helped"]
    ["ordinary search already answered the question" "neutral"]
    ["server recovery delayed the work" "impeded"]}}])
(def expected
  {:serenaReading {:roles 4 :requiredOnce true :cycles true :referenceOnlyIgnored true :missingRejected true :selectedTask true}
   :serenaUsage {:routes true :currentFallback true :observations true :exclusions true}})
(defonce evidence (atom nil))
(defn- verify! []
  (or @evidence
      (reset! evidence
        (into {} (for [[file key] [["test/serena-startup-reading-test.mjs" :serenaReading] ["test/serena-usage-rule-test.mjs" :serenaUsage]]]
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
  (assoc world :serena-startup-reading/active true))
(def handlers
  (support/feature-scoped-stateful-handlers feature-files
   #(= % "the role uses the generated startup instruction and shared Serena usage rule")
   :serena-startup-reading/active transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-05T23:18:31.392819844+02:00", :module-hash "1497015625", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-401050263"} {:id "def/feature-files", :kind "def", :line 4, :end-line 4, :hash "-101539201"} {:id "def/relations", :kind "def", :line 5, :end-line 23, :hash "-1857370121"} {:id "def/expected", :kind "def", :line 24, :end-line 26, :hash "23413420"} {:id "form/4/defonce", :kind "defonce", :line 27, :end-line 27, :hash "701185655"} {:id "defn-/verify!", :kind "defn-", :line 28, :end-line 37, :hash "-1474959476"} {:id "defn-/transition", :kind "defn-", :line 38, :end-line 42, :hash "1569845399"} {:id "def/handlers", :kind "def", :line 43, :end-line 46, :hash "-965753676"}]}
;; clj-mutate-manifest-end
