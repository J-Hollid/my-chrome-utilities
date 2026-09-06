(ns acceptance.steps.serena-startup-reading
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/swarmforge-serena-startup-reading.feature"
                    "features/swarmforge-serena-use-assessment.feature"])
(def relations
  [{:keys ["role"] :rows #{["specifier"] ["coder"] ["refactorer"] ["architect"]}}
   {:keys ["condition"] :rows #{["missing tool"] ["server failure"]
     ["stale symbol result"] ["unsupported file type"]}}
   {:keys ["role" "role_prompt"] :rows #{["specifier" "swarmforge/roles/specifier.prompt"]
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
    ["a complete architecture review" "the full candidate diff with targeted follow-up queries"]
    ["unfamiliar supported module structure" "a scoped Serena symbol overview"]
    ["callers affected by a split or interface" "Serena symbols and references"]
    ["a CSS selector or literal configuration" "ordinary file search"]
    ["verification owners and consumers" "the canonical ownership query"]
    ["complete architecture review" "full diff and suitable symbol work"]}}
   {:keys ["effect" "observation"] :rows #{["a targeted query avoided an unnecessary module read" "helped"]
    ["ordinary search already answered the question" "neutral"]
    ["server recovery delayed the work" "impeded"]}}])
(def expected
  {:serenaReading {:roles 4 :requiredOnce true :cycles true :referenceOnlyIgnored true :missingRejected true :selectedTask true :effectiveAssessment true}
   :serenaUsage {:routes true :currentFallback true :observations true :exclusions true :assessment true}})
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
   #{"the role uses the generated startup instruction and shared Serena usage rule"
     "the shared tool-use rule is delivered by the production role instruction generator"}
   :serena-startup-reading/active transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-06T13:42:14.192320018+02:00", :module-hash "-162870741", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-401050263"} {:id "def/feature-files", :kind "def", :line 4, :end-line 5, :hash "756221277"} {:id "def/relations", :kind "def", :line 6, :end-line 32, :hash "-1293937254"} {:id "def/expected", :kind "def", :line 33, :end-line 35, :hash "177241740"} {:id "form/4/defonce", :kind "defonce", :line 36, :end-line 36, :hash "701185655"} {:id "defn-/verify!", :kind "defn-", :line 37, :end-line 46, :hash "-1474959476"} {:id "defn-/transition", :kind "defn-", :line 47, :end-line 51, :hash "1569845399"} {:id "def/handlers", :kind "def", :line 52, :end-line 56, :hash "-203013595"}]}
;; clj-mutate-manifest-end
