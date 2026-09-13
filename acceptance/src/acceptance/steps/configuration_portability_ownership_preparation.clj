(ns acceptance.steps.configuration-portability-ownership-preparation
  (:require [acceptance.steps.support :as support]))

(def feature "features/configuration-portability-ownership-preparation.feature")
(defonce evidence (atom nil))

(defn- verify! []
  (or @evidence
      (let [result (support/verified-command-result
                     "node" "test/configuration-portability-ownership-preparation-contract-test.mjs")]
        (support/assert! (zero? (:exit result))
                         "Configuration portability ownership preparation failed."
                         {:result result})
        (support/assert! (= {:dispositions 3 :integratedSeams 1 :parentFallbacks 2
                             :consumerCount 0 :behaviorChanged false}
                            (support/json-observation
                              (:out result) :configurationPortabilityOwnershipPreparation))
                         "The exact reviewed dispositions and conserved behavior are required."
                         {:result result})
        (reset! evidence true))))

(defn- transition [world example captures _]
  (verify!)
  (doseq [key (support/capture-placeholder-keys captures)]
    (support/require-example example key))
  (assoc world :configuration-portability-ownership-preparation/active true))

(def handlers
  (support/feature-scoped-stateful-handlers
    [feature]
    #{"configuration portability is approved and has no product implementation delta"
      "the accepted registry records existing project transport owners and consumers"}
    :configuration-portability-ownership-preparation/active
    transition))
