Feature: Data layer multiple observation sources

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active

  # Data layer multiple observation sources 001
  Scenario Outline: Data layer multiple observation sources 001
    Given Data Layer queue sources <first_source> at <first_path> and <second_source> at <second_path> are configured
    When observation starts for the active page
    Then both queue sources are observed independently
    And captured events identify either <first_source> or <second_source>
    And each source shows its own attachment status

    Examples:
      | project_name         | first_source  | first_path    | second_source | second_path      |
      | my-chrome-utilities | Event history | event.history | GTM dataLayer | window.dataLayer |

  # Data layer multiple observation sources 002
  Scenario Outline: Data layer multiple observation sources 002
    Given observation adapters for <source_kinds> are enabled
    When events are captured from each adapter
    Then one chronological feed contains events from <source_kinds>
    And every event shows a source-kind label and source-instance label
    And source identity is not communicated by color alone

    Examples:
      | project_name         | source_kinds                 |
      | my-chrome-utilities | Data Layer, Adobe, and GTAG  |

  # Data layer multiple observation sources 003
  Scenario Outline: Data layer multiple observation sources 003
    Given source <failing_source> has status <failure_status>
    And connected source <connected_source> has status <connected_status>
    When observation continues
    Then events from <connected_source> continue to be captured
    And <failing_source> remains visibly identified with status <failure_status>

    Examples:
      | project_name         | failing_source | failure_status | connected_source | connected_status |
      | my-chrome-utilities | Event history  | Path missing   | Adobe beacons    | Connected        |

  # Data layer multiple observation sources 004
  Scenario Outline: Data layer multiple observation sources 004
    Given events from sources <source_names> are visible
    When the user filters the feed to source <selected_source>
    Then only events from <selected_source> are visible
    And the feed reports the filtered event count
    When the source filter is cleared
    Then events from <source_names> are visible again

    Examples:
      | project_name         | source_names                    | selected_source |
      | my-chrome-utilities | Event history and Adobe beacons | Adobe beacons   |

  # Data layer multiple observation sources 005
  Scenario Outline: Data layer multiple observation sources 005
    Given source <source_name> is configured with adapter <adapter_name> and destination <destination>
    When a reusable event for <source_name> is opened
    Then adapter <adapter_name> and destination <destination> are shown before an executable action
    And another source destination is not selected implicitly

    Examples:
      | project_name         | source_name   | adapter_name | destination   |
      | my-chrome-utilities | Event history | Data Layer   | event.history |

  # Data layer multiple observation sources 006
  Scenario Outline: Data layer multiple observation sources 006
    When the observation source manager is displayed
    Then each source shows friendly name, adapter kind, page destination or endpoint, enabled state, and connection status
    When the user adds source <source_name> with adapter <adapter_name> and destination <destination>
    Then source <source_name> is available to observe, filter, validate, and configure according to adapter capabilities

    Examples:
      | project_name         | source_name | adapter_name | destination       |
      | my-chrome-utilities | GA4 collect | GTAG         | /g/collect endpoint |

  # Data layer multiple observation sources 007
  Scenario Outline: Data layer multiple observation sources 007
    Given source <source_name> has already captured events
    When the user disables that source
    Then no new events are captured from <source_name>
    And previously captured events retain source identity <source_name>
    When the user removes the source after confirmation
    Then its configuration is removed without removing captured session events

    Examples:
      | project_name         | source_name   |
      | my-chrome-utilities | Event history |
