Feature: Data layer bulk requirement authoring

  Background:
    Given Shop data specification has a durable working draft
    And Shared event envelope profile is open in Specification Builder

  # Data layer bulk requirement authoring 001
  Scenario Outline: Data layer bulk requirement authoring 001
    Given no captured traffic exists
    When the operator starts requirement authoring from <starting_method>
    Then a staged candidate tree is created without changing the project draft
    And every candidate identifies source provenance and inferred structure
    And parse problems are displayed before commit

    Examples:
      | starting_method                  |
      | a blank profile                  |
      | a pasted JSON example            |
      | an uploaded JSON Schema          |
      | pasted spreadsheet rows          |
      | a reusable project template      |

  # Data layer bulk requirement authoring 002
  Scenario: Data layer bulk requirement authoring 002
    Given a spreadsheet paste contains 100 valid property rows and 3 invalid rows
    When import preview is displayed
    Then all 103 rows show parsed path, type, requirement, documentation, example, and issue state
    And each invalid row identifies its failing cell and actionable correction
    And the operator can correct or exclude invalid rows
    When the operator commits the valid staged rows
    Then 100 properties are added in one project transaction

  # Data layer bulk requirement authoring 003
  Scenario: Data layer bulk requirement authoring 003
    Given 40 differently typed properties are selected
    When the operator applies Required with severity error
    Then all 40 properties receive the shared change in one operation
    And per-property applicable value rules remain unchanged
    And one Undo removes the complete multi-selection change
    And one Redo restores it

  # Data layer bulk requirement authoring 004
  Scenario Outline: Data layer bulk requirement authoring 004
    Given selected properties support bulk field <bulk_field>
    When the operator enters <bulk_value> and reviews the staged change
    Then only <affected_content> changes on confirmation
    And unselected rows remain byte-for-byte unchanged

    Examples:
      | bulk_field      | bulk_value              | affected_content                    |
      | Description     | Commerce identifier     | selected descriptions               |
      | Severity        | warning                 | selected rule severities            |
      | Allowed values  | retail, trade           | compatible selected value rules     |

  # Data layer bulk requirement authoring 005
  Scenario Outline: Data layer bulk requirement authoring 005
    Given reusable subtree Commerce contains typed properties, rules, documentation, and examples
    When it is inserted using <reuse_mode>
    Then insertion result is <reuse_outcome>
    And the review identifies whether later source edits propagate

    Examples:
      | reuse_mode             | reuse_outcome                                             |
      | shared reference       | one stable Commerce reference is linked                   |
      | independent copy       | new stable identities are created for copied content      |

  # Data layer bulk requirement authoring 006
  Scenario: Data layer bulk requirement authoring 006
    Given a bulk rename moves /commerce/order to /ecommerce/order
    When the staged review is displayed
    Then affected rules, applicability, flows, fixtures, and exports are identified
    And unresolved external references block commit
    And confirmation moves the subtree and references in one transaction

  # Data layer bulk requirement authoring 007
  Scenario Outline: Data layer bulk requirement authoring 007
    Given bulk staging is open on <surface>
    When the operator reviews errors, selects rows, commits, and undoes using only the keyboard
    Then focus follows visible grid order and returns to the invoking action
    And errors, selection, provenance, and staged status do not depend on color alone
    And responsive behavior is <responsive_outcome>

    Examples:
      | surface               | responsive_outcome                                      |
      | 360 CSS px side panel | structural bulk authoring opens in Specification Builder |
      | full-page workspace   | the virtualized grid and inspector remain visible       |
