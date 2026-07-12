Feature: Data layer Live validation interaction

  Background:
    Given an automatically validated event is displayed in Live

  # Data layer Live validation interaction 001
  Scenario: Data layer Live validation interaction 001
    Given property page_type has a validation error
    When page_type receives pointer hover or keyboard focus
    Then the same concise issue preview appears for pointer and keyboard users
    And it identifies message, expected value, actual value, rule, and schema version
    And the preview is hoverable, remains visible while hovered or focused, and can be dismissed with Escape

  # Data layer Live validation interaction 002
  Scenario Outline: Data layer Live validation interaction 002
    Given the page_type evaluation set contains passing, warning, and error messages
    When the operator activates its status with <activation_input>
    Then a persistent property-rule disclosure opens
    And all passing, warning, and error evaluations are available in the disclosure
    And the disclosure state is exposed programmatically

    Examples:
      | activation_input |
      | Enter            |
      | Space            |
      | pointer click    |

  # Data layer Live validation interaction 003
  Scenario: Data layer Live validation interaction 003
    Given a matching enabled assignment exists for a newly captured event
    When the event enters the Live feed
    Then its assigned schema validates automatically without activating Validate
    And its feed badge and property results reflect the completed validation
    And opening the event shows the same validation result

  # Data layer Live validation interaction 004
  Scenario: Data layer Live validation interaction 004
    Given the open event inspector currently shows 1 warning
    When revalidation changes the result to Valid
    Then the inspector summary, property rows, and feed row update without closing the inspector
    And keyboard focus and inspector scroll position remain unchanged
    And a polite visible status announces that validation changed to Valid

  # Data layer Live validation interaction 005
  Scenario: Data layer Live validation interaction 005
    Given several background events are captured in quick succession
    When automatic validation completes for those events
    Then their feed rows expose their validation results
    And assertive announcements are not emitted for every background result
    And the selected event's changed validation is available as one concise polite status
