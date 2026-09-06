Feature: Side panel companion brand correction

  Background:
    Given the side panel uses the Specification Studio companion presentation
    And existing project data and product actions are available

  # Side panel companion brand correction 001
  Scenario Outline: Side panel companion brand correction 001
    Given visible text belongs to <text_role>
    When its foreground and rendered background are compared
    Then its contrast ratio is at least 4.5 to 1
    And an enabled project record does not use disabled presentation

    Examples:
      | text_role                |
      | active project metadata  |
      | saved project name       |
      | saved project metadata   |
      | Active project label     |
      | operation message        |
      | storage status           |
      | disabled control label   |

  # Side panel companion brand correction 002
  Scenario Outline: Side panel companion brand correction 002
    Given view <view_name> is selected
    When its ordinary records, groups, and status surfaces are displayed
    Then its canvas and content use warm paper with dark text
    And ordinary groups use spacing or dividers without elevation
    And powder-blue cards and slate neutral message panels are absent
    And its existing actions remain available in their production states

    Examples:
      | view_name |
      | Projects  |
      | Live      |
      | Library   |
      | Sessions  |
      | Defects   |
      | Schemas   |
      | Hotkeys   |

  # Side panel companion brand correction 003
  Scenario: Side panel companion brand correction 003
    When the side-panel header and navigation are displayed
    Then the navy masthead contains the existing logo and one Commands launcher
    And decorative utility badges are absent from the visible header
    And Data Layer and Hotkeys form the workspace selector
    And the six Data Layer tabs form a subordinate navigation row
    And section navigation uses at most two rows at side-panel widths
    And the selected workspace name is not repeated above that row
    And workspace, section, and keyboard focus states remain distinct

  # Side panel companion brand correction 004
  Scenario Outline: Side panel companion brand correction 004
    Given a visible control has role <control_role>
    When the companion presentation is applied
    Then the companion control uses <treatment>
    And ordinary controls and navigation have corner radii at most 4 CSS px
    And labels, hit areas, and keyboard operation retain their usable size

    Examples:
      | control_role        | treatment                           |
      | Create project      | navy fill with light text           |
      | ordinary action     | flat paper fill with navy text      |
      | selected section    | paper fill with a gold rule         |
      | destructive action  | red treatment and explicit text     |

  # Side panel companion brand correction 005
  Scenario: Side panel companion brand correction 005
    Given Projects lists one active project and two saved projects without a filter
    When the project records are displayed
    Then each project has one full record with a distinct name and metadata
    And the active record has an Active project label and an accent rule
    And no separate featured card or Projects context strip repeats that record
    And all existing active and saved project actions remain reachable
    And complete project identifiers and exact saved times are available in details

  # Side panel companion brand correction 006
  Scenario Outline: Side panel companion brand correction 006
    Given the active project is Retail measurement workspace
    When view <view_name> is selected
    Then a short context line identifies Retail measurement workspace
    And the context line does not display its raw project identifier
    And full identity remains available through Projects details

    Examples:
      | view_name |
      | Live      |
      | Library   |
      | Sessions  |
      | Defects   |
      | Schemas   |

  # Side panel companion brand correction 007
  Scenario Outline: Side panel companion brand correction 007
    Given a production operation has state <operation_state>
    When its feedback is displayed
    Then <feedback_presentation>
    And its existing announcement and recovery action remain available

    Examples:
      | operation_state | feedback_presentation                                      |
      | no message      | no empty decorated message strip occupies space            |
      | successful      | a readable message appears on paper with a success label   |
      | failed storage  | a readable error and existing recovery actions are visible |
