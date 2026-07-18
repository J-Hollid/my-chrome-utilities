Feature: Data layer Flow manual test expectations

  Background:
    Given Checkout journey documents context and interaction Events with obligations and multiplicities
    And it documents expected-next, alternative, parallel, and merge topology
    And its tester checklist is open

  # Data layer Flow manual test expectations 001
  Scenario Outline: Data layer Flow manual test expectations 001
    When the operator documents an Event occurrence
    And sets obligation <obligation> and multiplicity <multiplicity>
    Then trigger, <obligation>, <multiplicity>, topology, developer note, and tester note are available
    And the same values appear on the node, outline, checklist, and documentation preview

    Examples:
      | obligation    | multiplicity |
      | required      | exactly 1    |
      | optional      | 0 or 1       |
      | conditional   | 1 when known |
      | informational | any count    |

  # Data layer Flow manual test expectations 002
  Scenario Outline: Data layer Flow manual test expectations 002
    Given Purchase checklist status is Not checked
    When a tester records <manual_status>
    Then Purchase displays <manual_status>
    And the change records tester, time, note, and checklist-run revision without altering its referenced project revision or schema evidence

    Examples:
      | manual_status  |
      | Seen           |
      | Not seen       |
      | Not applicable |

  # Data layer Flow manual test expectations 003
  Scenario Outline: Data layer Flow manual test expectations 003
    Given one captured Event has <automatic_result>
    When it is displayed beside a checklist row
    Then the automatic status remains <automatic_result>
    And no manual Seen, Not seen, Not applicable, branch, or journey status is inferred

    Examples:
      | automatic_result     |
      | Valid payload        |
      | Invalid payload      |
      | No Assignment        |
      | Ambiguous Assignment |
      | Schema blocked       |

  # Data layer Flow manual test expectations 004
  Scenario: Data layer Flow manual test expectations 004
    Given one Purchase observation could relate to Retail Purchase or Trade Purchase
    When the tester attaches it to Retail Purchase by human name
    Then the immutable observation and Event validation result are retained
    And only the documented occurrence association and manual record change
    And removing the association does not rerun or change validation

  # Data layer Flow manual test expectations 005
  Scenario: Data layer Flow manual test expectations 005
    Given Purchase is documented after add_payment_info
    And immutable release 3 contains the matching Purchase Assignment and effective schema
    When Purchase is captured first
    Then its payload is independently validated through its Assignment
    And the checklist remains Not checked until a tester records a judgment
    And no automatic ordering or transition issue is created

  # Data layer Flow manual test expectations 006
  Scenario: Data layer Flow manual test expectations 006
    Given Product view is documented as expected 1 through 10 times
    And 11 Product view observations are attached
    When the tester explicitly records actual count 11
    Then all 11 retain their individual payload-validation results
    And the checklist persists actual count 11
    And no automatic occurrence error or Flow failure is created

  # Data layer Flow manual test expectations 007
  Scenario: Data layer Flow manual test expectations 007
    Given Shipping and Payment are documented as parallel required expectations
    When Shipping is marked Seen and Payment remains Not checked
    Then the checklist shows those two manual states exactly
    And no active branch, waiting join, completed join, or journey Pass status is displayed

  # Data layer Flow manual test expectations 008
  Scenario: Data layer Flow manual test expectations 008
    Given every checklist row remains Not checked
    When project compilation and release review run
    Then the manual journey is labelled Not checked rather than Passed
    And missing manual observations do not block publication by default
    And schema conflicts, missing deterministic Assignments, and failing required Event validation cases still block publication

  # Data layer Flow manual test expectations 009
  Scenario: Data layer Flow manual test expectations 009
    Given ChecklistRun Retail test 1 references immutable release 3 and begins at run revision 1
    When tester Alex records Purchase Seen, actual count 1, note Order 1001, and time 2026-07-18T10:00:00Z
    Then Retail test 1 advances to run revision 2
    And release 3, its project revision, validation-plan identity, documentation snapshot, and checklist template remain unchanged
    And exporting the run labels it execution evidence for release 3 rather than developer specification content

  # Data layer Flow manual test expectations 010
  Scenario: Data layer Flow manual test expectations 010
    Given ChecklistRun Draft test 1 references draft snapshot 24 and checklist template 24
    When a specification command creates draft snapshot 25 with a changed Purchase expectation
    Then Draft test 1 still identifies snapshot and template 24 and retains its existing rows and statuses
    And it is labelled Older specification rather than silently rebinding to snapshot 25
    And Start new run from draft 25 creates a separate blank run without mutating Draft test 1

  # Data layer Flow manual test expectations 011
  Scenario: Data layer Flow manual test expectations 011
    Given Builder and side panel opened ChecklistRun Retail test 1 at run revision 2
    When Builder records note Order 1001 and the stale side panel records actual count 1
    Then both disjoint run patches survive once in final run revision 4
    When both surfaces change Purchase manual status from run revision 4 and one saves first
    Then the stale overlapping status write requires visible resolution
    And no ChecklistRun, project, or release field is silently overwritten
