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
