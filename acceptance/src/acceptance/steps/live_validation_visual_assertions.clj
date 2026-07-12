(ns acceptance.steps.live-validation-visual-assertions
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def event-id
  {"pageview" :valid
   "checkout" :warning
   "purchase" :error
   "consent" :neutral
   "refund" :assignment})

(def symbol-name
  {"check" "check"
   "warning" "warning"
   "error" "error"
   "neutral" "neutral"})

(def property-symbol
  {"✓" "check"
   "⚠" "warning"
   "!" "error"
   "○" "neutral"})

(defn- feed-example [_text example observation]
  (let [name (support/require-example example "event_name")
        expected-badge (support/require-example example "badge_text")
        expected-symbol (support/require-example example "status_symbol")
        expected-treatment (str/replace (support/require-example example "status_treatment") " " "-")
        row (get-in observation [:rows (event-id name)])]
    (support/assert! (= [(str "· " expected-badge) (symbol-name expected-symbol) expected-treatment]
                        [(:text row) (:symbol row) (:treatment row)])
                     "Live feed validation badge did not match its result."
                     {:example example :row row})))

(defn- property-example [_text example observation]
  (let [path (keyword (support/require-example example "property_path"))
        expected-status (support/require-example example "property_status")
        expected-symbol (support/require-example example "status_symbol")
        expected-treatment (support/require-example example "visual_treatment")
        row (get-in observation [:properties path])
        status-text (str (:status row))
        prefix (subs status-text 0 (min 1 (count status-text)))
        symbol (get property-symbol prefix "neutral")
        status (str/replace-first status-text #"^[✓⚠!○]\s+" "")]
    (support/assert! (= [expected-status expected-symbol expected-treatment]
                        [status symbol (:treatment row)])
                     "Live property validation status did not match its evaluations."
                     {:example example :row row})))

(defn- error-border [_text _example observation]
  (support/assert! (= "error" (get-in observation [:rows :error :treatment]))
                   "Error row treatment is missing." {:observation observation}))

(defn- accessible-name [_text _example observation]
  (support/assert! (str/includes? (get-in observation [:rows :error :name]) "2 errors and 1 warning")
                   "Feed accessible name omitted validation counts." {:observation observation}))

(defn- row-states [_text _example observation]
  (support/assert! (= {:selected "true" :focused true :eventNameVisible true :sourceVisible true}
                      (:rowStates observation))
                   "Feed interaction states obscured event metadata." {:observation observation}))

(defn- inspector-summary [_text _example observation]
  (support/assert! (= ["Validation failed, 2 errors, and 1 warning"
                       "Checkout schema version 4"
                       true
                       "Change schema"]
                      [(get-in observation [:inspector :summary])
                       (get-in observation [:inspector :schema])
                       (every? (set (get-in observation [:inspector :actions])) ["Show validation issues" "Revalidate"])
                       (get-in observation [:inspector :changeSchema])])
                   "Inspector validation summary, schema, or actions are incomplete." {:observation observation}))

(defn- issue-preview [_text _example observation]
  (support/assert! (= [true true true]
                      [(= (:pointerPreview observation) (:focusPreview observation))
                       (every? #(str/includes? (:pointerPreview observation) %)
                               ["Page type is invalid" "expected checkout" "actual legacy" "Known page types v2" "Checkout schema v4"])
                       (:escaped observation)])
                   "Pointer and keyboard issue previews diverged or omitted provenance." {:observation observation}))

(defn- activation [_text example observation]
  (support/assert! (every? #(= "true" %) (vals (:disclosures observation)))
                   "Property rule disclosure did not open for every activation input."
                   {:example example :observation observation}))

(defn- evaluation-states [_text _example observation]
  (support/assert! (every? #(str/includes? (:evaluationText observation) %) ["pass" "warning" "error"])
                   "Property disclosure omitted evaluation states." {:observation observation}))

(defn- automatic-validation [_text _example observation]
  (support/assert! (= ["error" "Validation failed, 2 errors, and 1 warning"]
                      [(get-in observation [:rows :error :treatment])
                       (get-in observation [:inspector :summary])])
                   "Automatic validation was not shared by feed and inspector." {:observation observation}))

(defn- revalidation [_text _example observation]
  (support/assert! (= {:inspector "Validation passed"
                       :feed "· Valid"
                       :status "Validation changed to Valid."
                       :live "polite"
                       :scroll 37
                       :focused true}
                      (:revalidation observation))
                   "Revalidation did not update in place while preserving operator context." {:observation observation}))

(defn- polite-status [_text _example observation]
  (support/assert! (= "polite" (get-in observation [:revalidation :live]))
                   "Background validation used an assertive announcement." {:observation observation}))

(defn- structured-properties [_text _example observation]
  (support/assert! (= ["Raw JSON" true true]
                      [(get-in observation [:inspector :rawJson])
                       (:unchanged observation)
                       (boolean (some #{"Properties"} (get-in observation [:inspector :presentation])))])
                   "Structured Properties or Raw JSON presentation is incomplete." {:observation observation}))

(defn- mixed-severity [_text _example observation]
  (support/assert! (= ["error" true true]
                      [(get-in observation [:properties :page_type :treatment])
                       (str/includes? (get-in observation [:properties :page_type :status]) "1 error and 1 warning")
                       (str/includes? (:evaluationText observation) "pass")])
                   "Mixed property evaluations lost severity or details." {:observation observation}))

(defn- aggregate [_text _example observation]
  (support/assert! (= ["1 error and 2 warnings" "neutral"]
                      [(get-in observation [:properties :commerce :aggregate])
                       (get-in observation [:properties :sibling :treatment])])
                   "Collapsed aggregate or unaffected sibling treatment is incorrect." {:observation observation}))

(defn- missing-property [_text _example observation]
  (support/assert! (= ["Missing" true]
                      [(get-in observation [:properties :order_id :missing])
                       (boolean (some #(str/includes? % "order_id: Required property") (:issueRows observation)))])
                   "Missing-property issue was not represented in both views." {:observation observation}))

(defn- issue-rows [_text _example observation]
  (support/assert! (= [true "live-property-page-type" true]
                      [(>= (count (:issueRows observation)) 8)
                       (:issueFocus observation)
                       (boolean (some #(str/starts-with? % "Event:") (:issueRows observation)))])
                   "Event-level issues omitted metadata, property focus, or root issues." {:observation observation}))

(defn- successful-evaluation [_text _example observation]
  (support/assert! (= ["pass" true]
                      [(get-in observation [:properties :currency :treatment])
                       (str/includes? (:evaluationText observation) "Checkout schema v4")])
                   "Successful evaluations did not retain rule and schema provenance." {:observation observation}))

(defn- default-assertion [text _example observation]
  (support/assert! observation "Live validation browser boundary was not exercised." {:step text}))

(defn- includes-any? [text fragments]
  (some #(str/includes? text %) fragments))

(def assertion-routes
  [[(fn [_text example] (support/example-value example "event_name")) feed-example]
   [(fn [_text example] (support/example-value example "property_path")) property-example]
   [(fn [text _example] (str/includes? text "error border or tint")) error-border]
   [(fn [text _example] (str/includes? text "accessible name")) accessible-name]
   [(fn [text _example] (includes-any? text ["selection, hover" "does not obscure"])) row-states]
   [(fn [text _example] (includes-any? text ["inspector summary" "assigned schema" "Show validation issues"])) inspector-summary]
   [(fn [text _example] (includes-any? text ["concise issue preview" "message, expected" "hoverable"])) issue-preview]
   [(fn [_text example] (support/example-value example "activation_input")) activation]
   [(fn [text _example] (includes-any? text ["all passing" "disclosure state"])) evaluation-states]
   [(fn [text _example] (includes-any? text ["validates automatically" "feed badge and property" "same validation result"])) automatic-validation]
   [(fn [text _example] (includes-any? text ["update without closing" "focus and inspector scroll" "polite visible status"])) revalidation]
   [(fn [text _example] (includes-any? text ["assertive announcements" "concise polite status"])) polite-status]
   [(fn [text _example] (includes-any? text ["structured Properties" "nested objects" "Raw JSON" "does not modify"])) structured-properties]
   [(fn [text _example] (includes-any? text ["highest visual severity" "separately visible" "passing rule remains"])) mixed-severity]
   [(fn [text _example] (includes-any? text ["aggregate badge" "affected descendant" "unaffected sibling"])) aggregate]
   [(fn [text _example] (includes-any? text ["synthetic order_id" "Missing, Required" "same issue appears"])) missing-property]
   [(fn [text _example] (includes-any? text ["every issue shows" "links to and focuses" "without a rendered property"])) issue-rows]
   [(fn [text _example] (includes-any? text ["successful evaluation" "ruled and passing"])) successful-evaluation]
   [(constantly true) default-assertion]])

(defn assert-step! [text example observation]
  (let [[_ assertion] (first (filter (fn [[predicate]] (predicate text example)) assertion-routes))]
    (assertion text example observation)))
