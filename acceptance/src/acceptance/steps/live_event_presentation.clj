(ns acceptance.steps.live-event-presentation
  (:require [acceptance.steps.live-event-presentation-support :as presentation-support]
            [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-captured-event-presentation-pipeline.feature"
   "features/data-layer-observation-subscription-lifecycle.feature"])

(def step-specs
  (support/feature-step-specs
   feature-files
   #{"a repository for project <project_name>"}))

(defn- remember-context [world text example]
  (update world :presentation-context (fnil conj [])
          {:text text :example example}))

(defn- assert-observation! [world text example]
  (support/record-semantic-observation
   world :presentation-action :presentation-observations
   "presentation context" text example))

(defn- transition [world example captures {:keys [keyword text]}]
  (let [example (presentation-support/validate-example!
                 example
                 (support/capture-placeholder-keys captures))
        world (update world :presentation-history (fnil conj []) text)]
    (case keyword
      "Given" (remember-context world text example)
      "When" (assoc world :presentation-action {:text text :example example})
      "Then" (assert-observation! world text example)
      "And" (assert-observation! (remember-context world text example)
                                  text
                                  example))))

(def handlers
  (support/semantic-handlers step-specs transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T17:43:12.6719827+02:00", :module-hash "1730428470", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "2098510324"} {:id "def/feature-files", :kind "def", :line 5, :end-line nil, :hash "-415715610"} {:id "def/step-specs", :kind "def", :line 9, :end-line nil, :hash "-1034405787"} {:id "defn-/remember-context", :kind "defn-", :line 14, :end-line nil, :hash "2068918753"} {:id "defn-/assert-observation!", :kind "defn-", :line 18, :end-line nil, :hash "-1182859202"} {:id "defn-/transition", :kind "defn-", :line 23, :end-line nil, :hash "1634541834"} {:id "def/handlers", :kind "def", :line 36, :end-line nil, :hash "834366569"}]}
;; clj-mutate-manifest-end
