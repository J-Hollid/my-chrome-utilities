Feature: Data layer Library JSON validation recovery runtime

  Background:
    Given the built extension Library editor is running in a browser
    And template Scroll depth version 3 is open with a valid draft
    And target, permission, destination, and adapter readiness are resolved

  # Data layer Library JSON validation recovery runtime 001
  Scenario: Data layer Library JSON validation recovery runtime 001
    When the operator enters this invalid trailing-comma source
      """
      {
        "tealium_generated": "1",
        "scroll_percentage": 25,

      }
      """
    Then the editor state contains an invalid JSON error
    And the local validation status displays the JSON error
    And the JSON textarea is programmatically exposed as invalid
    And Save revision and Push draft are disabled with reason Correct the JSON draft
    And the last valid structured draft remains unchanged

  # Data layer Library JSON validation recovery runtime 002
  Scenario: Data layer Library JSON validation recovery runtime 002
    Given the trailing-comma JSON error is active
    When the operator corrects the textarea to this valid source
      """
      {
        "tealium_generated": "1",
        "scroll_percentage": 25
      }
      """
    Then the editor state contains no JSON error
    And the stale invalid JSON message is absent from visible and accessible validation status
    And the JSON textarea is no longer programmatically exposed as invalid
    And the structured draft contains exactly tealium_generated and scroll_percentage
    And action availability is recomputed from the corrected draft and current readiness
    And Save revision and Push draft are enabled

  # Data layer Library JSON validation recovery runtime 003
  Scenario: Data layer Library JSON validation recovery runtime 003
    Given the editor recovered from the trailing-comma error with a valid dirty draft
    When the operator activates Save revision
    Then Scroll depth version 4 is saved with the corrected payload
    And no invalid JSON result blocks or replaces the successful save result

  # Data layer Library JSON validation recovery runtime 004
  Scenario: Data layer Library JSON validation recovery runtime 004
    Given the editor recovered from the trailing-comma error with a valid dirty draft
    When the operator activates Push draft
    Then Push confirmation opens without executing the draft
    And its payload review uses the corrected draft
    And no stale invalid JSON message remains in the editor or confirmation

  # Data layer Library JSON validation recovery runtime 005
  Scenario: Data layer Library JSON validation recovery runtime 005
    Given the operator alternates the textarea between invalid and valid JSON 3 times
    When each input transition completes
    Then invalid input sets the JSON error and disables JSON-dependent actions
    And valid input clears the JSON error and restores actions allowed by current readiness
    And no earlier validation message survives a later valid transition

  # Data layer Library JSON validation recovery runtime 006
  Scenario: Data layer Library JSON validation recovery runtime 006
    When the automated Library JSON-validation browser test is inspected
    Then it enters the exact trailing-comma source through the textarea
    And it corrects the same textarea to valid JSON without reopening the editor
    And it asserts editor error state, visible status, accessible invalid state, and action availability after both inputs
    And it proves Save revision and Push draft are usable after recovery
