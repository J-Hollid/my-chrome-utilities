# mutation-stamp: sha256=35352e259a750010e16280d87f629510f4facefa654391199e66a2400e4e3586
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T19:27:19.747950405Z","feature_name":"Command registry presentation boundary","feature_path":"features/command-registry-presentation-boundary.feature","background_hash":"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b","implementation_hash":"sha256:side-panel-information-architecture-v2","scenarios":[{"index":0,"name":"Command registry presentation boundary 001","scenario_hash":"fc7bc42c4cb024248036564dc98c2540dbd8d26c97d80d70e9d170ecd76cb16e","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-07-10T19:27:19.747950405Z"}]}
# acceptance-mutation-manifest-end

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
