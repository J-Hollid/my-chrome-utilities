(ns acceptance.steps.schema-specification-preview-layout
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/data-layer-schema-specification-preview-layout.feature" "features/data-layer-schema-specification-preview-layout-runtime.feature"])
(def entry-modes {"the specification builder is open with selected properties across all seven preview columns" :model "the built extension side panel is running with the production specification builder and stylesheet" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified? "Specification preview layout model verification failed. "
   "npm" "run" "test:unit:schema-specification-preview-layout"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "SCHEMA_SPECIFICATION_PREVIEW_LAYOUT_BROWSER_ADAPTER"
    :observation-key :schemaSpecificationPreviewLayout
    :runtime-error "Specification preview layout browser runtime failed."
    :missing-error "Specification preview layout browser evidence is missing."}))

(defn- assert-runtime! [observed]
  (support/assert!
   (and (= 1 (get-in observed [:geometry :regions]))
        (> (get-in observed [:geometry :regionScroll])
           (get-in observed [:geometry :regionClient]))
        (true? (get-in observed [:geometry :contained]))
        (true? (get-in observed [:focused :inside]))
        (true? (get-in observed [:focused :visible]))
        (empty? (:runtimeErrors observed)))
   "Specification preview layout browser evidence was incomplete."
   observed)
  observed)

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :schema-specification-preview-layout-mode
   verify-model! (fn [_ _] true) runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-16T16:14:08.009900256+02:00", :module-hash "1620192270", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "1805838329"} {:id "def/feature-files", :kind "def", :line 4, :end-line 4, :hash "-1485555835"} {:id "def/entry-modes", :kind "def", :line 5, :end-line 5, :hash "-471543964"} {:id "form/3/defonce", :kind "defonce", :line 6, :end-line 6, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 7, :end-line 7, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 9, :end-line 12, :hash "323478919"} {:id "defn-/runtime-observation!", :kind "defn-", :line 14, :end-line 20, :hash "-788984611"} {:id "defn-/assert-runtime!", :kind "defn-", :line 22, :end-line 33, :hash "-1309501542"} {:id "def/handlers", :kind "def", :line 35, :end-line 38, :hash "-1839347066"}]}
;; clj-mutate-manifest-end
