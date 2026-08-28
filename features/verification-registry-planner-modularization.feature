Feature: Verification registry and planner modularization

  Background:
    Given verification planning is bound to one candidate and its current and historical registries

  # Verification registry and planner modularization 001
  Scenario: Verification registry and planner modularization 001
    Given an unrelated untracked artifact is present outside the governed candidate inventory
    When routine registry validation and changed-path planning run
    Then the artifact changes neither validation status nor plan identity
    And the artifact is not assigned an owner, registered, ignored, moved, edited, or deleted

  # Verification registry and planner modularization 002
  Scenario Outline: Verification registry and planner modularization 002
    Given candidate path <candidate_path> has state <path_state>
    When candidate inventory and ownership are validated
    Then validation result is <validation_result>

    Examples:
      | candidate_path                         | path_state                       | validation_result                                    |
      | docs/operator-notes.xlsx               | untracked and not explicitly staged | ignored without changing the plan                 |
      | scripts/new-verification-policy.mjs    | explicitly staged and unowned    | blocked until one owner is declared                  |
      | scripts/new-verification-policy.mjs    | committed and owned               | included in current and historical planning          |
      | generated/undeclared-runtime-input.mjs | consumed by the build but unbound | blocked as an undeclared candidate input              |

  # Verification registry and planner modularization 003
  Scenario: Verification registry and planner modularization 003
    Given the user's primary worktree contains unrelated tracked or untracked work
    When autonomous implementation and evidence are prepared
    Then every role uses a dedicated worktree from the exact authorized QA candidate
    And the primary worktree supplies no inventory, build input, cleanliness result, or evidence identity
    And review evidence still requires one clean committed task worktree

  # Verification registry and planner modularization 004
  Scenario: Verification registry and planner modularization 004
    Given authoritative pack fragments have valid registry declarations
    When the canonical registry is compiled twice
    Then both outputs are byte-identical and declaration-ordered
    And the checked canonical compatibility representation is generated rather than hand-authored
    And stale generated output blocks before planning or evidence

  # Verification registry and planner modularization 005
  Scenario Outline: Verification registry and planner modularization 005
    Given registry fragments contain <registry_defect>
    When fragment assembly and registry validation run
    Then verification is blocked with <diagnostic>

    Examples:
      | registry_defect                    | diagnostic                                      |
      | duplicate pack identity            | identify one authoritative pack fragment        |
      | duplicate source ownership         | assign each source boundary once                 |
      | missing executable leaf            | restore or unregister the missing leaf           |
      | unknown consumer                   | register every exact consumer                    |
      | conflicting shared boundary        | declare one compatible shared-boundary authority |
      | stale canonical output             | regenerate the canonical registry                |

  # Verification registry and planner modularization 006
  Scenario Outline: Verification registry and planner modularization 006
    Given a governed path is <historical_change>
    When current and base registry fragments are loaded from their own revisions
    Then affected verification is <historical_result>

    Examples:
      | historical_change                    | historical_result                                      |
      | renamed between compatible owners    | the union of former and current exact consumers        |
      | deleted from the candidate            | the former owner and conserved historical consumers    |
      | copied into a new owned boundary      | the union of source and destination exact consumers    |
      | described by an incompatible fragment | every runnable pack through conservative fallback      |

  # Verification registry and planner modularization 007
  Scenario Outline: Verification registry and planner modularization 007
    Given changed verification behavior belongs to <policy_boundary>
    When the default changed-path planner creates a focused plan
    Then selected process contract is <contract_task>
    And unrelated process contracts are absent from the plan

    Examples:
      | policy_boundary                  | contract_task                        |
      | registry schema and inventory    | registry and inventory contract      |
      | ownership and impact             | ownership and impact contract        |
      | dependency expansion             | dependency expansion contract        |
      | task construction and batching   | task construction and batching contract |
      | historical change planning       | historical planning contract         |
      | execution and checkpoints        | execution and checkpoint contract    |
      | reliability and run intent       | reliability and run-intent contract  |
      | evidence and promotion           | evidence and promotion contract      |
      | timing and performance           | timing and performance contract      |

  # Verification registry and planner modularization 008
  Scenario: Verification registry and planner modularization 008
    Given a product-only Shell change cannot affect verification policy
    When its default focused plan executes
    Then no verification-policy contract is selected or launched
    And every applicable Shell product, browser, acceptance, property, build, and package obligation is preserved
    And the receipt records the avoided policy tasks and their comparable historical duration

  # Verification registry and planner modularization 009
  Scenario Outline: Verification registry and planner modularization 009
    Given compatibility entry point <entry_point> receives an existing supported invocation
    When it performs <operation>
    Then it delegates to the owning policy modules
    And its external result remains compatible without executing retained duplicate policy logic

    Examples:
      | entry_point                            | operation                         |
      | scripts/verification-packs.mjs         | validation and planning           |
      | scripts/run-focused-acceptance.mjs     | execution and checkpoint control  |
      | scripts/verification-evidence.mjs      | evidence validation and promotion |

  # Verification registry and planner modularization 010
  Scenario: Verification registry and planner modularization 010
    Given the former process-contract task has boundary-specific successor tasks
    When its compatibility command is explicitly invoked
    Then every successor executes once
    And their combined status and diagnostics are returned through the former command in canonical order
    And ordinary focused and terminal plans schedule the successors without also scheduling the compatibility alias

  # Verification registry and planner modularization 011
  Scenario Outline: Verification registry and planner modularization 011
    Given an unresolved incident names the former process-contract task
    And one-to-many succession is <succession_state>
    When current incident coverage is validated
    Then incident result is <incident_result>

    Examples:
      | succession_state                                      | incident_result                                      |
      | complete, exact, conserved, and acyclic                | every applicable selected successor must pass freshly |
      | missing one conserved successor                        | blocked before execution                             |
      | ambiguous between two successor sets                   | blocked before execution                             |
      | weakened against the former boundary digest            | blocked before execution                             |
      | unavailable from current and historical registries     | blocked before execution                             |

  # Verification registry and planner modularization 012
  Scenario: Verification registry and planner modularization 012
    Given one boundary-specific contract fails and unrelated contracts have passed
    When a causal repair produces a new candidate
    Then repair-focused planning selects the failed boundary, its required predecessors, and its governed regression or successors
    And already passing unrelated contracts rerun only when the repair changes their governed inputs
    And the original failure remains recorded

  # Verification registry and planner modularization 013
  Scenario Outline: Verification registry and planner modularization 013
    Given failure occurs at <lifecycle_boundary>
    When the default runner records and diagnoses it
    Then failure ownership is <failure_owner>
    And recovery begins at the narrowest safe owned boundary without weakening evidence

    Examples:
      | lifecycle_boundary     | failure_owner                   |
      | task execution         | execution and checkpoint policy |
      | checkpoint identity    | execution and checkpoint policy |
      | retry admission        | reliability and run-intent policy |
      | receipt compatibility  | evidence and promotion policy   |
      | evidence promotion     | evidence and promotion policy   |

  # Verification registry and planner modularization 014
  Scenario: Verification registry and planner modularization 014
    Given one low-coupling pack has migrated to an authoritative fragment and other packs remain canonical
    When current, historical, focused, and terminal plans are constructed
    Then the mixed registry has one deterministic order and one validation result
    And the migrated pack is authored only in its local fragment
    And the terminal plan preserves every registered evidence leaf exactly once

  # Verification registry and planner modularization 015
  Scenario Outline: Verification registry and planner modularization 015
    Given boundary implementation state is <implementation_state>
    When adoption is assessed
    Then completion result is <completion_result>

    Examples:
      | implementation_state                                              | completion_result                              |
      | contracts are split but the default plan still selects the umbrella | incomplete because routing has not adopted them |
      | modules exist but a default entry point retains duplicate logic   | incomplete because execution has not adopted them |
      | routing is narrow but receipts omit selected and avoided work     | incomplete because benefit is not observable    |
      | default planning, execution, repair, and evidence use the boundaries | eligible for measured payoff assessment         |

  # Verification registry and planner modularization 016
  Scenario: Verification registry and planner modularization 016
    Given a representative product-only Shell plan retains all of its product evidence
    When comparable focused timing is measured before and after adoption
    Then its process-policy task count changes from the complete umbrella to zero
    And its median wall time is at most two minutes thirty seconds or comparable task timing proves a material critical-path reduction
    And no smaller file, moved assertion, new module, pack count, or task count substitutes for elapsed benefit

  # Verification registry and planner modularization 017
  Scenario Outline: Verification registry and planner modularization 017
    Given an approved unattended program stage encounters <condition>
    When its continuation boundary is evaluated
    Then program action is <program_action>

    Examples:
      | condition                                                    | program_action                                    |
      | a repairable failing contract                                | diagnose, repair, and continue                    |
      | an implementation choice within the conserved specification  | choose the least-cost sound option and continue   |
      | elapsed work spans another unattended period                 | preserve progress and continue                    |
      | unrelated files exist in the user's primary worktree         | leave them untouched and continue                 |
      | required product behavior is unspecified                     | stop at that exact semantic boundary              |
      | progress requires weaker evidence or destructive user impact | stop at that exact semantic boundary              |

  # Verification registry and planner modularization 018
  Scenario: Verification registry and planner modularization 018
    Given the approved feature is unowned at specification base 74cf0eac58
    And stopped implementation candidate 4bb46a9d assigns it to verification_process
    When standing ownership preparation is constructed from the specification base
    Then a non-runnable verification_process metadata pack owns the feature as planned
    And its source, dependency, task, executable feature, handler, browser, checkpoint, and package inventories are empty
    And no implementation change from stopped candidate 4bb46a9d enters the preparation

  # Verification registry and planner modularization 019
  Scenario Outline: Verification registry and planner modularization 019
    Given ownership preparation contains <preparation_state>
    When its one-time focused bootstrap validates current and historical ownership
    Then bootstrap result is <bootstrap_result>

    Examples:
      | preparation_state                                               | bootstrap_result                                  |
      | the exact unowned feature gains one non-runnable planned owner   | admit the exact transition and focused proof      |
      | another path changes owner                                      | block before task launch                          |
      | the metadata pack gains an executable task                      | block before task launch                          |
      | the runnable pack set or terminal inventory changes             | block before task launch                          |
      | product or VTD-012 implementation code enters the preparation   | block before task launch                          |

  # Verification registry and planner modularization 020
  Scenario: Verification registry and planner modularization 020
    Given the ownership preparation has focused review and is QA-integrated
    When verification-registry-planner-modularization resumes from that exact QA head
    Then verification_process is the feature's historical and current owner
    And exact preflight no longer consumes candidate-authored ownership
    And stopped candidate 4bb46a9d remains a patch reference rather than merged ancestry
    And no additional user approval or all-runnable-pack feature gate is requested

  # Verification registry and planner modularization 021
  Scenario: Verification registry and planner modularization 021
    Given coherent candidate 962affc8c2 combines the approved VTD-012 remainder with four cross-pack causal repair groups
    And exact review preflight expands shell and verification_process to every runnable pack because of the repair paths
    When the candidate stack is separated from current QA
    Then verification-slice-vtd012-cross-pack-repairs contains only the four repair groups
    And the VTD-012 product remainder is preserved independently with its nine successor contracts and scorecard
    And no commit from candidate 962affc8c2 enters the repair-slice ancestry
    And no all-runnable-pack feature review is launched

  # Verification registry and planner modularization 022
  Scenario Outline: Verification registry and planner modularization 022
    Given the standalone slice contains <repair_group>
    When its causal outcome is reviewed against current QA
    Then required result is <required_result>
    And unrelated product behavior, evidence leaves, and terminal obligations remain unchanged

    Examples:
      | repair_group                                      | required_result                                                                    |
      | inherited Shell and acceptance compatibility      | current and activated verification ownership both retain exact contract routing   |
      | installed schema-contributor browser flows        | durable active-project state drives the existing canonical contributor experience |
      | shared side-panel browser synchronization         | the matching native permission state replaces fixed-delay fixture assumptions     |
      | modular-architecture acceptance matching          | each handler matches only its exact scenario wording                              |

  # Verification registry and planner modularization 023
  Scenario: Verification registry and planner modularization 023
    Given the repair-only slice has exact focused review and is QA-integrated
    When repair integration triggers the conserved verification-registry-planner-modularization replay
    Then the reconstructed candidate excludes every QA-integrated repair hunk from its changed paths
    And default exact preflight uses historical ownership to select shell and verification_process without unrelated packs
    And the runner executes the selected nine successor contracts and their declared prerequisites
    And the product-only Shell scorecard and all unresolved terminal-deferred incidents remain conserved

  # Verification registry and planner modularization 024
  Scenario: Verification registry and planner modularization 024
    Given current QA has one pack-local manifest and 21 pack declarations in verification/packs.base.json
    When the authoritative manifest migration stage completes
    Then every one of the 22 registered packs has exactly one verification/manifests path named for its pack id
    And verification/packs.base.json contains no pack declaration
    And verification/packs.json remains generated and byte-identical to the pre-migration canonical registry
    And normal pack authoring never requires a hand-authored central pack declaration

  # Verification registry and planner modularization 025
  Scenario Outline: Verification registry and planner modularization 025
    Given migrated pack <pack> receives <local_change>
    When its registry is authored, regenerated, and planned through the default workflow
    Then the only hand-authored registry change is <manifest>
    And the generated canonical registry contains the change once without altering another pack declaration
    And focused planning selects <selected_scope>

    Examples:
      | pack                       | local_change                         | manifest                                                          | selected_scope                                    |
      | flow_export                | one owned feature declaration        | verification/manifests/flow_export.json                            | flow_export and its declared consumers            |
      | schemas                    | one verification input declaration   | verification/manifests/schemas.json                                | schemas and its declared consumers                |
      | durable_project_repository | one unit task declaration             | verification/manifests/durable_project_repository.json             | durable_project_repository and its declared consumers |

  # Verification registry and planner modularization 026
  Scenario: Verification registry and planner modularization 026
    Given two independent feature branches change different pack-local manifests
    When their declarations are compiled together in either discovery order
    Then both pack changes appear once in one declaration-ordered canonical registry
    And neither branch requires semantic reconciliation inside another pack manifest
    And regeneration resolves the shared compatibility output without changing either local declaration

  # Verification registry and planner modularization 027
  Scenario Outline: Verification registry and planner modularization 027
    Given historical pack declarations use <historical_format> and current declarations use <current_format>
    When <historical_change> is planned across the migration boundary
    Then current and historical ownership select <required_scope>
    And declaration format alone adds no pack, task, consumer, dependency, or evidence leaf

    Examples:
      | historical_format | current_format       | historical_change         | required_scope                                  |
      | central registry  | pack-local manifests | an owned path is renamed   | the union of its old and new declared consumers |
      | pack-local manifests | central registry  | an owned path is deleted   | every consumer required by the deleted owner    |
      | incompatible registry | pack-local manifests | ownership cannot be reconstructed | every runnable pack                    |

  # Verification registry and planner modularization 028
  Scenario: Verification registry and planner modularization 028
    Given all 21 remaining central pack objects and their canonical order are inventoried before migration
    When the coder performs the deterministic mechanical migration
    Then one ledger binds every source object digest, destination fragment, order, and compiled digest
    And every fragment is constructed before acceptance reconciliation begins
    And direct registry, historical-planning, and task-planning contracts report all migration differences together
    And one final exact review follows the conserved candidate instead of serial broad acceptance discovery

  # Verification registry and planner modularization 029
  Scenario Outline: Verification registry and planner modularization 029
    Given manifest decomposition has <migration_state>
    When VTD-012 completion is assessed
    Then manifest completion assessment is <completion_result>

    Examples:
      | migration_state                                                                  | completion_result                                      |
      | one fragment while another pack remains centrally declared                       | incomplete and automatic continuation is required      |
      | every pack is local but compiled canonical bytes or task identities differ       | blocked until exact conservation is restored            |
      | every pack is local, central declarations are empty, and exact conservation passes | eligible for focused QA review and payback observation |

  # Verification registry and planner modularization 030
  Scenario: Verification registry and planner modularization 030
    Given policy-boundary adoption is QA-integrated but manifest decomposition is incomplete
    When the approved VTD-012 program resumes from QA commit c7409bea
    Then the stable verification-registry-planner-modularization task migrates every remaining pack declaration
    And its implementation changes no Chrome-extension product source or packaged behavior
    And review remains focused on registry migration without an all-runnable terminal checkpoint
    And the user's untracked artifacts and every unresolved terminal-deferred incident remain untouched
