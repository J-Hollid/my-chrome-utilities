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
