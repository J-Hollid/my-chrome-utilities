Feature: Data layer view responsive layouts

  Background:
    Given a repository for project my-chrome-utilities
    And the Data Layer workspace is displayed

  # Data layer view responsive layouts 001
  Scenario Outline: Data layer view responsive layouts 001
    Given available width for <view_name> is <panel_width> CSS px
    When its workflow layout is rendered
    Then visible workflow regions use one ordered content column
    And every label remains in the same region and directly adjacent to its control
    And each count or status remains with the collection or action it describes
    And no related control is placed into another column

    Examples:
      | view_name | panel_width |
      | Live      | 360         |
      | Library   | 360         |
      | Sessions  | 360         |
      | Schemas   | 360         |
      | Live      | 520         |
      | Library   | 520         |
      | Sessions  | 520         |
      | Schemas   | 520         |

  # Data layer view responsive layouts 002
  Scenario Outline: Data layer view responsive layouts 002
    Given wide <view_name> presentation has a selected record at 720 CSS px
    When its workflow layout is rendered
    Then <view_name> uses its own named responsive regions
    And master region <master_region> is displayed beside detail region <detail_region>
    And full-width region <full_width_region> spans only content it owns
    And unrelated direct children are not distributed into spare grid columns

    Examples:
      | view_name | master_region                              | detail_region             | full_width_region                    |
      | Live      | event feed                                 | selected event inspector  | session summary and capture controls |
      | Library   | search, template count, and template list  | selected template editor  | Library navigation                   |
      | Sessions  | search, session count, and session list    | selected session detail   | Sessions navigation                  |
      | Schemas   | search, schema count, and schema list      | selected schema detail    | schema creation and import actions   |

  # Data layer view responsive layouts 003
  Scenario: Data layer view responsive layouts 003
    Given Purchase confirmation is the current Library record in wide presentation
    When the master-detail layout is rendered
    Then the master pane contains the search label, search input, Add new event action, template count, and template list in workflow order
    And the search label remains directly adjacent to the search input
    And the template count remains with the template list
    And the detail pane contains the selected editor, its action row, and its local feedback
    And editor feedback remains immediately below the action row

  # Data layer view responsive layouts 004
  Scenario Outline: Data layer view responsive layouts 004
    Given <view_name> has interactive regions in logical DOM order at <panel_width> CSS px
    When the operator navigates every visible control by keyboard
    Then focus follows DOM order without a layout-specific override
    And visual reading order matches the focus sequence
    And responsive placement does not move a later DOM region before an earlier one

    Examples:
      | view_name | panel_width |
      | Live      | 360         |
      | Library   | 520         |
      | Sessions  | 720         |
      | Schemas   | 720         |
