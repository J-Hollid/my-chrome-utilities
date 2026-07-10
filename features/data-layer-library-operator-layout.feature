Feature: Data layer library operator layout

  Background:
    Given a repository for project <project_name>
    And the Data Layer Library view is displayed

  # Data layer library operator layout 001
  Scenario Outline: Data layer library operator layout 001
    When Library navigation is displayed
    Then subviews are ordered <first_subview> then <second_subview>
    And only one Library subview is visible at a time
    And each subview shows its own search, filters, creation action, and item count

    Examples:
      | project_name         | first_subview   | second_subview |
      | my-chrome-utilities | Event templates | Sequences      |

  # Data layer library operator layout 002
  Scenario Outline: Data layer library operator layout 002
    Given event template <template_name> has event <event_name>, source <source_name>, version <version>, and validation state <validation_state>
    When event templates are listed
    Then <template_name> is the row's primary label
    And the row shows <event_name>, <source_name>, version <version>, <validation_state>, destination, and tags
    And frequently used action <primary_action> is visible on the selected row
    And additional actions remain available without expanding every row

    Examples:
      | project_name         | template_name         | event_name | source_name   | version | validation_state | primary_action |
      | my-chrome-utilities | Purchase confirmation | purchase   | event.history | 3       | Valid            | Push           |

  # Data layer library operator layout 003
  Scenario Outline: Data layer library operator layout 003
    Given event template <template_name> is selected
    When its editor is displayed
    Then template identity, source adapter, destination, schema, version, tags, and provenance appear before the payload editor
    And the payload can be edited through a structured property editor or raw JSON view
    And changing editor view preserves the current draft
    And persistent actions <editor_actions> remain reachable while the payload scrolls

    Examples:
      | project_name         | template_name         | editor_actions         |
      | my-chrome-utilities | Purchase confirmation | Save, Duplicate, Push  |

  # Data layer library operator layout 004
  Scenario Outline: Data layer library operator layout 004
    Given event template <template_name> has draft state <draft_state>
    When template draft status is displayed
    Then draft state <draft_state> is shown beside the template identity
    And issue summary <issue_summary> is shown before the affected property when issues exist
    And save and push availability reflect whether the draft is valid JSON

    Examples:
      | project_name         | template_name         | draft_state | issue_summary  |
      | my-chrome-utilities | Purchase confirmation | Unsaved     | Valid          |
      | my-chrome-utilities | Purchase confirmation | Invalid     | JSON error     |
      | my-chrome-utilities | Purchase confirmation | Unsaved     | 2 schema issues |

  # Data layer library operator layout 005
  Scenario Outline: Data layer library operator layout 005
    Given sequence <sequence_name> contains <step_count> ordered steps and has readiness <readiness>
    When the Sequences subview is displayed
    Then the selected sequence shows its name, <step_count> steps, <readiness>, and last-run summary before the step editor
    And each step shows order, enabled state, template version, adapter, destination, delay or breakpoint, and readiness
    And runner controls <runner_controls> remain distinct from sequence editing controls

    Examples:
      | project_name         | sequence_name    | step_count | readiness | runner_controls                 |
      | my-chrome-utilities | Purchase journey | 4          | Ready     | Run step, Run all, Pause, Stop  |

  # Data layer library operator layout 006
  Scenario Outline: Data layer library operator layout 006
    Given Library subview <subview_name> has selected item <item_name>
    When the user switches to the other Library subview and returns
    Then <subview_name> restores item <item_name>, its filters, and its scroll position
    And an unsaved editor draft is not discarded without confirmation

    Examples:
      | project_name         | subview_name    | item_name             |
      | my-chrome-utilities | Event templates | Purchase confirmation |
      | my-chrome-utilities | Sequences       | Purchase journey      |
