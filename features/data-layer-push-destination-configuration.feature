Feature: Data layer push destination configuration

  Background:
    Given observation history path <history_path> is configured in the Live view
    And event template <template_name> is open in the Library editor

  # Data layer push destination configuration 001
  Scenario Outline: Data layer push destination configuration 001
    When the Library editor is displayed
    Then a separately labelled Push destination path control contains <push_path>
    And the Push destination path control is distinct from the observation history path control
    And the observation history path remains <history_path>

    Examples:
      | history_path  | template_name         | push_path |
      | queue.history | Purchase confirmation | dataLayer |

  # Data layer push destination configuration 002
  Scenario Outline: Data layer push destination configuration 002
    When the user changes the Push destination path from <first_push_path> to <second_push_path>
    And saves the template revision
    Then template <template_name> targets <second_push_path>
    And reopening template <template_name> displays <second_push_path>
    And the observation history path remains <history_path>

    Examples:
      | history_path  | template_name         | first_push_path | second_push_path |
      | queue.history | Purchase confirmation | dataLayer       | analytics.queue  |

  # Data layer push destination configuration 003
  Scenario Outline: Data layer push destination configuration 003
    Given Push destination path <invalid_push_path> is not a valid object path
    When the user attempts to push the template
    Then the template is not pushed
    And the Push destination path control identifies the invalid path
    And no successful push result is displayed

    Examples:
      | history_path  | template_name         | invalid_push_path |
      | queue.history | Purchase confirmation | analytics[         |
