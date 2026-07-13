(ns acceptance.steps.event-feed-query
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-event-feed-query-builder.feature"])
(defonce ^:private observation (atom nil))

(defn- load-observation! []
  (let [result (process/shell support/build-shell-options "node" "test/data-layer-event-feed-query-ui-test.mjs")
        line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
        parsed (:eventFeedQuery (when line (json/parse-string line true)))]
    (support/assert! (zero? (:exit result)) "The production event-feed query UI failed." {:err (:err result)})
    (support/assert! parsed "The event-feed query observation is missing." {:out (:out result)})
    (reset! observation parsed)))

(defn- observation! [] (or @observation (load-observation!)))

(defn- assert-example! [example observed]
  (when-let [field (:field example)]
    (let [match (some #(when (and (= field (:field %)) (= (:operator example) (:operator %)) (= (:value example) (:value %))) %) (:matchingCases observed))]
      (support/assert! match "The query example was not exercised through production filtering." {:example example})
      (support/assert! (= ["purchase"] (:matches match)) "The query example retained a nonmatching event." match)
      (support/assert! (= (:summary example) (:summary match)) "The active-condition summary differs." match)))
  (when-let [outcome (:outcome example)]
    (let [match (some #(when (= outcome (:operator %)) %) (:ruleOutcomes observed))
          expected (get {"failed" ["failed"]
                         "warned" ["warned"]
                         "passed" ["passed"]
                         "was evaluated" ["failed" "warned" "passed"]
                         "was not evaluated" ["absent"]} outcome)]
      (support/assert! match "The validation-rule outcome was not exercised." {:outcome outcome})
      (support/assert! (= expected (:matches match)) "The validation-rule outcome retained an event outside its criterion." match))))

(defn- assert-observation! [example observed]
  (assert-example! example observed)
  (doseq [field ["Event name" "Source" "Adapter kind" "Pathname" "Payload · currency" "Validation state" "Schema" "Validation rule" "Rule severity" "Affected property"]]
    (support/assert! (some #{field} (:fieldOptions observed)) "A required query field is absent." {:field field}))
  (support/assert! (= ["event-feed-query-field" "event-feed-query-operator" "event-feed-query-value" "Apply condition" "Cancel"] (:controlOrder observed)) "Condition controls are not in keyboard order." observed)
  (support/assert! (= ["is" "is not" "contains" "does not contain"] (:operatorOptions observed)) "Text operators are incomplete." observed)
  (support/assert! (= ["checkout" "purchase"] (:suggestedNames observed)) "Captured event-name suggestions are not distinct and searchable." observed)
  (doseq [[field expected] {"Source" ["Adobe beacons" "Event history"]
                            "Adapter kind" ["Adobe" "Data layer"]
                            "Pathname" ["/checkout" "/products"]
                            "Payload · currency" ["EUR" "GBP"]
                            "Schema" ["Purchase event"]
                            "Validation rule" ["Page type allowed values"]
                            "Rule severity" ["error" "warning"]
                            "Affected property" ["currency" "page_type"]}]
    (support/assert! (= expected (get (:suggestionsByField observed) (keyword field))) "A query field did not expose distinct captured suggestions." {:field field :observed observed}))
  (support/assert! (true? (:incompleteDisabled observed)) "An incomplete condition could be applied." observed)
  (support/assert! (true? (:legacyFilterAbsent observed)) "The standalone validation filter remains." observed)
  (support/assert! (= {:preventScroll true} (:focusOnOpen observed)) "Opening the editor did not move focus without scrolling." observed)
  (support/assert! (= "1 of 2 events" (:appliedCount observed)) "Applied count does not cover the complete session." observed)
  (support/assert! (= "Remove filter Event name is purchase" (:removeName observed)) "The active condition lacks an accessible remove action." observed)
  (support/assert! (= {:preventScroll true} (:removeFocus observed)) "Removing a condition did not return focus to Add filter." observed)
  (support/assert! (= "0 of 2 events" (:zeroCount observed)) "The zero-match count is incorrect." observed)
  (support/assert! (= "No events match the active filters." (:zeroMessage observed)) "The filtered empty state is incorrect." observed)
  (support/assert! (= ["purchase" "checkout"] (:multiMatches observed)) "Values within a condition were not OR-matched." observed)
  (support/assert! (= ["purchase"] (:multiAndMatches observed)) "Conditions were not AND-matched." observed)
  (support/assert! (= ["purchase" "new-match"] (:liveMatches observed)) "New captures did not reuse the active query." observed)
  (support/assert! (= 1 (count (get-in observed [:preservedQuery :conditions]))) "Inspector navigation lost the active query." observed)
  (support/assert! (= {:eventId "purchase" :scrollTop 480} (:returnSnapshot observed)) "Inspector navigation lost feed scroll." observed))

(defn- transition [world example _captures _spec]
  (let [observed (observation!)] (assert-observation! example observed) (assoc world :event-feed-query observed)))

(def handlers
  (support/semantic-handlers (support/feature-step-specs feature-files #{}) transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-13T16:17:46.8249262+02:00", :module-hash "1542119108", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1354257905"} {:id "def/feature-files", :kind "def", :line 7, :end-line nil, :hash "768548319"} {:id "form/2/defonce", :kind "defonce", :line 8, :end-line nil, :hash "-1819867165"} {:id "defn-/load-observation!", :kind "defn-", :line 10, :end-line nil, :hash "168076834"} {:id "defn-/observation!", :kind "defn-", :line 18, :end-line nil, :hash "-775394783"} {:id "defn-/assert-example!", :kind "defn-", :line 20, :end-line nil, :hash "-289796773"} {:id "defn-/assert-observation!", :kind "defn-", :line 36, :end-line nil, :hash "1617644257"} {:id "defn-/transition", :kind "defn-", :line 66, :end-line nil, :hash "-1692133953"} {:id "def/handlers", :kind "def", :line 69, :end-line nil, :hash "857296873"}]}
;; clj-mutate-manifest-end
