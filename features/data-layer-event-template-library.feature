# mutation-stamp: sha256=d5c9070fe5bdee04f0a94142c3f862d66e3b6c4da684a299154c01d7a8f150bf
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T13:13:33.544026755Z","feature_name":"Data layer event template library","feature_path":"features/data-layer-event-template-library.feature","background_hash":"39070a43f3c1e9253948291e1f4f67745f6faf3dd627acae6b09ade9ea231548","implementation_hash":"sha256:event-template-library-semantic-v1","scenarios":[{"index":0,"name":"Data layer event template library 001","scenario_hash":"e4391d3fad4aa9f9f3833b7382458e3d992138066b1d325cf7320a28b087e335","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:13:33.544026755Z"},{"index":1,"name":"Data layer event template library 002","scenario_hash":"1a9be42b33ff9a2f25f28ce248405f1678249e9c47cecd889ef039aaf92cfb66","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:13:33.544026755Z"},{"index":2,"name":"Data layer event template library 003","scenario_hash":"d6db11006b871c764a60ca794c3395dcf3f5e1d18125ecdfce9ba4f23967f54d","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:13:33.544026755Z"},{"index":3,"name":"Data layer event template library 004","scenario_hash":"981c58a08302e1ba191871de4c9bed12579f487929c73898d6a9904fa2351da8","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:13:33.544026755Z"},{"index":4,"name":"Data layer event template library 005","scenario_hash":"a71e79b0aee947ede4af92988e5193c6eaa3b8da3b0cb95a896819be9344fc05","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:13:33.544026755Z"},{"index":5,"name":"Data layer event template library 006","scenario_hash":"594695136d986b169a9c80115cf7047533ee0888058eda2ffc95b8836b78d100","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:13:33.544026755Z"},{"index":6,"name":"Data layer event template library 007","scenario_hash":"9036aad1ea0b7da0027b0e4244f1e6236c9c50a1b963aaade5b1e32549e44f65","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:13:33.544026755Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer event template library

  Background:
    Given a repository for project <project_name>
    And captured event <event_name> is available from source <source_name>

  # Data layer event template library 001
  Scenario Outline: Data layer event template library 001
    When the user saves captured event <event_name> to the Library as <template_name>
    Then editable event template <template_name> is created independently of the captured event
    And template <template_name> records the originating session id and event id
    And changing template <template_name> cannot change the captured event or its saved session

    Examples:
      | project_name         | event_name | source_name   | template_name         |
      | my-chrome-utilities | pageview   | Event history | Purchase confirmation |

  # Data layer event template library 002
  Scenario Outline: Data layer event template library 002
    Given event templates <template_names> are saved
    When the user searches and filters by <query>
    Then only templates matching <query> by friendly name, event name, source, destination, tag, schema, or property are listed
    And the filtered template count is shown

    Examples:
      | project_name         | event_name | source_name   | template_names                               | query    |
      | my-chrome-utilities | pageview   | Event history | Purchase confirmation, Product detail view  | purchase |

  # Data layer event template library 003
  Scenario Outline: Data layer event template library 003
    Given event template <template_name> is saved
    When template <template_name> is shown in the Library
    Then it shows friendly name, event name, source adapter, destination, tags, schema assignment, validation state, and version
    And visible actions offer Edit, Duplicate, and Push when supported by the source adapter

    Examples:
      | project_name         | event_name | source_name   | template_name         |
      | my-chrome-utilities | pageview   | Event history | Purchase confirmation |

  # Data layer event template library 004
  Scenario Outline: Data layer event template library 004
    Given event template <template_name> targets <destination> on the active page
    When the user pushes template <template_name> without editing it
    Then the exact saved template payload is sent through its source adapter to <destination>
    And the visible result identifies the active page, source adapter, destination, and success or failure
    And no captured event or saved session is changed

    Examples:
      | project_name         | event_name | source_name   | template_name         | destination   |
      | my-chrome-utilities | pageview   | Event history | Purchase confirmation | event.history |

  # Data layer event template library 005
  Scenario Outline: Data layer event template library 005
    Given event template <template_name> has version <version>
    When the user duplicates it as <copy_name>
    Then a distinct template named <copy_name> is created with the same payload and destination
    And edits to <copy_name> do not change <template_name> version <version>

    Examples:
      | project_name         | event_name | source_name   | template_name         | version | copy_name             |
      | my-chrome-utilities | pageview   | Event history | Purchase confirmation | 3       | Purchase failure view |

  # Data layer event template library 006
  Scenario Outline: Data layer event template library 006
    Given event <event_name> is visible in a live or archived session
    When event actions are displayed
    Then Save to Library is available
    And direct replay of the immutable captured event is not offered

    Examples:
      | project_name         | event_name | source_name   |
      | my-chrome-utilities | pageview   | Event history |

  # Data layer event template library 007
  Scenario Outline: Data layer event template library 007
    Given event template <template_name> was saved in an earlier browser session
    When the side panel is opened later
    Then template <template_name> is restored with its payload, source adapter, destination, version, schema assignment, and provenance
    And template <template_name> can be edited or pushed according to adapter capabilities

    Examples:
      | project_name         | event_name | source_name   | template_name         |
      | my-chrome-utilities | pageview   | Event history | Purchase confirmation |
