(ns acceptance.steps.allowed-values-rule-migration
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-allowed-values-rule-migration.feature"
   "features/data-layer-allowed-values-rule-migration-runtime.feature"])

(def entry-modes
  {"Generic pageview revision 4 declares String error_type, Number quantity, and Boolean enabled properties" :model
   "the built extension side panel is running with production schema storage, rule authoring, validation, and specification building" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Allowed values rule migration model verification failed. "
   "npm" "run" "test:unit:allowed-values-rule-migration"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "ALLOWED_VALUES_RULE_MIGRATION_BROWSER_ADAPTER"
    :observation-key :allowedValuesRuleMigration
    :runtime-error "Allowed values rule migration browser runtime failed."
    :missing-error "Allowed values rule migration browser evidence is missing."}))

(defn- assert-runtime! [{:keys [current historical draft reusable allowedCell coverage idempotent runtimeErrors] :as observed}]
  (support/assert!
   (and (= ["technical" "validation" "authentication" "login" "notification"] (:allowedValues current))
        (nil? (:parameters current))
        (= [1 2] (:allowedValues historical))
        (= [true false] (:allowedValues draft))
        (= [1 2] (:allowedValues reusable))
        (str/includes? allowedCell "technical | validation | authentication | login | notification")
        (zero? (get-in coverage [:validation :valid]))
        (seq (get-in coverage [:validation :invalid]))
        (= [1 2] (get-in coverage [:authoring :picker :allowedValues]))
        (= [true false] (get-in coverage [:authoring :guided :allowedValues]))
        (= ["red" "blue"] (get-in coverage [:authoring :authored :allowedValues]))
        (= ["parent" "child"] (get-in coverage [:inheritance :values]))
        (seq (get-in coverage [:inheritance :invalid]))
        (str/includes? (get-in coverage [:invalidMigration :unsafe :migrationIssue]) "not-a-number")
        (= ["kept"] (get-in coverage [:invalidMigration :canonical :allowedValues]))
        (str/includes? (get-in coverage [:copyImport :plain]) "technical | validation | authentication | login | notification")
        (= (:allowedValues current) (get-in coverage [:copyImport :imported :allowedValues]))
        idempotent
        (empty? runtimeErrors))
   "Production migration consumers did not use canonical typed Allowed values."
   observed)
  observed)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :allowed-values-rule-migration-mode
   verify-model! (fn [_ _] true) runtime-observation! assert-runtime!))
