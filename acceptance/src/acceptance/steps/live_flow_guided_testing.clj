(ns acceptance.steps.live-flow-guided-testing
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]))

(def feature-files
  ["features/data-layer-live-flow-guided-testing.feature"
   "features/data-layer-live-flow-guided-testing-runtime.feature"])
(def entry-modes
  {"Retail website is the active project" :model
   "the installed extension has active project Retail website" :runtime})
(defonce model-verified? (atom false))
(defonce browser-verified? (atom false))

(defn- checked! [message & command]
  (let [result (apply process/shell {:out :string :err :string} command)]
    (support/assert! (zero? (:exit result)) (str message " " (:err result)) {:out (:out result)})
    result))

(defn- verify-command-once! [verified? message path]
  (when-not @verified?
    (checked! message "node" path)
    (reset! verified? true))
  @verified?)

(defn- verify-model! []
  (verify-command-once! model-verified?
                        "Live Flow testing model verification failed."
                        "test/data-layer-live-flow-testing-test.mjs"))

(defn- observe-browser! []
  (verify-command-once! browser-verified?
                        "Live Flow testing browser adapter failed."
                        "test/browser-packs/live-flow-testing.mjs"))

(def outline-example-rows
  #{{"relationship_kind" "expected_next"
     "next_step" "Payment Page frame"
     "label_state" "no label"
     "display_name" "Cart to Payment"}
    {"relationship_kind" "alternative"
     "next_step" "Cart PayPal Event occurrence"
     "label_state" "label PayPal route"
     "display_name" "PayPal route"}
    {"relationship_kind" "merge"
     "next_step" "Confirmation Page frame"
     "label_state" "no label"
     "display_name" "Cart to Confirmation"}
    {"flow_step" "Payment Page frame"
     "effective_schema" "its Shared Profiles, ordered Page Groups, Page, and Flow Page-instance contribution"}
    {"flow_step" "Payment add_payment_info occurrence"
     "effective_schema" "its Page-instance branch, Event branch, and Event-occurrence contribution"}
    {"capture_order" "before"}
    {"capture_order" "after"}})

(defn validate-example! [_mode example]
  (if (seq example)
    (let [normalized (into {} (map (fn [[key value]] [(name key) value]) example))]
      (support/assert! (contains? outline-example-rows normalized)
                       "Live Flow Scenario Outline example is not an authoritative contract row."
                       {:example normalized})
      normalized)
    example))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :live-flow-guided-testing-mode
   verify-model! validate-example!
   observe-browser!
   (fn [verified?]
     (support/assert! verified? "Installed Live Flow testing evidence is missing." {}))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-23T13:25:45.713945795+02:00", :module-hash "497231150", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "11037756"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "1623245481"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 10, :hash "993004909"} {:id "form/3/defonce", :kind "defonce", :line 11, :end-line 11, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 12, :end-line 12, :hash "-886002261"} {:id "defn-/checked!", :kind "defn-", :line 14, :end-line 17, :hash "938963528"} {:id "defn-/verify-command-once!", :kind "defn-", :line 19, :end-line 23, :hash "1589887869"} {:id "defn-/verify-model!", :kind "defn-", :line 25, :end-line 28, :hash "881042007"} {:id "defn-/observe-browser!", :kind "defn-", :line 30, :end-line 33, :hash "348126052"} {:id "def/handlers", :kind "def", :line 35, :end-line 41, :hash "-551639260"}]}
;; clj-mutate-manifest-end
