Feature: Data layer project fixtures and preflight

  Background:
    Given Shop data specification contains pages, events, applicability, profiles, and flows in a durable draft
    And no live website traffic is required

  # Data layer project fixtures and preflight 001
  Scenario Outline: Data layer project fixtures and preflight 001
    When the operator creates <fixture_kind> fixture <fixture_name>
    Then it records <expected_evidence>
    And the fixture is runnable before the website exists

    Examples:
      | fixture_kind    | fixture_name             | expected_evidence                                      |
      | single-event    | Retail purchase valid    | applicability winner, profiles, and Passed validation  |
      | single-event    | Trade purchase invalid   | applicability winner, profiles, and expected issues     |
      | ordered journey | Retail checkout success  | flow steps, transitions, occurrences, and Passed result |
      | ordered journey | Trade checkout failure   | failed step, missing requirement, and expected issue    |

  # Data layer project fixtures and preflight 002
  Scenario: Data layer project fixtures and preflight 002
    Given Retail checkout success includes repeatable Product and optional Upsell
    When the journey fixture runs
    Then every event is evaluated against its expected page, applicability winner, flow step, and effective profiles
    And occurrence and transition outcomes are recorded in order
    And prior flow state selects Retail confirmation without a final-event marker

  # Data layer project fixtures and preflight 003
  Scenario Outline: Data layer project fixtures and preflight 003
    Given the project contains <project_problem>
    When whole-project preflight runs
    Then it reports <diagnostic>
    And the diagnostic identifies every affected entity

    Examples:
      | project_problem                       | diagnostic                              |
      | page event with no requirements       | uncovered context                       |
      | unused requirement profile            | unused profile warning                  |
      | equal applicability winners           | blocking ambiguity                      |
      | broader matcher hiding exact matcher  | shadowing diagnostic                    |
      | unreachable flow branch               | blocking unreachable branch             |
      | missing flow entry or exit            | blocking flow structure error           |
      | missing required event occurrence     | occurrence failure                      |
      | incompatible profile composition      | blocking profile conflict               |
      | deleted referenced entity             | blocking unresolved reference           |
      | pinned missing revision               | blocking invalid pin                    |
      | missing description or example        | completeness warning                    |
      | failing required success fixture      | blocking fixture failure                |
      | unexpectedly passing failure fixture  | blocking fixture expectation failure    |
      | breaking released requirement change  | downstream breaking-change impact       |

  # Data layer project fixtures and preflight 004
  Scenario Outline: Data layer project fixtures and preflight 004
    Given the coverage matrix pivots by <matrix_dimension>
    When the operator selects a cell with an issue
    Then the cell identifies coverage, waiver, and diagnostic state
    And the exact source field opens in no more than 2 actions
    And matrix position and filters are preserved on return

    Examples:
      | matrix_dimension                 |
      | page or route by event           |
      | flow by step                     |
      | context by requirement profile   |
      | fixture by expected winner       |
      | property or rule by where used   |

  # Data layer project fixtures and preflight 005
  Scenario Outline: Data layer project fixtures and preflight 005
    Given preflight result has classification <classification>
    When release readiness is calculated under the default policy
    Then publication state is <publication_state>

    Examples:
      | classification        | publication_state                    |
      | error                 | blocked                              |
      | policy blocker        | blocked                              |
      | completeness warning  | available with acknowledged warning |
      | explicitly waived gap | available with recorded waiver       |

  # Data layer project fixtures and preflight 006
  Scenario: Data layer project fixtures and preflight 006
    Given Retail and Trade confirmation applicability deliberately tie
    When preflight and the Retail and Trade journey fixtures run
    Then the ambiguity is detected before publication
    And both candidates, shared context, and missing discriminator evidence are shown
    And publication remains blocked until matcher or flow-state resolution is corrected

  # Data layer project fixtures and preflight 007
  Scenario: Data layer project fixtures and preflight 007
    Given a captured event or saved session is available
    When the operator creates a fixture from that evidence
    Then capture data is copied as fixture input with source provenance
    And expected applicability, flow step, and validation outcome still require explicit review
    And deleting the capture does not delete the reviewed fixture

  # Data layer project fixtures and preflight 008
  Scenario: Data layer project fixtures and preflight 008
    Given the coverage matrix contains 500 properties and 50 flows
    When the operator filters, pivots, opens an issue, and returns using only the keyboard
    Then visible matrix cells and rows are virtualized with bounded overscan
    And focus, issue classification, waiver, and coverage state are accessible without color
    And the fixed benchmark records no interaction task longer than 100 milliseconds
