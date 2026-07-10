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
