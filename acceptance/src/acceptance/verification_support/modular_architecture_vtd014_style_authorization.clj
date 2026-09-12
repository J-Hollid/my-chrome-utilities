(ns acceptance.verification-support.modular-architecture-vtd014-style-authorization
  (:require [acceptance.verification-support.modular-architecture-repository-inspection
             :as repository-inspection]))

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

(defn handlers [{:keys [example-values stylesheet-boundaries prepared values
                        style-evidence assert-world!]}]
  [{:pattern #"^(.+) has declared destination (.+), style classification (.+), owner (.+), consumers (.+), QA targets (.+), and scope root (.+)$"
    :handler (fn [world example captures]
               (let [source (first (values example-values example captures))
                     boundary (get stylesheet-boundaries source source)]
                 (assoc (prepared world) :vtd014/style-boundary boundary)))}
   {:pattern #"^a feature-integration candidate changes a stylesheet classified as (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/style-boundary
                      (first (values example-values example captures))))}
   {:pattern #"^exact changed-path preflight plans QA verification$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the QA plan selects (.+)$"
    :handler (fn [world example captures]
               (let [boundary (:vtd014/style-boundary world)
                     expected (first (values example-values example captures))
                     evidence (style-evidence world boundary)]
                 (assert-world! world (selected-scope? expected evidence)
                                "Stylesheet QA scope did not come from the production planner and evidence path.")))}
   {:pattern #"^it authorizes (.+)$"
    :handler (fn [world example captures]
               (let [boundary (:vtd014/style-boundary world)
                     expected (first (values example-values example captures))
                     evidence (style-evidence world boundary)]
                 (assert-world! world
                                (and (authorized? expected evidence)
                                     (= (:expectedScope evidence) (:selected evidence))
                                     (or (= expected "no task launch")
                                         (and (:plannerInvoked evidence)
                                              (:reviewEvidencePath evidence))))
                                "Stylesheet QA scope did not come from the production planner and evidence path.")))}
   {:pattern #"^(?:the plan records|it records) terminal-full obligation (.+)$"
    :handler (fn [world example captures]
               (let [boundary (:vtd014/style-boundary world)
                     expected (first (values example-values example captures))
                     evidence (style-evidence world boundary)]
                 (assert-world! world
                                (= (= "present" expected) (:terminalFullObligation evidence))
                                "Stylesheet terminal-full obligation does not match the production planner.")))}
   {:pattern #"^QA-ready evidence cannot claim master regression proof$"
    :handler (fn [world _ _]
               (let [intents (get-in world [:vtd014/evidence :runIntent :intents])]
                 (assert-world! world (qa-ready-not-terminal? intents)
                                "QA-ready stylesheet evidence broadened to master regression proof.")))}
   {:pattern #"^no all-20 feature-mode task launches$"
    :handler (fn [world _ _]
               (let [boundary (:vtd014/style-boundary world)
                     evidence (style-evidence world boundary)]
                 (assert-world! world
                                (and (map? evidence)
                                     (< (count (:selectedPackIds evidence))
                                        (repository-inspection/runnable-pack-count
                                         (:modular/registry world))))
                                "Feature-integration stylesheet planning broadened to the all-20 terminal scope.")))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-12T17:44:29.902669392+02:00", :module-hash "1785514082", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-340921163"} {:id "defn/selected-scope?", :kind "defn", :line 5, :end-line 10, :hash "430361795"} {:id "defn/authorized?", :kind "defn", :line 12, :end-line 24, :hash "-100097610"} {:id "defn/qa-ready-not-terminal?", :kind "defn", :line 26, :end-line 29, :hash "1860287431"} {:id "defn/handlers", :kind "defn", :line 31, :end-line 85, :hash "1793018418"}]}
;; clj-mutate-manifest-end
