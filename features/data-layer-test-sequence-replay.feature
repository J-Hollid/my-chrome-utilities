# mutation-stamp: sha256=cd2b4c2521f889a0797e92d47a2f5acd6724b1a4bd964b6cf71116b6e764343b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T13:28:33.271363751Z","feature_name":"Data layer test sequence replay","feature_path":"features/data-layer-test-sequence-replay.feature","background_hash":"2c6a79c33b834bbafe014123baa97782b82afdddb87d7ca69cf0c222d8f59564","implementation_hash":"sha256:sequence-replay-semantic-v4","scenarios":[{"index":4,"name":"Data layer test sequence replay 005","scenario_hash":"8943d8f484b8544f15866215b5a28ca39c96f93d127f1bf1caff5b04af19b03c","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:28:33.271363751Z"},{"index":0,"name":"Data layer test sequence replay 001","scenario_hash":"8e6459c555978764df1cefba6668f46899705c296111acf17772ecee8586d237","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:27:20.874616451Z"},{"index":1,"name":"Data layer test sequence replay 002","scenario_hash":"c0acaf9016b5bc717ecba8684ac64f691c02dcb864d58637fccb28e6873ada45","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:27:20.874616451Z"},{"index":2,"name":"Data layer test sequence replay 003","scenario_hash":"3e1830a4e00d96ca882e5947c407d9de7537c906e00e3d83f9b41154147629b8","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:27:20.874616451Z"},{"index":3,"name":"Data layer test sequence replay 004","scenario_hash":"e1d2428e1ae7e885c59499ccbc765e3db058ff574dc7cf3100ffb29948f29412","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:27:20.874616451Z"},{"index":5,"name":"Data layer test sequence replay 006","scenario_hash":"c3f7f6798b1872430846993e146f8f0519a3397de98e425076f9e67f9b47209c","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:27:20.874616451Z"},{"index":6,"name":"Data layer test sequence replay 007","scenario_hash":"d37ad07d86c7e09fe4fb1beb61e460b19c40eee8efd9f8865d68a548067cf31e","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T13:27:20.874616451Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer test sequence replay

  Background:
    Given a repository for project <project_name>
    And reusable event templates are saved in the Library

  # Data layer test sequence replay 001
  Scenario Outline: Data layer test sequence replay 001
    Given saved session <session_name> contains events <event_names> in capture order
    When the user creates test sequence <sequence_name> from that session
    Then sequence <sequence_name> contains <event_names> in capture order
    And the user can omit captured events before saving the sequence
    And saved session <session_name> remains unchanged

    Examples:
      | project_name         | session_name    | sequence_name     | event_names                              |
      | my-chrome-utilities | Checkout journey | Purchase journey  | pageview, product_view, cart, purchase   |

  # Data layer test sequence replay 002
  Scenario Outline: Data layer test sequence replay 002
    Given test sequence <sequence_name> contains template <template_name> version <template_version>
    When template <template_name> is revised to version <new_version>
    Then sequence <sequence_name> continues using version <template_version>
    And the sequence offers an explicit update to version <new_version>

    Examples:
      | project_name         | sequence_name    | template_name         | template_version | new_version |
      | my-chrome-utilities | Purchase journey | Purchase confirmation | 3                | 4           |

  # Data layer test sequence replay 003
  Scenario Outline: Data layer test sequence replay 003
    Given test sequence <sequence_name> contains ordered steps <step_names>
    When the user edits the sequence
    Then steps can be reordered, disabled, duplicated, or removed
    And each step can define a delay, manual breakpoint, destination, and local payload override
    And local payload overrides do not change Library templates

    Examples:
      | project_name         | sequence_name    | step_names                       |
      | my-chrome-utilities | Purchase journey | Product view, Cart, and Purchase |

  # Data layer test sequence replay 004
  Scenario Outline: Data layer test sequence replay 004
    Given test sequence <sequence_name> has enabled steps with supported source adapters and destinations
    When the user chooses <run_action>
    Then the runner performs the corresponding enabled steps in sequence order
    And visible controls offer Run step, Run all, Pause, Resume, and Stop
    And the currently running step and result are shown

    Examples:
      | project_name         | sequence_name    | run_action |
      | my-chrome-utilities | Purchase journey | Run step   |
      | my-chrome-utilities | Purchase journey | Run all    |

  # Data layer test sequence replay 005
  Scenario Outline: Data layer test sequence replay 005
    Given sequence step <step_name> uses adapter <adapter_name> without capability <required_capability>
    When sequence readiness is checked
    Then step <step_name> is identified as not runnable
    And Run all does not start until the unsupported step is disabled or assigned a capable adapter

    Examples:
      | project_name         | sequence_name    | step_name    | adapter_name | required_capability |
      | my-chrome-utilities | Purchase journey | Adobe beacon | Adobe        | push                |

  # Data layer test sequence replay 006
  Scenario Outline: Data layer test sequence replay 006
    Given test sequence <sequence_name> is run against page <page_url>
    When the run ends with result <run_result>
    Then an immutable execution record stores each executed step, template version, effective payload, destination, timestamp, and result
    And the execution record links to sequence <sequence_name> without changing the sequence, templates, or originating session

    Examples:
      | project_name         | sequence_name    | page_url                          | run_result |
      | my-chrome-utilities | Purchase journey | https://example.test/confirmation | completed  |

  # Data layer test sequence replay 007
  Scenario Outline: Data layer test sequence replay 007
    Given test sequence <sequence_name> contains steps for source kinds <source_kinds>
    When all step adapters support their assigned actions
    Then the sequence can run across <source_kinds> in one ordered execution
    And every step result retains its source adapter and destination

    Examples:
      | project_name         | sequence_name       | source_kinds                    |
      | my-chrome-utilities | Analytics smoke test | Data Layer, Adobe, and GTAG     |

