# mutation-stamp: sha256=8d6e311d59a83acde418bb82231b5150a5e644e2754569e1932cfdd11661db01
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T14:48:23.894435933Z","feature_name":"Data layer library operator layout","feature_path":"features/data-layer-library-operator-layout.feature","background_hash":"5906105414972c7c4fa12e3e19f8751e160d0170d751954f6043fe7bbf506971","implementation_hash":"sha256:operator-interface-semantic-v2","scenarios":[{"index":0,"name":"Data layer library operator layout 001","scenario_hash":"4c0ecb7cec2c5c96d2126ced8f710630b01143495691be6b216bb05b7f39de4c","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:23.894435933Z"},{"index":1,"name":"Data layer library operator layout 002","scenario_hash":"b1472951aaad7c3e16ac310885189d272325f1a1eef246b2268affe715a2b82a","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:23.894435933Z"},{"index":2,"name":"Data layer library operator layout 003","scenario_hash":"0cc40cbb17034dd89ec6f45e5be5dce4d5335e05a09a72f001015b51257f6415","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:23.894435933Z"},{"index":3,"name":"Data layer library operator layout 004","scenario_hash":"f0f24a065562bcf2c461aa5dca29fd9e316b21006b126c7825da44112735199a","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:23.894435933Z"},{"index":4,"name":"Data layer library operator layout 005","scenario_hash":"edf96ebff4d19f595fabd72abdbb29d8a196b4aac2061a1bd98748045eacd0d5","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:23.894435933Z"},{"index":5,"name":"Data layer library operator layout 006","scenario_hash":"6cc093c0a3409480d44fc88e865622658e66c9802c9c45c81cfda981d4c522f9","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:23.894435933Z"}]}
# acceptance-mutation-manifest-end

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
    Given event template <template_name> has event <event_name>, source <source_name>, destination <destination>, version <version>, validation <validation_state>, schema <schema_name>, and tags <tags>
    When event templates are listed
    Then the first content line contains template name <template_name> followed by event name <event_name>
    And the second content line contains source <source_name> followed by destination <destination>
    And Version <version>, Validation <validation_state>, Schema <schema_name>, and Tags <tags> are separate labelled values or badges
    And a dedicated action row contains Edit, Duplicate, and Push in that order
    And no action is inline with a metadata sentence

    Examples:
      | project_name         | template_name         | event_name | source_name   | destination    | version | validation_state | schema_name | tags            |
      | my-chrome-utilities | Purchase confirmation | purchase   | event.history | checkoutLayer  | 3       | Valid            | Ecommerce  | checkout, sale  |
      | my-chrome-utilities | View                   | page_view  | GA4            | dataLayer       | 1       | Not checked      | None       | none            |

  # Data layer library operator layout 003
  Scenario Outline: Data layer library operator layout 003
    Given event template <template_name> is selected
    When its editor is displayed
    Then a named detail pane shows template identity, version, draft state, and provenance before editing sections
    And Properties appears first with Revision history, JSON, and execution settings available through separate progressive sections
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

  # Data layer library operator layout 007
  Scenario Outline: Data layer library operator layout 007
    Given the Library contains templates <short_template> and <long_template> with unequal metadata lengths
    When event templates are listed
    Then both rows align the same identity, routing, attributes, and actions regions
    And wrapped content in <long_template> does not change the region order used by <short_template>
    And each action row begins after its own metadata regions rather than after the last wrapped word

    Examples:
      | project_name         | short_template | long_template                                      |
      | my-chrome-utilities | View           | International purchase confirmation with campaign |
