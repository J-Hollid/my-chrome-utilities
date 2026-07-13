(ns acceptance.steps.defect-report-timeline-assertions
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn assert-timeline-composer! [observation]
  (let [composer (get-in observation [:ui :timelineComposer])
        initial-ids (:initialChoiceIds composer)
        summaries (:initialChoiceSummaries composer)]
    (support/assert! (str/includes? (:initialEmptyState composer) "No events added") "Timeline composer empty state is missing." composer)
    (support/assert! (and (:choicesHiddenInitially composer) (:evidenceHiddenInitially composer)) "Empty timeline exposed selection or evidence controls." composer)
    (support/assert! (= ["purchase" "checkout" "promotion" "pageview"] (vec (take 4 initial-ids))) "Timeline choices are not newest first." composer)
    (support/assert! (= 20 (count initial-ids)) "Timeline result window is not bounded." composer)
    (support/assert! (> (:loadedChoiceCount composer) (count initial-ids)) "Older timeline matches were not loaded incrementally." composer)
    (support/assert! (= ["search" "name" "source" "pathname" "validation"] (:filterFields composer)) "Timeline search and filters are incomplete." composer)
    (support/assert! (= ["purchase"] (:searchResultIds composer)) "Timeline search did not narrow captured events." composer)
    (support/assert! (every? #(and (str/includes? % " · ") (re-find #"products|checkout" %)) (take 4 summaries)) "Timeline choices omit capture metadata or validation state." composer)
    (support/assert! (:evidenceHiddenBeforeSelection composer) "Evidence controls appeared before selecting one event." composer)
    (support/assert! (re-find #"capture time.*event name.*source.*pathname" (:alwaysIncludedText composer)) "Always-included event metadata is not explained." composer)
    (support/assert! (= ["Summary — compact event summary"
                        "Payload — captured event JSON"
                        "Validation details — schema, rule, and issue information"]
                       (:evidenceDescriptions composer)) "Evidence choices are not explained." composer)
    (support/assert! (= ["Back to event selection" "Add to timeline" "Cancel"] (:configurationActions composer)) "Timeline configuration actions are incomplete." composer)
    (support/assert! (:backReturnedToSelection composer) "Timeline configuration did not return to event selection." composer)
    (support/assert! (and (:cancelledTimelineEmpty composer)
                          (= {:preventScroll true} (:cancelFocusRestored composer))) "Cancelling a timeline entry did not restore the empty state and focus." composer)
    (support/assert! (= "Open a product" (:pathnameEdit composer)) "Timeline composition changed pathname skeleton edits." composer)
    (support/assert! (every? #(str/includes? (:addedPurchaseMetadata composer) %) ["purchase" "Data layer" "/checkout"]) "Added timeline entry omits required metadata." composer)
    (support/assert! (= ["includeValidation"] (:addedPurchaseEvidence composer)) "Added purchase evidence differs from its configuration." composer)
    (support/assert! (= ["Adjust" "Remove"] (:addedPurchaseActions composer)) "Timeline entry actions are incomplete." composer)
    (support/assert! (:addStagesClosed composer) "Add-event stages remained open after adding an entry." composer)
    (support/assert! (= {:disabled true :status "true"} (:alreadyAddedState composer)) "Already-added purchase was not disabled." composer)
    (support/assert! (= ["includeValidation"] (:adjustPrefilledEvidence composer)) "Adjust did not restore existing evidence configuration." composer)
    (support/assert! (= ["includePayload"] (:adjustedPurchaseEvidence composer)) "Adjusted evidence did not replace Validation details with Payload." composer)
    (support/assert! (= 1 (:adjustedPurchaseCount composer)) "Adjust created a duplicate purchase entry." composer)
    (support/assert! (= {:preventScroll true} (:adjustFocusRestored composer)) "Saving an adjustment did not restore focus." composer)
    (support/assert! (= ["pageview" "purchase"] (:chronologicalEntries composer)) "Timeline entries do not remain in capture chronology." composer)
    (support/assert! (and (:emptyAfterRemove composer) (= 22 (:capturedEventsRetained composer))) "Removing timeline entries changed the captured session or missed the empty state." composer)))
