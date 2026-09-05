(ns acceptance.steps.serena-toolchain-preparation
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/serena-toolchain-ownership-preparation.feature"])
(defonce evidence (atom nil))

(defn- command-evidence [file key]
  (let [result (support/verified-command-result "node" file)
        payload (support/json-observation (:out result) key)]
    (support/assert! (and (zero? (:exit result)) payload)
                     "Optional toolchain production contract failed." {:file file :result result})
    payload))

(defn- verified-evidence! []
  (or @evidence
      (let [pins (command-evidence "test/development-toolchain-test.mjs" :developmentToolchain)
            runtime (command-evidence "test/development-toolchain-runtime-test.mjs" :developmentToolchainRuntime)
            ownership (command-evidence "test/development-toolchain-ownership-test.mjs" :developmentToolchainOwnership)
            resumption (support/verified-command-result "node" "test/stacked-campsite-control-test.mjs")]
        (support/assert! (zero? (:exit resumption)) "Reviewed resumption contracts failed." resumption)
        (reset! evidence {:pins pins :runtime runtime :ownership ownership :resumption true}))))

(defn- relations [observed]
  [{:keys ["condition" "result"]
    :rows #{["one valid optional pin from the subordinate fragment" "that exact pin and its authority source"]
            ["a requested optional name has no pin" "a missing-pin error"]
            ["an optional pin is invalid" "an invalid-pin error"]
            ["the fragment duplicates a core tool name" "an authority-conflict error"]
            ["the fragment uses an unknown schema" "a schema error"]}}
   {:keys ["operation" "action"]
    :rows #{["inspect the named optional tool" "offline inspection with an unavailable result"]
            ["explicitly provision a valid named optional tool" "only that tool's pinned provisioning operation"]
            ["provision without a tool name" "a nonzero request error before any download"]
            ["provision an unknown tool name" "a nonzero request error before any download"]}}
   {:keys ["core_state" "core_result"] :rows (set (get-in observed [:runtime :coreResults]))}
   {:keys ["path_kind" "selection"]
    :rows #{["an optional development-tool module" "its Shell slice, direct checks, and exact consumer closure"]
            ["the subordinate optional pin fragment" "its Shell slice, pin checks, and exact consumer closure"]
            ["the core runtime checker" "the existing global impact"]
            ["the core toolchain lock" "the existing global impact and core evidence identity binding"]}}
   {:keys ["status" "resumption"]
    :rows #{["only a committed preparation specification" "waiting for reviewed implementation"]
            ["an unreviewed implementation candidate" "waiting for reviewed implementation"]
            ["exact architect qa-ready proof integrated into QA with both causal path dispositions"
             "reissue the same pilot task from that QA head"]}}])

(defn- assertions [observed]
  (let [{:keys [pins runtime ownership resumption]} observed]
    {"the optional development-tool boundary is separate from core runtime authority" (:preservedCore ownership)
     "the original Serena pilot has no implementation delta" (:preservedCore ownership)
     "the composed toolchain has pin condition <condition>" (:pins pins)
     "the optional checker validates the requested tool" (:pins pins)
     "it reports <result>" (:pins pins)
     "it cannot override any pin in the core lock" (:pins pins)
     "an optional tool is absent locally" (:offlineInspection pins)
     "the optional entry point receives <operation>" (:dispatch runtime)
     "it attempts <action>" (:dispatch runtime)
     "it does not install any other tool" (:dispatch runtime)
     "the worker has core runtime state <core_state>" (:missingOptionalIndependent runtime)
     "its optional development tools are absent" (:missingOptionalIndependent runtime)
     "offline role startup performs strict runtime validation" (:missingOptionalIndependent runtime)
     "the core result remains <core_result>" (:missingOptionalIndependent runtime)
     "no optional download starts" (:offlineInspection pins)
     "the reviewed boundary receives a later change to <path_kind>" (:exactConsumers ownership)
     "canonical verification planning selects its impact" (:exactConsumers ownership)
     "it preserves <selection>" (:exactConsumers ownership)
     "the preparation adds a narrower optional-tool mapping" (:historicalUnion ownership)
     "its own canonical base and candidate plan is computed" (:historicalUnion ownership)
     "every required historical owner, prerequisite, consumer, and property is retained" (:historicalUnion ownership)
     "quarantine restrictions and terminal obligations remain in force" (:quarantine ownership)
     "neither core global declaration is removed or narrowed" (:preservedCore ownership)
     "a complete all-pack result remains blocked in feature mode" (:preservedCore ownership)
     "the independent preparation has status <status>" resumption
     "the original Serena pilot is considered for resumption" resumption
     "its resumption state is <resumption>" (and resumption (= 2 (:dispositions ownership)))}))

(defn- transition [world example captures {:keys [text]}]
  (let [observed (verified-evidence!)]
    (doseq [key (support/capture-placeholder-keys captures)] (support/require-example example key))
    (support/validate-example-relations! (relations observed) example "Unproved optional toolchain example.")
    (support/assert! (true? (get (assertions observed) text))
                     "Unproved optional toolchain step." {:step text})
    (assoc world :serena-preparation/active true)))

(def handlers
  (support/feature-scoped-stateful-handlers
   feature-files #(= % "the optional development-tool boundary is separate from core runtime authority")
   :serena-preparation/active transition))
