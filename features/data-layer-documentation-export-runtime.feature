# mutation-stamp: sha256=490bddcc247b278912e72b429694810667a5da84811011109c958c80b3356935
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:34:22.691413054Z","feature_name":"Data layer documentation export runtime","feature_path":"features/data-layer-documentation-export-runtime.feature","background_hash":"ace01b143ed96082112d4fa0013cec01d4bf12427d25c9e0ab0e292a418a051d","implementation_hash":"sha256:6f211b7a1075676dba5283c593fd874e3200ce05b5b678157ff381c4c7597496","scenarios":[{"index":2,"name":"Data layer documentation export runtime 003","scenario_hash":"9837fc44550edd876f895bdca520d690b491f9920b8dc6dd19253886f59be880","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:31.639485601Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer documentation export runtime

  Background:
    Given the built extension is running with production Specification Builder and documentation export systems
    And a released project with applicability and flows is loaded

  # Data layer documentation export runtime 001
  Scenario: Data layer documentation export runtime 001
    When the side panel renders project and schema actions
    Then the actual DOM labels authoring Specification Builder and documentation Generate documentation table
    And each action opens its distinct production surface

  # Data layer documentation export runtime 002
  Scenario: Data layer documentation export runtime 002
    When provenance, applicability, usage, and release fields are selected and copied
    Then actual preview HTML, rich clipboard HTML, rich clipboard text, and plain clipboard text contain the same selected values
    And no project draft or release bytes change

  # Data layer documentation export runtime 003
  Scenario Outline: Data layer documentation export runtime 003
    Given the actual documentation preview has width <width>
    When a 9-property multi-column export is rendered
    Then computed layout uses <layout_mode>
    And the active page has no horizontal overflow

    Examples:
      | width     | layout_mode                         |
      | 360       | cards or selected columns           |
      | 520       | cards or selected columns           |
      | 720       | selected columns                    |
      | full-page | complete dedicated table preview    |

  # Data layer documentation export runtime 004
  Scenario: Data layer documentation export runtime 004
    Given a lossy documentation selection omits flow semantics
    When the actual preview and clipboard output are inspected
    Then both representations identify the omitted flow semantics
    And keyboard focus returns to the invoking export action after close
