# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-18T19:11:36.784085194Z","feature_name":"Settled candidate final verification","feature_path":"features/settled-candidate-final-verification.feature","background_hash":"457aa173de9975d95c3bbe1656f520ac7779781798e2841a293f33f20cf4a8d1","implementation_hash":"sha256:4230e903a71795b47def1b4540a3e15b71d7b901e25cfcdf3e2ff163b6cec5bc","scenarios":[{"index":2,"name":"Settled candidate final verification 003","scenario_hash":"7f32214ce3c4fd499fde7bab3467b62ca640ccf2f80d6c89af6e0e9aca7d4385","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-08-18T19:08:51.407339587Z"},{"index":4,"name":"Settled candidate final verification 005","scenario_hash":"3e0f43fa326d0a3e1ba9b4539be3973357a037b6849c382b65789f8b432f821d","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-08-18T19:08:51.407339587Z"},{"index":5,"name":"Settled candidate final verification 006","scenario_hash":"fe81aea43a4baf6665d6a0b6f6c50e4650dbee6163d039935229c5fe28fb522b","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-08-18T19:08:51.407339587Z"},{"index":16,"name":"Settled candidate final verification 017","scenario_hash":"090474b6d1742648e118658bb746e0005b5650ccb44e3e9f14c9106c84aa953e","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-08-18T19:08:51.407339587Z"}]}
# acceptance-mutation-manifest-end

Feature: Settled candidate final verification

  Background:
    Given one user-approved task has a specification commit and a stable task name

  # Settled candidate final verification 001
  Scenario Outline: Settled candidate final verification 001
    Given <review_role> receives a candidate that may still change
    When that role completes <review_work>
    Then the role runs only focused checks that can observe its changes
    And the candidate advances as review-ready to <next_role>
    And review-ready evidence records the task, base, candidate, changed paths, focused scope, result, and timestamps
    And the candidate does not claim final regression evidence

    Examples:
      | review_role | review_work                         | next_role  |
      | coder       | implementation and focused repair  | refactorer |
      | refactorer  | structure and property review      | architect  |

  # Settled candidate final verification 002
  Scenario: Settled candidate final verification 002
    Given the architect has completed architecture review, applicable quality analysis, focused checks, and every resulting repair on one candidate tree
    When the architect seals that tree for QA integration
    Then the role runs only focused checks that can observe its changes
    And only that exact tree may receive a QA-ready handoff with bound focused evidence
    And the specifier may fast-forward that exact tree into QA
    And no full regression or master completion is claimed

  # Settled candidate final verification 003
  Scenario Outline: Settled candidate final verification 003
    Given a sealed candidate has passing final verification evidence
    When <later_change> occurs before master promotion
    Then the evidence effect is <evidence_effect>
    And the required next action is <required_action>

    Examples:
      | later_change                                                        | evidence_effect                         | required_action                                      |
      | production, test, build, registry, runner, or workflow input changes | final evidence is invalid               | settle the changed tree and run all 20 packs freshly |
      | documentation-only recording preserves every bound identity          | final product evidence remains eligible | promote or integrate without another product run     |

  # Settled candidate final verification 004
  Scenario: Settled candidate final verification 004
    Given one task in the fresh final run fails
    When the exact cause is recorded, repaired, and proved with its smallest causal regression
    Then the changed candidate runs all 20 packs with properties and the package check freshly
    And the failed result remains recorded
    And no retry, lower-concurrency run, carried passing leaf, or unrelated receipt can turn the failure green

  # Settled candidate final verification 005
  Scenario Outline: Settled candidate final verification 005
    Given a candidate is review-ready without passing final evidence
    When <requested_action> is requested
    Then the workflow result is <workflow_result>

    Examples:
      | requested_action                                  | workflow_result                                   |
      | focused refactorer or architect review            | permit the next named review role                 |
      | QA integration after an exact architect QA-ready handoff | permit only the QA fast-forward              |
      | integration into master                           | block because final evidence is absent             |
      | completion broadcast to the specifier             | block because final evidence is absent             |
      | promotion of another task or base receipt as final | block because its bound identity does not match    |

  # Settled candidate final verification 006
  Scenario Outline: Settled candidate final verification 006
    Given the historical <lineage> used <successful_full_runs> successful full runs before safety completion
    When the same role changes are scheduled through settled candidate final verification
    Then focused checks run while the candidate is changing
    And one successful full run occurs after the last review change
    And the modeled avoided successful full runs are <avoided_full_runs>

    Examples:
      | lineage                    | successful_full_runs | avoided_full_runs |
      | Command Palette controller | 3                    | 2                  |
      | workspace-tabs controller  | 2                    | 1                  |

  # Settled candidate final verification 007
  Scenario: Settled candidate final verification 007
    Given approval, role handoffs, verification receipts, repairs, and integration already have durable timestamps
    When a VTD-015 delivery or its next applicable slice completes
    Then the scorecard reports approval-to-integration time and elapsed role intervals
    And it reports focused verification time, successful and invalidated full runs, failures, repairs, reruns, and final-gate time
    And it confirms every terminal evidence leaf and the package check remain present
    And a VTD slice adds zero to completed-feature count
    And the user receives a continue, adjust, or stop recommendation before another enabling slice is activated

  # Settled candidate final verification 008
  Scenario: Settled candidate final verification 008
    Given VTD-015 must change the workflow that governs its own delivery
    When the VTD-015 candidate moves through coder, refactorer, architect, and specifier
    Then its handoffs obey the previously integrated verification protocol
    And the new review-ready protocol remains inactive until VTD-015 is integrated
    And VTD-017 shared-artifact parallel execution is the first live payback measurement
    And no bootstrap exception bypasses current durable evidence or integration safety

  # Settled candidate final verification 009
  Scenario: Settled candidate final verification 009
    Given the user explicitly requests master integration and QA contains one or more QA-ready tasks after master
    When the specifier freezes the exact QA head as a release candidate based on current master
    Then the architect starts a clean release lineage at that exact candidate
    And one fresh canonical run executes all 20 packs with properties and the package check
    And its durable evidence binds the master base, release task, candidate tree, complete plan, artifact, toolchain, receipt, and timestamps
    And only that passing sealed tree may advance master
    And QA and master finish on the same verified commit

  # Settled candidate final verification 010
  Scenario: Settled candidate final verification 010
    Given QA-integrated tasks and a master promotion have durable approval, handoff, receipt, and integration timestamps
    When the pilot scorecard is reported
    Then it reports approval-to-QA, QA queue, and approval-to-master time for every included feature
    And it accounts for every focused check, terminal attempt, failure, repair, revert, rerun, and the terminal cost per included task
    And it compares actual master-promotion time with the per-task terminal baseline
    And the user decides when another master integration phase begins

  # Settled candidate final verification 011
  Scenario Outline: Settled candidate final verification 011
    Given a QA feature slice approves focused scope <approved_scope>
    And its current candidate contains <candidate_change>
    When exact changed-path preflight selects <planned_scope> before any task launches
    Then <authorization_result>
    And the preflight reports the approved and planned packs, task count, critical-path estimate, expansion-causing paths, and remaining effort ceiling
    And no owned pack is omitted, no terminal result is claimed, and no task starts before authorization

    Examples:
      | approved_scope | candidate_change                                  | planned_scope         | authorization_result                                                                                              |
      | flow_graph     | only the approved Flow product and evidence paths | flow_graph            | the exact focused plan is authorized once                                                                         |
      | flow_graph     | an incidental shared verification-runner repair   | all 20 runnable packs | execution stops for a user choice to restore product scope or approve and integrate a standalone infrastructure slice |

  # Settled candidate final verification 012
  Scenario: Settled candidate final verification 012
    Given the architect has committed the last QA-candidate change
    And one focused plan can verify that exact tree and produce its review-ready receipt
    When QA-ready evidence is requested
    Then one evidence-producing invocation executes the focused plan and supplies the receipt used to record review-ready evidence
    And no preliminary invocation of the same plan is required for the same tree
    And the evidence binds the task, base, commit, tree, changed paths, plan, result, and timestamps
    And any later behavior, test, build, registry, runner, workflow, or mutation-metadata change requires one new evidence-producing invocation

  # Settled candidate final verification 013
  Scenario Outline: Settled candidate final verification 013
    Given the current candidate has an unresolved reliability incident with an eligible causal repair, deterministic regression, exact focused review-ready evidence, and package proof
    When a <readiness> handoff is evaluated in <integration_mode>
    Then the incident gate produces <gate_result>
    And a QA-eligible incident is recorded as terminal-verification-deferred with its failure, repair candidate and tree, regression, focused receipt, package receipt, and lineage intact
    And terminal-verification-deferred is neither incident resolution nor lineage abandonment
    And an unrepaired incident, failing regression, stale focused receipt, failing package, or changed bound identity remains blocking
    And a later feature candidate is not required to audit, reverify, mutate, copy, or re-defer that incident merely because its changed paths overlap incident inputs or its disposition is recorded on an abandoned parallel candidate
    And feature-mode incident work resumes only when ordinary focused work reproduces its diagnosed failure boundary or the approved slice intentionally changes its repair contract
    And only one passing master-integration all-20 checkpoint with properties and package proof resolves the deferred incident and supplies final evidence

    Examples:
      | readiness         | integration_mode    | gate_result                                                                     |
      | an approved specification | feature integration | permit coder start from current QA while retaining the ancestor deferral |
      | review-ready      | feature integration | permit the next named focused review and retain terminal verification deferred |
      | qa-ready          | feature integration | permit only QA integration and retain terminal verification deferred           |
      | release-candidate | master integration  | permit only architect terminal review of the frozen QA candidate               |
      | final-ready       | master integration  | block until the deferred incident is resolved by the exact terminal checkpoint |

  # Settled candidate final verification 014
  Scenario Outline: Settled candidate final verification 014
    Given a feature-integration candidate changes a stylesheet classified as <style_boundary>
    When exact changed-path preflight plans QA verification
    Then it authorizes <qa_verification>
    And it records terminal-full obligation <terminal_obligation>
    And QA-ready evidence cannot claim master regression proof

    Examples:
      | style_boundary                        | qa_verification              | terminal_obligation |
      | valid feature-local presentation      | owner and declared consumers | absent              |
      | valid feature-to-shell bridge         | owner and declared consumers | absent              |
      | shared global presentation foundation | bounded style smoke           | present             |
      | invalid or undeclared boundary         | no task launch                | absent              |

  # Settled candidate final verification 015
  Scenario: Settled candidate final verification 015
    Given the frozen QA release candidate contains one or more recorded style terminal obligations
    When the architect performs the one user-requested master-integration checkpoint
    Then all 20 runnable packs execute with properties and package proof on one sealed candidate
    And a passing final receipt consumes every matching style obligation and supplies final-ready evidence
    And a failure or behavior-bearing candidate change leaves the obligations active and requires the existing focused repair plus one fresh terminal checkpoint
    And no additional all-20 run is required for styling merely because the same passing receipt covered other accumulated QA work

  # Settled candidate final verification 016
  Scenario: Settled candidate final verification 016
    Given a user-approved QA feature names its development focus, QA impact, and likely shared integration surfaces
    When ownership readiness is evaluated before product coding
    Then a read-only intent plan reports current owners, consumers, planned packs, task estimate, and expansion-causing paths
    And no build, test, receipt, incident, evidence claim, Git change, or handoff is produced

  # Settled candidate final verification 017
  Scenario Outline: Settled candidate final verification 017
    Given ownership readiness classifies an approved feature as <classification>
    When the feature workflow selects its next stage
    Then the workflow routes to <next_stage>
    And no feature-mode all-20 run is authorized

    Examples:
      | classification        | next_stage                                                                                          |
      | bounded-ready         | product implementation starts from the approved QA base                                             |
      | granularity-assessment-required | bounded agent judgment selects a reviewed seam, preparation, observation, or parent fallback         |
      | coarse-within-pack    | bounded agent judgment selects a reviewed seam, preparation, observation, or parent fallback         |
      | coarse-boundary       | a standing-authorized ownership preparation stage starts without another routine user approval       |
      | genuinely-global      | implementation waits for current user or release direction                                          |
      | ownership-unavailable | implementation waits for ownership repair direction without inferring a narrower boundary           |
      | requirements-expanded | implementation waits for current user approval of the changed product or safety requirement          |

  # Settled candidate final verification 018
  Scenario Outline: Settled candidate final verification 018
    Given bounded agent judgment selected immediate <preparation_stage> for <planning_result>
    When its <preparation_stage> completes focused review
    Then the preparation is independently committed and integrated into QA from an architect QA-ready handoff
    And the product candidate has not implemented externally visible feature behavior
    And the already-approved product task restarts from that exact QA head without another product approval
    And the product evidence range cannot contain the <preparation_change> that narrows its own plan

    Examples:
      | planning_result                | preparation_stage                                  | preparation_change        |
      | a coarse ownership boundary    | standing-authorized ownership preparation          | ownership change          |
      | a coarse-within-pack boundary  | standing-authorized verification-slice preparation | verification-slice change |

  # Settled candidate final verification 019
  Scenario: Settled candidate final verification 019
    Given a coder has the first coherent committed candidate for an approved QA feature
    When exact candidate ownership is checked before a complete planned diagnostic or evidence run
    Then plan-only preflight uses the canonical Git change set and current and historical ownership
    And it executes no task and creates no receipt, incident, package, or evidence eligibility
    And an authorized settled candidate runs one property-enabled review-evidence plan after its final commit
    And an ordinary or dirty-tree diagnostic receipt cannot be recorded as review-ready evidence

  # Settled candidate final verification 020
  Scenario: Settled candidate final verification 020
    Given focused QA evidence used a declared shared boundary with a terminal-full obligation
    When later QA features proceed or the user requests master integration
    Then unrelated QA features neither resolve nor repeat the obligation
    And master integration applies the existing canonical final-verification procedure to the frozen candidate
    And matching passing terminal evidence changes the obligation state to consumed
    And unsuccessful terminal evidence or a behavior-bearing candidate change retains the active obligation

  # Settled candidate final verification 021
  Scenario Outline: Settled candidate final verification 021
    Given an approved feature's canonical preflight has <planning_result>
    When the feature workflow chooses whether to continue
    Then it performs <next_action>
    And no bounded forecast variance becomes a product-scope blocker
    And no feature-mode all-20 run is authorized

    Examples:
      | planning_result                                                     | next_action                                                                                          |
      | a bounded pack or task plan wider than the forecast                 | record the variance and continue with the canonical plan                                             |
      | a proved coarse-within-pack boundary judged worthwhile now          | QA-integrate one standing-authorized verification-slice preparation and resume the approved product  |
      | a materially disproportionate bounded plan whose preparation is not worthwhile now | record one durable granularity observation and continue with conservative verification |
      | a possible within-pack refinement without a proved safe slice       | record one durable granularity observation and continue with the conservative parent-pack closure    |
      | an all-pack coarse-boundary with exact owners and consumers         | QA-integrate the standing-authorized ownership preparation and resume the approved product            |
      | genuinely global, unavailable parent ownership, or changed requirements | wait for current user direction                                                                   |

  # Settled candidate final verification 022
  Scenario: Settled candidate final verification 022
    Given actual feature work proves a selected pack has a stable materially overbroad internal boundary
    When the standing verification-slice preparation validates that boundary
    Then the former parent-pack task closure equals its slices and conservative remainder
    And focused selection includes every applicable direct task, prerequisite, and consumer
    And exact-pack and terminal selection retain every former task exactly once
    And the preparation adds no product behavior, top-level pack, omitted assertion, or optional evidence

  # Settled candidate final verification 023
  Scenario: Settled candidate final verification 023
    Given accumulated QA work used one or more focused verification slices
    When the architect performs the one user-requested master-integration checkpoint
    Then the scorecard compares terminal-only failures with the focused slices selected for the accumulated work
    And a causal selection miss quarantines its slice to the parent-pack closure until a reviewed mapping repair reaches QA
    And a passing checkpoint records calibration without authorizing undeclared future narrowing
    And the same terminal checkpoint remains the only complete run required for the sealed candidate

  # Settled candidate final verification 024
  Scenario: Settled candidate final verification 024
    Given a coder's bounded judgment selects immediate preparation after intent or exact preflight reports a disproportionate plan
    When the automatic preparation route is activated
    Then the coder sends the specifier one authorized file-based note with the product task, QA base, causal paths, task families, proposed slice, and any stopped patch reference
    And the paused product handoff closes without a completed implementation claim
    And the specifier sends the derived verification-slice task from current QA without waiting for another user decision
    And architect QA-ready integration of that preparation causes the original stable product task to be reissued from the exact new QA head
    And every role uses the ordinary file-based handoff channel rather than reporting forecast variance as a user blocker

  # Settled candidate final verification 025
  Scenario: Settled candidate final verification 025
    Given a bounded feature plan is materially disproportionate to one local semantic change
    And immediate refinement is judged more complex, risky, or time-consuming than the behavior it enables
    When the feature proceeds with canonical conservative verification
    Then one durable granularity observation records the exact mismatch and judgment without changing product scope
    And the observation does not narrow the current evidence plan or authorize an all-20 feature run
    And preparation may be reconsidered from measured later evidence without assuming a roadmap or predicted touch frequency

  # Settled candidate final verification 026
  Scenario: Settled candidate final verification 026
    Given the user requests master promotion while QA ancestry contains active granularity observations
    When the specifier performs the pre-promotion portfolio review
    Then new unrelated product handoffs stop while QA remains mutable only for selected verification-only hardening
    And every active observation is explicitly selected, combined, carried with a reason, or retired with evidence
    And selection uses observed semantic mismatch, occurrences, verification wall time and failure surface, seam coherence, implementation and evidence cost, and change risk
    And no roadmap, pack count, task count, elapsed time, or hypothetical future touch frequency decides by itself

  # Settled candidate final verification 027
  Scenario: Settled candidate final verification 027
    Given the pre-promotion portfolio selected one or more bounded granularity refinements
    When those refinements complete ordinary focused QA review
    Then only architect QA-ready refinements advance QA before release freeze
    And every unselected or unsuccessful observation retains an explicit portfolio disposition
    And the specifier freezes the resulting exact QA head once and sends that release candidate directly to the architect
    And the architect runs the ordinary single all-20 checkpoint with properties and package proof on that sealed candidate

  # Settled candidate final verification 028
  Scenario: Settled candidate final verification 028
    Given a completed review-evidence receipt contains valid eligible-repair admissions and fresh package proof
    When review-ready evidence is recorded
    Then one durable transaction binds the receipt, review-ready record, and terminal-verification-deferred disposition for every admitted incident
    And recording revalidates the exact candidate, repair digests, selected coverage, fresh task results, plan, toolchain, artifact, and package identities under one canonical lock order
    And the transaction is committed only when the review-ready record and every matching incident disposition are durable
    And each incident remains unresolved with its immutable failure and repair history intact
    And handoff validation performs no late incident mutation

  # Settled candidate final verification 029
  Scenario Outline: Settled candidate final verification 029
    Given eligible-repair recording was interrupted with <durable_state>
    When the same record-review command is invoked with the exact receipt, base, task, and candidate
    Then transaction recovery produces <recovery_result>
    And review-ready and QA-ready handoffs remain blocked until the transaction is committed
    And recovery never duplicates an incident transition or review-ready record

    Examples:
      | durable_state                                      | recovery_result                                                   |
      | only the prepared transaction journal              | write every bound record and commit the transaction               |
      | the review-ready record but no incident disposition | write every missing matching disposition and commit the transaction |
      | every incident disposition but no review-ready record | write the missing review-ready record and commit the transaction |
      | both exact records and an uncommitted journal       | validate both records and mark the transaction committed          |
      | a stale, changed, missing, or conflicting bound record | block without publishing or replacing evidence                 |

  # Settled candidate final verification 030
  Scenario: Settled candidate final verification 030
    Given eligible-repair admission recording has one committed exact transaction
    When review-ready and QA-ready handoffs validate that candidate
    Then both routes require the matching review-ready evidence, transaction id, and terminal-verification-deferred dispositions
    And they remain focused claims that permit only the next review or QA fast-forward
    And no coder, refactorer, or feature-mode architect can request an all-20 fallback through admission
    And the incident is resolved only by the passing canonical all-20 properties and package checkpoint during explicitly requested master integration
