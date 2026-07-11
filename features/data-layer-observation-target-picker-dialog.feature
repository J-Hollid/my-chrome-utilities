# mutation-stamp: sha256=5e8ae68d8b7a76459b2b44e9a1e29fbe3958a33070e9690c6e2cb4010e48eb29
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-11T08:18:44.212560766Z","feature_name":"Data layer observation target picker dialog","feature_path":"features/data-layer-observation-target-picker-dialog.feature","background_hash":"3488d14ff147c2b246aaa8fdd7d7e8cd3e5c2c8d1841d2f74456f3399f82241d","implementation_hash":"sha256:6315028e0811359d03d9f4596fcd854a633e9ff3aba743c9fe7b60206f7801a5","scenarios":[{"index":0,"name":"Data layer observation target picker dialog 001","scenario_hash":"23e823b5f825eac9a064b62d263c6ddc0e573fbce6cc27a1fec657e277dc51c4","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-11T08:18:44.212560766Z"},{"index":1,"name":"Data layer observation target picker dialog 002","scenario_hash":"5428ad7afd7682e90a05ad3ccd78548043b83a25bbd22f376bf2233add01079e","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-11T08:18:44.212560766Z"},{"index":2,"name":"Data layer observation target picker dialog 003","scenario_hash":"5483503cd07bcfd6d184726f0efaa1b84f2b33e356ed772267be39fce625d1b2","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-11T08:18:44.212560766Z"},{"index":3,"name":"Data layer observation target picker dialog 004","scenario_hash":"7e88040d1f4e6a7bc468d68a03cc74cff4ed6877fc2dc739460c9f7083fb7ab0","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-11T08:18:44.212560766Z"},{"index":4,"name":"Data layer observation target picker dialog 005","scenario_hash":"3bbcedf918b3189d4492962fecb1a576964ee4c29e3762c478a8a12adefd1c21","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-11T08:18:44.212560766Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer observation target picker dialog

  Background:
    Given the Data Layer Live view is displayed at <panel_width>
    And Browse all tabs is available

  # Data layer observation target picker dialog 001
  Scenario Outline: Data layer observation target picker dialog 001
    Given the observation target picker is closed
    When the closed Live layout is inspected
    Then the target search and target inventory are not visibly rendered
    And the target picker is absent from normal document flow
    And the target picker does not obscure or displace Live content

    Examples:
      | panel_width |
      | 320 CSS px |

  # Data layer observation target picker dialog 002
  Scenario Outline: Data layer observation target picker dialog 002
    Given permission to browse open-tab metadata is granted
    And <tab_count> eligible tabs are open
    When the user activates Browse all tabs
    Then a focused observation-target dialog opens above the current side panel UI
    And the dialog contains target search and the matching target inventory
    And the target inventory scrolls within the bounded dialog
    And opening the dialog does not expand the Live view to fit <tab_count> target rows
    And background side panel content does not receive keyboard focus

    Examples:
      | panel_width | tab_count |
      | 320 CSS px | 12        |

  # Data layer observation target picker dialog 003
  Scenario Outline: Data layer observation target picker dialog 003
    Given the observation-target dialog is open with candidates <page_titles>
    When the user enters <query> in target search
    Then only matching target candidates are displayed
    When the user presses <navigation_key>
    Then focus moves through the matching target results without changing the selected target

    Examples:
      | panel_width | page_titles             | query    | navigation_key |
      | 320 CSS px | Home, Checkout, Purchase | checkout | ArrowDown      |

  # Data layer observation target picker dialog 004
  Scenario Outline: Data layer observation target picker dialog 004
    Given the observation-target dialog is open
    And result <page_title> with tab id <tab_id> has keyboard focus
    When the user completes selection with <selection_input>
    Then <page_title> with tab id <tab_id> becomes the selected observation target
    And the observation-target dialog closes
    And the Live target context identifies <page_title>
    And the underlying Live layout is unchanged

    Examples:
      | panel_width | page_title | tab_id | selection_input |
      | 320 CSS px | Checkout   | 42     | Enter           |
      | 320 CSS px | Checkout   | 42     | Select button   |

  # Data layer observation target picker dialog 005
  Scenario Outline: Data layer observation target picker dialog 005
    Given the observation-target dialog is open above an unchanged Live layout
    When the user dismisses it with <dismissal>
    Then no observation target selection changes
    And the observation-target dialog closes
    And focus returns to Browse all tabs
    And the underlying Live layout is unchanged

    Examples:
      | panel_width | dismissal   |
      | 320 CSS px | Escape      |
      | 320 CSS px | Close button |
