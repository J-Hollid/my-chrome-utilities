Feature: Data layer atomic project release runtime

  Background:
    Given the built extension is running with production project draft, preflight, diff, release, persistence, and validation systems
    And Shop data specification release 3 has a connected draft

  # Data layer atomic project release runtime 001
  Scenario: Data layer atomic project release runtime 001
    When actual release review opens
    Then the production DOM renders requirement, applicability, flow, fixture, coverage, ambiguity, impact, and breaking-change differences
    And rendered counts and identities equal production diff output
    And published storage remains byte-for-byte unchanged

  # Data layer atomic project release runtime 002
  Scenario Outline: Data layer atomic project release runtime 002
    Given production preflight contains <gate_state>
    When the operator attempts publication through actual controls
    Then the rendered publication outcome is <outcome>

    Examples:
      | gate_state               | outcome                              |
      | unresolved ambiguity     | blocked at its linked matcher         |
      | failing required fixture | blocked at its linked fixture         |
      | completeness warning     | available after acknowledgement       |
      | clean required checks    | available for confirmation            |

  # Data layer atomic project release runtime 003
  Scenario: Data layer atomic project release runtime 003
    When a valid release is confirmed through the actual DOM
    Then production persistence commits one release snapshot containing every project entity class
    And production validation resolves only references from that release
    And reload preserves release identity, revision graph, and cleared draft

  # Data layer atomic project release runtime 004
  Scenario Outline: Data layer atomic project release runtime 004
    Given production publication fails during <failure_point>
    When confirmation runs
    Then current release storage, project entity storage, and draft storage retain their complete pre-confirmation bytes
    And the actual DOM offers retry with the complete draft

    Examples:
      | failure_point        |
      | snapshot preparation |
      | reference validation |
      | atomic commit        |

  # Data layer atomic project release runtime 005
  Scenario: Data layer atomic project release runtime 005
    When Publish, Publish and close, cancel, and Restore as draft are completed using actual keyboard controls
    Then actual workspace visibility, focus containment, focus restoration, announcements, and release history match each action
    And browser reload never exposes a partial release
