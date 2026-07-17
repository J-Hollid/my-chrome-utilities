Feature: Data layer atomic project release

  Background:
    Given Shop data specification release 3 has a durable working draft
    And project preflight has completed

  # Data layer atomic project release 001
  Scenario: Data layer atomic project release 001
    When the operator requests Publish release 4
    Then structured review identifies added, removed, renamed, and changed requirements
    And it identifies profile order, applicability, priority, page, event, flow, transition, occurrence, fixture, and policy changes
    And it shows fixture results, coverage delta, ambiguity analysis, affected consumers, and breaking-change classification
    And no published project state changes before confirmation

  # Data layer atomic project release 002
  Scenario Outline: Data layer atomic project release 002
    Given release review contains <review_state>
    When release availability is calculated
    Then confirmation is <confirmation_state>
    And review guidance is <guidance>

    Examples:
      | review_state                         | confirmation_state | guidance                                      |
      | unresolved matcher tie               | blocked            | Resolve applicability ambiguity               |
      | unreachable required branch          | blocked            | Repair or remove the unreachable branch       |
      | failing required fixture             | blocked            | Correct specification or fixture expectation  |
      | unresolved stable reference          | blocked            | Repair the missing reference                  |
      | completeness warnings only           | available          | Acknowledge warnings or change project policy |
      | clean required checks                | available          | Review and publish release 4                  |

  # Data layer atomic project release 003
  Scenario: Data layer atomic project release 003
    Given release review is publishable
    When the operator confirms Publish release 4
    Then one immutable release snapshot atomically contains profiles, pages, events, applicability, flows, fixtures, policies, and stable references
    And all linked current revisions advance together
    And the working draft is cleared only after the complete snapshot succeeds
    And no individual schema publication can expose a mixed project release

  # Data layer atomic project release 004
  Scenario Outline: Data layer atomic project release 004
    Given release persistence fails at <failure_point>
    When the operator confirms publication
    Then published release 3 remains current
    And every project entity equals its pre-confirmation published snapshot
    And the complete working draft remains recoverable
    And the failure identifies <recovery_guidance>

    Examples:
      | failure_point          | recovery_guidance                    |
      | snapshot preparation   | Review storage and retry              |
      | reference validation   | Repair the identified reference       |
      | atomic commit          | Retry the unchanged release draft     |

  # Data layer atomic project release 005
  Scenario Outline: Data layer atomic project release 005
    Given release review is publishable
    When the operator completes <publication_action>
    Then release 4 is current
    And the workspace is <workspace_state>
    And focus is <focus_destination>

    Examples:
      | publication_action | workspace_state                | focus_destination          |
      | Publish            | open on the release summary    | release summary heading    |
      | Publish and close  | closed                         | invoking project action    |

  # Data layer atomic project release 006
  Scenario: Data layer atomic project release 006
    Given release 2 is selected from immutable release history
    When the operator requests Restore as draft
    Then review identifies differences from current release 3
    And confirmation creates a new draft based on release 2
    And release 3 remains current until a later publication
    And restoring never reactivates or mutates release 2

  # Data layer atomic project release 007
  Scenario: Data layer atomic project release 007
    Given release review contains breaking changes and affected consumers
    When the operator completes review using only the keyboard
    Then each diff section, blocker, warning, acknowledgement, and consumer link is reachable in visible order
    And focus is trapped in confirmation and restored after cancel or publication
    And status and severity do not depend on color alone
