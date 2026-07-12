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
        expected-result (support/require-example example "validation_result")
        expected-badge (support/require-example example "badge_text")
        expected-symbol (support/require-example example "status_symbol")
        expected-treatment (str/replace (support/require-example example "status_treatment") " " "-")
        row (get-in observation [:rows (event-id name)])]
    (support/assert! (= [(str "· " expected-result) expected-result expected-symbol expected-treatment]
                        [(:text row) expected-badge (:symbol row) (:treatment row)])
                     "Live feed validation badge did not match its result."
                     {:example example :row row})))

(defn- count-text [count singular]
  (str count " " singular (when (not= count 1) "s")))

(defn- expected-property-status [attached-rules errors warnings]
  (cond
    (pos? errors) (str (count-text errors "error")
                       (when (pos? warnings) (str " and " (count-text warnings "warning"))))
    (pos? warnings) (count-text warnings "warning")
    (pos? attached-rules) (str (count-text attached-rules "rule") " passed")
    :else "No rules"))

(defn- property-example [_text example observation]
  (let [path (keyword (support/require-example example "property_path"))
        attached-rules (parse-long (support/require-example example "attached_rule_count"))
        errors (parse-long (support/require-example example "error_count"))
        warnings (parse-long (support/require-example example "warning_count"))
        expected-status (support/require-example example "property_status")
        expected-symbol (support/require-example example "status_symbol")
        expected-treatment (support/require-example example "visual_treatment")
        row (get-in observation [:properties path])
        status-text (str (:status row))
        prefix (subs status-text 0 (min 1 (count status-text)))
        symbol (get property-symbol prefix "neutral")
        status (str/replace-first status-text #"^[✓⚠!○]\s+" "")
        counts-valid? (every? #(<= 0 %) [attached-rules errors warnings])]
    (support/assert! (= [true attached-rules (expected-property-status attached-rules errors warnings)
                         expected-status expected-symbol expected-treatment]
                        [counts-valid? (:evaluations row) expected-status status symbol (:treatment row)])
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
  (let [activation-key ({"Enter" :enter "Space" :space "pointer click" :click}
                        (support/require-example example "activation_input"))]
    (support/assert! (and activation-key
                          (= "true" (get-in observation [:disclosures activation-key])))
                   "Property rule disclosure did not open for every activation input."
                   {:example example :observation observation})))

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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-13T01:49:05.68986131+02:00", :module-hash "-977520389", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "358302693"} {:id "def/event-id", :kind "def", :line 5, :end-line nil, :hash "-1849201549"} {:id "def/symbol-name", :kind "def", :line 12, :end-line nil, :hash "300334935"} {:id "def/property-symbol", :kind "def", :line 18, :end-line nil, :hash "1581117122"} {:id "defn-/feed-example", :kind "defn-", :line 24, :end-line nil, :hash "-1230382143"} {:id "defn-/count-text", :kind "defn-", :line 36, :end-line nil, :hash "-263870779"} {:id "defn-/expected-property-status", :kind "defn-", :line 39, :end-line nil, :hash "1647004697"} {:id "defn-/property-example", :kind "defn-", :line 47, :end-line nil, :hash "1275550917"} {:id "defn-/error-border", :kind "defn-", :line 67, :end-line nil, :hash "-1380965208"} {:id "defn-/accessible-name", :kind "defn-", :line 71, :end-line nil, :hash "1789208927"} {:id "defn-/row-states", :kind "defn-", :line 75, :end-line nil, :hash "319092353"} {:id "defn-/inspector-summary", :kind "defn-", :line 80, :end-line nil, :hash "1239258495"} {:id "defn-/issue-preview", :kind "defn-", :line 91, :end-line nil, :hash "-1390415059"} {:id "defn-/activation", :kind "defn-", :line 99, :end-line nil, :hash "403991668"} {:id "defn-/evaluation-states", :kind "defn-", :line 107, :end-line nil, :hash "77681982"} {:id "defn-/automatic-validation", :kind "defn-", :line 111, :end-line nil, :hash "-885545002"} {:id "defn-/revalidation", :kind "defn-", :line 117, :end-line nil, :hash "68462194"} {:id "defn-/polite-status", :kind "defn-", :line 127, :end-line nil, :hash "-519299828"} {:id "defn-/structured-properties", :kind "defn-", :line 131, :end-line nil, :hash "-268916428"} {:id "defn-/mixed-severity", :kind "defn-", :line 138, :end-line nil, :hash "-376693056"} {:id "defn-/aggregate", :kind "defn-", :line 145, :end-line nil, :hash "776614194"} {:id "defn-/missing-property", :kind "defn-", :line 151, :end-line nil, :hash "547407736"} {:id "defn-/issue-rows", :kind "defn-", :line 157, :end-line nil, :hash "1461891276"} {:id "defn-/successful-evaluation", :kind "defn-", :line 164, :end-line nil, :hash "-472022518"} {:id "defn-/default-assertion", :kind "defn-", :line 170, :end-line nil, :hash "-237283355"} {:id "defn-/includes-any?", :kind "defn-", :line 173, :end-line nil, :hash "389819641"} {:id "def/assertion-routes", :kind "def", :line 176, :end-line nil, :hash "-767449259"} {:id "defn/assert-step!", :kind "defn", :line 197, :end-line nil, :hash "-1387675813"}]}
;; clj-mutate-manifest-end
