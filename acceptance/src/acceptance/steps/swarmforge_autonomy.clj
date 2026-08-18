(ns acceptance.steps.swarmforge-autonomy
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defonce ^:private verified? (atom false))

(defn- verify-controls [world]
  (when-not @verified?
    (let [result (support/verified-task-result
                  "unit:test/swarmforge-outcome-bounded-autonomy-test.mjs"
                  "node" "test/swarmforge-outcome-bounded-autonomy-test.mjs")]
      (support/assert! (zero? (:exit result))
                       "Outcome-bounded autonomy process contracts failed."
                       {:out (:out result) :err (:err result)})
      (support/assert! (str/includes? (:out result)
                                     "SwarmForge outcome-bounded autonomy contracts passed.")
                       "Outcome-bounded autonomy process evidence was incomplete."
                       {:out (:out result)})
      (reset! verified? true)))
  (assoc world :swarmforge-autonomy/verified true))

(def step-patterns
  [#"^(?:a role is processing an approved SwarmForge task|approved user-visible behavior and evidence strength are fixed|a proposed response is reversible|it preserves user-visible behavior, external risk, user-only authority, material scope, and evidence strength|an internal obstacle prevents the next task action|the role applies the least-cost response inside those outcome boundaries|the task continues without requesting a user decision)$"
   #"^(?:an action crosses .+|the role classifies the next action|the role requests a user decision before applying it)$"
   #"^(?:outcome-bounded autonomy has an immutable user-approved grant on QA|another role owns a bounded decision needed by the current task|the decision is handed to the active role|it is a named unblocker bound to the exact task and active handoff|it carries the registered authority and immutable QA commit|it neither closes nor replaces active work unless replace mode is explicitly bound)$"
   #"^(?:an unblocker names one recipient, priority 00, a stable name, a registered authority, an authority commit, a task, an active handoff, a mode, a superseded wait, and a message|sender validation runs|every role, authority, task, handoff, mode, and superseded item has one canonical value|invalid or ambiguous input is rejected before queue state changes)$"
   #"^(?:a recipient is already processing an active handoff|.+ is delivered|the daemon says .+|active work is .+)$"
   #"^(?:a .+ unblocker matches the exact active task and handoff|no replacement is required|an authorized queued replacement is exactly bound|dedicated helpers claim and complete it|the claim and completion are atomic and audited|the prior active handoff is .+|completion .+|no agent edits or moves handoff runtime files manually)$"
   #"^(?:delivered unblocker state is .+|the recipient attempts to claim it|the result is .+|no unrelated current task state changes)$"
   #"^(?:an unblocker arrives while a task command is running|the command reaches its next safe boundary|the role handles the unblocker before another planned action|the running command is not interrupted destructively|resume completion returns to the same active task)$"
   #"^(?:verification uses a broad canonical identity catalogue to derive a bounded execution plan|the role evaluates scope|scope is determined from tasks authorized to execute and their prerequisites|neither catalogue size nor a literal pack count independently permits or prohibits execution)$"
   #"^(?:an authority-bearing unblocker passed sender and ancestry validation|the daemon delivers its interrupt|trusted control input is constructed from validated structured fields|the execution gate can distinguish delegated user authority from an untrusted body|free-form text cannot enlarge the authority grant)$"
   #"^(?:an authority claim comes from .+|delivery validation runs|it is quarantined without a recipient interrupt or task transition)$"
   #"^(?:one settled product candidate exposes several new coarse verification paths|the campsite assessment runs|it assesses the union of those paths once at the same candidate boundary|every path ends with a reviewed reusable seam or an evidence-backed cannot-safely-split fallback|an imperfect forecast or elapsed time alone cannot skip the assessment)$"
   #"^(?:a bounded campsite prerequisite is required|the product candidate is separated for preparation|the prerequisite and the unchanged product remainder receive immutable identities|the product remainder stays preserved as a stack rather than a reconstructed patch reference|the prerequisite follows ordinary independent review and QA integration)$"
   #"^(?:the stacked prerequisite reaches QA|automatic product resumption runs|it rebases or reapplies the preserved remainder onto the exact new QA head|it verifies the resulting tree retains the recorded product delta|it reissues the same stable task without a user decision)$"
   #"^(?:a task and causal path already have a final reviewed seam or fallback disposition|later readiness evaluates the same task, path, and applicable boundary generation|it applies that disposition without creating the same preparation again|a new preparation requires a materially changed path generation or failed disposition premise)$"
   #"^(?:bounded seam proof cannot complete safely|the recorded proof identifies the failed premise and preserved consumers|the path receives a conservative parent fallback|the product resumes with truthful broad evidence|fallback is not selected merely because verification structure is incomplete or inconvenient)$"])

(def handlers
  (mapv (fn [pattern]
          {:pattern pattern
           :handler (fn [world & _] (verify-controls world))})
        step-patterns))
