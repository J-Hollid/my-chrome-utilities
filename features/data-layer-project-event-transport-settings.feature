# mutation-stamp: sha256=c0538a9b4c861e0b9ccfe4f7ce8e43981f4c84dbe45386490649d1a067d6b5a4
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-26T17:11:28.474780284Z","feature_name":"Data layer project event transport settings","feature_path":"features/data-layer-project-event-transport-settings.feature","background_hash":"b3b0214719cef941203fa3aa4d39bb89eaf8893c5002cc8d6c8847ae93b88553","implementation_hash":"sha256:8d8ca37921cf944117060063cfef0afdb9c95c493c7f0832e64648677c26d4d2","scenarios":[{"index":0,"name":"Data layer project event transport settings 001","scenario_hash":"e3c2c6c7ff3316a2a791d812a43f0ee57303047ed082316fb186c436d0efec14","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-26T17:11:28.474780284Z"},{"index":1,"name":"Data layer project event transport settings 002","scenario_hash":"f30ceef8ce7a1ffb5a999f6d34d9933d567ff4bdc312c5c8eafd74e371db602c","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-26T17:11:28.474780284Z"},{"index":2,"name":"Data layer project event transport settings 003","scenario_hash":"d88ff15caabe10f3e663fd7cac74f6397995d1e59d4e2bd718d48d69b7bd5cd6","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-26T17:11:28.474780284Z"},{"index":3,"name":"Data layer project event transport settings 004","scenario_hash":"447656b3bf32dedd01d24d91256f7bfd59722f7faa0d1715e9e4f9483b857d74","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-26T17:11:28.474780284Z"},{"index":4,"name":"Data layer project event transport settings 005","scenario_hash":"fbf5b76303f4aefb61b304c1b1937793017259a20a229f9fc561bb7f8a93ca14","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-26T17:11:28.474780284Z"},{"index":5,"name":"Data layer project event transport settings 006","scenario_hash":"c5ccf9a353ad37cff39d4ca3ed75d2cefe5df378b3f92395bdbc03dad031014d","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-26T17:11:28.474780284Z"},{"index":7,"name":"Data layer project event transport settings 008","scenario_hash":"2d60fff0d7353ead5386b3f55859c7311f193783c0f0eeafba6d86301e07c821","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-26T17:11:28.474780284Z"},{"index":8,"name":"Data layer project event transport settings 009","scenario_hash":"c101bb96dd7fda4aba9ee21d8a810e90d45104997d643b730ddbd3b6a41d34df","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-26T17:11:28.474780284Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer project event transport settings

  Background:
    Given project transport fixtures are Retail website at queue.history and queue, Trade portal at event.history and dataLayer, and Partner site at event_queue and event_queue
    And Purchase confirmation is a global Library event with explicit destination analyticsQueue

  # Data layer project event transport settings 001
  Scenario Outline: Data layer project event transport settings 001
    Given <project> is active
    When the operator opens Data Layer Settings
    Then the project context is <project>
    And Observation history path contains <observation_path>
    And Default push path contains <push_path>
    And the two paths are separately labelled and editable

    Examples:
      | project        | observation_path | push_path   |
      | Retail website | queue.history    | queue       |
      | Trade portal   | event.history    | dataLayer   |
      | Partner site   | event_queue      | event_queue |

  # Data layer project event transport settings 002
  Scenario Outline: Data layer project event transport settings 002
    Given <project> is active
    When Live observation starts
    Then new observations are read only from <observation_path>
    When the operator directly pushes new event <event_name>
    Then <push_path>.push receives that event
    And <observation_path>.push is not used to send it

    Examples:
      | project        | observation_path | push_path   | event_name      |
      | Retail website | queue.history    | queue       | purchase        |
      | Trade portal   | event.history    | dataLayer   | checkout_started |
      | Partner site   | event_queue      | event_queue | partner_login   |

  # Data layer project event transport settings 003
  Scenario Outline: Data layer project event transport settings 003
    Given <project> is active
    When the operator uses <creation_route>
    Then the Library event draft Destination initially contains <project_push_path>
    When the operator saves <template_name> without changing Destination
    Then <template_name> stores explicit destination <project_push_path>
    And the project default push path remains <project_push_path>

    Examples:
      | project        | project_push_path | creation_route                                  | template_name        |
      | Retail website | queue             | Add new event                                   | Retail purchase      |
      | Trade portal   | dataLayer         | Save captured checkout_started as Library event | Trade checkout start |

  # Data layer project event transport settings 004
  Scenario Outline: Data layer project event transport settings 004
    Given <project> is active with default push path <project_push_path>
    And Purchase confirmation has explicit destination analyticsQueue
    When the operator pushes Purchase confirmation
    Then analyticsQueue.push receives its exact saved payload
    And neither <project_push_path>.push nor <observation_path>.push receives it
    And the global Purchase confirmation record remains byte-identical

    Examples:
      | project        | observation_path | project_push_path |
      | Retail website | queue.history    | queue             |
      | Trade portal   | event.history    | dataLayer         |

  # Data layer project event transport settings 005
  Scenario Outline: Data layer project event transport settings 005
    Given <project> is active with default push path <project_push_path>
    And <template_name> stores explicit destination <project_push_path>
    When the operator changes the project default push path to <new_push_path>
    Then direct pushes and subsequently created Library events default to <new_push_path>
    And <template_name> retains explicit destination <project_push_path>
    And the observation history path remains <observation_path>

    Examples:
      | project        | observation_path | project_push_path | new_push_path | template_name   |
      | Retail website | queue.history    | queue             | eventBus      | Retail purchase |
      | Trade portal   | event.history    | dataLayer         | commandQueue  | Trade purchase  |

  # Data layer project event transport settings 006
  Scenario Outline: Data layer project event transport settings 006
    Given <project> is active
    When the operator switches to <second_project>
    Then Data Layer Settings changes from <first_observation_path> and <first_push_path> to <second_observation_path> and <second_push_path>
    And new Live observation and direct pushes use only <second_project> settings
    When the operator switches back to <project>
    Then its <first_observation_path> and <first_push_path> settings return unchanged
    And no global Library event destination has been rewritten

    Examples:
      | project        | first_observation_path | first_push_path | second_project | second_observation_path | second_push_path |
      | Retail website | queue.history          | queue           | Trade portal   | event.history           | dataLayer        |
      | Trade portal   | event.history          | dataLayer       | Partner site   | event_queue             | event_queue      |

  # Data layer project event transport settings 007
  Scenario: Data layer project event transport settings 007
    Given no project is active
    When the operator opens Data Layer Settings
    Then project observation and default push settings are unavailable with guidance to open a project
    And no project is selected implicitly
    When the operator opens Purchase confirmation
    Then its explicit analyticsQueue destination remains available
    And adding a new Library event starts with an empty Destination that must be entered before saving or pushing

  # Data layer project event transport settings 008
  Scenario Outline: Data layer project event transport settings 008
    Given <project> is active with observation history path <observation_path> and default push path <push_path>
    When the operator exports <project>, imports it as <imported_project>, and opens the imported project
    Then <imported_project> uses observation history path <observation_path> and default push path <push_path>
    And the source project settings remain unchanged
    And Purchase confirmation remains outside the project bundle with explicit destination analyticsQueue

    Examples:
      | project        | imported_project    | observation_path | push_path |
      | Retail website | Retail website copy | queue.history    | queue     |
      | Trade portal   | Trade portal copy   | event.history    | dataLayer |

  # Data layer project event transport settings 009
  Scenario Outline: Data layer project event transport settings 009
    Given Retail website is active
    When configured <setting> path <invalid_path> does not resolve to <required_target> on the selected page
    Then the affected action is blocked with <status>
    And the other project path is not substituted as a fallback
    And no event is observed or pushed through <invalid_path>

    Examples:
      | setting                  | invalid_path | required_target     | status                        |
      | Observation history path | missing.path | an array             | Waiting for observation path  |
      | Default push path         | queue.value  | a push-capable array | Push path is not push-capable |
