(ns acceptance.verification-support.modular-architecture-vtd014-style-authorization)

(defn selected-scope? [expected evidence]
  (and (= expected (:expectedScope evidence))
       (= expected (:selected evidence))
       (or (= expected "no task launch")
           (and (:plannerInvoked evidence)
                (:reviewEvidencePath evidence)))))

(defn authorized? [expected evidence]
  (case expected
    "owner and declared consumers"
    (contains? #{"flow_graph" "flow_graph and shell"} (:selected evidence))

    "bounded style smoke"
    (and (= "declared QA targets" (:selected evidence))
         (seq (:styleSmokeTargets evidence)))

    "no task launch"
    (= "no task launch" (:selected evidence))

    false))

(defn qa-ready-not-terminal? [intents]
  (and (= "review-evidence" (:review intents))
       (= "terminal" (:terminal intents))
       (not= (:review intents) (:terminal intents))))
