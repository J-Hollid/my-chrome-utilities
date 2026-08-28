(ns acceptance.steps.swarmforge-autonomy
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defonce ^:private verified? (atom false))

(defn- verify-task! [task command marker]
  (let [result (support/verified-task-result task "node" command)]
    (support/assert! (zero? (:exit result))
                     "Outcome-bounded autonomy process contracts failed."
                     {:out (:out result) :err (:err result)})
    (support/assert! (str/includes? (:out result) marker)
                     "Outcome-bounded autonomy process evidence was incomplete."
                     {:out (:out result)})))

(defn- verify-controls [world]
  (when-not @verified?
    (verify-task! "unit:test/swarmforge-outcome-bounded-autonomy-test.mjs"
                  "test/swarmforge-outcome-bounded-autonomy-test.mjs"
                  "SwarmForge outcome-bounded autonomy contracts passed.")
    (verify-task! "unit:test/stacked-campsite-control-test.mjs"
                  "test/stacked-campsite-control-test.mjs"
                  "Stacked campsite control contracts passed.")
    (reset! verified? true))
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
   #"^(?:one settled product candidate exposes several new coarse verification paths|the campsite assessment runs|it assesses the union of those paths once at the same candidate boundary|it compares the semantic product change with unrelated verification families, measured or forecast cost, seam coherence, preparation cost, and change risk|every path ends with a reviewed reusable seam, an evidence-backed cannot-safely-split fallback, or a durable non-blocking granularity observation|clearly disproportionate verification weighs materially while an imperfect forecast, pack count, task count, elapsed time, or hypothetical future reuse cannot dictate the decision)$"
   #"^(?:a bounded campsite prerequisite is required|the product candidate is separated for preparation|the prerequisite and the unchanged product remainder receive immutable identities|the product remainder stays preserved as a stack rather than a reconstructed patch reference|the prerequisite follows ordinary independent review and QA integration)$"
   #"^(?:the stacked prerequisite reaches QA|automatic product resumption runs|it rebases or reapplies the preserved remainder onto the exact new QA head|it verifies the resulting tree retains the recorded product delta|it reissues the same stable task without a user decision)$"
   #"^(?:a task and causal path already have a final reviewed seam or fallback disposition|later readiness evaluates the same task, path, and applicable boundary generation|it applies that disposition without creating the same preparation again|a new preparation requires a materially changed path generation or failed disposition premise)$"
   #"^(?:bounded seam proof cannot complete safely|the recorded proof identifies the failed premise and preserved consumers|the path receives a conservative parent fallback|the product resumes with truthful broad evidence|fallback is not selected merely because verification structure is incomplete or inconvenient)$"
   #"^(?:immediate granularity preparation was selected for a bounded product task|actual preparation becomes materially more complex, risky, or time-consuming than the local behavior it enables|the unintegrated preparation may stop without weakening verification|one durable granularity observation preserves the exact finding and reconsideration evidence|the product resumes with its canonical conservative feature-mode plan when that plan is smaller than all runnable packs)$"
   #"^(?:a master-promotion request reaches a QA history with active granularity observations|bounded autonomy evaluates the portfolio before release freeze|every observation receives one explicit selected, combined, carried, or retired disposition|selected verification-only work proceeds through ordinary QA review while unrelated product work remains outside the intended release batch|carried observations retain their reasons and become visible again at the next promotion review)$"
   #"^(?:all selected pre-promotion granularity work is either QA-integrated or explicitly carried|master integration begins|the specifier freezes the exact resulting QA head once|the architect performs one canonical all-20 checkpoint with properties and package proof|no granularity observation is silently resolved by product evidence or by the terminal checkpoint alone)$"
   #"^(?:a preserved product remainder names a specification authority and a stable implementation prerequisite task|the specification commit reaches QA before an architect-reviewed implementation of that task|specification ancestry alone does not satisfy the campsite prerequisite|automatic resumption creates no product handoff|the same active product task remains parked with its preserved stack unchanged)$"
   #"^(?:the architect marks one implementation candidate against the latest prerequisite specification as QA-ready|that exact implementation reaches QA|one immutable satisfaction record binds the campsite generation, manifest digest, prerequisite task, latest specification, reviewed implementation commit and tree, review evidence, and integrated QA head|the QA trigger resumes the preserved product from that exact integrated head|a missing, mismatched, unreviewed, unintegrated, or specification-only binding fails closed)$"
   #"^(?:a replacement prerequisite specification is committed while its implementation is in flight|campsite satisfaction evaluates an implementation of the superseded specification|the old candidate cannot satisfy the latest specification binding|no product resumption occurs until a reviewed implementation includes the replacement correction and reaches QA)$"
   #"^(?:a specification-only prerequisite prematurely produced a resumed product result|the official campsite recovery helper repairs the generation|it appends an immutable quarantine or supersession record without deleting the preserved manifest or premature result|the premature result cannot become a verification, evidence, product, or later-resumption base|only valid implementation satisfaction may reissue the original remainder with its task, ordered commits, causal paths, change-set digest, and product delta conserved)$"])

(def handlers
  (mapv (fn [pattern]
          {:pattern pattern
           :handler (fn [world & _] (verify-controls world))})
        step-patterns))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-18T21:01:19.179521772+02:00", :module-hash "-1331698334", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1706070967"} {:id "form/1/defonce", :kind "defonce", :line 5, :end-line 5, :hash "415811200"} {:id "defn-/verify-task!", :kind "defn-", :line 7, :end-line 14, :hash "-1193268447"} {:id "defn-/verify-controls", :kind "defn-", :line 16, :end-line 25, :hash "126552596"} {:id "def/step-patterns", :kind "def", :line 27, :end-line 46, :hash "-1208230721"} {:id "def/handlers", :kind "def", :line 48, :end-line 52, :hash "818799540"}]}
;; clj-mutate-manifest-end
