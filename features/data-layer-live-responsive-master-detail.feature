Feature: Data Layer Live responsive master-detail layout

  Background:
    Given the built extension Data Layer Live view is running in a browser

  # Data Layer Live responsive master-detail layout 001
  Scenario Outline: Data Layer Live responsive master-detail layout 001
    Given Live is <panel_width> CSS px wide
    And Live event selection is <selection_state>
    And inspector JSON is collapsed
    When the Live working region renders
    Then <active_pane> is the only displayed Live content pane
    And <inactive_pane> is hidden
    And <active_pane> is the only vertical scroll container inside the Live working region
    And no wrapper around <active_pane> creates a second vertical scrollbar

    Examples:
      | panel_width | selection_state | active_pane       | inactive_pane     |
      | 360         | none            | event feed        | event inspector   |
      | 360         | purchase        | event inspector   | event feed        |
      | 520         | none            | event feed        | event inspector   |
      | 520         | purchase        | event inspector   | event feed        |

  # Data Layer Live responsive master-detail layout 002
  Scenario: Data Layer Live responsive master-detail layout 002
    Given Live is 720 CSS px wide with event purchase selected
    And the feed and inspector each contain enough content to overflow vertically
    And inspector JSON is collapsed
    When the Live working region renders
    Then the event feed remains visible in the left master pane
    And the purchase inspector is visible in the right detail pane
    And the inspector pane is at least 360 CSS px wide
    And the feed and inspector are the 2 vertical scroll containers inside the Live working region
    And the Live working-region wrapper does not create another vertical scrollbar

  # Data Layer Live responsive master-detail layout 003
  Scenario: Data Layer Live responsive master-detail layout 003
    Given Live is 720 CSS px wide with no selected event
    When the Live working region renders
    Then the event feed expands across the available Live content width
    And no empty detail column is reserved
    And the event inspector is hidden
    And selecting an event changes Live to the wide master-detail state

  # Data Layer Live responsive master-detail layout 004
  Scenario: Data Layer Live responsive master-detail layout 004
    Given Live is 720 CSS px wide with event purchase selected
    And the inspector pane width is recorded
    When Live content width increases to 900 CSS px
    Then the feed retains a bounded readable master-pane width
    And the additional content width increases the inspector pane width
    And formatted payload lines have more available inline space

  # Data Layer Live responsive master-detail layout 005
  Scenario Outline: Data Layer Live responsive master-detail layout 005
    Given event purchase contains long metadata, property values, actions, and JSON at <panel_width> CSS px
    When horizontal overflow is measured
    Then property rows, metadata, and action groups fit or wrap within the inspector pane
    And the event feed, inspector pane, Live view, and side-panel document do not scroll horizontally
    And only a bounded JSON block may scroll horizontally
    And the complete JSON remains reachable within that block

    Examples:
      | panel_width |
      | 360         |
      | 520         |
      | 720         |

  # Data Layer Live responsive master-detail layout 006
  Scenario: Data Layer Live responsive master-detail layout 006
    When the automated Live layout suite is inspected
    Then it exercises unselected and selected events at 360, 520, and 720 CSS px
    And it asserts the displayed and hidden state of the feed and inspector panes
    And it asserts an inspector minimum width of 360 CSS px at wide layout
    And it asserts 1 primary vertical scroll container at narrow widths
    And it asserts 2 pane scroll containers for a selected event at wide layout
    And it fails when an unexpected wrapper scrollbar or horizontal document overflow appears
