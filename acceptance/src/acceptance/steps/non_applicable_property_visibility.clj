(ns acceptance.steps.non-applicable-property-visibility
  (:require [acceptance.steps.schema-publication-refresh-support :as verification]
            [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-non-applicable-property-visibility.feature"
   "features/data-layer-non-applicable-property-visibility-runtime.feature"])

(def entry-modes
  {"a captured event with an assigned schema is open in the Live inspector" :model
   "the built extension Live inspector is running with production validation and property-tree rendering" :runtime})

(def example-values
  {"property_state" #{"missing" "present with value" "present with null"}
   "rule_state" #{"optional Allowed values Not applicable" "Required failed" "conditional rule Not applicable" "Allowed values failed"
                  "Allowed values not applicable" "conditional rule not applicable"}
   "row_visibility" #{"hidden" "visible"}
   "property_outcome" #{"neutral Not applicable" "error Required" "neutral No applicable rules" "error with actual null"}
   "treatment" #{"neutral when revealed" "error" "neutral"}})

(defn- validate-example! [_mode example]
  (support/validate-example-domain!
   example-values example (filter #(support/example-value example %) (keys example-values))
   "Non-applicable property visibility example value was outside the specified contract."))

(defn- transition [world example _captures {:keys [text]}]
  (verification/transition!
   world example text entry-modes :non-applicable-property-visibility-mode
   validate-example!))

(def handlers
  (support/feature-mode-handlers
   feature-files entry-modes :non-applicable-property-visibility-mode transition))
