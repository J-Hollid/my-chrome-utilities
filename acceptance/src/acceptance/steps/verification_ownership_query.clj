(ns acceptance.steps.verification-ownership-query
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/verification-ownership-query.feature"])
(def relations
  [{:keys ["state" "result"] :rows #{["one eligible slice" "its parent pack and exact slice"]
    ["one parent without an eligible slice" "its parent fallback and the reason"]
    ["a quarantined slice" "the quarantine restriction and conservative parent fallback"]
    ["a proposed file under one declared source prefix" "its declared owner and file-existence status"]
    ["no declared owner" "explicit unowned status without a safe-scope claim"]
    ["conflicting owners at the controlling priority" "a nonzero ambiguity error"]}}
   {:keys ["change" "behavior"] :rows #{["a rename between owners" "plan both old and new paths"]
    ["deletion of an owned file" "retain its historical owner"]
    ["a narrower mapping in the candidate" "retain the required base and current ownership union"]
    ["a declared consumer with prerequisites" "retain the complete consumer and prerequisite closure"]
    ["a quarantined selected slice" "retain the conservative parent closure"]
    ["a property-bearing selected boundary" "include its required property checks"]}}
   {:keys ["classification" "action"] :rows #{["bounded-ready" "continue with the canonical bounded plan"]
    ["coarse-boundary" "mandatory independent ownership preparation"]
    ["granularity-assessment-required" "structured bounded judgment"]
    ["coarse-within-pack" "structured bounded judgment"]}}
   {:keys ["count" "list" "format" "shown" "omitted"] :rows #{["2" "checks" "text" "2" "0"]
    ["12" "checks" "text" "10" "2"]
    ["15" "consumers" "JSON" "10" "5"]}}
   {:keys ["target" "detail"] :rows #{["slice:pack_a/slice_a for a selected slice" "that slice declaration and provenance"]
    ["consumers" "the complete declared consumer list and provenance"]
    ["checks" "all direct, prerequisite, and consumer checks with their reasons"]
    ["slice:pack_a/unknown" "a nonzero unknown-target error"]}}
   {:keys ["condition" "outcome"] :rows #{["an invalid or non-ancestral changes base" "a nonzero base error"]
    ["an absolute or escaping repository path" "a nonzero path error"]
    ["stale generated registry bytes" "a nonzero stale-registry error"]
    ["missing authoritative registry input" "a nonzero missing-authority error"]
    ["valid uncommitted registry content for a path query" "an advisory answer marked with current content identity and dirty state"]
    ["registry inputs differ from HEAD for a changes query" "a nonzero registry-revision error"]
    ["uncommitted source edits for a changes query" "the committed answer with an explicit working-tree exclusion"]}}
   {:keys ["operation"] :rows #{["path"]
    ["changes"]
    ["an invalid expansion"]}}])
(def expected
  {:ownershipQuery {:path true :changes true :rename true :consumer true :prerequisite true :properties true :limits true :expansion true :unowned true :invalid true :dirty true :staleRejected true}
   :ownershipHistory {:renameAcrossOwners true :deletion true :canonicalUnion true :quarantine true :nonmutation true :invalidBase true :ambiguity true :missingAuthority true}
   :ownershipPresentation {:limits true :expansions true :restrictions true :classifications ["bounded-ready" "coarse-boundary" "granularity-assessment-required" "coarse-within-pack"]}})
(defonce evidence (atom nil))
(defn- verify! []
  (or @evidence
      (reset! evidence
        (into {} (for [[file key] [["test/ownership-query/cli-test.mjs" :ownershipQuery] ["test/ownership-query/history-test.mjs" :ownershipHistory] ["test/ownership-query/presentation-test.mjs" :ownershipPresentation]]]
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
  (assoc world :verification-ownership-query/active true))
(def handlers
  (support/feature-scoped-stateful-handlers feature-files
   #(= % "the ownership query uses the repository registry and canonical planning APIs")
   :verification-ownership-query/active transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-05T23:18:54.319746204+02:00", :module-hash "-1280728671", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "65245146"} {:id "def/feature-files", :kind "def", :line 4, :end-line 4, :hash "-2002835996"} {:id "def/relations", :kind "def", :line 5, :end-line 38, :hash "1811628038"} {:id "def/expected", :kind "def", :line 39, :end-line 42, :hash "1335931744"} {:id "form/4/defonce", :kind "defonce", :line 43, :end-line 43, :hash "701185655"} {:id "defn-/verify!", :kind "defn-", :line 44, :end-line 53, :hash "-1299344446"} {:id "defn-/transition", :kind "defn-", :line 54, :end-line 58, :hash "-936375769"} {:id "def/handlers", :kind "def", :line 59, :end-line 62, :hash "-1140607049"}]}
;; clj-mutate-manifest-end
