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
  {:context "Checkout working draft" :heading "Define requirement" :destinationAbsent true
   :expectedTypeSource "String — Checkout version 2"})

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

(def ^:private draft-action-destinations
  {"Review draft" "the Product listing working draft"
   "Publish revision" "Product listing publication review"})

(defn- assert-draft-action-example! [example]
  (when-let [action (support/example-value example "draft_action")]
    (support/assert! (= (get draft-action-destinations action)
                        (support/example-value example "destination"))
                     "Draft action example is not supported or opens the wrong destination."
                     {:example example})))

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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T00:33:51.012995037+02:00", :module-hash "1435114515", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "241111063"} {:id "def/feature-file", :kind "def", :line 4, :end-line nil, :hash "-1545669257"} {:id "form/2/defonce", :kind "defonce", :line 5, :end-line nil, :hash "-1618529344"} {:id "def/shared-background-step", :kind "def", :line 6, :end-line nil, :hash "1986657026"} {:id "def/entry-steps", :kind "def", :line 9, :end-line nil, :hash "-1650975376"} {:id "defn-/load-observation!", :kind "defn-", :line 17, :end-line nil, :hash "72309010"} {:id "defn-/observation!", :kind "defn-", :line 25, :end-line nil, :hash "204904339"} {:id "def/expected-initial", :kind "def", :line 27, :end-line nil, :hash "-1682895987"} {:id "def/expected-interaction", :kind "def", :line 30, :end-line nil, :hash "21044473"} {:id "def/expected-reload", :kind "def", :line 53, :end-line nil, :hash "-1404082605"} {:id "def/assignment-expectations", :kind "def", :line 57, :end-line nil, :hash "-1733513909"} {:id "defn-/assert-assignment-example!", :kind "defn-", :line 65, :end-line nil, :hash "-733580272"} {:id "def/draft-action-destinations", :kind "def", :line 74, :end-line nil, :hash "1792898830"} {:id "defn-/assert-draft-action-example!", :kind "defn-", :line 78, :end-line nil, :hash "1055408457"} {:id "defn-/assert-examples!", :kind "defn-", :line 85, :end-line nil, :hash "-2104905303"} {:id "defn-/assert-continuation!", :kind "defn-", :line 89, :end-line nil, :hash "-887790840"} {:id "defn-/with-continuation-observation", :kind "defn-", :line 98, :end-line nil, :hash "637410409"} {:id "defn-/transition", :kind "defn-", :line 103, :end-line nil, :hash "-1420103422"} {:id "def/handlers", :kind "def", :line 112, :end-line nil, :hash "-1754947269"}]}
;; clj-mutate-manifest-end
