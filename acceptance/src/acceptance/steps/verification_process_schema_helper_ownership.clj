(ns acceptance.steps.verification-process-schema-helper-ownership
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/verification-process-schema-controller-helper-ownership.feature"])

(defonce ^:private evidence (atom nil))

(defn- result-payload [result]
  (support/json-observation (:out result) :schemaControllerHelperOwnership))

(defn- verified-evidence! []
  (when-not @evidence
    (let [result (support/verified-command-result
                  "node" "test/verification-contracts/schema-controller-slice-activation-test.mjs")
          payload (result-payload result)]
      (support/assert! (and (zero? (:exit result)) payload)
                       "Schema controller helper ownership contracts failed."
                       {:err (:err result) :out (:out result)})
      (reset! evidence payload)))
  @evidence)

(defn- classification-relations [evidence]
  [{:keys ["boundary_evidence" "ownership_result" "required_evidence"]
    :rows (set (map (juxt :boundaryEvidence :ownershipResult :requiredEvidence)
                    (:classificationRelations evidence)))}])

(defn- validate-example! [example evidence]
  (support/validate-example-relations!
   (classification-relations evidence)
   example
   "The Schema helper ownership example is not proved by the registry contract."))

(defn- validate-captures! [example captures]
  (doseq [key (support/capture-placeholder-keys captures)]
    (support/require-example example key)))

(defn- all-true? [values]
  (every? true? values))

(defn- step-validations [evidence]
  (let [{:keys [inventory controllerSlices classificationRelations exactPlan
                fallbackPlan candidateEvidence]} evidence]
    {"QA has the ten installed Schema controller slices and the existing project hydration owner"
     #(and (= 10 (:installed controllerSlices))
           (:projectHydrationOwnerRetained controllerSlices))
     "the current installed Schema TypeScript inventory is authoritative"
     #(and (:authoritative inventory) (= 73 (:total inventory)))
     "the helper ownership inventory is complete"
     #(= (:total inventory) (+ (:exactOwners inventory) (:parentFallbacks inventory)))
     "each current installed Schema TypeScript file has exactly one existing slice owner or one explicit parent fallback"
     #(and (= 48 (:exactOwners inventory)) (= 25 (:parentFallbacks inventory)))
     "no current file is unclassified or has more than one result"
     #(and (zero? (:unclassified inventory)) (zero? (:duplicates inventory)))
     "an installed Schema helper has <boundary_evidence>"
     #(every? :proved classificationRelations)
     "helper ownership is classified"
     #(every? :proved classificationRelations)
     "its ownership result is <ownership_result>"
     #(every? :proved classificationRelations)
     "its required evidence is <required_evidence>"
     #(every? :proved classificationRelations)
     "a helper has valid ownership in one existing controller slice"
     #(:validOwnership exactPlan)
     "exact changed-path planning selects that helper"
     #(and (:validOwnership exactPlan) (:exactConsumers exactPlan))
     "the plan includes its direct evidence, declared properties, prerequisites, and exact consumers"
     #(all-true? (map exactPlan [:directEvidence :declaredProperties :prerequisites :exactConsumers]))
     "the plan excludes every unrelated Schema controller task"
     #(:excludesUnrelated exactPlan)
     "the complete Schemas parent task closure remains conserved"
     #(:parentClosureConserved exactPlan)
     "a helper has an explicit parent fallback"
     #(:explicit fallbackPlan)
     "verification applies the safe fallback route"
     #(and (:explicit fallbackPlan) (:reasonIdentifiesBoundary fallbackPlan))
     "the plan includes the complete Schemas unit, property, and dependant closure"
     #(all-true? (map fallbackPlan [:completeUnit :completeProperty :completeDependants]))
     "the fallback reason identifies the shared or unproved boundary"
     #(:reasonIdentifiesBoundary fallbackPlan)
     "the candidate changes helper ownership declarations and their durable contracts"
     #(and (:noNewSchemaSlice candidateEvidence)
           (:noNewVerificationProcessSlice candidateEvidence))
     "current and base planning prepare the candidate evidence"
     #(:selfNarrowingPrevented candidateEvidence)
     "the candidate cannot use its new helper mappings to reduce its own evidence"
     #(:selfNarrowingPrevented candidateEvidence)
     "the plan uses the existing verification-process ownership and registry slices"
     #(= ["ownership_impact" "registry_inventory" "reliability_run_intent"]
         (:processSlices candidateEvidence))
     "no new Schema behavior slice or verification-process slice is present"
     #(and (:noNewSchemaSlice candidateEvidence)
           (:noNewVerificationProcessSlice candidateEvidence))}))

(defn- validate-step! [text evidence]
  (let [validation (get (step-validations evidence) text)]
    (support/assert! validation "The Schema helper ownership step has no semantic validation."
                     {:step text})
    (support/assert! (validation) "The Schema helper ownership step is not proved."
                     {:step text :evidence evidence})))

(defn- transition [world example captures {:keys [text]}]
  (let [verified (verified-evidence!)]
    (validate-captures! example captures)
    (validate-example! example verified)
    (validate-step! text verified)
    (assoc world
           :verification-schema-helper-ownership/active true
           :verification-schema-helper-ownership/evidence verified)))

(def handlers
  (support/feature-scoped-stateful-handlers
   feature-files
   #(= % "QA has the ten installed Schema controller slices and the existing project hydration owner")
   :verification-schema-helper-ownership/active
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-05T15:20:19.202736414+02:00", :module-hash "-1949748950", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "2046882011"} {:id "def/feature-files", :kind "def", :line 4, :end-line 5, :hash "1804965397"} {:id "form/2/defonce", :kind "defonce", :line 7, :end-line 7, :hash "701185655"} {:id "defn-/result-payload", :kind "defn-", :line 9, :end-line 10, :hash "-1524877860"} {:id "defn-/verified-evidence!", :kind "defn-", :line 12, :end-line 21, :hash "749975531"} {:id "defn-/classification-relations", :kind "defn-", :line 23, :end-line 26, :hash "-174152369"} {:id "defn-/validate-example!", :kind "defn-", :line 28, :end-line 32, :hash "1416984120"} {:id "defn-/validate-captures!", :kind "defn-", :line 34, :end-line 36, :hash "-1679388996"} {:id "defn-/all-true?", :kind "defn-", :line 38, :end-line 39, :hash "-1373750603"} {:id "defn-/step-validations", :kind "defn-", :line 41, :end-line 93, :hash "-880351924"} {:id "defn-/validate-step!", :kind "defn-", :line 95, :end-line 100, :hash "-1789230270"} {:id "defn-/transition", :kind "defn-", :line 102, :end-line 109, :hash "2061534300"} {:id "def/handlers", :kind "def", :line 111, :end-line 116, :hash "-855433816"}]}
;; clj-mutate-manifest-end
