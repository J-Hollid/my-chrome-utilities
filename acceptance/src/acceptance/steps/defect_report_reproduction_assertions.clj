(ns acceptance.steps.defect-report-reproduction-assertions
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- assert-outline-example! [example composer]
  (when-let [component-name (:component_name example)]
    (let [match (some #(when (and (= component-name (:componentName %))
                                  (= (:component_details example) (:componentDetails %))) %)
                      (:clickExamples composer))]
      (support/assert! match "Click-component example was not exercised by the production UI." {:example example})
      (support/assert! (= (:step_text example) (:stepText match)) "Click-component example preview differs." {:example example :match match})))
  (when-let [scroll-target (:scroll_target example)]
    (let [match (some #(when (= scroll-target (:scrollTarget %)) %) (:scrollExamples composer))]
      (support/assert! match "Scroll example was not exercised by the production UI." {:example example})
      (support/assert! (= (:step_text example) (:stepText match)) "Scroll example preview differs." {:example example :match match}))))

(def ^:private action-order ["+" "Adjust" "Remove" "Move earlier" "Move later"])
(def ^:private checkout-boundary
  {:text "2. Click Checkout"
   :earlierVisible true
   :earlierDisabled true
   :guidance "Reordering stays within /checkout."
   :chooseAnotherAbsent true})

(defn- complete-layout? [observation]
  (= [true true true true]
     ((juxt :textBeforeActions :guidanceAfterActions :completeControls :noHorizontalOverflow)
      observation)))

(defn- contextual-row? [row]
  (= [true true true]
     [(:textBeforeActions row)
      (str/starts-with? (:addName row) "Add step to /")
      (str/includes? (:addName row) " section from step ")]))

(defn- assert-action-row! [observation]
  (support/assert! (= "2. Click Checkout" (:text observation)) "The manual step text differs in the browser." observation)
  (support/assert! (= action-order (:actionOrder observation)) "Manual-step browser actions are unordered." observation)
  (support/assert! (= (:actionOrder observation) (:tabOrder observation)) "Keyboard navigation order differs from the displayed action order." observation)
  (support/assert! (complete-layout? observation) "The reproduction step does not preserve its three-row responsive layout." observation)
  (support/assert! (every? contextual-row? (:rows observation)) "A pathname or manual row lost text-first order or its contextual Add name." observation)
  (support/assert! (= checkout-boundary (:checkoutBoundary observation)) "The /checkout pathname boundary is unclear or movable." observation))

(def ^:private builder-widths
  {"360 CSS px" 360
   "520 CSS px" 520})

(defn- assert-action-rows! [example observations]
  (support/assert! (= [360 520] (mapv :width observations)) "The reproduction action rows were not verified at both specified widths." observations)
  (when-let [builder-width (:builder_width example)]
    (let [expected-width (get builder-widths builder-width)]
      (support/assert! expected-width "The reproduction builder example uses an unsupported width." {:example example})
      (support/assert! (some #(= expected-width (:width %)) observations)
                       "The reproduction builder example was not exercised at its specified width."
                       {:example example :observations observations})))
  (doseq [observation observations]
    (assert-action-row! observation)))

(defn assert-reproduction-composer! [example observation]
  (let [composer (get-in observation [:ui :reproductionComposer])
        action-rows (:reproductionStepActionRows observation)
        expected-order ["1. Visit /products"
                        "2. Scroll to the bottom of the page"
                        "3. Click Checkout"
                        "4. Visit /checkout"]
        section-end-order ["1. Visit /products"
                           "2. Click Product card"
                           "3. Scroll to the bottom of the page"
                           "4. Review the available products"
                           "5. Visit /checkout"]]
    (assert-outline-example! example composer)
    (assert-action-rows! example action-rows)
    (support/assert! (= 2 (:initialAdjacentActionCount composer)) "A pathname row is missing its adjacent add action." composer)
    (support/assert! (= ["Add step to /products section from step 1 Visit /products"
                         "Add step to /checkout section from step 2 Visit /checkout"]
                        (:initialActionNames composer)) "Initial row add actions have incorrect accessible names." composer)
    (support/assert! (true? (:legacyControlsAbsent composer)) "Legacy pathname selector or shared add controls remain visible." composer)
    (support/assert! (true? (:composerDisplayedInline composer)) "The template composer was not mounted beneath its invoking row." composer)
    (support/assert! (= {:preventScroll true} (:templateComposerFocus composer)) "Opening the template composer moved the viewport or did not focus it." composer)
    (support/assert! (= ["Click component" "Log in as user" "Scroll" "Custom step"] (:templateActions composer)) "The reproduction templates are incomplete or unordered." composer)
    (support/assert! (true? (:noStepBeforeSubmit composer)) "Opening the composer added an incomplete step." composer)
    (support/assert! (= "Click Checkout — sticky footer button" (:clickPreview composer)) "Click component preview differs." composer)
    (support/assert! (= ["componentName" "description"] (:businessFields composer)) "Click component requires fields other than business-readable name and description." composer)
    (support/assert! (= "Log in as returning customer" (:loginPreview composer)) "Login preview differs." composer)
    (support/assert! (true? (:secretFieldsAbsent composer)) "The login composer exposed authentication-secret fields." composer)
    (support/assert! (= ["Scroll to the bottom of the page"
                        "Scroll to the top of the page"
                        "Scroll to Order summary"
                        "Scroll to the middle of results"]
                       (:scrollPreviews composer)) "Scroll previews differ." composer)
    (support/assert! (= "Apply the free delivery filter" (:customPreview composer)) "Custom preview differs." composer)
    (support/assert! (true? (:customBlankSubmissionUnavailable composer)) "Blank custom text could be submitted." composer)
    (support/assert! (= ["Adjust" "Remove" "Move earlier" "Move later"] (:manualActions composer)) "Manual-step actions are incomplete." composer)
    (support/assert! (= ["+" "Adjust" "Remove" "Move earlier" "Move later"] (:manualActionRow composer)) "Manual-step actions are not grouped in display order." composer)
    (support/assert! (= ["defect-reproduction-step-text" "defect-reproduction-step-actions" "defect-reproduction-step-guidance"] (:manualRowStructure composer)) "Manual-step rows are not structured as text, actions, then guidance." composer)
    (support/assert! (= 3 (:afterFirstAddActionCount composer)) "An added manual row did not receive its own adjacent add action." composer)
    (support/assert! (= "Click Checkout — primary checkout action" (:adjustedText composer)) "Adjusted click text differs." composer)
    (support/assert! (= 1 (:adjustedCount composer)) "Adjusting created a duplicate manual step." composer)
    (support/assert! (= {:preventScroll true} (:adjustFocusRestored composer)) "Saving an adjustment did not restore focus." composer)
    (support/assert! (= ["pathname" "pathname"] (:anchorsAfterRemove composer)) "Removing a manual step changed the pathname skeleton." composer)
    (support/assert! (= expected-order (:order composer)) "Manual steps are not numbered within their pathname anchors." composer)
    (support/assert! (true? (:crossAnchorMoveDisabled composer)) "A manual step could move across a pathname anchor without changing segment." composer)
    (support/assert! (= "Reordering stays within /products." (:crossAnchorGuidance composer)) "Local reorder guidance still suggests changing pathname segments." composer)
    (support/assert! (true? (:cancelPreserved composer)) "Cancel changed the numbered reproduction steps." composer)
    (support/assert! (= {:preventScroll true} (:cancelFocusRestored composer)) "Cancel did not restore focus to the contextual Add action." composer)
    (support/assert! (= "Add step to /products section from step 2 Click Product card" (:manualSectionAddName composer)) "The manual-row add action has an incorrect accessible name." composer)
    (support/assert! (= section-end-order (:sectionEndOrder composer)) "Adding from a manual row did not append at the pathname section end." composer)
    (support/assert! (= 5 (:finalAdjacentActionCount composer)) "A row in the section-end insertion example lacks an adjacent add action." composer)
    (support/assert! (= 4 (:finalStepCount composer)) "The final reproduction list lost a pathname or manual step." composer)
    (doseq [representation [(:finalPreview composer) (:jiraText composer)]]
      (support/assert! (and representation
                            (< (str/index-of representation "Visit /products")
                               (str/index-of representation "Scroll to the bottom of the page")
                               (str/index-of representation "Click Checkout")
                               (str/index-of representation "Visit /checkout")))
                       "Preview or Jira output changed reproduction-step order." {:representation representation})
      (support/assert! (not (re-find #"componentName|scrollTarget|reproductionField" representation)) "Template configuration leaked into report output." {:representation representation}))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-13T21:28:25.921429987+02:00", :module-hash "1833592313", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1823940385"} {:id "defn-/assert-outline-example!", :kind "defn-", :line 5, :end-line nil, :hash "389789638"} {:id "def/action-order", :kind "def", :line 17, :end-line nil, :hash "-821931862"} {:id "def/checkout-boundary", :kind "def", :line 18, :end-line nil, :hash "544271857"} {:id "defn-/complete-layout?", :kind "defn-", :line 25, :end-line nil, :hash "-344994125"} {:id "defn-/contextual-row?", :kind "defn-", :line 30, :end-line nil, :hash "-514341073"} {:id "defn-/assert-action-row!", :kind "defn-", :line 36, :end-line nil, :hash "-1599490917"} {:id "def/builder-widths", :kind "def", :line 44, :end-line nil, :hash "1495228669"} {:id "defn-/assert-action-rows!", :kind "defn-", :line 48, :end-line nil, :hash "-1487388388"} {:id "defn/assert-reproduction-composer!", :kind "defn", :line 59, :end-line nil, :hash "901310921"}]}
;; clj-mutate-manifest-end
