# mutation-stamp: sha256=229ec2d1d7c3233e8db63451e6c42223c331f957240de95d49ace68b91842c25
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T14:56:28.916423084Z","feature_name":"Data layer testing session","feature_path":"features/data-layer-testing-session.feature","background_hash":"4d7d32f4ea4769ebefbe738969b7f9c03fc3616d07d1322af52d24959a07bffd","implementation_hash":"sha256:e3dfa4aef09fe561266bc4c1bcc3d0ca237578fa59134dcd7e2fb53b8faa9904","scenarios":[{"index":0,"name":"Data layer testing session 001","scenario_hash":"f633eb2f98d39fe73b4e4c602117e8e83fbadbe962e56e85debdb5eac4aac572","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-08T20:50:55.965530433Z"},{"index":1,"name":"Data layer testing session 002","scenario_hash":"2a9778cfc64afaa925efc418fdeb1f4072cbfbef3f391a2dab82fca32da31d1a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-08T20:50:55.965530433Z"},{"index":2,"name":"Data layer testing session 003","scenario_hash":"c630ca2f82ff92503410ecdd4fcad51ea91892ee0d55d0fd1252bccadb7f5a94","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-08T20:50:55.965530433Z"},{"index":3,"name":"Data layer testing session 004","scenario_hash":"1759f3397073a940344dbabfe5def900d31dec6ea2fbea8c7f16ffc02aad09db","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-08T20:50:55.965530433Z"},{"index":4,"name":"Data layer testing session 005","scenario_hash":"13dccbe6a8cad1ca42ad7ebc934483d3ea6d5436d814c42dabb89340ebc10f43","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-08T20:50:55.965530433Z"},{"index":5,"name":"Data layer testing session 006","scenario_hash":"1fa59b1f2e2f620e46e30246da0178a5a01b3fc1b1fbcd8b2d666209c3e80b6b","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-08T20:50:55.965530433Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer testing session

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured

  # Data layer testing session 001
  Scenario Outline: Data layer testing session 001
    When command <command_id> is run for the active tab
    Then a data layer testing session starts for the active tab
    And the session scope is the active tab journey
    And the side panel shows the session as active
    And the active session uses history array path <history_path>

    Examples:
      | project_name         | history_path  | command_id               |
      | my-chrome-utilities | queue.history | data-layer.start-testing |

  # Data layer testing session 002
  Scenario Outline: Data layer testing session 002
    Given a data layer testing session is active
    When the active tab navigates or reloads from <start_url> to <next_url>
    Then the same data layer testing session remains active
    And captured event entries remain part of the same session timeline

    Examples:
      | project_name         | history_path  | start_url             | next_url                |
      | my-chrome-utilities | queue.history | https://example.test/ | https://example.test/p/ |
      | my-chrome-utilities | queue.history | https://example.test/ | https://example.test/   |

  # Data layer testing session 003
  Scenario Outline: Data layer testing session 003
    Given a data layer testing session is active
    When the side panel is reopened
    Then the active session is restored from local persistence
    And captured event entries remain visible

    Examples:
      | project_name         | history_path  |
      | my-chrome-utilities | queue.history |

  # Data layer testing session 004
  Scenario Outline: Data layer testing session 004
    Given a data layer testing session is active
    When command <command_id> is run for the active tab
    Then an active session warning is shown
    And the existing data layer testing session remains unchanged

    Examples:
      | project_name         | history_path  | command_id               |
      | my-chrome-utilities | queue.history | data-layer.start-testing |

  # Data layer testing session 005
  Scenario Outline: Data layer testing session 005
    Given a data layer testing session is active
    When command <command_id> is run for the active tab
    Then the data layer testing session ends intentionally
    And no new page entries are captured for that ended session

    Examples:
      | project_name         | history_path  | command_id             |
      | my-chrome-utilities | queue.history | data-layer.end-testing |

  # Data layer testing session 006
  Scenario Outline: Data layer testing session 006
    When data layer testing session features are inspected
    Then a multi-profile session manager is not present
    And event replay is not present

    Examples:
      | project_name         | history_path  |
      | my-chrome-utilities | queue.history |
