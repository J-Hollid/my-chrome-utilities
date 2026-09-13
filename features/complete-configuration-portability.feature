# Complete configuration portability 001 through 005
Feature: Complete configuration portability

  Background:
    Given the source configuration has two projects with shared schemas and rules, an event library, a saved session, images, Excel templates, published revisions, and hotkeys

  # Complete configuration portability 001
  Scenario: Complete configuration portability 001
    When the operator exports complete configuration
    Then one versioned ZIP contains every included saved domain and required binary body
    And its manifest records counts, versions, digests, dependencies, and exclusions
    And references and shared dependencies belong to one consistent snapshot
    And source data remains unchanged

  # Complete configuration portability 002
  Scenario: Complete configuration portability 002
    Given the recipient has a fresh configuration
    When the operator selects the exported configuration file
    Then inspection shows all included sections without writing configuration
    When the operator activates Set up from configuration once
    Then all included data and assets are committed together without separate library imports
    And the source active project is restored without starting a live connection
    And reload preserves the complete imported configuration

  # Complete configuration portability 003
  Scenario Outline: Complete configuration portability 003
    Given the recipient has conflicting project and library identities and different hotkey preferences
    When the operator selects <choice> in the conflict review
    Then the outcome is <outcome>
    And unrelated recipient content remains unchanged
    And no reference silently binds to different content or becomes invalid

    Examples:
      | choice                            | outcome                                                      |
      | Cancel                            | no configuration changes                                     |
      | Import only non-conflicting items | conflicting records and their unsafe dependents are skipped   |
      | Replace all conflicts             | incoming conflicting records replace the reviewed local ones |

  # Complete configuration portability 004
  Scenario Outline: Complete configuration portability 004
    Given the imported configuration has <fault>
    When the operator attempts setup
    Then setup reports <result>
    And no partial configuration is visible after reload

    Examples:
      | fault                       | result                            |
      | a missing image body        | the missing asset and its project |
      | an altered template digest  | the invalid template body         |
      | an unsupported feature      | the required unsupported feature  |
      | a storage failure at commit | an uncommitted setup              |

  # Complete configuration portability 005
  Scenario Outline: Complete configuration portability 005
    Given the selected file is <format>
    When the unified importer inspects its content
    Then it presents <route> before any write

    Examples:
      | format                                      | route                                      |
      | a supported Studio project JSON             | a project import review                    |
      | a supported durable project JSON            | a project import review                    |
      | a complete legacy repository recovery JSON  | one review for its projects and libraries   |
      | a legacy recovery JSON with missing assets  | a request to export the missing asset data  |
      | a Schema Library backup                     | the Schema Library import review           |
