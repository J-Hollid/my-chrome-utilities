Feature: Specification Studio choice controls

  Background:
    Given an operator is using Specification Studio
    And the Studio contains binary settings, selection lists, confirmations, and batch choices

  # Specification Studio choice controls 001
  Scenario Outline: Specification Studio choice controls 001
    Given control <control> has consequence <consequence>
    When its Studio control pattern is chosen
    Then it uses <pattern>
    And the pattern communicates the consequence before activation

    Examples:
      | control                      | consequence                                      | pattern  |
      | Only defined fields          | immediately applies one reversible Draft setting | switch   |
      | Include concept subheadings  | changes configuration pending preview refresh     | checkbox |
      | Include ecommerce concept    | selects membership in an ordered group             | checkbox |
      | Export Sitewide              | selects membership in an export scope               | checkbox |
      | Confirm incomplete export    | records an acknowledgement                          | checkbox |
      | Select staged property       | selects membership for a later batch action          | checkbox |
      | Borders                      | stages a theme option for an explicit save            | checkbox |

  # Specification Studio choice controls 002
  Scenario Outline: Specification Studio choice controls 002
    Given a checkbox row is displayed for <pointer_context>
    Then its visible square is between 16 and 18 CSS pixels
    And its label begins 8 CSS pixels to the right of the square
    And the complete labelled row is one pointer target at least <target_height> high
    And generic text-input height, padding, border radius, and width do not enlarge the square

    Examples:
      | pointer_context                | target_height |
      | fine pointer at desktop width  | 36 CSS pixels |
      | coarse pointer at narrow width | 44 CSS pixels |

  # Specification Studio choice controls 003
  Scenario: Specification Studio choice controls 003
    Given related checkboxes and adjacent row actions are displayed
    Then every checkbox has one visible explicitly associated label
    And selecting either the square or its label changes exactly that checkbox
    And related choices are stacked vertically beneath one group legend
    And optional hint text is aligned beneath the corresponding label
    And row actions follow a separate action boundary without interrupting the square-label pair

  # Specification Studio choice controls 004
  Scenario: Specification Studio choice controls 004
    Given a standalone binary setting applies immediately and reversibly
    When it is represented as a switch
    Then the switch has one visible positive label and visible On or Off state text
    And checked state, text, and shape communicate its state without color alone
    And Space changes the state after keyboard focus
    And the complete labelled switch row is clickable
    And a setting requiring Save, Refresh, confirmation, or a later batch action is not represented as a switch

  # Specification Studio choice controls 005
  Scenario Outline: Specification Studio choice controls 005
    Given labelled choice rows are displayed at <presentation>
    When labels wrap and controls receive keyboard focus
    Then every square or switch remains adjacent to its complete label
    And label text, hint text, and row actions do not overlap or clip
    And focus is visibly distinguishable
    And no horizontal page scroll is introduced

    Examples:
      | presentation                 |
      | 1280 CSS pixel Studio        |
      | 360 CSS pixel Studio         |
      | 200 percent browser zoom     |

  # Specification Studio choice controls 006
  Scenario: Specification Studio choice controls 006
    Given an existing Studio choice control is migrated to the shared pattern
    When the operator changes, saves, refreshes, undoes, redoes, and reloads its value as applicable
    Then its established product consequence and durable value are unchanged
    And one operator activation produces one established command or staged change
    And presentation migration creates no additional project revision or Undo entry
    And side-panel controls are unchanged
