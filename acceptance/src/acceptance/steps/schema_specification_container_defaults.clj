(ns acceptance.steps.schema-specification-container-defaults
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-schema-specification-container-defaults.feature"
   "features/data-layer-schema-specification-container-defaults-runtime.feature"])

(def entry-modes
  {"Generic pageview declares commerce as Object, products as Array of Object, and products[].attributes as Object" :model
   "the built extension side panel is running with the production specification builder" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Specification container defaults model verification failed. "
   "npm" "run" "test:unit:schema-specification-container-defaults"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_SPECIFICATION_CONTAINER_DEFAULTS_BROWSER_ADAPTER"
    :observation-key :schemaSpecificationContainerDefaults
    :runtime-error "Specification container defaults browser runtime failed."
    :missing-error "Specification container defaults browser evidence is missing."}))

(defn- assert-runtime! [{:keys [initial inheritedContainer excluded afterContainer afterDescendant retained workingDraft reset cleared selected unchanged runtimeErrors] :as observed}]
  (support/assert!
   (and (:all initial)
        (:unique initial)
        (not-any? #(.endsWith ^String % "/*") (:available initial))
        (= (:paths initial) (:available initial))
        (every? (set (:available initial)) ["/products" "/products/*/duration" "/site_id" "/context"])
        (:checked inheritedContainer)
        (:descendant inheritedContainer)
        (re-find #"inherited.*container" (:label inheritedContainer))
        (= {:initial true :workingDraft true :historical true} excluded)
        (false? (:container afterContainer))
        (:descendant afterContainer)
        (not (some #{"/products"} (:paths afterContainer)))
        (some #{"/products/*/duration"} (:paths afterContainer))
        (= {:container false :descendant false} afterDescendant)
        (= {:products false :duration false} retained)
        (:all workingDraft)
        (every? (set (:available workingDraft)) ["/draft_only" "/context"])
        (= (set (:paths workingDraft)) (set (:available workingDraft)))
        (:all reset)
        (some #{"/context"} (:available reset))
        (= (set (:paths reset)) (set (:available reset)))
        (= {:checked 0 :rows 0} cleared)
        (:all selected)
        (= (:rows selected) (:controls selected))
        unchanged
        (empty? runtimeErrors))
   "Production container defaults, independent toggles, reset, or bulk selection were incorrect."
   observed)
  observed)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-specification-container-defaults-mode
   verify-model! (fn [_ _] true) runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T13:59:27.716577987+02:00", :module-hash "1075397449", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "518675952"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-196197508"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 10, :hash "-514044435"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 13, :end-line 13, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 15, :end-line 19, :hash "175118376"} {:id "defn-/runtime-observation!", :kind "defn-", :line 21, :end-line 27, :hash "1792381819"} {:id "defn-/assert-runtime!", :kind "defn-", :line 29, :end-line 59, :hash "2138545824"} {:id "def/handlers", :kind "def", :line 61, :end-line 64, :hash "-640643909"}]}
;; clj-mutate-manifest-end
