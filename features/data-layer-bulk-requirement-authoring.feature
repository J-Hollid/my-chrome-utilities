# mutation-stamp: sha256=5de97def624fa790ee9e172dc0dc2b7ed652a577cc244b1dfe1c33e4342281b1
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T01:02:57.300904022Z","feature_name":"Data layer bulk requirement authoring","feature_path":"features/data-layer-bulk-requirement-authoring.feature","background_hash":"b97b09fe8dfb8024a4284406d5f3761040e1f2586f3833568efb609d958f45b7","implementation_hash":"sha256:965aee0e08a605daae19ce003b89c16a1023502bc71847c48f40469f06264551","scenarios":[{"index":0,"name":"Data layer bulk requirement authoring 001","scenario_hash":"1b6ee0f5479ae84aa2d5cbe9b44be712ac818fd1254de53482439358d0139227","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:02:57.300904022Z"},{"index":3,"name":"Data layer bulk requirement authoring 004","scenario_hash":"88bfa4dc695ffb21084e94059ea2810f99039e9ba3798bccdd94b90b324a3f87","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:02:57.300904022Z"},{"index":4,"name":"Data layer bulk requirement authoring 005","scenario_hash":"30314845cb928b25c685223d2b981fb7eaf55b81bf9c1f30cd7ee9a6e82438af","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:02:57.300904022Z"},{"index":6,"name":"Data layer bulk requirement authoring 007","scenario_hash":"5cb7ffa79b867d8a8b87d47d008395d193548b47ac0ddc6ddb4cd405dbf2b07a","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:02:57.300904022Z"}]}
# acceptance-mutation-manifest-end

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
