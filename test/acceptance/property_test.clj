(ns acceptance.property-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.command-registry :as command-registry]
            [acceptance.steps.data-layer :as data-layer]
            [acceptance.steps.data-layer-session :as data-layer-session]
            [acceptance.steps.package-flow :as package-flow]
            [acceptance.steps.palette :as palette]
            [acceptance.steps.side-panel :as side-panel]
            [clojure.string :as str]
            [clojure.test :refer [deftest is]]
            [clojure.test.check :as tc]
            [clojure.test.check.generators :as gen]
            [clojure.test.check.properties :as prop]))

(def step-gen
  (gen/fmap (fn [text]
              {:keyword "Then"
               :text text})
            (gen/not-empty gen/string-alphanumeric)))

(def example-gen
  (gen/map gen/string-alphanumeric gen/string-alphanumeric
           {:max-elements 4}))

(def scenario-gen
  (gen/let [name (gen/not-empty gen/string-alphanumeric)
            steps (gen/vector step-gen 0 5)
            examples (gen/vector example-gen 0 4)]
    {:name name
     :steps steps
     :examples examples}))

(def feature-gen
  (gen/let [background (gen/vector step-gen 0 3)
            scenarios (gen/vector scenario-gen 0 6)]
    {:name "Generated"
     :background background
     :scenarios scenarios}))

(defn- set-of-elements-gen [values]
  (gen/fmap set
            (gen/vector (gen/elements (vec values))
                        0
                        (count values))))

(def command-field-set-gen
  (set-of-elements-gen command-registry/command-fields))

(def fuzzy-package-set-gen
  (set-of-elements-gen palette/fuzzy-package-names))

(def path-segment-gen
  (gen/not-empty gen/string-alphanumeric))

(defn- check [property]
  (tc/quick-check 100 property))

(defn- expected-execution-count [scenarios]
  (reduce + (map #(max 1 (count (:examples %))) scenarios)))

(defn- execution-shape-valid? [background scenarios execution]
  (let [scenario (nth scenarios (:scenario-index execution))
        examples (:examples scenario)
        expected-example (if (seq examples)
                           (nth examples (:example-index execution))
                           {})]
    (and (= scenario (:scenario execution))
         (= expected-example (:example execution))
         (= (vec (concat background (:steps scenario))) (:steps execution))
         (= (format "%s/example_%d"
                    (:name scenario)
                    (inc (:example-index execution)))
            (:name execution)))))

(defn- command-source-for [fields]
  (str/join "\n" (map #(str % ": value") fields)))

(defn- package-with-fuzzy-dependencies [packages]
  {:dependencies (into {} (map (fn [package]
                                 [(keyword package) "1.0.0"])
                               packages))
   :devDependencies {}})

(defn- palette-scope-input [packages global-shortcut? keybinding-editor?]
  {:package (package-with-fuzzy-dependencies packages)
   :manifest (if global-shortcut?
               {:commands {:open-palette {}}}
               {})
   :files (if keybinding-editor?
            {"src/settings.ts" "shortcut editor"}
            {"src/side-panel.ts" ""})})

(defn- expected-palette-scope-findings [packages global-shortcut? keybinding-editor?]
  (vec
   (concat
    (map (fn [_package] {:kind :fuzzy-package :path "package.json"})
         (sort packages))
    (when global-shortcut?
      [{:kind :global-shortcut :path "manifest.json"}])
    (when keybinding-editor?
      [{:kind :keybinding-editor :path "src/settings.ts"}]))))

(defn- extension-build-files [manifest-version background? side-panel?]
  (cond-> {"manifest.json" (format "{\"manifest_version\":%d,\"background\":{\"service_worker\":\"background.js\"},\"side_panel\":{\"default_path\":\"side-panel.html\"}}"
                                   manifest-version)}
    background? (assoc "background.js" "")
    side-panel? (assoc "side-panel.html" "")))

(defn- nested-page-object [root leaf value]
  {(keyword root) {(keyword leaf) value}})

(defn- session-options [tab-id url history-path]
  {:tab-id tab-id
   :url url
   :history-path history-path})

(deftest expand-executions-preserves-scenario-example-shape
  (let [result (check
                (prop/for-all [{:keys [background scenarios] :as feature} feature-gen]
                  (let [executions (runtime/expand-executions feature)]
                    (and (= (expected-execution-count scenarios)
                            (count executions))
                         (every? #(execution-shape-valid? background scenarios %)
                                 executions)))))]
    (is (:pass? result) (pr-str result))))

(deftest manifest-contract-normalizes-side-panel-shape
  (let [result (check
                (prop/for-all [manifest-version gen/pos-int
                               extension-name gen/string-alphanumeric
                               default-path gen/string-alphanumeric
                               permissions (gen/vector gen/string-alphanumeric 0 8)
                               content-scripts? gen/boolean]
                  (let [manifest (cond-> {:manifest_version manifest-version
                                           :name extension-name
                                           :side_panel {:default_path default-path}
                                           :permissions permissions}
                                   content-scripts? (assoc :content_scripts []))
                        contract (side-panel/manifest-contract manifest)]
                    (and (= manifest-version (:manifest-version contract))
                         (= extension-name (:extension-name contract))
                         (= default-path (:default-path contract))
                         (= (set permissions) (:permissions contract))
                         (= content-scripts? (:content-scripts? contract))))))]
    (is (:pass? result) (pr-str result))))

(deftest command-field-detection-round-trips-field-subsets
  (let [result (check
                (prop/for-all [fields command-field-set-gen]
                  (= fields
                     (command-registry/defined-fields
                      (command-source-for fields)))))]
    (is (:pass? result) (pr-str result))))

(deftest palette-scope-findings-compose-from-independent-signals
  (let [result (check
                (prop/for-all [packages fuzzy-package-set-gen
                               global-shortcut? gen/boolean
                               keybinding-editor? gen/boolean]
                  (= (expected-palette-scope-findings packages
                                                      global-shortcut?
                                                      keybinding-editor?)
                     (palette/forbidden-palette-scope-findings
                      (palette-scope-input packages
                                           global-shortcut?
                                           keybinding-editor?)))))]
    (is (:pass? result) (pr-str result))))

(deftest loadable-extension-build-requires-mv3-background-and-side-panel
  (let [result (check
                (prop/for-all [manifest-version gen/pos-int
                               background? gen/boolean
                               side-panel? gen/boolean]
                  (= (and (= 3 manifest-version) background? side-panel?)
                     (package-flow/loadable-extension-build?
                      (extension-build-files manifest-version
                                             background?
                                             side-panel?)))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-path-status-classifies-generated-paths
  (let [result (check
                (prop/for-all [root path-segment-gen
                               leaf path-segment-gen]
                  (let [path (str root "." leaf)]
                    (and (= "ready"
                            (data-layer/path-status
                             (nested-page-object root leaf [])
                             path))
                         (= "not an array"
                            (data-layer/path-status
                             (nested-page-object root leaf 1)
                             path))
                         (= "path missing"
                            (data-layer/path-status
                             (nested-page-object root leaf [])
                             (str root "." leaf "_missing")))
                         (= "path missing"
                            (data-layer/path-status
                             {(keyword root) 1}
                             path))))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-session-lifecycle-preserves-active-session-invariants
  (let [result (check
                (prop/for-all [tab-id gen/pos-int
                               route path-segment-gen
                               history-root path-segment-gen]
                  (let [url (str "https://example.test/" route)
                        history-path (str history-root ".history")
                        started (data-layer-session/run-start-command
                                 {}
                                 (session-options tab-id url history-path))
                        duplicate (data-layer-session/run-start-command
                                   started
                                   (session-options tab-id
                                                    (str url "/next")
                                                    "other.history"))
                        ended (data-layer-session/end-session started)
                        after-ended (data-layer-session/capture-entry
                                     ended
                                     {:type "page" :url (str url "/after")})]
                    (and (data-layer-session/active-session? started)
                         (= (str "tab-" tab-id)
                            (get-in started [:session :id]))
                         (= history-path
                            (get-in started [:session :history-path]))
                         (= [{:type "page" :url url}]
                            (get-in started [:session :timeline]))
                         (= (:session started) (:session duplicate))
                         (= "active session already exists"
                            (:warning duplicate))
                         (= "ended" (get-in ended [:session :status]))
                         (= (get-in ended [:session :timeline])
                            (get-in after-ended [:session :timeline]))
                         (= started
                            (data-layer-session/restore-session
                             (data-layer-session/persisted-session started)))))))]
    (is (:pass? result) (pr-str result))))
