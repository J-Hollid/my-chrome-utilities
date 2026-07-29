(ns acceptance.steps.specification-studio-choice-controls
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/specification-studio-choice-controls.feature"
   "features/specification-studio-choice-controls-runtime.feature"])

(def entry-modes
  {"an operator is using Specification Studio" :model
   "the built extension is running with production Specification Studio" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Specification Studio choice-control model verification failed. "
   "node" "test/data-layer-studio-choice-controls-test.mjs"))

(defn- verify-browser! []
  (support/cached-command-observation!
   browser-observation
   {:command ["node" "test/twatility-workflow-polish-browser-test.mjs"]
    :observation-key :studioChoiceControls
    :runtime-error "Specification Studio choice-control browser verification failed."
    :missing-error "Specification Studio choice-control browser evidence is missing."}))

(def example-relations
  [{:keys ["control" "consequence" "pattern"]
    :rows #{["Only defined fields" "immediately applies one reversible Draft setting" "switch"]
            ["Include concept subheadings" "changes configuration pending preview refresh" "checkbox"]
            ["Include ecommerce concept" "selects membership in an ordered group" "checkbox"]
            ["Export Sitewide" "selects membership in an export scope" "checkbox"]
            ["Confirm incomplete export" "records an acknowledgement" "checkbox"]
            ["Select staged property" "selects membership for a later batch action" "checkbox"]
            ["Borders" "stages a theme option for an explicit save" "checkbox"]}}
   {:keys ["pointer_context" "target_height"]
    :rows #{["fine pointer at desktop width" "36 CSS pixels"]
            ["coarse pointer at narrow width" "44 CSS pixels"]}}
   {:keys ["presentation"]
    :rows #{["1280 CSS pixel Studio"]
            ["360 CSS pixel Studio"]
            ["200 percent browser zoom"]}}])

(defn- validate-example! [_mode example]
  (support/validate-example-relations!
   example-relations example
   "Specification Studio choice-control example columns describe an invalid result."))

(defn- assert-browser! [evidence]
  (let [contracts #{"schema.only-defined" "schema.copy-dependency" "schema.destructive-confirmation"
                    "schema.specification-property" "schema.specification-headings"
                    "documentation.concept-subheadings" "documentation.concept-membership"
                    "documentation.section-membership" "documentation.flow-context"
                    "documentation.property-row" "documentation.metadata-column"
                    "documentation.matrix-context" "documentation.profile-column"
                    "documentation.export-section" "documentation.confirm-incomplete"
                    "documentation.theme-option"
                    "entity.creation-option" "entity.editor-option"
                    "conflict.pending-field" "bulk.staged-property" "defect.issue-inclusion"
                    "defect.timeline-evidence" "defect.expected-override" "defect.acknowledgement"
                    "defect.report-section" "defect.warning-acknowledgement"
                    "defect.expected-property" "guided.conditional" "guided.publish-rule"}]
  (support/assert! (and (= (set (map keyword contracts))
                           (set (keys evidence)))
                        (every? true? (vals evidence)))
                   "Installed Specification Studio choice-control evidence is incomplete."
                   evidence)))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :specification-studio-choice-controls-mode
   verify-model! validate-example!
   verify-browser! assert-browser!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-29T18:23:39.928088863+02:00", :module-hash "-1480354669", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "1666609219"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-669728793"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 10, :hash "-385232689"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 13, :end-line 13, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 15, :end-line 19, :hash "1860670314"} {:id "defn-/verify-browser!", :kind "defn-", :line 21, :end-line 27, :hash "912583480"} {:id "def/example-relations", :kind "def", :line 29, :end-line 44, :hash "-433954336"} {:id "defn-/validate-example!", :kind "defn-", :line 46, :end-line 49, :hash "-1064675176"} {:id "defn-/assert-browser!", :kind "defn-", :line 51, :end-line 69, :hash "-1291827217"} {:id "def/handlers", :kind "def", :line 71, :end-line 75, :hash "-1256697772"}]}
;; clj-mutate-manifest-end
