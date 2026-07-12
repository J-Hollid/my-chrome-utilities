(ns acceptance.steps.live-validation-visuals
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-live-validation-feed-presentation.feature"
   "features/data-layer-live-validation-interaction.feature"
   "features/data-layer-live-validation-property-presentation.feature"])

(defonce ^:private browser-observation (atom nil))

(defn- load-browser-observation! []
  (let [result (process/shell (assoc support/build-shell-options :env {"LIVE_VALIDATION_VISUALS_BROWSER_ADAPTER" "1"})
                              "node" "test/side-panel-component-layout-runtime-test.mjs")
        line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
        payload (when line (json/parse-string line true))
        observation (:liveValidationVisuals payload)]
    (support/assert! (zero? (:exit result)) "Live validation visuals browser runtime failed." {:out (:out result) :err (:err result)})
    (support/assert! observation "Live validation visuals browser observation is missing." {:payload payload})
    (reset! browser-observation observation)))

(defn- observation! []
  (or @browser-observation (load-browser-observation!)))

(def event-id {"pageview" :valid "checkout" :warning "purchase" :error "consent" :neutral "refund" :assignment})
(def symbol-name {"check" "check" "warning" "warning" "error" "error" "neutral" "neutral"})

(defn- assert-feed-example! [example observation]
  (let [name (support/require-example example "event_name")
        expected-badge (support/require-example example "badge_text")
        expected-symbol (support/require-example example "status_symbol")
        expected-treatment (str/replace (support/require-example example "status_treatment") " " "-")
        row (get-in observation [:rows (event-id name)])]
    (support/assert! (= [(str "· " expected-badge) (symbol-name expected-symbol) expected-treatment]
                        [(:text row) (:symbol row) (:treatment row)])
                     "Live feed validation badge did not match its result."
                     {:example example :row row})))

(defn- assert-property-example! [example observation]
  (let [path (keyword (support/require-example example "property_path"))
        expected-status (support/require-example example "property_status")
        expected-symbol (support/require-example example "status_symbol")
        expected-treatment (support/require-example example "visual_treatment")
        row (get-in observation [:properties path])
        symbol (cond (str/starts-with? (:status row) "✓") "check" (str/starts-with? (:status row) "⚠") "warning" (str/starts-with? (:status row) "!") "error" :else "neutral")
        status (str/replace-first (:status row) #"^[✓⚠!○]\s+" "")]
    (support/assert! (= [expected-status expected-symbol expected-treatment]
                        [status symbol (:treatment row)])
                     "Live property validation status did not match its evaluations."
                     {:example example :row row})))

(defn- assert-step! [text example observation]
  (cond
    (support/example-value example "event_name") (assert-feed-example! example observation)
    (support/example-value example "property_path") (assert-property-example! example observation)
    (str/includes? text "error border or tint") (support/assert! (= "error" (get-in observation [:rows :error :treatment])) "Error row treatment is missing." {:observation observation})
    (str/includes? text "accessible name") (support/assert! (str/includes? (get-in observation [:rows :error :name]) "2 errors and 1 warning") "Feed accessible name omitted validation counts." {:observation observation})
    (or (str/includes? text "selection, hover") (str/includes? text "does not obscure")) (support/assert! (= {:selected "true" :focused true :eventNameVisible true :sourceVisible true} (:rowStates observation)) "Feed interaction states obscured event metadata." {:observation observation})
    (or (str/includes? text "inspector summary") (str/includes? text "assigned schema") (str/includes? text "Show validation issues"))
    (support/assert! (and (= "Validation failed, 2 errors, and 1 warning" (get-in observation [:inspector :summary]))
                          (= "Checkout schema version 4" (get-in observation [:inspector :schema]))
                          (every? (set (get-in observation [:inspector :actions])) ["Show validation issues" "Revalidate"])
                          (= "Change schema" (get-in observation [:inspector :changeSchema])))
                     "Inspector validation summary, schema, or actions are incomplete." {:observation observation})
    (or (str/includes? text "concise issue preview") (str/includes? text "message, expected") (str/includes? text "hoverable"))
    (support/assert! (and (= (:pointerPreview observation) (:focusPreview observation))
                          (every? #(str/includes? (:pointerPreview observation) %) ["Page type is invalid" "expected checkout" "actual legacy" "Known page types v2" "Checkout schema v4"])
                          (:escaped observation))
                     "Pointer and keyboard issue previews diverged or omitted provenance." {:observation observation})
    (support/example-value example "activation_input") (support/assert! (every? #(= "true" %) (vals (:disclosures observation))) "Property rule disclosure did not open for every activation input." {:example example :observation observation})
    (or (str/includes? text "all passing") (str/includes? text "disclosure state")) (support/assert! (every? #(str/includes? (:evaluationText observation) %) ["pass" "warning" "error"]) "Property disclosure omitted evaluation states." {:observation observation})
    (or (str/includes? text "validates automatically") (str/includes? text "feed badge and property") (str/includes? text "same validation result")) (support/assert! (= ["error" "Validation failed, 2 errors, and 1 warning"] [(get-in observation [:rows :error :treatment]) (get-in observation [:inspector :summary])]) "Automatic validation was not shared by feed and inspector." {:observation observation})
    (or (str/includes? text "update without closing") (str/includes? text "focus and inspector scroll") (str/includes? text "polite visible status")) (support/assert! (= {:inspector "Validation passed" :feed "· Valid" :status "Validation changed to Valid." :live "polite" :scroll 37 :focused true} (:revalidation observation)) "Revalidation did not update in place while preserving operator context." {:observation observation})
    (or (str/includes? text "assertive announcements") (str/includes? text "concise polite status")) (support/assert! (= "polite" (get-in observation [:revalidation :live])) "Background validation used an assertive announcement." {:observation observation})
    (or (str/includes? text "structured Properties") (str/includes? text "nested objects") (str/includes? text "Raw JSON") (str/includes? text "does not modify")) (support/assert! (and (= "Raw JSON" (get-in observation [:inspector :rawJson])) (:unchanged observation) (some #{"Properties"} (get-in observation [:inspector :presentation]))) "Structured Properties or Raw JSON presentation is incomplete." {:observation observation})
    (or (str/includes? text "highest visual severity") (str/includes? text "separately visible") (str/includes? text "passing rule remains")) (support/assert! (and (= "error" (get-in observation [:properties :page_type :treatment])) (str/includes? (get-in observation [:properties :page_type :status]) "1 error and 1 warning") (str/includes? (:evaluationText observation) "pass")) "Mixed property evaluations lost severity or details." {:observation observation})
    (or (str/includes? text "aggregate badge") (str/includes? text "affected descendant") (str/includes? text "unaffected sibling")) (support/assert! (= ["1 error and 2 warnings" "neutral"] [(get-in observation [:properties :commerce :aggregate]) (get-in observation [:properties :sibling :treatment])]) "Collapsed aggregate or unaffected sibling treatment is incorrect." {:observation observation})
    (or (str/includes? text "synthetic order_id") (str/includes? text "Missing, Required") (str/includes? text "same issue appears")) (support/assert! (and (= "Missing" (get-in observation [:properties :order_id :missing])) (some #(str/includes? % "order_id: Required property") (:issueRows observation))) "Missing-property issue was not represented in both views." {:observation observation})
    (or (str/includes? text "every issue shows") (str/includes? text "links to and focuses") (str/includes? text "without a rendered property")) (support/assert! (and (>= (count (:issueRows observation)) 8) (= "live-property-page-type" (:issueFocus observation)) (some #(str/starts-with? % "Event:") (:issueRows observation))) "Event-level issues omitted metadata, property focus, or root issues." {:observation observation})
    (or (str/includes? text "successful evaluation") (str/includes? text "ruled and passing")) (support/assert! (and (= "pass" (get-in observation [:properties :currency :treatment])) (str/includes? (:evaluationText observation) "Checkout schema v4")) "Successful evaluations did not retain rule and schema provenance." {:observation observation})
    :else (support/assert! observation "Live validation browser boundary was not exercised." {:step text})))

(defn- transition [world example _captures {:keys [text]}]
  (let [observation (observation!)]
    (assert-step! text example observation)
    (assoc world :live-validation-visuals observation)))

(def handlers
  (mapv (fn [spec] {:pattern (support/template-pattern (:text spec))
                    :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))
