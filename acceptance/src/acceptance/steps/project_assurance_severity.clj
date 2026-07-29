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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-29T18:23:49.826148565+02:00", :module-hash "895879163", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-543545613"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "1958285866"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 10, :hash "-1398913262"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 13, :end-line 13, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 15, :end-line 19, :hash "-711588434"} {:id "defn-/verify-browser!", :kind "defn-", :line 21, :end-line 27, :hash "-871324884"} {:id "defn-/assert-browser!", :kind "defn-", :line 29, :end-line 34, :hash "-1551178522"} {:id "def/example-values", :kind "def", :line 36, :end-line 55, :hash "-423368284"} {:id "defn/validate-example!", :kind "defn", :line 57, :end-line 60, :hash "-1444193830"} {:id "def/handlers", :kind "def", :line 62, :end-line 66, :hash "-200869150"}]}
;; clj-mutate-manifest-end
