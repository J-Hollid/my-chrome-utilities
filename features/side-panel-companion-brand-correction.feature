# mutation-stamp: sha256=6963b1b5f07121a23f324f1045feff4331dc280ba6a77bebad6f72732c23b9b3
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-09-07T13:09:48.182864174Z","feature_name":"Side panel companion brand correction","feature_path":"features/side-panel-companion-brand-correction.feature","background_hash":"529d957ce32876c585aaba97046b8613f90de9c1cc9d0a2d2c91bcb3ad5f2853","implementation_hash":"unknown","scenarios":[{"index":0,"name":"Side panel companion brand correction 001","scenario_hash":"bdeb05656247e0e570cf7fb939fad5fef7b9d5656501971ba50a233abc3241b6","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:09:48.182864174Z"},{"index":1,"name":"Side panel companion brand correction 002","scenario_hash":"bc52bc9724fb06ef81e91f7f8cae5b7534585d816ed9effd91a6da7f7abe80d7","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:09:48.182864174Z"},{"index":3,"name":"Side panel companion brand correction 004","scenario_hash":"401f1a6f00fc1c65a0a7e158690c76b649a3e04236a1321ae82d4514ed145276","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:09:48.182864174Z"},{"index":5,"name":"Side panel companion brand correction 006","scenario_hash":"6ffbc2e649d85c5b59c7e5200d75af33039aa10689c87192492400194e68e84b","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:09:48.182864174Z"},{"index":6,"name":"Side panel companion brand correction 007","scenario_hash":"a4bae5bab5d039fb549d35a06d692f9173c92e1f4af38bd67cd13c268d0a3380","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-09-07T13:09:48.182864174Z"}]}
# acceptance-mutation-manifest-end

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
