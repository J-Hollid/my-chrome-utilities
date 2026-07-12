Feature: Data layer schema rule editor visibility

  Background:
    Given the Data Layer workspace is displayed

  # Data layer schema rule editor visibility 001
  Scenario Outline: Data layer schema rule editor visibility 001
    Given Data Layer view <view_name> is active
    And no reusable rule editor is open
    When the active view is displayed
    Then Rule configuration is not visible

    Examples:
      | view_name |
      | Live      |
      | Library   |
      | Sessions  |
      | Schemas   |

  # Data layer schema rule editor visibility 002
  Scenario: Data layer schema rule editor visibility 002
    Given the Schema workspace Rule Library subview is displayed
    When the operator opens the reusable rule editor
    Then Rule configuration is visible inside the reusable rule editor
