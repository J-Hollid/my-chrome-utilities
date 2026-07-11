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
    And the observer path field shows status <path_status>
    And the Live summary shows observer status <observer_status>
    And neither status is derived from <sample_value>, the sample page object, or the extension side-panel page
    And no sample-derived result is persisted while the selected target read is pending

    Examples:
      | tab_id | page_url                                  | observer_path | target_value              | sample_value               | path_status  | observer_status  |
      | 42     | https://shop.example.test/checkout        | event.history | array containing pageview | missing                    | ready        | Connected        |
      | 43     | https://shop.example.test/product/blue    | dataLayer     | missing                   | array containing purchase  | path missing | Waiting for path |
      | 44     | https://shop.example.test/confirmation    | queue.history | object containing order   | array containing order     | not an array | Error            |
