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

(defn assert-reproduction-composer! [example observation]
  (let [composer (get-in observation [:ui :reproductionComposer])
        expected-order ["1. Visit /products"
                        "2. Scroll to the bottom of the page"
                        "3. Click Checkout"
                        "4. Visit /checkout"]]
    (assert-outline-example! example composer)
    (support/assert! (= 1 (:contextualActionCount composer)) "The selected pathname did not have exactly one contextual add action." composer)
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
    (support/assert! (= "Click Checkout — primary checkout action" (:adjustedText composer)) "Adjusted click text differs." composer)
    (support/assert! (= 1 (:adjustedCount composer)) "Adjusting created a duplicate manual step." composer)
    (support/assert! (= {:preventScroll true} (:adjustFocusRestored composer)) "Saving an adjustment did not restore focus." composer)
    (support/assert! (= ["pathname" "pathname"] (:anchorsAfterRemove composer)) "Removing a manual step changed the pathname skeleton." composer)
    (support/assert! (= expected-order (:order composer)) "Manual steps are not numbered within their pathname anchors." composer)
    (support/assert! (true? (:crossAnchorMoveDisabled composer)) "A manual step could move across a pathname anchor without changing segment." composer)
    (support/assert! (true? (:cancelPreserved composer)) "Cancel changed the numbered reproduction steps." composer)
    (support/assert! (= {:preventScroll true} (:cancelFocusRestored composer)) "Cancel did not restore focus to the contextual Add action." composer)
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
;; {:version 1, :tested-at "2026-07-13T13:57:09.951206741+02:00", :module-hash "-1725450592", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1823940385"} {:id "defn-/assert-outline-example!", :kind "defn-", :line 5, :end-line nil, :hash "389789638"} {:id "defn/assert-reproduction-composer!", :kind "defn", :line 17, :end-line nil, :hash "2131075878"}]}
;; clj-mutate-manifest-end
