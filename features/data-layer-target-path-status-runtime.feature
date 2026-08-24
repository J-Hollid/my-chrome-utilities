Feature: Data layer target path status runtime

  Background:
    Given the built extension side panel is running in a browser
    And the Data Layer Live view is displayed

  # Data layer target path status runtime 001
  Scenario Outline: Data layer target path status runtime 001
    Given selected target tab <tab_id> at <page_url> exposes <target_value> at observer path <observer_path> in its MAIN world
    And an in-memory sample page object exposes <sample_value> at <observer_path>
    When the user configures observer path <observer_path>
    Then the extension reads <observer_path> from selected target tab <tab_id> before reporting its status
    And the observer path field shows labelled readiness <path_status>
    And the Live summary shows observer status <observer_status>
    And neither status is derived from <sample_value>, the sample page object, or the extension side-panel page
    And no sample-derived result is persisted while the selected target read is pending

    Examples:
      | tab_id | page_url                                  | observer_path | target_value              | sample_value               | path_status  | observer_status  |
      | 42     | https://shop.example.test/checkout        | event.history | array containing pageview | missing                    | Ready            | Connected        |
      | 43     | https://shop.example.test/product/blue    | dataLayer     | missing                   | array containing purchase  | Waiting for path | Waiting for path |
      | 44     | https://shop.example.test/confirmation    | queue.history | object containing order   | array containing order     | Error            | Error            |

  # Data layer target path status runtime 002
  Scenario Outline: Data layer target path status runtime 002
    Given current active tab <tab_id> at <page_url> has no usable active-tab or persistent origin grant
    And no data layer testing session is active
    And <history_path> becomes ready in its MAIN world after access is granted
    When the user opens Choose target and selects that active tab
    Then the installed extension retains tab <tab_id> as the selected target
    And the failed page probe changes its access state to Permission required
    And visible action Request access is available in the current Confirm access and path step
    When the user activates Request access and Chrome grants origin <origin>
    Then the permission request covers only <origin>
    And the installed extension rechecks <history_path> on tab <tab_id>
    And Confirm access and path reports Ready without another target selection
    And Start testing <page_title> is enabled

    Examples:
      | tab_id | page_title | page_url                           | origin                    | history_path  |
      | 42     | Checkout   | https://shop.example.test/checkout | https://shop.example.test | event.history |
