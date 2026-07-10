Feature: Data layer sessions operator layout

  Background:
    Given a repository for project <project_name>
    And the Data Layer Sessions view is displayed

  # Data layer sessions operator layout 001
  Scenario Outline: Data layer sessions operator layout 001
    Given saved session <session_name> has page scope <page_scope>, <event_count> events, <source_count> sources, and validation summary <validation_summary>
    When saved sessions are listed
    Then <session_name> is the row's primary label
    And the row shows capture date, <page_scope>, duration, <event_count> events, <source_count> sources, and <validation_summary>
    And long page scope does not displace the session name or actions

    Examples:
      | project_name         | session_name     | page_scope                            | event_count | source_count | validation_summary |
      | my-chrome-utilities | Checkout journey | https://example.test/order/complete   | 18          | 3            | 16 valid, 2 issues |

  # Data layer sessions operator layout 002
  Scenario Outline: Data layer sessions operator layout 002
    Given saved session <session_name> is selected in the session collection
    When its detail is displayed
    Then session identity, capture context, sources, event count, and validation summary appear before its event timeline
    And timeline records retain the same event-row hierarchy used by the Live view
    And session actions <session_actions> remain reachable while the event timeline scrolls

    Examples:
      | project_name         | session_name     | session_actions                                  |
      | my-chrome-utilities | Checkout journey | Open archived, Resume, Create sequence, Export  |

  # Data layer sessions operator layout 003
  Scenario Outline: Data layer sessions operator layout 003
    Given saved session <session_name> detail is displayed
    When the user opens event <event_name> from its timeline
    Then event <event_name> is inspected without losing the selected session
    And a visible return action restores the session summary and event position
    And event action <event_action> is available from the archived event inspector

    Examples:
      | project_name         | session_name     | event_name | event_action    |
      | my-chrome-utilities | Checkout journey | purchase   | Save to Library |

  # Data layer sessions operator layout 004
  Scenario Outline: Data layer sessions operator layout 004
    Given the Delete action for saved session <session_name> has focus
    When deletion is requested
    Then a focused confirmation names <session_name> and explains that its immutable archive will be removed
    And the destructive confirmation is visually distinct from cancellation
    And cancellation restores focus to the Delete action for <session_name>

    Examples:
      | project_name         | session_name     |
      | my-chrome-utilities | Checkout journey |

  # Data layer sessions operator layout 005
  Scenario Outline: Data layer sessions operator layout 005
    Given the Sessions view is filtered by <query>
    And saved session <session_name> remains selected in the filtered collection
    When the user performs action <session_action>
    Then the selected session remains identifiable during the action
    And completion status appears in the session context without being inserted into the event timeline

    Examples:
      | project_name         | query    | session_name     | session_action  |
      | my-chrome-utilities | checkout | Checkout journey | Export          |
      | my-chrome-utilities | checkout | Checkout journey | Create sequence |
