# mutation-stamp: sha256=d4f0852c2232163fb72d17a637497bbc1ce5e786cd040551c017e6c4e46af81c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T09:54:07.473916303Z","feature_name":"Data layer schema property copy runtime","feature_path":"features/data-layer-schema-property-copy-runtime.feature","background_hash":"3cba67d5c50ed11f44332381ac1126c096a77675de114e88a99e08cb40f66fd7","implementation_hash":"sha256:1446528cd95c26733b0afd9710f3fc0cd3df3ad652b60b6640b2546035b8bf0a","scenarios":[{"index":1,"name":"Data layer schema property copy runtime 002","scenario_hash":"6f73e8de64ca6b5e0d56e77ae83b1c1ba7d5f143017dcbd3cea621a62d8a9e9d","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:54:07.473916303Z"},{"index":3,"name":"Data layer schema property copy runtime 004","scenario_hash":"2edd889e003ea64239d72705cb4e2281854dad7a6d80290828d1f26bdcabd308","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:54:07.473916303Z"},{"index":4,"name":"Data layer schema property copy runtime 005","scenario_hash":"9ab95cc0cfbbb6245de98a4c5dae1a0abc30919b739858173186a8ef1d692273","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:54:07.473916303Z"},{"index":6,"name":"Data layer schema property copy runtime 007","scenario_hash":"a2c0fd25bc7fb01d78971f2354931583eac3501c5991cbd53e93092e37653604","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:54:07.473916303Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema property copy runtime

  Background:
    Given the built extension side panel is running with the production Schema Library, property editor, rule editor, conditional validation, documentation, working drafts, and persistence
    And production Generic pageview revision 7 and Generic in-page event revision 3 are stored as distinct schemas

  # Data layer schema property copy runtime 001
  Scenario: Data layer schema property copy runtime 001
    Given the actual Generic pageview property tree displays /error_message
    When the operator activates rendered Copy to another schema and selects Generic in-page event
    Then production review renders source and destination revisions, selected path, subtree, ancestor shells, dependencies, rules, conditions, documentation, reusable attachments, and conflicts
    And no production schema or working draft changes before confirmation

  # Data layer schema property copy runtime 002
  Scenario Outline: Data layer schema property copy runtime 002
    Given production source selection is <selected_path>
    And destination initially contains <destination_state>
    When the actual copy review is confirmed
    Then stored destination paths are <stored_paths>
    And unrelated sibling outcome is <sibling_outcome>

    Examples:
      | selected_path       | destination_state          | stored_paths                                      | sibling_outcome            |
      | /commerce           | no commerce property       | complete commerce subtree                         | source root siblings absent |
      | /context/user/id    | no context property        | context, context/user, and context/user/id         | user siblings absent        |
      | /products/*/id      | products array without id  | existing products path and products wildcard id   | array item siblings unchanged |
      | /a~1b/tilde~0name   | no escaped-name property   | exact canonical escaped path and ancestors        | decoded names not flattened |

  # Data layer schema property copy runtime 003
  Scenario: Data layer schema property copy runtime 003
    Given production /error_message conditional requirement references /error_action
    And /error_action configuration references /error_type
    When the actual dependency review is expanded
    Then production plan contains each dependency property, ancestor, local rule, condition, and documentation once
    And each dependency links to its requiring predicate
    And excluding a dependency disables or excludes dependent rules rather than persisting a dangling pointer

  # Data layer schema property copy runtime 004
  Scenario Outline: Data layer schema property copy runtime 004
    Given production included rule is <rule_kind>
    When the actual copy operation persists the destination draft
    Then stored rule outcome is <stored_outcome>

    Examples:
      | rule_kind                                | stored_outcome                                      |
      | source local conditional rule            | independent local identity with copied configuration |
      | reusable rule attachment                 | same reusable identity attached once                 |
      | inherited local rule                     | destination local snapshot with origin metadata      |
      | reusable rule already inherited by destination | no additional local attachment                 |

  # Data layer schema property copy runtime 005
  Scenario Outline: Data layer schema property copy runtime 005
    Given production destination has <collision>
    When the actual copy plan resolves it with <operator_choice>
    Then production result is <result>

    Examples:
      | collision                                  | operator_choice    | result                                         |
      | identical property and rule                | confirm            | existing configuration reused once             |
      | compatible parent missing selected child   | merge              | missing child added                             |
      | selected property has incompatible type    | keep destination   | source property excluded with dependent review |
      | selected property has incompatible type    | replace from source | source subtree replaces reviewed destination items |
      | parent is incompatible scalar              | no choice          | confirmation blocked                            |
      | rule identity has different configuration  | cancel              | destination unchanged                           |
      | documentation differs                      | use source text     | source property documentation stored            |

  # Data layer schema property copy runtime 006
  Scenario: Data layer schema property copy runtime 006
    Given production Replace from source would remove destination-owned descendants and rules
    When the operator reviews impact, confirms replacement, and then activates Undo
    Then one destination working-draft transaction is first persisted
    And Undo restores byte-equivalent pre-copy document, rules, conditions, documentation, and pending changes
    And current published source and destination revisions remain byte-equivalent throughout

  # Data layer schema property copy runtime 007
  Scenario Outline: Data layer schema property copy runtime 007
    Given the rendered source property comes from <source_surface>
    When production copy review opens
    Then copied values come from <expected_snapshot>
    And later source-local edits do not mutate the stored destination snapshot

    Examples:
      | source_surface                    | expected_snapshot               |
      | current published revision 7      | revision 7                      |
      | visible working draft based on 7  | current working draft           |
      | historical revision 5             | revision 5                      |

  # Data layer schema property copy runtime 008
  Scenario: Data layer schema property copy runtime 008
    Given production copied error configuration is in the Generic in-page event working draft
    When equivalent valid, missing, disallowed, and condition-not-satisfied payloads are validated against source snapshot and destination draft
    Then production evaluation outcomes, typed parameters, messages, severity, and applicable states agree for copied rules
    And destination assignments, schema-level documentation, current revision, revision history, and source schema are unchanged
    And no duplicate property, rule, condition, reusable attachment, or documentation entry exists

  # Data layer schema property copy runtime 009
  Scenario: Data layer schema property copy runtime 009
    Given the production copy has been applied and the side panel is closed
    When the extension side panel is reopened
    Then the destination working draft restores the copied subtree, dependencies, rules, conditions, documentation, pending change, and origin labels
    And Review draft and Publish revision use the ordinary production workflow
    And publishing creates one destination revision without changing source ownership

  # Data layer schema property copy runtime 010
  Scenario: Data layer schema property copy runtime 010
    Given the actual schema editor is 320 CSS pixels wide with a deep subtree and several conflicts
    When the operator selects a destination, expands dependencies, resolves conflicts, confirms, and undoes using keyboard controls
    Then the copy action, review groups, impact details, decisions, confirmation, feedback, and Undo remain reachable without horizontal page scrolling
    And focus and schema-editor scroll are restored after review rerenders and close
    And runtime coverage exercises production schema trees, canonical paths, conditional dependency planning, conflict resolution, working-draft persistence, validation, reopening, undo, and publish review rather than source-string inspection
