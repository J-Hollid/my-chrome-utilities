Feature: Modular verification packs

  Background:
    Given every utility module has one registered verification pack

  # Modular verification packs 001
  Scenario: Modular verification packs 001
    When a verification pack is inspected
    Then it declares owned source paths, direct module dependencies, unit tests, property tests, acceptance features, acceptance handlers, and browser adapters
    And each declared path exists
    And each source file, test, feature, handler, and browser adapter has exactly one owning pack

  # Modular verification packs 002
  Scenario Outline: Modular verification packs 002
    Given changed files belong to <changed_boundary>
    When impacted verification packs are selected
    Then selected packs are <selected_packs>
    And unrelated packs are <unrelated_pack_result>

    Examples:
      | changed_boundary                   | selected_packs                         | unrelated_pack_result |
      | schema core                        | schemas and declared dependants        | excluded              |
      | event-library browser adapter      | event library and shell integration    | excluded              |
      | shared browser-storage platform    | every pack using browser storage       | excluded              |
      | shell utility registry             | every registered utility and shell integration | none excluded  |

  # Modular verification packs 003
  Scenario: Modular verification packs 003
    Given a verification session selects one or more packs
    When its tests run
    Then TypeScript is checked and compiled once before selected test processes start
    And child unit, property, acceptance, and browser commands do not start another build
    And no acceptance handler invokes a unit, property, acceptance, or build command
    And every selected test uses the same immutable build artifact

  # Modular verification packs 004
  Scenario Outline: Modular verification packs 004
    Given verification phase is <verification_phase>
    When verification gates are selected
    Then required scope is <required_scope>

    Examples:
      | verification_phase       | required_scope                                                      |
      | coder implementation     | impacted packs and their declared dependencies                      |
      | refactorer review        | impacted packs with relevant coverage and property checks           |
      | architect terminal review | every registered pack against one clean packaged artifact          |

  # Modular verification packs 005
  Scenario: Modular verification packs 005
    Given impacted-pack verification has passed during implementation and refactoring
    When architect terminal review runs
    Then every registered unit, property, acceptance, browser, and shell-integration gate runs once
    And differential mutation checks changed source and changed Gherkin examples
    And no successful focused result can replace the complete terminal regression gate

  # Modular verification packs 006
  Scenario Outline: Modular verification packs 006
    Given pack registry defect is <registry_defect>
    When registry validation runs
    Then verification is blocked with reason <blocked_reason>

    Examples:
      | registry_defect                         | blocked_reason                                  |
      | source path has no owner                | Assign every source path to one pack            |
      | feature has two owners                  | Assign every feature to exactly one pack        |
      | declared dependency pack is missing     | Register every direct dependency                |
      | test path does not exist                | Correct the missing test path                   |
      | changed shared path selects no dependant | Include every declared dependant pack          |

  # Modular verification packs 007
  Scenario: Modular verification packs 007
    Given a pack's unit test appears in focused and aggregate verification
    When the aggregate verification plan is created
    Then that test is scheduled once
    And suite composition references the owning pack instead of repeating test filenames

  # Modular verification packs 008
  Scenario Outline: Modular verification packs 008
    Given changed verification input is <verification_input>
    And its registered consumers are <registered_consumers>
    When impacted verification packs are selected
    Then selected packs are <selected_packs>
    And semantic dependant expansion is <dependant_expansion>

    Examples:
      | verification_input                    | registered_consumers | selected_packs | dependant_expansion |
      | layered schema usability helper       | layered schema       | layered schema | excluded            |
      | flow graph runtime helper             | flow graph           | flow graph      | excluded            |
      | shared headless Chrome harness        | every browser pack   | every browser pack | excluded         |

  # Modular verification packs 009
  Scenario: Modular verification packs 009
    Given registered tests import verification support helpers
    When verification-pack validation runs
    Then every imported helper declares each consuming pack
    And every declared consumer imports that helper through a registered test
    And an undeclared or stale helper consumer blocks verification with the helper path and pack identity

  # Modular verification packs 010
  Scenario Outline: Modular verification packs 010
    Given a changed file belongs to <layered_boundary>
    When impacted verification packs are selected
    Then the primary selected pack is <primary_pack>
    And selected downstream scope is <downstream_scope>
    And unrelated layered boundaries are excluded

    Examples:
      | layered_boundary              | primary_pack                  | downstream_scope       |
      | canonical schema model        | canonical schema core         | declared dependants    |
      | canonical schema editor       | canonical schema editor       | none                   |
      | layered schema composition    | layered schema composition    | declared dependants    |
      | page group structure          | page group structure          | declared dependants    |
      | selective profile inheritance | selective profile inheritance | none                   |

  # Modular verification packs 011
  Scenario: Modular verification packs 011
    Given delivery CSS and assets declare their runtime consumer packs
    When one delivery CSS or asset path changes
    Then impacted verification includes its declared runtime consumers and their semantic dependants
    And packs without a declared consumer path are excluded
    But a delivery path used by every pack remains globally impactful

  # Modular verification packs 012
  Scenario: Modular verification packs 012
    Given verification receipts include current and rejected runtime records
    When verification throughput is reported
    Then every runnable pack has an exact-pack and representative changed-path row
    And each row reports task counts, measured coverage, projected duration, and dependant fan-out
    And rejected receipts are counted by receipt version, runtime mismatch, and incomplete task result

  # Modular verification packs 013
  Scenario Outline: Modular verification packs 013
    Given measured verification metric is <metric_state>
    When verification performance budgets are checked
    Then the budget result is <budget_result>
    And diagnostic detail is <diagnostic_detail>

    Examples:
      | metric_state                                   | budget_result | diagnostic_detail                                  |
      | browser target p90 is within its declared limit | pass          | target identity and measured p90                  |
      | exact pack duration exceeds its declared limit  | fail          | pack identity, measured duration, and limit       |
      | changed path fan-out exceeds its declared limit | fail          | changed path, selected packs, and allowed fan-out |

  # Modular verification packs 014
  Scenario: Modular verification packs 014
    Given an exact verification plan and evidence contract are prepared
    When checkpoint preflight runs
    Then registry validation, canonical plan validation, receipt-schema validation, artifact validation, and evidence-recording validation finish before the first verification task starts
    And a preflight failure exits without starting unit, property, acceptance, or browser tasks
    And the failure identifies the incompatible contract field or recording limit

  # Modular verification packs 015
  Scenario Outline: Modular verification packs 015
    Given browser verification produces <generated_output>
    When it runs in <execution_mode>
    Then the output destination is <output_destination>
    And tracked delivery evidence is <tracked_evidence_result>

    Examples:
      | generated_output            | execution_mode          | output_destination                 | tracked_evidence_result |
      | screenshots and reports     | ordinary verification   | an isolated temporary run directory | unchanged              |
      | screenshots and reports     | explicit fixture update | the declared delivery evidence path | updated                |
      | Chrome profile and downloads | ordinary verification  | an isolated temporary run directory | unchanged              |

  # Modular verification packs 016
  Scenario Outline: Modular verification packs 016
    Given a checkpoint receipt contains independently identified passing tasks and <remaining_result>
    And the resumed checkpoint has <resume_identity>
    When bounded checkpoint resume runs
    Then prior passing tasks are <passing_task_result>
    And tasks selected to run are <selected_tasks>
    And the combined receipt records reused and fresh task provenance

    Examples:
      | remaining_result             | resume_identity                              | passing_task_result | selected_tasks                 |
      | one transient failed target  | identical commit, artifact, plan, and toolchain | reused            | the failed target only         |
      | one incomplete target        | identical commit, artifact, plan, and toolchain | reused            | the incomplete target only     |
      | one transient failed target  | a different commit, artifact, plan, or toolchain | rejected          | every required checkpoint task |

  # Modular verification packs 017
  Scenario: Modular verification packs 017
    Given accepted timing history exists for every runnable pack and registered browser target
    When verification performance budgets are refreshed
    Then each default budget is derived from the target's measured percentile and declared tolerance
    And an unmeasured target uses an explicit bootstrap budget identified as provisional
    And a permissive catch-all limit cannot hide a regression in a measured pack or target
    And the report compares current measurements with the accepted baseline

  # Modular verification packs 018
  Scenario Outline: Modular verification packs 018
    Given a changed Flow path belongs to <flow_boundary>
    When impacted verification packs are selected
    Then selected packs are <selected_packs>
    And selected Flow browser targets are <browser_targets>

    Examples:
      | flow_boundary                                 | selected_packs                    | browser_targets                                                    |
      | workspace camera controls                     | flow_graph                        | FLOW_WORKSPACE_CONTROLS_TARGET                                     |
      | workspace Section controls and layout         | flow_graph                        | FLOW_WORKSPACE_AUTHORING_TARGET                                    |
      | workspace surface composition                 | flow_graph                        | FLOW_WORKSPACE_CONTROLS_TARGET and FLOW_WORKSPACE_AUTHORING_TARGET |
      | Flow graph semantic model                     | flow_graph and declared dependants | every Flow target                                                  |
      | an unclassified new path below src/flow-graph | flow_graph and declared dependants | every Flow target                                                  |

  # Modular verification packs 019
  Scenario: Modular verification packs 019
    Given the measured representative change src/flow-graph/workspace-section-ui.ts previously selected 4 packs and 46 tasks in 104.4 seconds
    When its focused Flow editor verification plan and completed receipt are reported
    Then only flow_graph and FLOW_WORKSPACE_AUTHORING_TARGET are selected
    And every planned task has a measured completed result
    And the representative changed-path duration is at most 35 seconds
    And the reduction from the accepted 104.4 second baseline is at least 65 percent
    And the report identifies selected packs, target identity, task count, browser launches, measured coverage, and duration
    And exact flow_graph verification still runs every Flow target and preserves complete assertion evidence

  # Modular verification packs 020
  Scenario Outline: Modular verification packs 020
    Given a bounded verification stage has <ordered_tasks> and worker limit <worker_limit>
    When verification throughput is reported
    Then the stage estimate is <critical_path>
    And tasks are assigned in execution order to the next available worker
    And no indivisible task duration is divided by the worker limit

    Examples:
      | ordered_tasks                          | worker_limit | critical_path |
      | no tasks                               | 2            | 0 seconds     |
      | one task lasting 200 seconds           | 2            | 200 seconds   |
      | tasks lasting 200, 40, and 40 seconds  | 2            | 200 seconds   |
      | tasks lasting 120, 100, and 80 seconds | 2            | 180 seconds   |
      | tasks lasting 120, 100, and 80 seconds | 3            | 120 seconds   |

  # Modular verification packs 021
  Scenario Outline: Modular verification packs 021
    Given the timing ledger offers <timing_evidence> for a browser-observation task
    When verification throughput is reported
    Then the task estimate is <task_estimate>
    And its reported timing source is <timing_source>

    Examples:
      | timing_evidence                                                          | task_estimate | timing_source           |
      | exact task median 210 seconds plus target median 92 seconds              | 210 seconds   | exact task samples      |
      | target medians 92 and 46 seconds plus modeled session overhead 5 seconds | 143 seconds   | composed target samples |
      | one target median 92 seconds plus modeled session overhead 5 seconds     | 97 seconds    | composed target samples |
      | no eligible task or target sample and explicit bootstrap 120 seconds     | 120 seconds   | bootstrap fallback      |

  # Modular verification packs 022
  Scenario: Modular verification packs 022
    Given a verification plan contains sequential and bounded execution stages
    When its complete throughput estimate is calculated
    Then each sequential stage contributes the sum of its task estimates
    And each bounded stage contributes its deterministic longest worker load
    And the plan estimate is the sum of those stage critical paths
    And estimation changes no task order, worker limit, pack selection, browser batch, or runner scheduling

  # Modular verification packs 023
  Scenario Outline: Modular verification packs 023
    Given <report_row> has corrected estimate <corrected_estimate> and budget <budget>
    When verification performance budgets are checked
    Then the row result is <budget_result>
    And the result identifies the row, corrected estimate, budget, and timing source

    Examples:
      | report_row                            | corrected_estimate | budget      | budget_result |
      | one 200-second observation task       | 200 seconds        | 150 seconds | fail          |
      | representative Flow workspace change | 26.2 seconds       | 35 seconds  | pass          |

  # Modular verification packs 024
  Scenario: Modular verification packs 024
    Given explicitly supplied root and worktree receipt sources contain unique receipts alpha and beta plus a copied alpha receipt
    When the canonical timing ledger is built with those sources in either order
    Then its accepted receipt identities are alpha and beta in deterministic order
    And the copied alpha receipt contributes one independent sample
    And the ledger scope identifies every supplied source and raw receipt digest

  # Modular verification packs 025
  Scenario: Modular verification packs 025
    Given accepted timing samples declare runtime, platform, execution load, worker concurrency, observation concurrency, and artifact build identity
    When timing environment classes are formed
    Then every distinct environment tuple has separate task, pack, and browser-target statistics
    And the default report includes percentiles only from the requested environment class
    And an explicit cross-class comparison preserves each class percentile and labels any combined comparison

  # Modular verification packs 026
  Scenario Outline: Modular verification packs 026
    Given a canonical ledger contains one accepted receipt and <rejected_receipt>
    When receipt eligibility is reported
    Then accepted receipt count is 1 and rejected receipt count is 1
    And the rejection reason is <rejection_reason>
    And the rejected receipt contributes no timing sample

    Examples:
      | rejected_receipt                       | rejection_reason        |
      | a runtime-mismatched receipt           | runtime mismatch        |
      | an incomplete-task receipt             | incomplete task result  |
      | an old-version receipt                 | receipt version         |
      | an artifact-identity-mismatched receipt | artifact build identity |

  # Modular verification packs 027
  Scenario Outline: Modular verification packs 027
    Given a timing identity has <independent_samples> independent samples
    And minimum independent sample count is <minimum_samples>
    When sample-count eligibility is evaluated
    Then its timing status is <timing_status>

    Examples:
      | independent_samples | minimum_samples | timing_status   |
      | 3                   | default 5       | provisional     |
      | 5                   | default 5       | non-provisional |
      | 3                   | configured 3    | non-provisional |

  # Modular verification packs 028
  Scenario: Modular verification packs 028
    Given the canonical index classifies FLOW_GRAPH_EXAMPLES_TARGET measurements of 10.734 seconds as normal and 24.322 seconds as loaded without changing either raw receipt
    When timing statistics are reported for that target
    Then normal p90 is 10.734 seconds and loaded p90 is 24.322 seconds
    And the default target percentile does not merge normal and loaded samples
    And machine-readable and human output identify receipt scope, environment class, sample count, and timing maturity

  # Modular verification packs 029
  Scenario Outline: Modular verification packs 029
    Given local timing evidence contains accepted receipts, rejected receipts, and incomplete receipts
    When receipt maintenance runs as <maintenance_action>
    Then source evidence is <source_evidence_result>
    And maintenance output is <maintenance_output>
    And accepted receipt bytes remain unchanged

    Examples:
      | maintenance_action | source_evidence_result                         | maintenance_output                                      |
      | report only        | unchanged                                      | no archive operation                                    |
      | archive preview    | unchanged                                      | candidates with source, digest, and rejection reason    |
      | explicit archive   | rejected and incomplete receipts recoverable  | manifest with original path, archive path, and digest   |

  # Modular verification packs 030
  Scenario Outline: Modular verification packs 030
    Given a FLOW_GRAPH_EXAMPLES_TARGET sample is recorded under <sample_condition>
    When phase-aware target timing is emitted
    Then receipt execution load is <execution_load>
    And plan context is <plan_context>
    And timing identifies browser startup, target setup, fixture setup, readiness, example compilation, rendering, persistence, assertion, and cleanup phases
    And every phase has explicit process or target scope and a finite non-negative duration

    Examples:
      | sample_condition                 | execution_load | plan_context                         |
      | focused single-target            | normal         | focused FLOW_GRAPH_EXAMPLES_TARGET   |
      | normally loaded terminal lane 4 of 4 | loaded      | existing Flow and capture co-run     |

  # Modular verification packs 031
  Scenario Outline: Modular verification packs 031
    Given the canonical ledger contains <focused_samples> focused normal samples and <loaded_samples> normally loaded samples for FLOW_GRAPH_EXAMPLES_TARGET from one artifact build
    When phase timing maturity is reported with minimum 5
    Then focused normal timing is <focused_status>
    And normally loaded timing is <loaded_status>
    And each class reports separate target and phase p50 and p90 values with receipt digests

    Examples:
      | focused_samples | loaded_samples | focused_status   | loaded_status     |
      | 4               | 5              | provisional      | non-provisional   |
      | 5               | 4              | non-provisional  | provisional       |
      | 5               | 5              | non-provisional  | non-provisional   |

  # Modular verification packs 032
  Scenario Outline: Modular verification packs 032
    Given five focused normal FLOW_GRAPH_EXAMPLES_TARGET samples have p90 <focused_p90>
    When verification performance budgets are checked
    Then the budget result is <budget_result>
    And normally loaded samples do not enter the focused normal percentile

    Examples:
      | focused_p90    | budget_result |
      | 12.890 seconds | pass          |
      | 12.892 seconds | fail          |

  # Modular verification packs 033
  Scenario: Modular verification packs 033
    Given a committed Flow examples characterization references at least five focused normal and five normally loaded accepted receipt digests from the current artifact build
    When VTD-013 completion is evaluated
    Then every sample contains complete phase timing and environment identity
    And the report identifies the dominant phase and the bounded synchronization or work correction
    And every loaded sample passes its assigned assertions without widening the 12.891 second target budget
    And the 35 second representative Flow changed-path guardrail is unchanged
    And Flow controls, authoring, legacy, and all 21 examples assertion leaves retain their identities

  # Modular verification packs 034
  Scenario Outline: Modular verification packs 034
    Given runnable pack <pack> declares representative changed file <representative_path>
    When the representative changed-path plan is selected
    Then the exact changed file exists and is owned by <pack>
    And selected packs are <selected_packs>
    And no directory prefix or first-entry fallback substitutes for the declared file

    Examples:
      | pack                         | representative_path                                      | selected_packs                                                                                                                                                                                                     |
      | project_management           | src/data-layer-assignment-routing-ui.ts                   | project_management                                                                                                                                                                                                 |
      | durable_project_repository   | src/data-layer-durable-project-repository-ui.ts           | durable_project_repository, flow_graph, flow_export, live_flow_testing, layered_schema, property_set_flow_sections                                                                                                  |
      | command-palette              | src/command-palette-ui.ts                                 | command-palette, hotkeys, shell                                                                                                                                                                                     |
      | hotkeys                      | src/hotkey-keymap.ts                                      | hotkeys, shell                                                                                                                                                                                                      |
      | capture                      | src/data-layer-live-inspector-presentation-ui.ts          | capture, event-library, project_event_transport, schemas, defects, replay, live_flow_testing, project_assurance_severity, guided_test_cases, shell                                                                   |
      | event-library                | src/data-layer-event-library-deletion.ts                  | event-library, project_event_transport, defects, replay, live_flow_testing, guided_test_cases, shell                                                                                                                 |
      | project_event_transport      | src/data-layer-project-event-transport.ts                 | project_event_transport                                                                                                                                                                                             |
      | schemas                      | src/data-layer-allowed-value-expansion-ui.ts              | schemas, defects, live_flow_testing, project_assurance_severity, guided_test_cases, shell                                                                                                                            |
      | defects                      | src/data-layer-defect-library-ui.ts                       | defects, live_flow_testing, shell                                                                                                                                                                                    |
      | replay                       | src/data-layer-sequence-replay-ui.ts                      | replay, shell                                                                                                                                                                                                       |
      | flow_graph                   | src/flow-graph/workspace-section-ui.ts                    | flow_graph                                                                                                                                                                                                          |
      | flow_export                  | src/data-layer-project-documentation-workspace-ui.ts      | flow_export                                                                                                                                                                                                         |
      | live_flow_testing            | src/data-layer-live-flow-testing-ui.ts                    | live_flow_testing                                                                                                                                                                                                   |
      | layered_schema               | src/canonical-schema-focused/navigator-rows.ts            | layered_schema                                                                                                                                                                                                      |
      | schema_relationship_tree     | src/schema-relationship-tree.ts                           | schema_relationship_tree                                                                                                                                                                                            |
      | property_set_flow_sections   | src/data-layer-property-set-flow-section-ui.ts            | property_set_flow_sections                                                                                                                                                                                          |
      | project_assurance_severity   | features/data-layer-project-assurance-severity.feature    | project_assurance_severity                                                                                                                                                                                          |
      | branding_polish              | src/data-layer-studio-choice-controls.ts                  | branding_polish                                                                                                                                                                                                     |
      | guided_test_cases            | src/data-layer-guided-test-cases.ts                       | guided_test_cases                                                                                                                                                                                                   |
      | shell                        | src/workspace-tabs-ui.ts                                  | every runnable pack                                                                                                                                                                                                 |

  # Modular verification packs 035
  Scenario: Modular verification packs 035
    Given one exact-pack row and one declared representative-change row exist for every runnable pack in one selected timing environment class
    And calibration tolerance is 1.2
    When verification performance budgets are refreshed
    Then every runnable pack receives an explicit exact-pack duration, changed-path duration, and changed-path fan-out budget
    And each changed-path duration names its declared file, critical-path baseline, limit, tolerance, timing sources, and measurement coverage
    And each fan-out limit equals the selected dependant count and preserves the selected pack identities
    And no runnable pack uses the 1200 second or fan-out 20 defaults as its ordinary success criterion
    And genuinely global shell infrastructure remains a separate conservative budget class

  # Modular verification packs 036
  Scenario Outline: Modular verification packs 036
    Given representative path src/alpha/local-ui.ts selects alpha and beta with critical-path baseline 50 seconds
    When <regression> is checked against its calibrated budget
    Then the representative-path result is fail
    And the diagnostic identifies src/alpha/local-ui.ts, alpha and beta, the critical-path baseline, measured value, and limit

    Examples:
      | regression                                      |
      | selected packs add gamma                        |
      | corrected critical path exceeds the 60 second limit |

  # Modular verification packs 037
  Scenario Outline: Modular verification packs 037
    Given browser target <target> has <timing_evidence> in the selected environment class
    And minimum independent sample count is 5
    And calibration tolerance is 1.2
    When verification performance budgets are refreshed
    Then its budget is <budget_status>
    And its budget source is <budget_source>
    And samples before and after a declared timing correction are not merged

    Examples:
      | target                       | timing_evidence                                                        | budget_status   | budget_source                      |
      | FLOW_GRAPH_EXAMPLES_TARGET   | five post-correction focused samples with p90 3.830 seconds             | non-provisional | committed characterization digests |
      | LAYERED_SCHEMA_EDITOR_TARGET | fewer than five comparable samples and focused baseline 45.919 seconds | provisional     | explicit target baseline            |
      | an unmeasured target         | no comparable target sample and a declared registry fallback           | provisional     | declared registry fallback          |

  # Modular verification packs 038
  Scenario: Modular verification packs 038
    Given five focused normal FLOW_GRAPH_EXAMPLES_TARGET samples have p90 3.830 seconds
    And those samples are the committed post-correction characterization digests
    And calibration tolerance is 1.2
    When verification performance budgets are refreshed
    Then its focused normal limit is 4.596 seconds
    And loaded samples remain diagnostic rather than entering the focused percentile
    And the prior 12.891 second limit is tightened rather than widened
    And the 35 second representative Flow changed-path guardrail is unchanged

  # Modular verification packs 039
  Scenario: Modular verification packs 039
    Given a committed performance calibration references the selected environment class, raw receipt digests, 20 runnable packs, and 81 registered browser targets
    When VTD-003 completion is evaluated
    Then every runnable pack has one deliberate representative file and three explicit pack budgets
    And every browser target has an explicit measured or provisional budget with maturity and provenance
    And provisional layered targets use tolerance 1.2 rather than tolerance 2
    And pack ownership, impact propagation, task order, browser batching, assertion leaves, worker limits, and terminal shards are unchanged

  # Modular verification packs 040
  Scenario Outline: Modular verification packs 040
    Given project_management owns source path <source_path>
    When its impact boundary is inspected
    Then its boundary is <boundary>
    And its source class is <source_class>
    And dependant propagation is <dependant_propagation>

    Examples:
      | source_path                                       | boundary                                | source_class           | dependant_propagation |
      | src/data-layer-project-entity-lifecycle.ts        | project_entity_lifecycle_semantic       | core or semantic       | retained              |
      | src/data-layer-page-authoring.ts                  | project_page_authoring_controller       | application controller | retained              |
      | src/data-layer-assignment-routing.ts              | project_assignment_routing_semantic     | core or semantic       | retained              |
      | src/data-layer-assignment-routing-ui.ts           | project_assignment_routing_presentation | browser presentation   | excluded              |
      | src/data-layer-project-library.ts                 | project_library_persistence             | persistence migration  | retained              |
      | src/data-layer-project-library-ui.ts              | project_library_controller              | application controller | retained              |
      | src/data-layer-project-library-presentation-ui.ts | project_library_presentation            | browser presentation   | excluded              |

  # Modular verification packs 041
  Scenario Outline: Modular verification packs 041
    Given changed project-management path is <changed_path>
    When impacted verification packs are selected
    Then selected packs are <selected_packs>
    And its complete owner unit, property, feature, handler, and installed browser evidence is selected

    Examples:
      | changed_path                                      | selected_packs                                                                                                                                                                             |
      | src/data-layer-assignment-routing-ui.ts           | project_management                                                                                                                                                                         |
      | src/data-layer-project-library-presentation-ui.ts | project_management                                                                                                                                                                         |
      | src/data-layer-project-entity-lifecycle.ts        | project_management, durable_project_repository, project_event_transport, flow_graph, flow_export, live_flow_testing, layered_schema, property_set_flow_sections, guided_test_cases, and shell |
      | src/data-layer-page-authoring.ts                  | project_management, durable_project_repository, project_event_transport, flow_graph, flow_export, live_flow_testing, layered_schema, property_set_flow_sections, guided_test_cases, and shell |
      | src/data-layer-assignment-routing.ts              | project_management, durable_project_repository, project_event_transport, flow_graph, flow_export, live_flow_testing, layered_schema, property_set_flow_sections, guided_test_cases, and shell |
      | src/data-layer-project-library.ts                 | project_management, durable_project_repository, project_event_transport, flow_graph, flow_export, live_flow_testing, layered_schema, property_set_flow_sections, guided_test_cases, and shell |
      | src/data-layer-project-library-ui.ts              | project_management, durable_project_repository, project_event_transport, flow_graph, flow_export, live_flow_testing, layered_schema, property_set_flow_sections, guided_test_cases, and shell |

  # Modular verification packs 042
  Scenario: Modular verification packs 042
    Given acceptance/src/acceptance/steps/project_management.clj owns six project-management feature files
    When acceptance-handler isolation is audited from APS step consumers
    Then every served feature and step consumer belongs to project_management
    And the handler is declared isolated
    And a handler-only change selects the complete project_management evidence without dependant packs
    But any cross-pack consumer blocks isolation and retains dependant propagation

  # Modular verification packs 043
  Scenario Outline: Modular verification packs 043
    Given project-management change is <change>
    And historical registry state is <historical_registry>
    When impacted verification packs are selected from current and historical ownership
    Then selected scope is <selected_scope>

    Examples:
      | change                                                                                               | historical_registry        | selected_scope                 |
      | delete src/data-layer-assignment-routing-ui.ts                                                      | readable and compatible    | project_management             |
      | rename src/data-layer-assignment-routing-ui.ts to src/data-layer-project-library-presentation-ui.ts | readable and compatible    | project_management             |
      | rename src/data-layer-assignment-routing-ui.ts to src/data-layer-project-library.ts                 | readable and compatible    | the ten-pack dependant closure |
      | delete src/data-layer-assignment-routing-ui.ts                                                      | unreadable or incompatible | every runnable pack            |

  # Modular verification packs 044
  Scenario: Modular verification packs 044
    Given every project-management boundary maps to the complete owner evidence profile
    When exact project_management verification and terminal-full planning are compared before and after VTD-004
    Then all four unit files, four property files, six features, one handler, and four installed browser adapters execute once in the exact owner plan
    And terminal-full planning executes every conserved assertion leaf and package check exactly once
    And browser batching, task order, worker limits, terminal shards, product behavior, durable bytes, migrations, Undo, and accessibility are unchanged

  # Modular verification packs 045
  Scenario: Modular verification packs 045
    Given the calibrated representative path src/data-layer-assignment-routing-ui.ts previously selected ten packs with critical-path baseline 390 seconds and limit 468 seconds
    When its non-propagating boundary is calibrated from the accepted VTD-003 receipt scope
    Then it selects only project_management with dependant fan-out 0
    And its critical-path baseline is 37.1 seconds with tolerance 1.2 and limit 45 seconds
    And the other 19 pack calibrations and all 81 browser-target budgets are unchanged
