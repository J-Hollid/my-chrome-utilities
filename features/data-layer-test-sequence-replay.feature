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

