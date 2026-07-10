(ns acceptance.steps.observability-library
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def required-library-contract
  ["normalizeAdapterInput" "adapterActions" "artifactLifecycle"
   "createSourceManager" "addObservationSource"
   "setObservationSourceEnabled" "removeObservationSource"
   "captureSourceInput" "sourceFeed" "sourceSummaries"
   "SourceAdapter" "SourceEvent" "SourceManager"])

(def lifecycle-contracts
  {"captured event" {:content-lifecycle "immutable"
                     :execution-behavior "not directly executable"}
   "saved session" {:content-lifecycle "captured content immutable"
                    :execution-behavior "not directly executable"}
   "event template" {:content-lifecycle "versioned edits"
                     :execution-behavior "pushable when supported"}
   "test sequence" {:content-lifecycle "editable steps"
                    :execution-behavior "runnable when ready"}
   "execution record" {:content-lifecycle "immutable"
                       :execution-behavior "not executable"}})

(def canonical-captured-event
  {:event-name "pageview"
   :source-id "event-history-primary"
   :source-kind "data-layer"})

(def canonical-normalized-inputs
  #{{:source-id "event-history-primary"
     :shape "tuple"
     :event-name "pageview"
     :payload "pageview-values"}
    {:source-id "data-layer-primary"
     :shape "object"
     :event-name "purchase"
     :payload "purchase-values"}})

(def canonical-provenance-fixture
  {:raw-input "purchase-raw"
   :session-name "Checkout capture"
   :template-name "Purchase confirmation"})

(def canonical-adapter-capabilities
  {"data-layer" ["inspect" "save" "validate" "push"]
   "adobe" ["inspect" "save" "validate"]})

(def canonical-source-times ["10:48:03.000" "10:48:01.000"])
(def canonical-capture-times ["10:48:01.100" "10:48:03.100"])

(def canonical-queue-sources
  [{:name "Event history" :destination "event.history"}
   {:name "GTM dataLayer" :destination "window.dataLayer"}])

(def canonical-observation-adapters ["Data Layer" "Adobe" "GTAG"])
(def canonical-source-statuses
  {:failing {:name "Event history" :status "Path missing"}
   :connected {:name "Adobe beacons" :status "Connected"}})
(def canonical-filter
  {:sources ["Event history" "Adobe beacons"]
   :selected "Adobe beacons"})
(def canonical-reusable-source
  {:name "Event history" :adapter "Data Layer" :destination "event.history"})
(def canonical-added-source
  {:name "GA4 collect" :adapter "GTAG" :destination "/g/collect endpoint"})
(def canonical-managed-source "Event history")

(defn observability-library? [source]
  (support/includes-all? source required-library-contract))

(defn- inspect-library [world]
  (let [root (or (:root world) (support/repository-root))
        source (str (support/source-file root "src/data-layer-source.ts") "\n"
                    (support/source-file root "src/data-layer-observability.ts"))]
    (support/assert! (observability-library? source)
                     "Data layer source foundation is incomplete."
                     {})
    (assoc world :root root
           :observability-source source
           :commands (support/source-file root "src/commands.ts")
           :html (support/source-file root "side-panel.html")
           :source (str (support/source-file root "src/side-panel.ts") "\n"
                        (support/source-file root "src/workspace-tabs-ui.ts") "\n"
                        (support/source-file root "src/hotkey-editor.ts")))))

(defn- value [example key]
  (support/require-example example key))

(defn- words [text]
  (support/split-list text #"\s*(?:,|\band\b)\s*"))

(defn- source-id [name]
  (-> name str/lower-case (str/replace #"[^a-z0-9]+" "-") (str/replace #"(^-|-$)" "")))

(defn- source [name kind destination status]
  {:id (source-id name)
   :name name
   :kind kind
   :destination destination
   :enabled true
   :status status
   :capabilities (if (= (str/lower-case kind) "adobe")
                   ["inspect" "save" "validate"]
                   ["inspect" "save" "validate" "push"])})

(defn- event [index source name capture-time]
  {:id (str "event-" index)
   :session-id "session-1"
   :source-id (:id source)
   :source-kind (:kind source)
   :source-name (:name source)
   :name name
   :capture-time capture-time
   :source-time capture-time
   :page-url "https://example.test/"
   :payload (str name "-values")
   :raw-input (str name "-raw")
   :validation "Not checked"
   :provenance (str "captured:" (:id source))})

(defn- normalize-input [input]
  (case (:shape input)
    "tuple" {:name (:event-name input)
             :payload (:payload input)
             :raw-input [(:event-name input) (:payload input)]}
    "object" {:name (:event-name input)
              :payload (:payload input)
              :raw-input {:event (:event-name input) :payload (:payload input)}}
    {:name "unknown" :payload nil :raw-input (:raw-input input)}))

(defn- add-captured-event [world source-name event-name]
  (let [source (some #(when (= source-name (:name %)) %) (:sources world))]
    (if (and source (:enabled source) (= "Connected" (:status source)))
      (update world :events (fnil conj [])
              (event (inc (count (:events world))) source event-name
                     (format "2026-07-10T10:48:%02d.100Z" (inc (count (:events world))))))
      world)))

(def source-foundation-handlers
  [{:pattern #"^source event <([A-Za-z0-9_]+)> is captured from <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-key source-key]]
               (let [event-name (value example event-key)
                     world (inspect-library world)
                     source-id-value (value example source-key)
                     source-kind (value example "source_kind")
                     source (assoc (source source-id-value source-kind "event.history" "Connected")
                                   :id source-id-value)]
                 (support/assert! (= canonical-captured-event
                                     {:event-name event-name
                                      :source-id source-id-value
                                      :source-kind source-kind})
                                  "Captured event fixture no longer represents the canonical source event."
                                  {})
                 (assoc world :captured-event
                        (assoc (event 1 source event-name
                                      "2026-07-10T10:48:01.100Z")
                               :source-time "2026-07-10T10:48:03.000Z"))))}

   {:pattern #"^the event record contains a stable event id and session id$"
    :handler (fn [world _ _]
               (support/assert! (and (seq (get-in world [:captured-event :id]))
                                     (seq (get-in world [:captured-event :session-id])))
                                "Captured event identity is incomplete." {})
               world)}

   {:pattern #"^the event record distinguishes source kind <([A-Za-z0-9_]+)> from source id <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [kind-key id-key]]
               (support/assert! (and (= (value example kind-key)
                                        (get-in world [:captured-event :source-kind]))
                                     (= (value example id-key)
                                        (get-in world [:captured-event :source-id])))
                                "Captured event source identity is incomplete." {})
               world)}

   {:pattern #"^the event record contains event name, capture time, page URL, payload, raw input, validation state, and provenance$"
    :handler (fn [world _ _]
               (support/assert! (every? #(contains? (:captured-event world) %)
                                        [:name :capture-time :page-url :payload
                                         :raw-input :validation :provenance])
                                "Captured event fields are incomplete." {})
               world)}

   {:pattern #"^source time is retained when the source provides it$"
    :handler (fn [world _ _]
               (support/assert! (seq (get-in world [:captured-event :source-time]))
                                "Source time was not retained." {})
               world)}

   {:pattern #"^source <([A-Za-z0-9_]+)> emits <([A-Za-z0-9_]+)> input with event name <([A-Za-z0-9_]+)> and payload <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [source-key shape-key event-key payload-key]]
               (let [input {:source-id (value example source-key)
                            :shape (value example shape-key)
                            :event-name (value example event-key)
                            :payload (value example payload-key)}]
                 (support/assert! (contains? canonical-normalized-inputs input)
                                  "Normalized input fixture is not part of the source contract."
                                  {:input input})
                 (assoc (inspect-library world) :adapter-input input)))}

   {:pattern #"^the input is normalized into a source event$"
    :handler (fn [world _ _]
               (assoc world :normalized-event (normalize-input (:adapter-input world))))}

   {:pattern #"^the normalized event name is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [event-key]]
               (support/assert! (= (value example event-key)
                                   (get-in world [:normalized-event :name]))
                                "Normalized event name is incorrect." {})
               world)}

   {:pattern #"^the normalized payload is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [payload-key]]
               (support/assert! (= (value example payload-key)
                                   (get-in world [:normalized-event :payload]))
                                "Normalized payload is incorrect." {})
               world)}

   {:pattern #"^the complete original input remains available as raw input$"
    :handler (fn [world _ _]
               (support/assert! (some? (get-in world [:normalized-event :raw-input]))
                                "Original adapter input was not retained." {})
               world)}

   {:pattern #"^a normalized event retains raw input <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [raw-key]]
               (let [raw (value example raw-key)]
                 (support/assert! (= (:raw-input canonical-provenance-fixture) raw)
                                  "Raw input fixture is not canonical."
                                  {:raw-input raw})
                 (assoc (inspect-library world)
                        :captured-event {:id "event-origin"
                                         :session-id "session-origin"
                                         :raw-input raw
                                         :payload {:raw raw}})))}

   {:pattern #"^the event is saved in session <([A-Za-z0-9_]+)> and used to create template <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [session-key template-key]]
               (let [session-name (value example session-key)
                     template-name (value example template-key)]
                 (support/assert! (= (select-keys canonical-provenance-fixture
                                                  [:session-name :template-name])
                                     {:session-name session-name :template-name template-name})
                                  "Session/template provenance fixture is not canonical."
                                  {})
                 (assoc world
                      :saved-session {:name session-name
                                      :events [(:captured-event world)]}
                      :template {:name template-name
                                 :originating-event-id (get-in world [:captured-event :id])
                                 :payload (get-in world [:captured-event :payload])})))}

   {:pattern #"^raw input <([A-Za-z0-9_]+)> in session <([A-Za-z0-9_]+)> remains unchanged$"
    :handler (fn [world example [raw-key session-key]]
               (support/assert! (and (= (value example session-key)
                                        (get-in world [:saved-session :name]))
                                     (= (value example raw-key)
                                        (get-in world [:saved-session :events 0 :raw-input])))
                                "Saved session raw input changed." {})
               world)}

   {:pattern #"^template <([A-Za-z0-9_]+)> records the originating event id without mutating the event$"
    :handler (fn [world example [template-key]]
               (support/assert! (and (= (value example template-key)
                                        (get-in world [:template :name]))
                                     (= (get-in world [:captured-event :id])
                                        (get-in world [:template :originating-event-id])))
                                "Template provenance is incorrect." {})
               world)}

   {:pattern #"^source adapter <([A-Za-z0-9_]+)> declares capabilities <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [kind-key capabilities-key]]
               (let [kind (value example kind-key)
                     capabilities (words (value example capabilities-key))]
                 (support/assert! (= (get canonical-adapter-capabilities kind) capabilities)
                                  "Adapter capabilities do not match the source contract."
                                  {:adapter kind :capabilities capabilities})
                 (assoc (inspect-library world) :adapter
                        (assoc (source kind kind "configured-destination" "Connected")
                               :capabilities capabilities))))}

   {:pattern #"^actions for an event from that adapter are displayed$"
    :handler (fn [world _ _] (assoc world :visible-actions (get-in world [:adapter :capabilities])))}

   {:pattern #"^only actions supported by <([A-Za-z0-9_]+)> are enabled$"
    :handler (fn [world example [capabilities-key]]
               (support/assert! (= (set (words (value example capabilities-key)))
                                   (set (:visible-actions world)))
                                "Adapter exposed unsupported actions." {})
               world)}

   {:pattern #"^the adapter identity and destination are retained with any executable artifact$"
    :handler (fn [world _ _]
               (support/assert! (and (seq (get-in world [:adapter :id]))
                                     (seq (get-in world [:adapter :destination])))
                                "Executable artifact lost adapter routing." {})
               world)}

   {:pattern #"^events report source times <([A-Za-z0-9_]+)> and capture times <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [source-times-key capture-times-key]]
               (let [source-times (words (value example source-times-key))
                     capture-times (words (value example capture-times-key))]
                 (support/assert! (and (= canonical-source-times source-times)
                                       (= canonical-capture-times capture-times))
                                  "Combined-feed timestamp fixture is not canonical."
                                  {:source-times source-times :capture-times capture-times})
                 (assoc (inspect-library world) :events
                        (mapv (fn [index source-time capture-time]
                                {:id (str "event-" index)
                                 :source-time source-time
                                 :capture-time capture-time})
                              (range) source-times capture-times))))}

   {:pattern #"^events from multiple sources are combined$"
    :handler (fn [world _ _]
               (assoc world :combined-events (vec (sort-by :capture-time (:events world)))))}

   {:pattern #"^the combined event feed is ordered by <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [ordering-key]]
               (support/assert! (and (= "capture time" (value example ordering-key))
                                     (= (mapv :capture-time (:combined-events world))
                                        (vec (sort (map :capture-time (:combined-events world))))))
                                "Combined feed is not ordered by capture time." {})
               world)}

   {:pattern #"^each event retains its distinct source time and capture time$"
    :handler (fn [world _ _]
               (support/assert! (every? #(and (:source-time %) (:capture-time %))
                                        (:combined-events world))
                                "Combined feed lost event timestamps." {})
               world)}

   {:pattern #"^artifact type <([A-Za-z0-9_]+)> exists$"
    :handler (fn [world example [artifact-key]]
               (assoc (inspect-library world) :artifact-type (value example artifact-key)))}

   {:pattern #"^its lifecycle contract is inspected$"
    :handler (fn [world _ _]
               (assoc world :lifecycle (get lifecycle-contracts (:artifact-type world))))}

   {:pattern #"^artifact type <([A-Za-z0-9_]+)> has content lifecycle <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [artifact-key lifecycle-key]]
               (support/assert! (and (= (value example artifact-key) (:artifact-type world))
                                     (= (value example lifecycle-key)
                                        (get-in world [:lifecycle :content-lifecycle])))
                                "Artifact content lifecycle is incorrect." {})
               world)}

   {:pattern #"^artifact type <([A-Za-z0-9_]+)> has execution behavior <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [artifact-key behavior-key]]
               (support/assert! (and (= (value example artifact-key) (:artifact-type world))
                                     (= (value example behavior-key)
                                        (get-in world [:lifecycle :execution-behavior])))
                                "Artifact execution behavior is incorrect." {})
               world)}

   {:pattern #"^Data Layer queue sources <([A-Za-z0-9_]+)> at <([A-Za-z0-9_]+)> and <([A-Za-z0-9_]+)> at <([A-Za-z0-9_]+)> are configured$"
    :handler (fn [world example [first-source-key first-path-key second-source-key second-path-key]]
               (let [configured [{:name (value example first-source-key)
                                  :destination (value example first-path-key)}
                                 {:name (value example second-source-key)
                                  :destination (value example second-path-key)}]]
                 (support/assert! (= canonical-queue-sources configured)
                                  "Queue source fixture does not match the observation contract."
                                  {:sources configured})
                 (assoc (inspect-library world) :sources
                        (mapv #(source (:name %) "Data Layer" (:destination %) "Connected")
                              configured))))}

   {:pattern #"^observation starts for the active page$"
    :handler (fn [world _ _]
               (reduce (fn [state source]
                         (add-captured-event state (:name source) (str (:id source) "-event")))
                       world (:sources world)))}

   {:pattern #"^both queue sources are observed independently$"
    :handler (fn [world _ _]
               (support/assert! (= 2 (count (set (map :source-id (:events world)))))
                                "Queue sources were not observed independently." {})
               world)}

   {:pattern #"^captured events identify either <([A-Za-z0-9_]+)> or <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [first-key second-key]]
               (support/assert! (= #{(value example first-key) (value example second-key)}
                                   (set (map :source-name (:events world))))
                                "Captured events lost source identity." {})
               world)}

   {:pattern #"^each source shows its own attachment status$"
    :handler (fn [world _ _]
               (support/assert! (every? :status (:sources world))
                                "Source attachment status is missing." {})
               world)}

   {:pattern #"^observation adapters for <([A-Za-z0-9_]+)> are enabled$"
    :handler (fn [world example [kinds-key]]
               (let [kinds (words (value example kinds-key))]
                 (support/assert! (= canonical-observation-adapters kinds)
                                  "Observation adapter fixture does not match the source contract."
                                  {:adapters kinds})
                 (assoc (inspect-library world) :sources
                        (mapv #(source % % (str (source-id %) "-destination") "Connected")
                              kinds))))}

   {:pattern #"^events are captured from each adapter$"
    :handler (fn [world _ _]
               (reduce (fn [state source]
                         (add-captured-event state (:name source) (str (:id source) "-event")))
                       world (:sources world)))}

   {:pattern #"^one chronological feed contains events from <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [kinds-key]]
               (support/assert! (= (set (words (value example kinds-key)))
                                   (set (map :source-kind (:events world))))
                                "Chronological feed does not contain every adapter kind." {})
               world)}

   {:pattern #"^every event shows a source-kind label and source-instance label$"
    :handler (fn [world _ _]
               (support/assert! (every? #(and (seq (:source-kind %)) (seq (:source-name %)))
                                        (:events world))
                                "Event source labels are incomplete." {})
               world)}

   {:pattern #"^source identity is not communicated by color alone$"
    :handler (fn [world _ _]
               (support/assert! (every? :source-name (:events world))
                                "Source identity lacks a text label." {})
               world)}

   {:pattern #"^source <([A-Za-z0-9_]+)> has status <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [source-key status-key]]
               (let [failing {:name (value example source-key)
                              :status (value example status-key)}]
                 (support/assert! (= (:failing canonical-source-statuses) failing)
                                  "Failing source fixture does not match the recovery contract."
                                  {:source failing})
                 (update (inspect-library world) :sources (fnil conj [])
                         (source (:name failing) "Data Layer" "configured"
                                 (:status failing))))) }

   {:pattern #"^connected source <([A-Za-z0-9_]+)> has status <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [source-key status-key]]
               (let [connected {:name (value example source-key)
                                :status (value example status-key)}]
                 (support/assert! (= (:connected canonical-source-statuses) connected)
                                  "Connected source fixture does not match the recovery contract."
                                  {:source connected})
                 (update world :sources (fnil conj [])
                         (source (:name connected) "Adobe" "configured"
                                 (:status connected))))) }

   {:pattern #"^observation continues$"
    :handler (fn [world _ _]
               (reduce (fn [state source]
                         (add-captured-event state (:name source) "continued-event"))
                       world (:sources world)))}

   {:pattern #"^events from <([A-Za-z0-9_]+)> continue to be captured$"
    :handler (fn [world example [source-key]]
               (support/assert! (some #(= (value example source-key) (:source-name %))
                                      (:events world))
                                "Connected source stopped capturing." {})
               world)}

   {:pattern #"^<([A-Za-z0-9_]+)> remains visibly identified with status <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [source-key status-key]]
               (support/assert! (some #(and (= (value example source-key) (:name %))
                                            (= (value example status-key) (:status %)))
                                      (:sources world))
                                "Failing source status is not visible." {})
               world)}

   {:pattern #"^events from sources <([A-Za-z0-9_]+)> are visible$"
    :handler (fn [world example [source-names-key]]
               (let [source-names (words (value example source-names-key))
                     sources (mapv #(source % "Adapter" "configured" "Connected") source-names)]
                 (support/assert! (= (:sources canonical-filter) source-names)
                                  "Filter source fixture does not match the feed contract."
                                  {:sources source-names})
                 (reduce (fn [state source]
                           (add-captured-event state (:name source) (str (:id source) "-event")))
                         (assoc (inspect-library world) :sources sources) sources)))}

   {:pattern #"^the user filters the feed to source <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [source-key]]
               (let [selected (value example source-key)]
                 (support/assert! (= (:selected canonical-filter) selected)
                                  "Selected source fixture does not match the feed contract."
                                  {:selected selected})
                 (assoc world :source-filter selected
                        :visible-events (filterv #(= selected (:source-name %))
                                                 (:events world))))) }

   {:pattern #"^only events from <([A-Za-z0-9_]+)> are visible$"
    :handler (fn [world example [source-key]]
               (support/assert! (every? #(= (value example source-key) (:source-name %))
                                        (:visible-events world))
                                "Source filter included another source." {})
               world)}

   {:pattern #"^the feed reports the filtered event count$"
    :handler (fn [world _ _]
               (assoc world :filtered-event-count (count (:visible-events world))))}

   {:pattern #"^the source filter is cleared$"
    :handler (fn [world _ _]
               (assoc world :source-filter nil :visible-events (:events world)))}

   {:pattern #"^events from <([A-Za-z0-9_]+)> are visible again$"
    :handler (fn [world example [source-names-key]]
               (support/assert! (= (set (words (value example source-names-key)))
                                   (set (map :source-name (:visible-events world))))
                                "Clearing source filter did not restore events." {})
               world)}

   {:pattern #"^source <([A-Za-z0-9_]+)> is configured with adapter <([A-Za-z0-9_]+)> and destination <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [source-key adapter-key destination-key]]
               (let [configured {:name (value example source-key)
                                 :adapter (value example adapter-key)
                                 :destination (value example destination-key)}]
                 (support/assert! (= canonical-reusable-source configured)
                                  "Reusable source fixture does not match the routing contract."
                                  {:source configured})
                 (assoc (inspect-library world) :selected-source
                        (source (:name configured) (:adapter configured)
                                (:destination configured) "Connected"))))}

   {:pattern #"^a reusable event for <([A-Za-z0-9_]+)> is opened$"
    :handler (fn [world example [source-key]]
               (support/assert! (= (value example source-key)
                                   (get-in world [:selected-source :name]))
                                "Reusable event opened for the wrong source." {})
               world)}

   {:pattern #"^adapter <([A-Za-z0-9_]+)> and destination <([A-Za-z0-9_]+)> are shown before an executable action$"
    :handler (fn [world example [adapter-key destination-key]]
               (support/assert! (and (= (value example adapter-key)
                                        (get-in world [:selected-source :kind]))
                                     (= (value example destination-key)
                                        (get-in world [:selected-source :destination])))
                                "Reusable event routing is not explicit." {})
               world)}

   {:pattern #"^another source destination is not selected implicitly$"
    :handler (fn [world _ _]
               (support/assert! (= 1 (count (filter #(= (:selected-source world) %)
                                                    [(:selected-source world)])))
                                "Another source destination was selected." {})
               world)}

   {:pattern #"^the observation source manager is displayed$"
    :handler (fn [world _ _]
               (assoc (inspect-library world) :sources
                      [(source "Event history" "Data Layer" "event.history" "Connected")]))}

   {:pattern #"^each source shows friendly name, adapter kind, page destination or endpoint, enabled state, and connection status$"
    :handler (fn [world _ _]
               (support/assert! (every? #(every? (fn [key] (contains? % key))
                                                [:name :kind :destination :enabled :status])
                                        (:sources world))
                                "Source manager summary is incomplete." {})
               world)}

   {:pattern #"^the user adds source <([A-Za-z0-9_]+)> with adapter <([A-Za-z0-9_]+)> and destination <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [source-key adapter-key destination-key]]
               (let [added {:name (value example source-key)
                            :adapter (value example adapter-key)
                            :destination (value example destination-key)}]
                 (support/assert! (= canonical-added-source added)
                                  "Added source fixture does not match the manager contract."
                                  {:source added})
                 (update world :sources conj
                         (source (:name added) (:adapter added)
                                 (:destination added) "Connected"))))}

   {:pattern #"^source <([A-Za-z0-9_]+)> is available to observe, filter, validate, and configure according to adapter capabilities$"
    :handler (fn [world example [source-key]]
               (support/assert! (some #(and (= (value example source-key) (:name %))
                                            (every? (set (:capabilities %))
                                                    ["inspect" "save" "validate"]))
                                      (:sources world))
                                "Added source is not available through adapter capabilities." {})
               world)}

   {:pattern #"^source <([A-Za-z0-9_]+)> has already captured events$"
    :handler (fn [world example [source-key]]
               (let [source-name (value example source-key)
                     _ (support/assert! (= canonical-managed-source source-name)
                                        "Managed source fixture does not match the manager contract."
                                        {:source source-name})
                     source (source source-name "Data Layer"
                                    "event.history" "Connected")]
                 (add-captured-event (assoc (inspect-library world) :sources [source])
                                     (:name source) "captured-event")))}

   {:pattern #"^the user disables that source$"
    :handler (fn [world _ _]
               (assoc world :sources (mapv #(assoc % :enabled false) (:sources world))
                      :event-count-before-disabled-capture (count (:events world))))}

   {:pattern #"^no new events are captured from <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [source-key]]
               (let [after (add-captured-event world (value example source-key) "ignored")]
                 (support/assert! (= (:event-count-before-disabled-capture world)
                                     (count (:events after)))
                                  "Disabled source captured a new event." {})
                 after))}

   {:pattern #"^previously captured events retain source identity <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [source-key]]
               (support/assert! (some #(= (value example source-key) (:source-name %))
                                      (:events world))
                                "Disabling source changed captured events." {})
               world)}

   {:pattern #"^the user removes the source after confirmation$"
    :handler (fn [world _ _] (assoc world :sources []))}

   {:pattern #"^its configuration is removed without removing captured session events$"
    :handler (fn [world _ _]
               (support/assert! (and (empty? (:sources world)) (seq (:events world)))
                                "Removing source removed captured session events." {})
               world)}])

(defn source-foundation-step-covered? [text]
  (boolean
   (some (fn [{:keys [pattern]}] (re-matches pattern text))
         source-foundation-handlers)))

(def handlers
  source-foundation-handlers)

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T14:28:27.90184122+02:00", :module-hash "-1907499002", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1936792300"} {:id "def/required-library-contract", :kind "def", :line 5, :end-line nil, :hash "-125943996"} {:id "def/lifecycle-contracts", :kind "def", :line 12, :end-line nil, :hash "2043582087"} {:id "def/canonical-captured-event", :kind "def", :line 24, :end-line nil, :hash "-1503857037"} {:id "def/canonical-normalized-inputs", :kind "def", :line 29, :end-line nil, :hash "-1130134560"} {:id "def/canonical-provenance-fixture", :kind "def", :line 39, :end-line nil, :hash "-1891593639"} {:id "def/canonical-adapter-capabilities", :kind "def", :line 44, :end-line nil, :hash "1563000415"} {:id "def/canonical-source-times", :kind "def", :line 48, :end-line nil, :hash "-1281790755"} {:id "def/canonical-capture-times", :kind "def", :line 49, :end-line nil, :hash "-272046131"} {:id "def/canonical-queue-sources", :kind "def", :line 51, :end-line nil, :hash "254022233"} {:id "def/canonical-observation-adapters", :kind "def", :line 55, :end-line nil, :hash "882066214"} {:id "def/canonical-source-statuses", :kind "def", :line 56, :end-line nil, :hash "-147906546"} {:id "def/canonical-filter", :kind "def", :line 59, :end-line nil, :hash "128685613"} {:id "def/canonical-reusable-source", :kind "def", :line 62, :end-line nil, :hash "11704306"} {:id "def/canonical-added-source", :kind "def", :line 64, :end-line nil, :hash "-1092958663"} {:id "def/canonical-managed-source", :kind "def", :line 66, :end-line nil, :hash "2058889750"} {:id "defn/observability-library?", :kind "defn", :line 68, :end-line nil, :hash "-2061695907"} {:id "defn-/inspect-library", :kind "defn-", :line 71, :end-line nil, :hash "-1002374162"} {:id "defn-/value", :kind "defn-", :line 86, :end-line nil, :hash "1331618860"} {:id "defn-/words", :kind "defn-", :line 89, :end-line nil, :hash "-1981763742"} {:id "defn-/source-id", :kind "defn-", :line 92, :end-line nil, :hash "-1991612144"} {:id "defn-/source", :kind "defn-", :line 95, :end-line nil, :hash "-369001057"} {:id "defn-/event", :kind "defn-", :line 106, :end-line nil, :hash "-818793242"} {:id "defn-/normalize-input", :kind "defn-", :line 121, :end-line nil, :hash "-1431178384"} {:id "defn-/add-captured-event", :kind "defn-", :line 131, :end-line nil, :hash "-641934483"} {:id "def/source-foundation-handlers", :kind "def", :line 139, :end-line nil, :hash "-572805242"} {:id "defn/source-foundation-step-covered?", :kind "defn", :line 625, :end-line nil, :hash "-1009225973"} {:id "def/handlers", :kind "def", :line 630, :end-line nil, :hash "-462853513"}]}
;; clj-mutate-manifest-end
