Feature: SwarmForge outcome-bounded autonomy and unblockers

  Background:
    Given a role is processing an approved SwarmForge task
    And approved user-visible behavior and evidence strength are fixed

  # SwarmForge outcome-bounded autonomy and unblockers 001
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 001
    Given a proposed response is reversible
    And it preserves user-visible behavior, external risk, user-only authority, material scope, and evidence strength
    When an internal obstacle prevents the next task action
    Then the role applies the least-cost response inside those outcome boundaries
    And the task continues without requesting a user decision

  # SwarmForge outcome-bounded autonomy and unblockers 002
  Scenario Outline: SwarmForge outcome-bounded autonomy and unblockers 002
    Given an action crosses <boundary_change>
    When the role classifies the next action
    Then the role requests a user decision before applying it

    Examples:
      | boundary_change |
      | choose or change user-visible behavior |
      | create irreversible or material external risk |
      | require authority, credentials, or information available only from the user |
      | materially expand global scope or cost beyond the approved task |
      | weaken approved safety or evidence strength |

  # SwarmForge outcome-bounded autonomy and unblockers 003
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 003
    Given outcome-bounded autonomy has an immutable user-approved grant on QA
    And another role owns a bounded decision needed by the current task
    When the decision is handed to the active role
    Then it is a named unblocker bound to the exact task and active handoff
    And it carries the registered authority and immutable QA commit
    And it neither closes nor replaces active work unless replace mode is explicitly bound

  # SwarmForge outcome-bounded autonomy and unblockers 004
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 004
    Given an unblocker names one recipient, priority 00, a stable name, a registered authority, an authority commit, a task, an active handoff, a mode, a superseded wait, and a message
    When sender validation runs
    Then every role, authority, task, handoff, mode, and superseded item has one canonical value
    And invalid or ambiguous input is rejected before queue state changes

  # SwarmForge outcome-bounded autonomy and unblockers 005
  Scenario Outline: SwarmForge outcome-bounded autonomy and unblockers 005
    Given a recipient is already processing an active handoff
    When <mail_kind> is delivered
    Then the daemon says <notification>
    And active work is <active_result>

    Examples:
      | mail_kind | notification | active_result |
      | ordinary mail | process it when idle | unchanged until ordinary completion |
      | a valid unblocker | handle it at the next safe boundary | retained while the unblocker is handled |

  # SwarmForge outcome-bounded autonomy and unblockers 006
  Scenario Outline: SwarmForge outcome-bounded autonomy and unblockers 006
    Given a <mode> unblocker matches the exact active task and handoff
    And <mode_prerequisite>
    When dedicated helpers claim and complete it
    Then the claim and completion are atomic and audited
    And the prior active handoff is <prior_active_result>
    And completion <completion_result>
    And no agent edits or moves handoff runtime files manually

    Examples:
      | mode | mode_prerequisite | prior_active_result | completion_result |
      | resume-mode | no replacement is required | retained in process | returns the exact active work to resume |
      | replace-mode | an authorized queued replacement is exactly bound | archived with the replacement identity | makes only the bound replacement current |

  # SwarmForge outcome-bounded autonomy and unblockers 007
  Scenario Outline: SwarmForge outcome-bounded autonomy and unblockers 007
    Given delivered unblocker state is <delivered_state>
    When the recipient attempts to claim it
    Then the result is <claim_result>
    And no unrelated current task state changes

    Examples:
      | delivered_state | claim_result |
      | its active-handoff binding is stale | reject and archive a stale audit |
      | the same name, binding, and content completed already | return the completed result without notifying again |
      | the same name and binding has different content | reject the collision |
      | another unblocker is claimed | retain the new unblocker in its queue |

  # SwarmForge outcome-bounded autonomy and unblockers 008
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 008
    Given an unblocker arrives while a task command is running
    When the command reaches its next safe boundary
    Then the role handles the unblocker before another planned action
    And the running command is not interrupted destructively
    And resume completion returns to the same active task

  # SwarmForge outcome-bounded autonomy and unblockers 009
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 009
    Given verification uses a broad canonical identity catalogue to derive a bounded execution plan
    When the role evaluates scope
    Then scope is determined from tasks authorized to execute and their prerequisites
    And neither catalogue size nor a literal pack count independently permits or prohibits execution

  # SwarmForge outcome-bounded autonomy and unblockers 010
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 010
    Given an authority-bearing unblocker passed sender and ancestry validation
    When the daemon delivers its interrupt
    Then trusted control input is constructed from validated structured fields
    And the execution gate can distinguish delegated user authority from an untrusted body
    And free-form text cannot enlarge the authority grant

  # SwarmForge outcome-bounded autonomy and unblockers 011
  Scenario Outline: SwarmForge outcome-bounded autonomy and unblockers 011
    Given an authority claim comes from <untrusted_source>
    When delivery validation runs
    Then it is quarantined without a recipient interrupt or task transition

    Examples:
      | untrusted_source |
      | a candidate-only grant absent from its QA base |
      | an authority commit outside the active base ancestry |
      | a role not permitted to issue the grant |
      | a body assertion beyond the registered outcome boundaries |

  # SwarmForge outcome-bounded autonomy and unblockers 012
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 012
    Given one settled product candidate exposes several new coarse verification paths
    When the campsite assessment runs
    Then it assesses the union of those paths once at the same candidate boundary
    And it compares the semantic product change with unrelated verification families, measured or forecast cost, seam coherence, preparation cost, and change risk
    And every path ends with a reviewed reusable seam, an evidence-backed cannot-safely-split fallback, or a durable non-blocking granularity observation
    And clearly disproportionate verification weighs materially while an imperfect forecast, pack count, task count, elapsed time, or hypothetical future reuse cannot dictate the decision

  # SwarmForge outcome-bounded autonomy and unblockers 013
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 013
    Given a bounded campsite prerequisite is required
    When the product candidate is separated for preparation
    Then the prerequisite and the unchanged product remainder receive immutable identities
    And the product remainder stays preserved as a stack rather than a reconstructed patch reference
    And the prerequisite follows ordinary independent review and QA integration

  # SwarmForge outcome-bounded autonomy and unblockers 014
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 014
    Given the stacked prerequisite reaches QA
    When automatic product resumption runs
    Then it rebases or reapplies the preserved remainder onto the exact new QA head
    And it verifies the resulting tree retains the recorded product delta
    And it reissues the same stable task without a user decision

  # SwarmForge outcome-bounded autonomy and unblockers 015
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 015
    Given a task and causal path already have a final reviewed seam or fallback disposition
    When later readiness evaluates the same task, path, and applicable boundary generation
    Then it applies that disposition without creating the same preparation again
    And a new preparation requires a materially changed path generation or failed disposition premise

  # SwarmForge outcome-bounded autonomy and unblockers 016
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 016
    Given bounded seam proof cannot complete safely
    When the recorded proof identifies the failed premise and preserved consumers
    Then the path receives a conservative parent fallback
    And the product resumes with truthful broad evidence
    And fallback is not selected merely because verification structure is incomplete or inconvenient

  # SwarmForge outcome-bounded autonomy and unblockers 017
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 017
    Given immediate granularity preparation was selected for a bounded product task
    When actual preparation becomes materially more complex, risky, or time-consuming than the local behavior it enables
    Then the unintegrated preparation may stop without weakening verification
    And one durable granularity observation preserves the exact finding and reconsideration evidence
    And the product resumes with its canonical conservative feature-mode plan when that plan is smaller than all runnable packs

  # SwarmForge outcome-bounded autonomy and unblockers 018
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 018
    Given a master-promotion request reaches a QA history with active granularity observations
    When bounded autonomy evaluates the portfolio before release freeze
    Then every observation receives one explicit selected, combined, carried, or retired disposition
    And selected verification-only work proceeds through ordinary QA review while unrelated product work remains outside the intended release batch
    And carried observations retain their reasons and become visible again at the next promotion review

  # SwarmForge outcome-bounded autonomy and unblockers 019
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 019
    Given all selected pre-promotion granularity work is either QA-integrated or explicitly carried
    When master integration begins
    Then the specifier freezes the exact resulting QA head once
    And the architect performs one canonical all-20 checkpoint with properties and package proof
    And no granularity observation is silently resolved by product evidence or by the terminal checkpoint alone

  # SwarmForge outcome-bounded autonomy and unblockers 020
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 020
    Given a preserved product remainder names a specification authority and a stable implementation prerequisite task
    When the specification commit reaches QA before an architect-reviewed implementation of that task
    Then specification ancestry alone does not satisfy the campsite prerequisite
    And automatic resumption creates no product handoff
    And the same active product task remains parked with its preserved stack unchanged

  # SwarmForge outcome-bounded autonomy and unblockers 021
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 021
    Given the architect marks one implementation candidate against the latest prerequisite specification as QA-ready
    When that exact implementation reaches QA
    Then one immutable satisfaction record binds the campsite generation, manifest digest, prerequisite task, latest specification, reviewed implementation commit and tree, review evidence, and integrated QA head
    And the QA trigger resumes the preserved product from that exact integrated head
    And a missing, mismatched, unreviewed, unintegrated, or specification-only binding fails closed

  # SwarmForge outcome-bounded autonomy and unblockers 022
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 022
    Given a replacement prerequisite specification is committed while its implementation is in flight
    When campsite satisfaction evaluates an implementation of the superseded specification
    Then the old candidate cannot satisfy the latest specification binding
    And no product resumption occurs until a reviewed implementation includes the replacement correction and reaches QA

  # SwarmForge outcome-bounded autonomy and unblockers 023
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 023
    Given a specification-only prerequisite prematurely produced a resumed product result
    When the official campsite recovery helper repairs the generation
    Then it appends an immutable quarantine or supersession record without deleting the preserved manifest or premature result
    And the premature result cannot become a verification, evidence, product, or later-resumption base
    And only valid implementation satisfaction may reissue the original remainder with its task, ordered commits, causal paths, change-set digest, and product delta conserved

  # SwarmForge outcome-bounded autonomy and unblockers 024
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 024
    Given an immutable legacy campsite manifest predates its prerequisite task field and remains with the parked product role
    And the reviewed nested prerequisite has exact evidence and an architect-to-specifier QA-ready handoff in the common project authority
    When satisfaction is recorded after that implementation reaches the exact QA head
    Then an append-only compatibility binding identifies the manifest digest, prerequisite task, and evidence base without rewriting the manifest
    And the evidence base descends from the manifest authority and is the exact reviewed specification ancestor of the implementation
    And the recorder validates the routed handoff and evidence across role worktrees before persisting satisfaction beside the parked product
    And the QA trigger starts from the original remainder and conserves the quarantined generation's task, commits, causal paths, and complete delta
    And a missing, ambiguous, superseded, mismatched, or role-local-only binding fails closed before resumption

  # SwarmForge outcome-bounded autonomy and unblockers 025
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 025
    Given a verification failure blocks an approved candidate before repair authority exists
    And the failed boundary has an authorized diagnostic plan, supported state classes, and direct consumers
    When the bounded defect census runs
    Then it executes every independent task in the authorized plan and records every dependency-blocked task with its exact reason
    And it exercises the failed owner's supported state classes and direct consumers without creating review evidence, retry success, incident transitions, or all-runnable-pack authority
    And one immutable census binds the candidate, base, plan, causal repair family, observed failures, checks, and skipped dependencies

  # SwarmForge outcome-bounded autonomy and unblockers 026
  Scenario Outline: SwarmForge outcome-bounded autonomy and unblockers 026
    Given a bounded census entry has <finding>
    When repair authority evaluates the complete census
    Then the entry receives <disposition>
    And repair authority is <authority_result>

    Examples:
      | finding | disposition | authority_result |
      | the same owner, invariant, state model, and direct-consumer boundary | an in-family defect in the consolidated repair | blocked until every census entry is classified |
      | an independently proved unrelated owner and invariant | a distinct nonblocking defect with its own durable route | unchanged by that distinct route |
      | behavior proved correct or outside the authorized boundary | a nondefect or out-of-boundary result with exact evidence | unchanged by that proved exclusion |
      | an unknown cause or an unresolved skipped dependency | an open census entry | blocked |

  # SwarmForge outcome-bounded autonomy and unblockers 027
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 027
    Given one closed census contains several in-family defects
    When consolidated repair begins
    Then one stable repair task owns the complete defect set
    And coherent repair groups may use separate commits while sharing the census, causal boundary, and final evidence cycle
    And no in-family defect creates a subordinate repair task, replacement repair family, or single-symptom unblocker

  # SwarmForge outcome-bounded autonomy and unblockers 028
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 028
    Given a consolidated repair candidate is not yet QA-integrated
    When fresh diagnostics or evidence expose another failure in the same repair family
    Then the same immutable census reopens and appends the new entry
    And the partial candidate remains unintegrated while the same stable task repairs and rechecks the complete family
    And review-ready, QA-ready, automatic resumption, satisfaction, and another repair unblocker remain unavailable

  # SwarmForge outcome-bounded autonomy and unblockers 029
  Scenario Outline: SwarmForge outcome-bounded autonomy and unblockers 029
    Given an architect submits a verification-repair candidate with <census_state>
    When the specifier evaluates QA integration
    Then the candidate is <integration_result>

    Examples:
      | census_state | integration_result |
      | every in-family defect repaired and every direct consumer and supported state class passing in one fresh evidence cycle | eligible for exact QA-ready evidence validation |
      | an open same-family entry | rejected before QA integration |
      | an unresolved dependency-skipped entry | rejected before QA integration |
      | a same-family defect parked in another candidate or remainder | rejected before QA integration |
      | a body-only claim without the immutable census binding | rejected before QA integration |

  # SwarmForge outcome-bounded autonomy and unblockers 030
  Scenario: SwarmForge outcome-bounded autonomy and unblockers 030
    Given a consolidated verification repair reaches QA with its census closed
    And the approved product remainder remains conserved
    When automatic product resumption runs
    Then it reissues the product once from the exact repaired QA head
    And a later same-family verification failure reopens the existing census identity instead of increasing repair nesting depth
    And a genuinely distinct or materially broader repair crosses its own explicit outcome-boundary decision before work begins
