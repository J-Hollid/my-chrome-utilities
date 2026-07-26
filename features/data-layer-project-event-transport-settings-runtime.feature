Feature: Data layer project event transport settings runtime

  Background:
    Given the built extension is running with the production project repository, active-context coordinator, Live observer, and Library push adapter
    And production transport fixtures are project-retail at queue.history and queue, project-trade at event.history and dataLayer, and project-partner at event_queue and event_queue
    And production Purchase confirmation is a global Library event with explicit destination analyticsQueue

  # Data layer project event transport settings runtime 001
  Scenario Outline: Data layer project event transport settings runtime 001
    Given production <project_identity> is active
    When actual controls open Data Layer Settings
    Then the installed settings context names <project>
    And rendered Observation history path contains <observation_path>
    And rendered Default push path contains <push_path>
    And DOM inspection finds distinct labels and controls for those paths

    Examples:
      | project_identity | project        | observation_path | push_path   |
      | project-retail   | Retail website | queue.history    | queue       |
      | project-trade    | Trade portal   | event.history    | dataLayer   |
      | project-partner  | Partner site   | event_queue      | event_queue |

  # Data layer project event transport settings runtime 002
  Scenario Outline: Data layer project event transport settings runtime 002
    Given production <project_identity> is active
    When actual controls start Live observation and directly push <event_name>
    Then installed observation attaches only to <observation_path>
    And the page receives one <push_path>.push call containing <event_name>
    And no send call targets <observation_path>

    Examples:
      | project_identity | observation_path | push_path   | event_name       |
      | project-retail   | queue.history    | queue       | purchase         |
      | project-trade    | event.history    | dataLayer   | checkout_started |
      | project-partner  | event_queue      | event_queue | partner_login    |

  # Data layer project event transport settings runtime 003
  Scenario Outline: Data layer project event transport settings runtime 003
    Given production <project_identity> is active
    When actual controls invoke <creation_route>
    Then the installed Library event draft Destination initially contains <push_path>
    When actual controls save <template_name> without editing Destination
    Then durable Library bytes store <template_name> with destination <push_path>
    And durable project bytes retain default push path <push_path>

    Examples:
      | project_identity | push_path | creation_route                                  | template_name        |
      | project-retail   | queue     | Add new event                                   | Retail purchase      |
      | project-trade    | dataLayer | Save captured checkout_started as Library event | Trade checkout start |

  # Data layer project event transport settings runtime 004
  Scenario Outline: Data layer project event transport settings runtime 004
    Given production <project_identity> is active with default push path <project_push_path>
    And production Purchase confirmation has explicit destination analyticsQueue
    When actual controls push Purchase confirmation
    Then the page receives one analyticsQueue.push call with the exact saved payload
    And no call targets <project_push_path> or <observation_path>
    And durable Purchase confirmation bytes remain unchanged

    Examples:
      | project_identity | observation_path | project_push_path |
      | project-retail   | queue.history    | queue             |
      | project-trade    | event.history    | dataLayer         |

  # Data layer project event transport settings runtime 005
  Scenario Outline: Data layer project event transport settings runtime 005
    Given production <project_identity> is active with default push path <project_push_path>
    And durable <template_name> stores explicit destination <project_push_path>
    When actual controls save project default push path <new_push_path>
    Then installed direct push and new-event creation use <new_push_path>
    And durable <template_name> retains destination <project_push_path>
    And rendered Observation history path remains <observation_path>

    Examples:
      | project_identity | observation_path | project_push_path | new_push_path | template_name   |
      | project-retail   | queue.history    | queue             | eventBus      | Retail purchase |
      | project-trade    | event.history    | dataLayer         | commandQueue  | Trade purchase  |

  # Data layer project event transport settings runtime 006
  Scenario Outline: Data layer project event transport settings runtime 006
    Given production <project_identity> is active
    When actual controls switch to <second_project>
    Then rendered settings change from <first_observation_path> and <first_push_path> to <second_observation_path> and <second_push_path>
    And the next observer attachment and direct push use only <second_project> paths
    When actual controls switch back to <project_identity>
    Then rendered <first_observation_path> and <first_push_path> return
    And serialized global Library destination bytes remain unchanged

    Examples:
      | project_identity | first_observation_path | first_push_path | second_project  | second_observation_path | second_push_path |
      | project-retail   | queue.history          | queue           | project-trade   | event.history           | dataLayer        |
      | project-trade    | event.history          | dataLayer       | project-partner | event_queue             | event_queue      |

  # Data layer project event transport settings runtime 007
  Scenario: Data layer project event transport settings runtime 007
    Given production active-project state is absent
    When actual controls open Data Layer Settings
    Then installed project transport controls are unavailable with Open project guidance
    And repository inspection finds no implicit active identity
    When actual controls inspect the global event and start an unsourced Library event
    Then Purchase confirmation retains explicit destination analyticsQueue
    And the new-event Destination is empty and blocks save and push until entered

  # Data layer project event transport settings runtime 008
  Scenario Outline: Data layer project event transport settings runtime 008
    Given production <project_identity> is active with observation history path <observation_path> and default push path <push_path>
    When actual controls export the project, import it as <imported_project>, and activate the import
    Then durable imported project bytes contain observation history path <observation_path> and default push path <push_path>
    And the installed observer and direct push adapter use those imported settings
    And source project bytes and global Purchase confirmation bytes remain unchanged

    Examples:
      | project_identity | imported_project    | observation_path | push_path |
      | project-retail   | Retail website copy | queue.history    | queue     |
      | project-trade    | Trade portal copy   | event.history    | dataLayer |

  # Data layer project event transport settings runtime 009
  Scenario Outline: Data layer project event transport settings runtime 009
    Given production project-retail is active
    When the installed <setting> path <invalid_path> resolves to <observed_target>
    Then the affected action is disabled with <status>
    And instrumentation finds no fallback to the other configured project path
    And the page receives no observation or push through <invalid_path>

    Examples:
      | setting                  | invalid_path | observed_target | status                        |
      | Observation history path | missing.path | missing         | Waiting for observation path  |
      | Default push path         | queue.value  | a scalar        | Push path is not push-capable |
