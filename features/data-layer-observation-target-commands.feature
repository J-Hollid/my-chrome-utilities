Feature: Data layer observation target commands

  Background:
    Given a repository for project <project_name>
    And observation target controls are available in the Data Layer Live view

  # Data layer observation target commands 001
  Scenario Outline: Data layer observation target commands 001
    When observation target command <command_id> is inspected
    Then it is available in the command palette and for hotkey assignment
    And its title describes action <command_action>
    And running it shows the Data Layer Live view before performing <command_action>

    Examples:
      | project_name         | command_id                               | command_action         |
      | my-chrome-utilities | data-layer.choose-observation-target     | Choose target          |
      | my-chrome-utilities | data-layer.attach-selected-target        | Attach selected target |
      | my-chrome-utilities | data-layer.detach-observation-target     | Detach target          |

  # Data layer observation target commands 002
  Scenario Outline: Data layer observation target commands 002
    Given keyboard focus is outside the target picker
    When command <command_id> runs
    Then the target picker opens
    And keyboard focus moves to target search
    And the currently selected target is identified

    Examples:
      | project_name         | command_id                           |
      | my-chrome-utilities | data-layer.choose-observation-target |

  # Data layer observation target commands 003
  Scenario Outline: Data layer observation target commands 003
    Given selected target <page_title> has attachment readiness <readiness>
    When attachment command <command_id> runs for that selection
    Then result <command_result> is announced in the Live target context
    And the command does not attach a different browser tab implicitly

    Examples:
      | project_name         | page_title | readiness          | command_id                           | command_result       |
      | my-chrome-utilities | Checkout   | Ready               | data-layer.attach-selected-target    | Attached             |
      | my-chrome-utilities | Checkout   | Permission required | data-layer.attach-selected-target    | Permission required  |

  # Data layer observation target commands 004
  Scenario Outline: Data layer observation target commands 004
    Given a testing session is attached to target <page_title>
    When detachment command <command_id> runs for the active target
    Then a confirmation identifies <page_title> and the active testing session
    And detachment cannot silently end, discard, or retarget the session
    And cancellation returns focus to the target context

    Examples:
      | project_name         | page_title | command_id                            |
      | my-chrome-utilities | Checkout   | data-layer.detach-observation-target  |

  # Data layer observation target commands 005
  Scenario Outline: Data layer observation target commands 005
    Given the user invokes the extension from page <page_url> through <invocation>
    When the side panel receives the invocation context
    Then the exact invoking tab and window become the current registered target
    And the target URL is <page_url>
    And the side panel does not substitute its own extension URL

    Examples:
      | project_name         | invocation       | page_url                           |
      | my-chrome-utilities | toolbar action   | https://shop.example.test/checkout |
      | my-chrome-utilities | browser shortcut | https://shop.example.test/checkout |

  # Data layer observation target commands 006
  Scenario Outline: Data layer observation target commands 006
    Given the target picker is displayed at available width <panel_width>
    When keyboard navigation key <navigation_key> is used
    Then focus moves among visible target rows without selecting a target unexpectedly
    And Enter selects the focused eligible target
    And Escape closes the picker and returns focus to Choose target
    And target title, access state, and primary action remain readable without horizontal document scrolling

    Examples:
      | project_name         | panel_width | navigation_key |
      | my-chrome-utilities | 320 px      | ArrowDown     |
      | my-chrome-utilities | 720 px      | ArrowUp       |

  # Data layer observation target commands 007
  Scenario Outline: Data layer observation target commands 007
    Given target operation <operation> completes with result <result>
    When the Live target context updates
    Then result <result> is announced once without moving keyboard focus
    And the result is not inserted into the captured event feed

    Examples:
      | project_name         | operation          | result               |
      | my-chrome-utilities | target attachment  | Attached to Checkout |
      | my-chrome-utilities | target discovery   | 3 eligible targets   |
