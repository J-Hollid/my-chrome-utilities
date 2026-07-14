(ns acceptance.steps.guided-rule-parameter-integrity
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-guided-rule-parameter-integrity.feature"
   "features/data-layer-guided-rule-parameter-integrity-runtime.feature"])

(def ^:private entry-modes
  {"schema Otelo - Generic Pageview revision 1 contains property /login_status" :model
   "the built extension side panel is running with production guided validation, Schema Library persistence, and schema validation" :runtime})

(defonce ^:private model-verified? (atom false))
(defonce ^:private browser-observation (atom nil))

(defn- verify-model! []
  (when-not @model-verified?
    (let [result (process/shell support/build-shell-options
                                "node" "test/data-layer-guided-rule-parameter-integrity-test.mjs")]
      (support/assert! (zero? (:exit result))
                       (str "Guided rule parameter integrity verification failed: " (:err result))
                       {:out (:out result) :err (:err result)})
      (reset! model-verified? true))))

(defn- load-browser-observation! []
  (let [result (process/shell (assoc support/build-shell-options
                                     :env (merge (into {} (System/getenv))
                                                 {"GUIDED_VALIDATION_BROWSER_ADAPTER" "1"}))
                              "node" "test/side-panel-component-layout-runtime-test.mjs")
        line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
        payload (when line (json/parse-string line true))
        observation (:guidedValidation payload)]
    (support/assert! (zero? (:exit result))
                     (str "Guided rule browser runtime verification failed: " (:err result))
                     {:out (:out result) :err (:err result)})
    (support/assert! observation "Guided rule browser observation is missing." {:payload payload})
    (reset! browser-observation observation)))

(defn- browser-observation! []
  (or @browser-observation (load-browser-observation!)))

(defn- assert-runtime-boundary! [observation]
  (let [attachment (get-in observation [:saved :attachedRule])
        published-attachment (get-in observation [:published :attachedRule])
        reusable (get-in observation [:published :reusableRule])]
    (support/assert! (= ["/page_type" "allowed-values" "product_list,homepage"]
                        (mapv attachment [:propertyPath :operator :parameters]))
                     "Rendered guided save did not persist canonical operator parameters."
                     {:attachment attachment})
    (support/assert! (not (str/includes? (:parameters attachment) (:propertyPath attachment)))
                     "Rendered guided save duplicated its property path in operator parameters."
                     {:attachment attachment})
    (support/assert! (= (:parameters published-attachment) (:parameters reusable))
                     "Reusable rule and schema attachment diverged at the browser persistence boundary."
                     {:attachment published-attachment :reusable reusable})))

(defn- transition [world _example _captures {:keys [text]}]
  (let [mode (or (get entry-modes text) (:guided-rule-parameter-integrity-mode world))]
    (support/assert! mode "Guided rule parameter integrity scenario did not establish its mode." {:step text})
    (verify-model!)
    (when (= mode :runtime) (assert-runtime-boundary! (browser-observation!)))
    (assoc world :guided-rule-parameter-integrity-mode mode)))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (contains? entry-modes (:text spec))
                           (:guided-rule-parameter-integrity-mode world)))
           :handler (fn [world example captures]
                      (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))
