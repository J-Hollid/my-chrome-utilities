Feature: Side panel action feedback

  Background:
    Given a repository for project my-chrome-utilities
    And the side panel is displayed

  # Side panel action feedback 001
  Scenario: Side panel action feedback 001
    Given captured event purchase is open in the Live inspector
    When Save to Library succeeds as template Purchase
    Then the inspector action status beside Save to Library shows Saved Purchase to Library
    And the same status offers Open in Library
    And the result remains while the operator reads or scrolls the current inspector

  # Side panel action feedback 002
  Scenario Outline: Side panel action feedback 002
    Given the last inspector outcome was Saved Purchase to Library
    When the operator <subsequent_action>
    Then Saved Purchase to Library is absent
    And the current local outcome is <replacement_result>

    Examples:
      | subsequent_action                 | replacement_result       |
      | activates Validate                | validation result         |
      | opens another captured event      | no result                 |
      | navigates away from Live          | no result                 |

  # Side panel action feedback 003
  Scenario Outline: Side panel action feedback 003
    Given the Library editor action row is displayed for template Purchase confirmation
    When editor action <editor_action> succeeds
    Then editor feedback immediately below the action row shows <success_result>
    And the result remains until another editor action or a context change makes it stale

    Examples:
      | editor_action | success_result                                                              |
      | Save revision | Saved Purchase confirmation as version 4                                    |
      | Push draft    | Pushed purchase to Checkout through event.history at 10:04:05              |

  # Side panel action feedback 004
  Scenario Outline: Side panel action feedback 004
    Given editor feedback shows <existing_result>
    When <context_change>
    Then <existing_result> is removed from visible and accessible editor feedback

    Examples:
      | existing_result                            | context_change                         |
      | Saved Purchase confirmation as version 4   | the draft changes                      |
      | Pushed purchase to Checkout at 10:04:05    | the selected target changes            |
      | Saved Purchase confirmation as version 4   | the editor closes                      |

  # Side panel action feedback 005
  Scenario Outline: Side panel action feedback 005
    Given action <action_name> is available in <action_context>
    When the action fails because <failure_reason>
    Then its local action status states <failure_reason>
    And the same status identifies recovery step <recovery_step>
    And no success result remains for <action_name>

    Examples:
      | action_context | action_name     | failure_reason              | recovery_step       |
      | Live inspector | Save to Library | browser storage is unavailable | Retry Save to Library |
      | Library editor | Save revision   | the JSON draft is invalid   | Correct the JSON    |
      | Library editor | Push draft      | target Checkout is closed   | Choose target       |

  # Side panel action feedback 006
  Scenario Outline: Side panel action feedback 006
    Given global command feedback Testing started is visible at <panel_width> CSS px
    When canonical session state becomes Capturing
    Then Testing started is cleared because Capturing now describes the result
    And the global feedback region does not overlap or cover active view content
    When the session later changes state
    Then no stale start-testing feedback reappears

    Examples:
      | panel_width |
      | 360         |
      | 720         |

  # Side panel action feedback 007
  Scenario Outline: Side panel action feedback 007
    Given static helper text <helper_text> and prior result <prior_result> are present near an action status
    When the status updates to <new_result>
    Then assistive technology announces <new_result> once
    And the announcement excludes <helper_text> and <prior_result>
    And keyboard focus remains on the operator's current control

    Examples:
      | helper_text                    | prior_result       | new_result                                      |
      | Changes create a new version   | Draft is valid     | Saved Purchase confirmation as version 4       |
      | Push sends to the active target | Ready to push     | Pushed purchase to Checkout at 10:04:05        |
