Feature: Data Layer secondary view separation

  # Data Layer secondary view separation 001
  Scenario Outline: Data Layer secondary view separation 001
    Given the Data Layer section is displayed
    When Data Layer tab <selected_view> is activated
    Then exactly the <selected_view> tab is selected
    And only the <selected_view> panel is visible in Data Layer content
    And the <first_hidden_view> and <second_hidden_view> panels are hidden
    And the Data Layer content is not a combined Library, Sessions, and Schemas view

    Examples:
      | selected_view | first_hidden_view | second_hidden_view |
      | Library       | Sessions          | Schemas            |
      | Sessions      | Library           | Schemas            |
      | Schemas       | Library           | Sessions           |
