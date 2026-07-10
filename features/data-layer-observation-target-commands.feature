# mutation-stamp: sha256=8e57acc5fec2229e67a3dcc592d068b7bf3053c547085fd13780b32af40dc262
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T17:15:22.661896988Z","feature_name":"Data layer observation target commands","feature_path":"features/data-layer-observation-target-commands.feature","background_hash":"c061cf2b62072d861bce09a71a5283a36b87e49b3a698a134174c28415c7579a","implementation_hash":"sha256:architect-semantic-review-v3","scenarios":[{"index":0,"name":"Data layer observation target commands 001","scenario_hash":"a3753ffa21561a0f561f2a10480674778721a52be338b32d9c82512b143447d8","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:22.661896988Z"},{"index":1,"name":"Data layer observation target commands 002","scenario_hash":"a31c084f34c4a20c45325e5ab5ed6a4062be85c5905211e4b335a21990ad1952","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:22.661896988Z"},{"index":2,"name":"Data layer observation target commands 003","scenario_hash":"25080c16fa8f895c4800f0d602a78f1dff469fbc476e98dec1b5f7c96ea46b34","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:22.661896988Z"},{"index":3,"name":"Data layer observation target commands 004","scenario_hash":"b9ec6efbcce29c8c1cb3274dc82bcc11bdfba67cf60ba31cceeec1203596c4ca","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:22.661896988Z"},{"index":4,"name":"Data layer observation target commands 005","scenario_hash":"b4440fc5b8e8d0fa4d4a3dc5248ace0269e53b03c8e9347c63c5925065fb52fe","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:22.661896988Z"},{"index":5,"name":"Data layer observation target commands 006","scenario_hash":"d13c746eca50e2eeaf94c27b92ff6a5fdf7be58fa1a2b7b39313b9a3981ca89b","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:22.661896988Z"},{"index":6,"name":"Data layer observation target commands 007","scenario_hash":"252f5f7c7a7853cd5ecb6a46bae9537072c20245c90c9fc8fbb41dff99850354","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T17:15:22.661896988Z"}]}
# acceptance-mutation-manifest-end

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
