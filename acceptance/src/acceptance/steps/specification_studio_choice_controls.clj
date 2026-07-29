(ns acceptance.steps.specification-studio-choice-controls
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/specification-studio-choice-controls.feature"
   "features/specification-studio-choice-controls-runtime.feature"])

(def entry-modes
  {"an operator is using Specification Studio" :model
   "the built extension is running with production Specification Studio" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- checked! [& command]
  (let [result (apply process/shell {:out :string :err :string} command)]
    (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)})
    result))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Specification Studio choice-control model verification failed. "
   "node" "test/data-layer-studio-choice-controls-test.mjs"))

(defn- verify-browser! []
  (or @browser-observation
      (let [result (checked! "node" "test/twatility-workflow-polish-browser-test.mjs")
            payload (->> (str/split-lines (:out result))
                         (filter #(str/starts-with? % "{"))
                         last
                         (#(json/parse-string % true))
                         :studioChoiceControls)]
        (support/assert! payload "Specification Studio choice-control browser evidence is missing."
                         {:out (:out result)})
        (reset! browser-observation payload))))

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
  (support/assert! (and (= #{:installedBoundary :explicitLabels :checkboxClassification
                             :desktopGeometry :labelActivation :verticalGroups
                             :separateActions :immediateSwitch :oneCommand
                             :undoRedoReload :coarseAndNarrow :focusVisible
                             :responsiveOverflow :sidePanelUnchanged}
                           (set (keys evidence)))
                        (every? true? (vals evidence)))
                   "Installed Specification Studio choice-control evidence is incomplete."
                   evidence))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :specification-studio-choice-controls-mode
   verify-model! validate-example!
   verify-browser! assert-browser!))
