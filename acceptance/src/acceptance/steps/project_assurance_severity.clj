(ns acceptance.steps.project-assurance-severity
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-project-assurance-severity.feature"
   "features/data-layer-project-assurance-severity-runtime.feature"])

(def entry-modes
  {"Shop has a Saved Draft with one valid canonical schema and one publishable change" :model
   "the built extension is running with production project storage, schema validation, preflight, release review, and publication" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Project assurance severity model verification failed. "
   "node" "test/data-layer-project-assurance-severity-test.mjs"))

(defn- verify-browser! []
  (support/cached-command-observation!
   browser-observation
   {:command ["node" "test/browser-packs/project-assurance-severity.mjs"]
    :observation-key :projectAssuranceSeverity
    :runtime-error "Project assurance severity browser verification failed."
    :missing-error "Project assurance severity browser evidence is missing."}))

(defn- assert-browser! [evidence]
  (let [values (concat (vals (dissoc evidence :blockedEvidence))
                       (vals (:blockedEvidence evidence)))]
    (support/assert! (every? #(or (true? %) (= "status" %)) values)
                     "Installed project assurance evidence is incomplete."
                     evidence)))

(def example-values
  {"project_state" #{"no Fixtures" "no Assignments" "zero effective Coverage cells"
                     "an incomplete Fixture" "a Fixture whose expected result fails"
                     "equal Assignment candidates" "an Assignment with an unresolved target"
                     "one unproven effective requirement" "stale Coverage after a schema edit"
                     "incompatible inherited property types" "a malformed canonical validation rule"
                     "a required property missing from submitted data"
                     "an undeclared property while Only defined fields is enabled"}
   "finding" #{"No Fixtures" "No Assignments" "No Coverage"}
   "warning_code" #{"fixture-incomplete" "fixture-failed" "assignment-tie"
                    "assignment-unresolved" "uncovered-requirement" "stale-coverage"}
   "category" #{"Fixture" "Assignment" "Coverage"}
   "legacy_setting" #{"fixturesRequired" "warningsBlock"}
   "validation_boundary" #{"effective-schema compilation" "canonical compilation"
                           "payload validation" "effective-schema compiler"
                           "canonical compiler" "payload validator"}
   "repair_target" #{"the conflicting property facets" "the invalid rule field"
                     "the missing property path" "the undeclared property path"
                     "the conflicting property controls" "the invalid rule control"}
   "blocked_operation" #{"schema export and publication" "successful validation"}})

(defn validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode example-values example-values example
   "Project assurance severity example was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :project-assurance-severity-mode
   verify-model! validate-example!
   verify-browser! assert-browser!))
