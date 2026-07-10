# mutation-stamp: sha256=87fde2e7ea45de689562b209c6a3b3a74775965da5f555f778f309724b159b55
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T14:48:28.497835306Z","feature_name":"Side panel responsive navigation shell","feature_path":"features/side-panel-responsive-navigation-shell.feature","background_hash":"2d21fc410e5c20db772deed5c4693f197d286bf79fba8460df83e2627cb66f80","implementation_hash":"sha256:operator-interface-semantic-v2","scenarios":[{"index":0,"name":"Side panel responsive navigation shell 001","scenario_hash":"be3e3bfd98eb01e45f9a01a5e3b7fbb6be83093b7a1264b241f4556a7b81040c","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:28.497835306Z"},{"index":1,"name":"Side panel responsive navigation shell 002","scenario_hash":"5bf0c50e88ab7a0ff17422f202e1d4360051a9313bb49afac381a43dd240e86c","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:28.497835306Z"},{"index":2,"name":"Side panel responsive navigation shell 003","scenario_hash":"49b4cb1d58a23e88e1c52f5995876da1c5697bde5dcc0df925f769a8aaa670e5","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:28.497835306Z"},{"index":3,"name":"Side panel responsive navigation shell 004","scenario_hash":"4853649b3b6c75e006d3c909f2fc0ea212d8236376d1d04b78be7f3761c79044","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:28.497835306Z"},{"index":4,"name":"Side panel responsive navigation shell 005","scenario_hash":"c2beba081fc590a6c893b9ea16e88f1dbc008109ed0977c1534f52790e19aad6","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:28.497835306Z"},{"index":5,"name":"Side panel responsive navigation shell 006","scenario_hash":"d0a1985219246ae06def5e9f2733553b80c15ca56d6af92fa8801c84abfd78ad","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:28.497835306Z"},{"index":6,"name":"Side panel responsive navigation shell 007","scenario_hash":"dba63109de6e31a1f967724e849b3b280868f57af2ba67c33b4e46e1030ead73","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T14:48:28.497835306Z"}]}
# acceptance-mutation-manifest-end

Feature: Side panel responsive navigation shell

  Background:
    Given a repository for project <project_name>
    And the side panel is displayed at available width <panel_width>

  # Side panel responsive navigation shell 001
  Scenario Outline: Side panel responsive navigation shell 001
    Given workspace <workspace_name> and view <view_name> are active
    When the active view content is scrolled
    Then the product header, workspace tabs, and active view context remain reachable without returning to the top of the content
    And only the active content region scrolls vertically
    And the side panel document does not scroll horizontally

    Examples:
      | project_name         | panel_width | workspace_name | view_name |
      | my-chrome-utilities | 320 px      | Data Layer     | Live      |
      | my-chrome-utilities | 480 px      | Data Layer     | Library   |
      | my-chrome-utilities | 720 px      | Hotkeys        | Hotkeys   |

  # Side panel responsive navigation shell 002
  Scenario Outline: Side panel responsive navigation shell 002
    Given view <view_name> has a collection and a selected record
    When available width <panel_width> can present both regions without obscuring their content
    Then the collection and selected-record detail are visible side by side
    And each region can scroll without moving the product header or navigation

    Examples:
      | project_name         | panel_width | view_name |
      | my-chrome-utilities | 720 px      | Live      |
      | my-chrome-utilities | 720 px      | Library   |
      | my-chrome-utilities | 720 px      | Sessions  |
      | my-chrome-utilities | 720 px      | Schemas   |

  # Side panel responsive navigation shell 003
  Scenario Outline: Side panel responsive navigation shell 003
    Given view <view_name> has a collection and selected record <record_name>
    When available width <panel_width> cannot present both regions clearly
    Then selected record <record_name> replaces the collection in the content region
    And a visible Back to <collection_name> action restores the collection
    And returning restores the collection's filters, selection, and scroll position

    Examples:
      | project_name         | panel_width | view_name | record_name           | collection_name |
      | my-chrome-utilities | 320 px      | Live      | purchase event        | events          |
      | my-chrome-utilities | 320 px      | Library   | Purchase confirmation | templates       |
      | my-chrome-utilities | 320 px      | Sessions  | Checkout journey      | sessions        |
      | my-chrome-utilities | 320 px      | Schemas   | Purchase event v2     | schemas         |

  # Side panel responsive navigation shell 004
  Scenario Outline: Side panel responsive navigation shell 004
    Given navigation state identifies workspace <workspace_name>, view <view_name>, subview <subview_name>, and record <record_name>
    When the side panel changes between narrow and wide presentation
    Then workspace <workspace_name>, view <view_name>, subview <subview_name>, and record <record_name> remain selected
    And narrow-only Back actions do not become persisted domain data

    Examples:
      | project_name         | panel_width | workspace_name | view_name | subview_name    | record_name           |
      | my-chrome-utilities | 480 px      | Data Layer     | Library   | Event templates | Purchase confirmation |

  # Side panel responsive navigation shell 005
  Scenario Outline: Side panel responsive navigation shell 005
    Given selected record <record_name> no longer exists in view <view_name>
    When the saved navigation state is restored
    Then view <view_name> remains active
    And the collection is displayed without a selected-record detail
    And status text explains that record <record_name> is no longer available

    Examples:
      | project_name         | panel_width | view_name | record_name      |
      | my-chrome-utilities | 480 px      | Sessions  | Deleted checkout |

  # Side panel responsive navigation shell 006
  Scenario Outline: Side panel responsive navigation shell 006
    Given the side panel is docked on <dock_side>
    When available width is <panel_width>
    Then layout decisions are based on available side panel width
    And the reading order and action order are the same as when docked on the opposite side

    Examples:
      | project_name         | panel_width | dock_side |
      | my-chrome-utilities | 320 px      | left      |
      | my-chrome-utilities | 720 px      | right     |

  # Side panel responsive navigation shell 007
  Scenario Outline: Side panel responsive navigation shell 007
    Given keyboard focus is on the global Commands control
    When the command palette opens at available width <panel_width>
    Then the search field and matching command results fit within the side panel
    And command results scroll independently when they exceed the available height
    And background workspace content does not scroll or receive keyboard focus
    When the command palette closes
    Then keyboard focus returns to the global Commands control

    Examples:
      | project_name         | panel_width |
      | my-chrome-utilities | 320 px      |
      | my-chrome-utilities | 720 px      |
