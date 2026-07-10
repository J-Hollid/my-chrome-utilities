# mutation-stamp: sha256=6094d5350b0ac0e1b3a688bf60a607874c78b5734e8bf7e5f40738172dc556d3
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T23:55:22.391370759Z","feature_name":"Data Layer Live inspector actions","feature_path":"features/data-layer-live-inspector-actions.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:live-inspector-interaction-regressions-v1","scenarios":[{"index":0,"name":"Data Layer Live inspector actions 001","scenario_hash":"fae3db42312af84517ddf93552f8b5d24cb5611d00bd372f5a8535d3d0c596d9","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:55:22.391370759Z"},{"index":1,"name":"Data Layer Live inspector actions 002","scenario_hash":"7f17e806cd9a232c724abb1cd0fb5b22ff7af44411298b1cd04b50e1fd02a240","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:55:22.391370759Z"},{"index":2,"name":"Data Layer Live inspector actions 003","scenario_hash":"17a391f6997164392bb13140954fe9dfb34685da71ecda9b956222663f36c748","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:55:22.391370759Z"},{"index":3,"name":"Data Layer Live inspector actions 004","scenario_hash":"1f91ddef46dbcbd6431ea16940cf70b93ebfe757b5c097775b705b3e7a00a5d3","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-10T23:55:22.391370759Z"}]}
# acceptance-mutation-manifest-end

Feature: Data Layer Live inspector actions

  # Data Layer Live inspector actions 001
  Scenario Outline: Data Layer Live inspector actions 001
    Given captured event <event_name> with payload <payload_label> is selected in the Live inspector
    When Copy payload is activated
    Then canonical JSON for <payload_label> is written to the system clipboard
    And success feedback appears only after the clipboard write succeeds
    And a failed clipboard write reports failure without claiming the copy completed

    Examples:
      | event_name | payload_label   |
      | purchase   | purchase-values |

  # Data Layer Live inspector actions 002
  Scenario Outline: Data Layer Live inspector actions 002
    Given captured event <event_name> from <source_name> with destination <destination> and payload <payload_label> is selected
    When Save to Library is activated
    Then exactly one editable event template is created from <event_name>, <source_name>, <destination>, and <payload_label>
    And the saved template is visible and persisted in the Library view
    And success feedback identifies the saved template
    And the selected Live inspector remains open

    Examples:
      | event_name | source_name   | destination  | payload_label   |
      | purchase   | Event history | event.history | purchase-values |

  # Data Layer Live inspector actions 003
  Scenario Outline: Data Layer Live inspector actions 003
    Given captured event <event_name> has validation state <initial_state>
    And schema <schema_name> is assigned to its source and event name
    When Validate is activated
    Then schema <schema_name> validates the event payload
    And the same captured event changes to validation state <result_state> without creating another event
    And structured validation issues are available when <result_state> reports issues
    And the feed row and open inspector show <result_state>

    Examples:
      | event_name | initial_state | schema_name | result_state |
      | purchase   | Not checked   | Purchase v2 | 2 issues     |

  # Data Layer Live inspector actions 004
  Scenario Outline: Data Layer Live inspector actions 004
    Given captured event <event_name> has no compatible assigned schema
    When its inspector actions are displayed
    Then Validate is absent or disabled with an explanation
    And activating inspector actions cannot report validation completed without running validation

    Examples:
      | event_name |
      | pageview   |
