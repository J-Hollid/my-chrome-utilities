Feature: Side panel component layout runtime

  Background:
    Given the built extension side panel is running in a browser
    And deterministic long metadata, form, list, and code fixtures are displayed

  # Side panel component layout runtime 001
  Scenario: Side panel component layout runtime 001
    Given compact layout is constrained to 360 CSS px
    When component bounding rectangles are measured
    Then metadata groups, forms, and action groups each occupy one content column
    And every component rectangle stays within its parent content rectangle
    And action buttons wrap as whole controls inside their action group
    And all label, value, and button text remains visible within its owning component
    And document scroll width does not exceed document client width

  # Side panel component layout runtime 002
  Scenario: Side panel component layout runtime 002
    Given an intermediate viewport provides 520 CSS px for components
    When component bounding rectangles are measured
    Then the shared control-width contract passes for every textarea and text input
    And a metadata group uses no more than 2 columns
    And every metadata item in a 2-column group is at least 200 CSS px wide
    And a metadata group falls back to one column when either value would have less than 200 CSS px
    And all metadata text remains visible inside its item
    And document scroll width does not exceed document client width

  # Side panel component layout runtime 003
  Scenario Outline: Side panel component layout runtime 003
    Given <view_name> shows master and detail panes at a 720 CSS px viewport
    When pane bounding rectangles and computed placement are measured
    Then measured pane widths satisfy these bounds
      | pane   | minimum CSS px | maximum CSS px |
      | master | <master_min>   | <master_max>   |
      | detail | <detail_min>   | <detail_max>   |
    And both panes have non-auto named grid areas owned by <view_name>
    And the pane rectangles fit their parent without overlap
    And document scroll width does not exceed document client width

    Examples:
      | view_name | master_min | master_max | detail_min | detail_max |
      | Live      | 280        | 320        | 344        | 400        |
      | Library   | 240        | 288        | 384        | 448        |
      | Sessions  | 240        | 300        | 360        | 432        |
      | Schemas   | 240        | 300        | 360        | 432        |

  # Side panel component layout runtime 004
  Scenario Outline: Side panel component layout runtime 004
    Given form measurement viewport width is <panel_width> CSS px
    When textarea and text-input rectangles are measured
    Then every control border box is at least its parent client width minus horizontal padding
    And every measured control remains within the parent border box

    Examples:
      | panel_width |
      | 360         |
      | 520         |
      | 720         |

  # Side panel component layout runtime 005
  Scenario Outline: Side panel component layout runtime 005
    Given bounded code blocks and lists contain content larger than their visible region at <panel_width> CSS px
    When overflow behavior is measured
    Then each bounded component scrolls internally on its overflowing axis
    And all content remains reachable within that component
    And the side panel document has no horizontal scrolling

    Examples:
      | panel_width |
      | 360         |
      | 520         |
      | 720         |

  # Side panel component layout runtime 006
  Scenario: Side panel component layout runtime 006
    When the automated component layout suite is inspected
    Then it runs browser layout measurements at 360, 520, and 720 CSS px
    And it asserts document overflow, metadata rectangles, form-control rectangles, action-group rectangles, and pane rectangles
    And a bounding-box or overflow contract violation fails the automated test
