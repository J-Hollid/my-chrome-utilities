(ns acceptance.steps.guided-assignment-coverage
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-file "features/data-layer-guided-assignment-coverage-runtime.feature")
(defonce browser-observation (atom nil))

(defn- observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "GUIDED_ASSIGNMENT_COVERAGE_BROWSER_ADAPTER"
    :observation-key :guidedAssignmentCoverage
    :runtime-error "Guided assignment coverage browser runtime failed."
    :missing-error "Guided assignment coverage browser evidence is missing."}))

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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T14:37:42.706982902+02:00", :module-hash "1400938863", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "813440774"} {:id "def/feature-file", :kind "def", :line 5, :end-line 5, :hash "548524383"} {:id "form/2/defonce", :kind "defonce", :line 6, :end-line 6, :hash "-1618529344"} {:id "defn-/observation!", :kind "defn-", :line 8, :end-line 14, :hash "-92125886"} {:id "defn-/require-observation!", :kind "defn-", :line 16, :end-line 17, :hash "-619313877"} {:id "defn/validate-browser-observation!", :kind "defn", :line 19, :end-line 59, :hash "325368015"} {:id "defn/browser-observation!", :kind "defn", :line 61, :end-line 62, :hash "-1900744807"} {:id "defn-/example-value", :kind "defn-", :line 64, :end-line 65, :hash "369719940"} {:id "defn-/assert-example!", :kind "defn-", :line 67, :end-line 70, :hash "-793654877"} {:id "defn/validate-example!", :kind "defn", :line 72, :end-line 105, :hash "-1430073915"} {:id "defn-/transition", :kind "defn-", :line 107, :end-line 110, :hash "1573289377"} {:id "def/handlers", :kind "def", :line 112, :end-line 115, :hash "1551695576"}]}
;; clj-mutate-manifest-end
