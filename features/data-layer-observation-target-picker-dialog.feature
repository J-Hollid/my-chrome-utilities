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
