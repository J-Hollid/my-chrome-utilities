(ns acceptance.steps.event-library-editor-support
  (:require [acceptance.steps.support :as support]))

(defn wired? [html source]
  (support/includes-all? (str html source)
                         ["data-layer-panel-library" "event-template-search" "event-template-list"
                          "event-property-editor" "event-template-json" "event-template-properties"
                          "event-template-validation" "createEditableTemplate" "openPropertyEditor"
                          "setDraftProperty" "updateDraftJson" "saveDraftRevision"
                          "saveAsTemplateCopy" "executeDraftPush" "canPushTemplate"
                          "leaveEditorOptions" "serializeEventTemplateLibrary"
                          "restoreEventTemplateLibrary"]))

(defn inspect [world]
  (let [root (or (:root world) (support/repository-root))
        html (support/source-file root "side-panel.html")
        source (str (support/source-file root "src/side-panel.ts") "\n"
                    (support/source-file root "src/data-layer-event-library-editor.ts") "\n"
                    (support/source-file root "src/data-layer-event-library-editor-ui.ts"))]
    (support/assert! (wired? html source) "Event library editor UI wiring is incomplete." {})
    (assoc world :root root :editor-html html :editor-source source)))

(defn value [example key]
  (support/require-example example key))

(defn assert-value! [actual expected message]
  (support/assert! (= expected actual) message {:expected expected :actual actual}))

(def canonical-payload
  {:transaction_id "test-123"
   :debug true
   :revenue nil
   :items [{:product_id "sku-123"}]
   :metadata {:channel "web"}})

(defn captured-event [name source]
  {:id "event-1" :session-id "session-1" :name name :source source
   :payload canonical-payload :immutable true})

(defn event-template
  ([name] (event-template name 1))
  ([name version]
   {:id (str "template:" name) :name name :event-name "pageview"
    :source "Event history" :destination "event.history" :tags ["checkout"]
    :schema "purchase" :validation "Valid" :version version
    :payload canonical-payload :originating-session-id "session-1"
    :originating-event-id "event-1" :provenance "template:captured:history"}))

(def property-pattern support/template-pattern)

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T15:32:35.063824491+02:00", :module-hash "686380861", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-761790167"} {:id "defn/wired?", :kind "defn", :line 4, :end-line nil, :hash "563978528"} {:id "defn/inspect", :kind "defn", :line 14, :end-line nil, :hash "-1158883615"} {:id "defn/value", :kind "defn", :line 23, :end-line nil, :hash "1659070196"} {:id "defn/assert-value!", :kind "defn", :line 26, :end-line nil, :hash "-1812560737"} {:id "def/canonical-payload", :kind "def", :line 29, :end-line nil, :hash "1370894261"} {:id "defn/captured-event", :kind "defn", :line 36, :end-line nil, :hash "-795658010"} {:id "defn/event-template", :kind "defn", :line 40, :end-line nil, :hash "-1221163956"} {:id "def/property-pattern", :kind "def", :line 49, :end-line nil, :hash "1372428669"}]}
;; clj-mutate-manifest-end
