(ns acceptance.verification-support.modular-architecture-vtd014-resolution-handlers
  (:require [acceptance.steps.support :as support]))

(defn- assert! [world predicate message]
  (support/assert! predicate message {:evidence (:vtd014/evidence world)})
  world)

(defn handlers [{:keys [prepared]}]
  [{:pattern #"^a causal reliability repair and its fresh focused regression have passed$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^one fresh canonical all-runnable-pack checkpoint and node scripts/package.mjs pass without reused tasks or another failure$"
    :handler (fn [world _ _]
               (let [resolution (get-in world [:vtd014/evidence :resolution])
                     runnable-count (get-in world [:vtd014/evidence :conservation :allPackCount])]
                 (assert! world (and (= runnable-count (:allPackCount resolution))
                                     (zero? (:reusedTaskCount resolution))
                                     (:packagePassed resolution))
                          "Reliability resolution did not use a fresh all-runnable-pack checkpoint and package.")))}
   {:pattern #"^the incident resolution binds .+$"
    :handler (fn [world _ _]
               (let [resolution (get-in world [:vtd014/evidence :resolution :evidence])]
                 (assert! world (and (= 64 (count (:failureDigest resolution)))
                                     (= 64 (count (:resolutionDigest resolution)))
                                     (:repairCommit resolution) (:repairTree resolution)
                                     (:causalCategory resolution) (:regression resolution)
                                     (:focusedReceipt resolution) (:checkpointReceiptSha256 resolution))
                          "Reliability resolution evidence is not completely bound.")))}
   {:pattern #"^Git-note verification recomputes every resolution link$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :resolution :archiveVerified]))
                        "Resolution archive links were not recomputed."))}
   {:pattern #"^the current candidate lineage has no unresolved incident or retry result awaiting repair$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :resolution :resolvedIncidentExcludedFromBlocking]))
                        "The resolved incident still blocks its candidate lineage."))}
   {:pattern #"^git_handoff is permitted while repair note handoffs remained available throughout the blocked state$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :resolution :handoffGate]))
                        "The resolved incident did not release the handoff gate."))}
   {:pattern #"^a later failure in a downstream role creates a new incident rather than reopening or hiding the resolved one$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :resolution :downstreamIncidentDistinct]))
                        "A later failure reused the resolved incident identity."))}])
