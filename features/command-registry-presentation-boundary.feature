Feature: Command registry presentation boundary

  # Command registry presentation boundary 001
  Scenario Outline: Command registry presentation boundary 001
    Given command <command_id> named <command_title> is registered
    When command <command_id> is selected from the command palette
    Then command <command_id> remains executable through the command registry
    And <command_title> is searchable in the command palette
    And registering command <command_id> does not add a permanent global command button

    Examples:
      | command_id                              | command_title            |
      | data-layer.start-testing                 | Start data layer testing |
      | data-layer.end-testing                   | End data layer testing   |
      | data-layer.save-session                  | Save data layer session  |
      | data-layer.choose-observation-target     | Choose target            |
      | data-layer.attach-selected-target        | Attach selected target   |
      | data-layer.detach-observation-target     | Detach target            |
      | data-layer.show-live                     | Show Live                |
      | data-layer.show-library                  | Show Library             |
      | data-layer.show-sessions                 | Show Sessions            |
      | data-layer.show-schemas                  | Show Schemas             |
      | navigation.show-data-layer               | Show Data Layer          |
      | navigation.show-hotkeys                  | Show Hotkeys             |
