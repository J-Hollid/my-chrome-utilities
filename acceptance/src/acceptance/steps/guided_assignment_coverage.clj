(ns acceptance.steps.guided-assignment-coverage
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-file "features/data-layer-guided-assignment-coverage-runtime.feature")
(defonce browser-observation (atom nil))

(defn- observation! []
  (or @browser-observation
      (reset! browser-observation
              (support/load-browser-observation!
               {:adapter-env "GUIDED_ASSIGNMENT_COVERAGE_BROWSER_ADAPTER"
                :observation-key :guidedAssignmentCoverage
                :runtime-error "Guided assignment coverage browser runtime failed."
                :missing-error "Guided assignment coverage browser evidence is missing."}))))

(defn- require-observation! [condition message observation]
  (support/assert! condition message {:observation observation}))

(defn validate-browser-observation! [observation]
  (let [{:keys [first published incompatible multiple]} observation]
    (require-observation!
     (and (:firstConfigurationDisplayed first)
          (every? #(and (false? (:configuration %))
                        (false? (:selection %))
                        (= ["Define requirement" "Review validation"] (:stages %)))
                  (:laterVisibility first))
          (= 1 (:assignmentCount first))
          (:assignmentUnchanged first)
          (= ["order_id" "currency" "value"] (:rulePaths first)))
     "The first reviewed assignment was not reused for later draft rules."
     first)
    (require-observation!
     (and (false? (:configuration published))
          (false? (:selection published))
          (= "reuse the covering assignment" (:action published))
          (= 1 (:assignmentCount published))
          (:identityUnchanged published))
     "Published assignment coverage was changed or displayed for reconfiguration."
     published)
    (require-observation!
     (and (:configuration (:before incompatible))
          (false? (:selection (:before incompatible)))
          (= 1 (:assignmentCount (:before incompatible)))
          (= 2 (get-in incompatible [:afterConfirm :count]))
          (false? (get-in incompatible [:laterVisibility :configuration]))
          (false? (get-in incompatible [:laterVisibility :selection]))
          (= 2 (:finalCount incompatible))
          (= "reuse the covering pending assignment" (:laterAction incompatible)))
     "URL-incompatible coverage did not create once and then reuse the pending assignment."
     incompatible)
    (require-observation!
     (and (false? (:configuration multiple))
          (false? (:selection multiple))
          (= "reuse existing schema coverage" (:action multiple))
          (= 2 (:beforeCount multiple) (:afterCount multiple))
          (= 2 (count (set (:identities multiple)))))
     "Multiple covering assignments changed count or required assignment selection."
     multiple)
    observation))

(defn browser-observation! []
  (validate-browser-observation! (observation!)))

(defn- example-value [example key]
  (support/example-value example key))

(defn- assert-example! [condition key example observed]
  (support/assert! condition
                   (str "Guided assignment coverage did not bind example " key ".")
                   {:key key :example example :observed observed}))

(defn validate-example! [example observation]
  (let [{:keys [event schemaName published incompatible multiple]
         first-case :first} observation]
    (doseq [[key actual] [["event_name" (:name event)]
                          ["source_id" (:sourceId event)]
                          ["page_url" (:pageUrl event)]
                          ["schema_name" schemaName]]]
      (assert-example! (= (example-value example key) actual) key example actual))
    (cond
      (example-value example "later_properties")
      (doseq [[key actual] [["first_property" (first (:rulePaths first-case))]
                            ["later_properties" (str/join ", " (rest (:rulePaths first-case)))]
                            ["assignment_name" (get-in first-case [:assignment :name])]]]
        (assert-example! (= (example-value example key) actual) key example actual))

      (example-value example "domain_condition")
      (doseq [[key actual] [["assignment_name" (get-in published [:assignment :name])]
                            ["domain_condition" (get-in published [:assignment :domainCondition])]
                            ["path_condition" (get-in published [:assignment :pathnameCondition])]
                            ["property_name" (first (:rulePaths published))]]]
        (assert-example! (= (example-value example key) actual) key example actual))

      (example-value example "existing_assignment")
      (doseq [[key actual] [["existing_assignment" (get-in incompatible [:assignments 0 :name])]
                            ["property_name" (first (:rulePaths incompatible))]
                            ["later_property" (second (:rulePaths incompatible))]
                            ["new_assignment" (get-in incompatible [:assignments 1 :name])]]]
        (assert-example! (= (example-value example key) actual) key example actual))

      (example-value example "covering_assignment_count")
      (doseq [[key actual] [["covering_assignment_count" (str (:beforeCount multiple))]
                            ["property_name" (first (:rulePaths multiple))]]]
        (assert-example! (= (example-value example key) actual) key example actual)))
    observation))

(defn- transition [world example _captures _spec]
  (let [observation (browser-observation!)]
    (validate-example! example observation)
    (assoc world :guided-assignment-coverage observation)))

(def handlers
  (support/semantic-handlers
   (support/feature-step-specs [feature-file] #{})
   transition))
