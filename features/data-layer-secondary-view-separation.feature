Feature: Data Layer secondary view separation

  Background:
    Given the Data Layer section is displayed

  # Data Layer secondary view separation 001
  Scenario Outline: Data Layer secondary view separation 001
    When Data Layer tab <selected_view> is activated
    Then exactly the <selected_view> tab is selected
    And only the <selected_view> panel is visible in Data Layer content
    And the <first_hidden_view>, <second_hidden_view>, and <third_hidden_view> panels are hidden
    And the Data Layer content is not a combined Library, Sessions, and Schemas view
    And Live testing controls, target selection, settings, and session timeline are absent from <selected_view> content

    Examples:
      | selected_view | first_hidden_view | second_hidden_view | third_hidden_view |
      | Library       | Live              | Sessions           | Schemas           |
      | Sessions      | Live              | Library            | Schemas           |
      | Schemas       | Live              | Library            | Sessions          |

  # Data Layer secondary view separation 002
  Scenario Outline: Data Layer secondary view separation 002
    Given Data Layer tab <selected_view> is active in a browser
    When the computed presentation of the Data Layer panels is inspected
    Then the <selected_view> panel has a computed display other than none
    And the <first_hidden_view>, <second_hidden_view>, and <third_hidden_view> panels have computed display none
    And hidden Data Layer panels do not occupy layout space or receive keyboard focus

    Examples:
      | selected_view | first_hidden_view | second_hidden_view | third_hidden_view |
      | Library       | Live              | Sessions           | Schemas           |
      | Sessions      | Live              | Library            | Schemas           |
      | Schemas       | Live              | Library            | Sessions          |
