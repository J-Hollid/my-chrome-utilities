# mutation-stamp: sha256=8fc36af220c24a44ba2eb7be30ca85efb269760d247c9090d1f4aafa6d1389b1
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-29T16:29:02.205655070Z","feature_name":"Specification Studio choice controls","feature_path":"features/specification-studio-choice-controls.feature","background_hash":"69b6edb91456b1276fe564a422e1df7df1cc34aa3011219426550ec0a35bb70f","implementation_hash":"unknown","scenarios":[{"index":0,"name":"Specification Studio choice controls 001","scenario_hash":"52f858858c2542d8f5abf463238703493cf33937c4001b9d62da91c2b55a0d5c","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-07-29T16:29:02.205655070Z"},{"index":1,"name":"Specification Studio choice controls 002","scenario_hash":"29e1a2052310abd7919479c73f6288dbdc76a5aa6908717e386894af9674f2b8","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-29T16:29:02.205655070Z"},{"index":4,"name":"Specification Studio choice controls 005","scenario_hash":"32f292c76c15a39003d082412814584b1bc5c5ba63ee588a2be7e1d57c179453","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-29T16:29:02.205655070Z"}]}
# acceptance-mutation-manifest-end

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
      | Applicability preview        | previews independent Property Set composition          | checkbox |

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
