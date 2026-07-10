(ns acceptance.property-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.command-registry :as command-registry]
            [acceptance.steps.data-layer :as data-layer]
            [acceptance.steps.data-layer-observer :as data-layer-observer]
            [acceptance.steps.data-layer-page-context :as data-layer-page-context]
            [acceptance.steps.data-layer-recovery :as data-layer-recovery]
            [acceptance.steps.data-layer-session :as data-layer-session]
            [acceptance.steps.data-layer-timeline :as data-layer-timeline]
            [acceptance.steps.hotkey-keymap :as hotkey-keymap]
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

(deftest hotkey-keymap-update-preserves-generated-command-bindings
  (let [result (check
                (prop/for-all [existing-name path-segment-gen
                               added-name path-segment-gen
                               obsolete-name path-segment-gen
                               first-key path-segment-gen
                               second-key path-segment-gen]
                  (let [existing-id (str "existing." existing-name)
                        added-id (str "added." added-name)
                        obsolete-id (str "obsolete." obsolete-name)
                        sequence (str first-key " " second-key)
                        summary (hotkey-keymap/update-keymap
                                 {:schemaVersion 1
                                  :bindings {existing-id sequence
                                             obsolete-id "C-x z"}}
                                 [existing-id added-id])
                        bindings (get-in summary [:keymap :bindings])]
                    (and (= 1 (get-in summary [:keymap :schemaVersion]))
                         (= sequence (get bindings existing-id))
                         (= "" (get bindings added-id))
                         (not (contains? bindings obsolete-id))
                         (= [added-id] (:added summary))
                         (= [obsolete-id] (:removed summary))))))]
    (is (:pass? result) (pr-str result))))

(deftest hotkey-keymap-update-status-reports-generated-counts
  (let [result (check
                (prop/for-all [added-count (gen/choose 0 100)
                               removed-count (gen/choose 0 100)]
                  (= (str "Keymap updated: added " added-count
                          ", removed " removed-count)
                     (hotkey-keymap/keymap-update-status
                      {:added (vec (range added-count))
                       :removed (vec (range removed-count))}))))]
    (is (:pass? result) (pr-str result))))

(deftest hotkey-keymap-resolves-generated-sequences-with-focus-guard
  (let [result (check
                (prop/for-all [command-name path-segment-gen
                               first-key path-segment-gen
                               second-key path-segment-gen]
                  (let [command-id (str "command." command-name)
                        binding (str first-key "   " second-key)
                        pressed (str " " first-key " " second-key " ")
                        keymap {:schemaVersion 1
                                :bindings {command-id binding}}]
                    (and (= command-id
                            (hotkey-keymap/command-for-sequence keymap pressed))
                         (= command-id
                            (hotkey-keymap/runnable-command-for-sequence
                             keymap
                             nil
                             pressed))
                         (nil? (hotkey-keymap/runnable-command-for-sequence
                                nil
                                nil
                                pressed))
                         (nil? (hotkey-keymap/runnable-command-for-sequence
                                keymap
                                "history-path"
                                pressed))
                         (hotkey-keymap/sequence-prefix? keymap first-key)))))]
    (is (:pass? result) (pr-str result))))

(deftest hotkey-keymap-detects-generated-duplicate-normalized-sequences
  (let [result (check
                (prop/for-all [first-name path-segment-gen
                               second-name path-segment-gen
                               unique-name path-segment-gen
                               first-key path-segment-gen
                               second-key path-segment-gen]
                  (let [first-id (str "first." first-name)
                        second-id (str "second." second-name)
                        unique-id (str "unique." unique-name)
                        duplicate (str first-key " " second-key)
                        keymap {:schemaVersion 1
                                :bindings {first-id duplicate
                                           second-id (str " " first-key
                                                          "   "
                                                          second-key
                                                          " ")
                                           unique-id (str "C-x "
                                                          unique-name)}}
                        expected-sequence (hotkey-keymap/normalize-sequence
                                           duplicate)]
                    (= [{:sequence expected-sequence
                         :command-ids (vec (sort [first-id second-id]))}]
                       (hotkey-keymap/duplicate-sequences keymap)))))]
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

(deftest data-layer-history-path-text-entry-records-generated-paths
  (let [result (check
                (prop/for-all [root path-segment-gen
                               leaf path-segment-gen]
                  (let [history-path (str root "." leaf)
                        state (data-layer/enter-history-array-path
                               {:side-panel-html
                                "<section id=\"data-layer-settings\"><input id=\"history-path\" /></section>"
                                :side-panel-source
                                (str "historyPathInput.addEventListener('input', () => { "
                                     "const path = setHistoryArrayPath(historyPathInput.value); "
                                     "renderHistoryPath(path); });")}
                               history-path)]
                    (and (= history-path (:history-path state))
                         (= history-path
                            (:history-path-field-value state))))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-history-path-incremental-entry-preserves-generated-text
  (let [result (check
                (prop/for-all [root path-segment-gen
                               leaf path-segment-gen
                               first-text path-segment-gen
                               intermediate-text path-segment-gen]
                  (let [history-path (str root "." leaf)
                        state (data-layer/type-history-array-path-sequence
                               {:side-panel-html
                                "<section id=\"data-layer-settings\"><input id=\"history-path\" /></section>"
                                :side-panel-source
                                (str "historyPathInput.addEventListener('input', () => { "
                                     "const typedPath = historyPathInput.value; "
                                     "const path = setHistoryArrayPath(typedPath); "
                                     "renderHistoryPath(path, typedPath); });")}
                               first-text
                               intermediate-text
                               history-path)]
                    (and (= [first-text intermediate-text history-path]
                            (:history-path-input-sequence state))
                         (= intermediate-text
                            (:intermediate-history-path-field-value state))
                         (= history-path (:history-path-field-value state))
                         (= history-path (:history-path state))))))]
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

(deftest data-layer-observer-records-generated-history-pushes
  (let [result (check
                (prop/for-all [route path-segment-gen
                               event-name path-segment-gen
                               payload-label path-segment-gen]
                  (let [url (str "https://example.test/" route)
                        base-state {:session-state
                                    (data-layer-session/run-start-command
                                     {}
                                     (session-options 1 url "queue.history"))}
                        state (-> base-state
                                  (data-layer-observer/attach-observer
                                   {:history-path "queue.history"
                                    :page-url url})
                                  (data-layer-observer/page-push event-name
                                                                 payload-label))
                        entry (data-layer-observer/last-observed-entry state)]
                    (and (= 1 (:push-return state))
                         (= [{:event event-name
                              :payload {:label payload-label}}]
                            (get-in state [:page-object :queue :history]))
                         (= "observed" (:type entry))
                         (= url (:url entry))
                         (= "queue.history" (:observer-path entry))
                         (= event-name (:name entry))
                         (= payload-label (:payload entry))
                         (= entry (last (get-in state [:session-state
                                                       :session
                                                       :timeline])))))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-observer-live-capture-conserves-generated-session-events
  (let [result (check
                (prop/for-all [route path-segment-gen
                               root path-segment-gen
                               leaf path-segment-gen
                               queued-event path-segment-gen
                               queued-payload path-segment-gen
                               pushed-event path-segment-gen
                               pushed-payload path-segment-gen]
                  (let [url (str "https://example.test/" route)
                        history-path (str root "." leaf)
                        state (-> {:history-path history-path}
                                  (data-layer-observer/define-active-page-window-with-entry
                                   {:page-url url
                                    :history-path history-path
                                    :event-name queued-event
                                    :payload-label queued-payload})
                                  data-layer-observer/start-side-panel-live-capture
                                  (data-layer-observer/page-push pushed-event
                                                                 pushed-payload))
                        timeline (data-layer-observer/session-timeline state)
                        observed (filter #(= "observed" (:type %)) timeline)
                        last-entry (data-layer-observer/last-observed-entry state)]
                    (and (= {:type "page" :url url} (first timeline))
                         (= [queued-event pushed-event] (map :name observed))
                         (every? #(= url (:url %)) observed)
                         (every? #(= history-path (:observer-path %)) observed)
                         (data-layer-observer/session-timeline-shows-page-and-observed?
                          state
                          url
                          queued-event)
                         (data-layer-observer/session-timeline-shows-page-and-observed?
                          state
                          url
                          pushed-event)
                         (data-layer-observer/observed-entry-matches?
                          last-entry
                          {:page-url url
                           :history-path history-path
                           :payload-label pushed-payload})))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-observer-resolves-generated-active-page-window-paths
  (let [result (check
                (prop/for-all [route path-segment-gen
                               root path-segment-gen
                               leaf path-segment-gen
                               event-name path-segment-gen
                               payload-label path-segment-gen]
                  (let [url (str "https://example.test/" route)
                        history-path (str root "." leaf)
                        ready-state (-> {:history-path history-path}
                                        (data-layer-observer/define-active-page-window
                                         {:page-url url
                                          :history-path history-path})
                                        data-layer-observer/start-active-page-observation
                                        (data-layer-observer/page-push event-name
                                                                       payload-label))
                        missing-state (-> {:history-path history-path}
                                          (data-layer-observer/define-active-page-window-without-path
                                           {:page-url url})
                                          data-layer-observer/start-active-page-observation)
                        entry (data-layer-observer/last-observed-entry ready-state)]
                    (and (= "ready" (get-in ready-state [:observer :status]))
                         (= 1 (:push-return ready-state))
                         (= url (:url entry))
                         (= history-path (:observer-path entry))
                         (= event-name (:name entry))
                         (= payload-label (:payload entry))
                         (data-layer-observer/page-owned-history-entry?
                          ready-state
                          event-name)
                         (= "path missing"
                            (get-in missing-state [:observer :status]))
                         (zero? (get-in missing-state
                                        [:observer :active-count]))))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-observer-distinguishes-generated-page-read-results
  (let [result (check
                (prop/for-all [route path-segment-gen
                               root path-segment-gen
                               leaf path-segment-gen
                               event-name path-segment-gen]
                  (let [url (str "https://example.test/" route)
                        history-path (str root "." leaf)
                        readable-state (-> {:history-path history-path}
                                           (data-layer-observer/define-active-page-window-with-entry
                                            {:page-url url
                                             :history-path history-path
                                             :event-name event-name})
                                           (data-layer-observer/read-active-page-history-path
                                            history-path))
                        unreadable-state (-> {:history-path history-path}
                                             (data-layer-observer/define-unreadable-active-page
                                              {:page-url url})
                                             data-layer-observer/start-active-page-observation)]
                    (and (data-layer-observer/active-page-read-succeeded?
                          readable-state)
                         (data-layer-observer/active-page-read-result-includes-path?
                          readable-state
                          history-path)
                         (data-layer-observer/active-page-read-result-not-empty?
                          readable-state)
                         (= "ready" (get-in readable-state [:observer :status]))
                         (= "page access unavailable"
                            (:page-access-status unreadable-state))
                         (not= "path missing"
                               (get-in unreadable-state [:observer :status]))
                         (data-layer-observer/no-empty-page-object-used-as-successful-read?
                          unreadable-state)))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-observer-refreshes-generated-pageloads-once
  (let [result (check
                (prop/for-all [route path-segment-gen
                               next-route path-segment-gen
                               root path-segment-gen
                               leaf path-segment-gen
                               event-name path-segment-gen
                               reload? gen/boolean]
                  (let [start-url (str "https://example.test/" route)
                        refreshed-url (if reload?
                                        start-url
                                        (str "https://example.test/"
                                             next-route))
                        history-path (str root "." leaf)
                        refresh-page (if reload?
                                       data-layer-observer/reload-with-delayed-history-path
                                       data-layer-observer/navigate-with-delayed-history-path)
                        state (-> {:history-path history-path
                                   :session-state
                                   (data-layer-session/run-start-command
                                    {}
                                    (session-options 1
                                                     start-url
                                                     history-path))}
                                  (data-layer-observer/attach-observation-on-page
                                   start-url)
                                  (refresh-page {:page-url refreshed-url
                                                 :history-path history-path})
                                  (data-layer-observer/page-push-after-ready
                                   event-name
                                   history-path))
                        matching-entries (filter
                                          #(and (= event-name (:name %))
                                                (= history-path
                                                   (:observer-path %))
                                                (= refreshed-url (:url %)))
                                          (:observed-entries state))
                        page-urls (mapv :url
                                        (filter #(= "page" (:type %))
                                                (data-layer-observer/session-timeline
                                                 state)))]
                    (and (data-layer-observer/automatic-pageload-observation-refresh?
                          state)
                         (false? (:manual-observation-restart-required? state))
                         (= history-path (:waited-for-history-path state))
                         (:ready-push-captured-once? state)
                         (= history-path (:ready-push-history-path state))
                         (= [start-url refreshed-url] page-urls)
                         (= 1 (count matching-entries))
                         (data-layer-observer/observed-entry-matches?
                          (data-layer-observer/last-observed-entry state)
                          {:page-url refreshed-url
                           :history-path history-path
                           :payload-label (str event-name "-payload")})))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-timeline-preserves-generated-entry-order-and-session-capture
  (let [result (check
                (prop/for-all [route path-segment-gen
                               first-event path-segment-gen
                               second-event path-segment-gen]
                  (let [url (str "https://example.test/" route)
                        state (-> {:session-state
                                   (data-layer-session/run-start-command
                                    {}
                                    (session-options 1 url "queue.history"))}
                                  (data-layer-timeline/record-observed-entry
                                   {:event-name first-event
                                    :page-url url
                                    :history-path "queue.history"
                                    :payload-label (str first-event "-values")
                                    :raw-label (str first-event "-raw")})
                                  (data-layer-timeline/record-observed-entry
                                   {:event-name second-event
                                    :page-url url
                                    :history-path "queue.history"
                                    :payload-label (str second-event "-values")
                                    :raw-label (str second-event "-raw")}))
                        visible (data-layer-timeline/visible-timeline-entries state)
                        session-visible (data-layer-timeline/visible-timeline-entries
                                         {:timeline-entries (get-in state
                                                                    [:session-state
                                                                     :session
                                                                     :timeline])})
                        expanded (data-layer-timeline/expanded-entry (last visible))]
                    (and (= [first-event second-event] (map :name visible))
                         (= second-event (:name expanded))
                         (= url (:url expanded))
                         (= "queue.history" (:observer-path expanded))
                         (= (str second-event "-values") (:payload expanded))
                         (= (str second-event "-raw") (:raw-value expanded))
                         (= visible session-visible)))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-timeline-nests-generated-pages-events-and-payloads
  (let [result (check
                (prop/for-all [route path-segment-gen
                               next-route path-segment-gen
                               first-event path-segment-gen
                               first-extra-event path-segment-gen
                               second-event path-segment-gen
                               second-extra-event path-segment-gen
                               payload-event path-segment-gen
                               payload-name path-segment-gen
                               payload-value path-segment-gen]
                  (let [first-url (str "https://example.test/" route)
                        second-url (str "https://example.test/" next-route)
                        history-path "queue.history"
                        payload-event-name (str "payload-event:" payload-event)
                        nested-state (data-layer-timeline/record-pageloads-with-events
                                      {}
                                      {:first-page-url first-url
                                       :second-page-url second-url
                                       :first-page-events (str first-event
                                                               ", "
                                                               first-extra-event)
                                       :second-page-events (str second-event
                                                                ", "
                                                                second-extra-event)
                                       :history-path history-path})
                        nested (data-layer-timeline/nested-timeline nested-state)
                        payload-state (data-layer-timeline/record-observed-event-with-payload
                                       nested-state
                                       {:event-name payload-event-name
                                        :payload-properties (format "%s: \"%s\""
                                                                    payload-name
                                                                    payload-value)})
                        details (data-layer-timeline/nested-event-details
                                 payload-state
                                 payload-event-name)]
                    (and (= [first-url second-url] (mapv :url nested))
                         (= [[first-event first-extra-event]
                             [second-event second-extra-event]]
                            (mapv #(mapv :name (:events %)) nested))
                         (every? #(= history-path (:observer-path %))
                                 (mapcat :events nested))
                         (= [{:name payload-name
                              :value (format "\"%s\"" payload-value)}]
                            (:payload-properties details))))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-timeline-renders-generated-tuple-payload-properties
  (let [result (check
                (prop/for-all [event-name path-segment-gen
                               root path-segment-gen
                               leaf path-segment-gen
                               first-name path-segment-gen
                               second-name path-segment-gen
                               third-name path-segment-gen]
                  (let [history-path (str root "." leaf)
                        properties [(str "first_" first-name)
                                    (str "second_" second-name)
                                    (str "third_" third-name)]
                        state (data-layer-timeline/record-observed-tuple
                               {}
                               {:event-name event-name
                                :history-path history-path
                                :timestamp "2026-07-09T20:00:00Z"
                                :payload-object (str/join ", " properties)})
                        rendered (data-layer-timeline/render-observed-event state)
                        expected-detail-lines (mapv
                                               (fn [property]
                                                 {:name property
                                                  :value (str "\"example "
                                                              property
                                                              "\"")})
                                               properties)]
                    (and (= (str event-name " | " history-path)
                            (:heading rendered))
                         (= expected-detail-lines (:detail-lines rendered))
                         (false? (:raw-payload-object-visible? rendered))))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-timeline-preserves-generated-expanded-page-state
  (let [result (check
                (prop/for-all [expanded-route path-segment-gen
                               collapsed-route path-segment-gen
                               first-event path-segment-gen
                               second-event path-segment-gen
                               collapsed-event path-segment-gen]
                  (let [expanded-url (str "https://example.test/expanded/"
                                          expanded-route)
                        collapsed-url (str "https://example.test/collapsed/"
                                           collapsed-route)
                        repeated-url (str "https://example.test/repeated/"
                                          expanded-route)
                        first-event-name (str "first-" first-event)
                        second-event-name (str "second-" second-event)
                        collapsed-event-name (str "collapsed-"
                                                  collapsed-event)
                        state (-> {}
                                  (data-layer-timeline/expand-pageload
                                   expanded-url)
                                  (data-layer-timeline/record-event-for-pageload
                                   {:page-url expanded-url
                                    :event-name first-event-name})
                                  (data-layer-timeline/record-event-for-pageload
                                   {:page-url expanded-url
                                    :event-name second-event-name})
                                  (data-layer-timeline/record-event-for-pageload
                                   {:page-url collapsed-url
                                    :event-name collapsed-event-name})
                                  data-layer-timeline/render-timeline-expanded-state)
                        duplicate-state (-> {}
                                            (data-layer-timeline/expand-pageload
                                             repeated-url)
                                            (data-layer-timeline/record-event-for-pageload
                                             {:page-url repeated-url
                                              :event-name first-event-name})
                                            (data-layer-timeline/record-collapsed-pageload
                                             repeated-url)
                                            (data-layer-timeline/record-event-for-pageload
                                             {:page-url repeated-url
                                              :event-name collapsed-event-name})
                                            data-layer-timeline/render-timeline-expanded-state)
                        expanded-page-indexes
                        (get-in state
                                [:rendered-expanded-timeline
                                 :expanded-page-indexes])
                        duplicate-expanded-page-indexes
                        (get-in duplicate-state
                                [:rendered-expanded-timeline
                                 :expanded-page-indexes])]
                    (and (= #{0} expanded-page-indexes)
                         (data-layer-timeline/event-visible-without-reexpanding?
                          state
                          expanded-url
                          first-event-name)
                         (data-layer-timeline/event-visible-without-reexpanding?
                          state
                          expanded-url
                          second-event-name)
                         (not (data-layer-timeline/pageload-expanded?
                               state
                               collapsed-url))
                         (= #{0} duplicate-expanded-page-indexes)
                         (data-layer-timeline/event-visible-without-reexpanding?
                          duplicate-state
                          repeated-url
                          first-event-name)
                         (not
                          (data-layer-timeline/event-visible-without-reexpanding?
                           duplicate-state
                           repeated-url
                           collapsed-event-name))))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-recovery-preserves-session-history-after-navigation
  (let [result (check
                (prop/for-all [route path-segment-gen
                               next-route path-segment-gen
                               event-name path-segment-gen]
                  (let [url (str "https://example.test/" route)
                        next-url (str "https://example.test/" next-route)
                        state (-> {}
                                  (data-layer-session/start-session
                                   (session-options 1 url "queue.history"))
                                  (data-layer-recovery/capture-observed-event
                                   {:event-name event-name
                                    :page-url url
                                    :history-path "queue.history"})
                                  (data-layer-recovery/reopen-after-navigation
                                   next-url))
                        entry (data-layer-recovery/timeline-entry state event-name)]
                    (and (= event-name (:name entry))
                         (= url (:url entry))
                         (= "queue.history"
                            (data-layer-recovery/restored-history-path state))
                         (= next-url (get-in state [:session :current-url]))
                         (= "active" (get-in state [:session :status]))))))]
    (is (:pass? result) (pr-str result))))

(deftest data-layer-page-context-keeps-side-panel-url-out-of-session-timeline
  (let [result (check
                (prop/for-all [route path-segment-gen
                               next-route path-segment-gen
                               event-name path-segment-gen
                               payload-label path-segment-gen]
                  (let [side-panel-url "chrome-extension://extension/side-panel.html"
                        start-url (str "https://example.test/" route)
                        page-url (str "https://example.test/" next-route)
                        state (-> {}
                                  (data-layer-page-context/open-side-panel
                                   side-panel-url)
                                  (data-layer-page-context/set-active-tab-url
                                   start-url)
                                  (data-layer-page-context/start-active-session
                                   "queue.history")
                                  (data-layer-page-context/navigate-active-tab
                                   {:start-url start-url
                                    :page-url page-url})
                                  (data-layer-page-context/page-appends-history-entry
                                   {:page-url page-url
                                    :event-name event-name
                                    :payload-label payload-label}))
                        entry (data-layer-page-context/timeline-entry
                               state
                               event-name)]
                    (and (= page-url
                            (get-in state
                                    [:session-state :session :current-url]))
                         (= page-url (:url entry))
                         (not (data-layer-page-context/timeline-uses-url?
                               state
                               side-panel-url))))))]
    (is (:pass? result) (pr-str result))))
