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
  (support/assert! (and (= #{:installedBoundary :explicitContracts
                             :documentationRoute :canonicalAuthoringRoute
                             :conditionsRoute :conflictRoute :defectRoute
                             :themeRoute :confirmationRoute :bulkRoute
                             :optionalHints :groupingAndActions
                             :activationAndKeyboard :commandConservation
                             :durableConservation :responsive :sidePanelHashes}
                           (set (keys evidence)))
                        (every? true? (vals evidence)))
                   "Installed Specification Studio choice-control evidence is incomplete."
                   evidence))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :specification-studio-choice-controls-mode
   verify-model! validate-example!
   verify-browser! assert-browser!))
