(ns acceptance.steps.guided-draft-continuation
  (:require [acceptance.steps.support :as support]))

(def feature-file "features/data-layer-guided-validation-draft-continuation.feature")
(defonce ^:private browser-observation (atom nil))
(def ^:private shared-background-step
  "captured event pageview is selected in the Live event inspector")

(def ^:private entry-steps
  #{"pageview has no working-draft continuation context"
    "Product listing has a working draft based on revision 3 with 2 pending changes"
    "Product listing is the selected working-draft continuation context"
    "Product listing targets payload and has 1 enabled assignment compatible with pageview"
    "Product listing has <compatible_assignment_count> compatible assignments for pageview"
    "Product listing and Checkout each have working drafts"})

(defn- load-observation! []
  (reset! browser-observation
          (support/load-browser-observation!
           {:adapter-env "GUIDED_DRAFT_CONTINUATION_BROWSER_ADAPTER"
            :observation-key :guidedDraftContinuation
            :runtime-error "Guided draft continuation browser runtime failed."
            :missing-error "Guided draft continuation browser observation is missing."})))

(defn- observation! [] (or @browser-observation (load-observation!)))

(def ^:private expected-initial
  {:createAvailable true :continuationAbsent true})

(def ^:private expected-interaction
  {:initial {:heading "Product listing working draft"
             :status "Current revision 3 · 2 pending changes"
             :actions ["Add property from this event" "Review draft" "Publish revision" "Use a different schema"]
             :sectionCount 1 :genericAbsent true}
   :opened {:context "Adding to Product listing draft"
            :stages ["Choose properties" "Define requirement" "Choose event scope" "Review validation"]}
   :requirement {:heading "Define requirement" :destinationAbsent true :selectedSchema "schema-product-listing"}
   :prefill {:target "payload" :targetSource "Product listing version 3"
             :source "event-history" :sourceSource "Product pages assignment"
             :domain "127.0.0.1" :domainSource "Product pages assignment"
             :eventName "pageview" :eventSource "Product pages assignment"
             :path "/" :pathSource "Product pages assignment" :editable true}
   :review {:name "Product listing" :status "Working draft based on revision 3 · 2 pending changes" :checkoutUnchanged true}
   :publication {:review "Product listing working draft will be compared with current revision 3; confirmation publishes revision 4."
                 :productCurrent 3 :checkoutUnchanged true}
   :switchOpen {:heading "Choose schema destination"
                :choices ["Product listing revision 3 · 2 pending changes" "Checkout revision 2 · 1 pending changes"]
                :productUnchanged true}
   :afterCancel {:context "Product listing working draft" :productUnchanged true}
   :afterSwitch {:context "Checkout working draft" :sectionCount 1 :unnamedAbsent true :productUnchanged true}
   :assignmentResolution {:none "Create a new assignment" :multiple "required from readable assignment choices"}})

(def ^:private expected-reload
  {:context "Checkout working draft" :heading "Define requirement" :destinationAbsent true})

(def ^:private assignment-expectations
  {"0" {:feature "create a pending assignment from event defaults"
        :path [:interaction :assignmentResolution :none]
        :runtime "Create a new assignment"}
   "2" {:feature "require a choice between readable assignments"
        :path [:interaction :assignmentResolution :multiple]
        :runtime "required from readable assignment choices"}})

(defn- assert-assignment-example! [example observation]
  (when-let [count (support/example-value example "compatible_assignment_count")]
    (let [{:keys [feature path runtime]} (get assignment-expectations count)]
      (support/assert! (= feature (support/example-value example "assignment_behavior"))
                       "Assignment-resolution example changed." {:example example})
      (support/assert! (= runtime (get-in observation path))
                       "Assignment-resolution behavior did not use the selected continuation schema."
                       {:example example :observed (get-in observation path)}))))

(defn- assert-draft-action-example! [example]
  (when-let [action (support/example-value example "draft_action")]
    (support/assert! (contains? #{"Review draft" "Publish revision"} action)
                     "Draft action example is not supported." {:example example})))

(defn- assert-examples! [example observation]
  (assert-assignment-example! example observation)
  (assert-draft-action-example! example))

(defn- assert-continuation! [example observation]
  (support/assert! (= expected-initial (:initial observation))
                   "Events without context did not retain generic creation." observation)
  (support/assert! (= expected-interaction (:interaction observation))
                   "The selected working draft was not continued through the rendered browser UI." observation)
  (support/assert! (= expected-reload (:reload observation))
                   "The selected continuation context did not survive reload." observation)
  (assert-examples! example observation))

(defn- with-continuation-observation [world text]
  (if (entry-steps text)
    (assoc world :guided-draft-continuation (observation!))
    world))

(defn- transition [world example _captures {:keys [text]}]
  (if (= shared-background-step text)
    world
    (let [world (with-continuation-observation world text)
          observation (:guided-draft-continuation world)]
      (support/assert! observation "Guided draft continuation browser adapter was not executed." {:step text})
      (assert-continuation! example observation)
      world)))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (= shared-background-step (:text spec))
                           (entry-steps (:text spec))
                           (:guided-draft-continuation world)))
           :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs [feature-file] #{})))
