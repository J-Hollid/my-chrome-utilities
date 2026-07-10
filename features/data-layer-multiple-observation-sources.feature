# mutation-stamp: sha256=72cdc1be748ed0f515b32e94975d0cddebe351eebdad3771c18936fb34046aa7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T12:28:59.714940324Z","feature_name":"Data layer multiple observation sources","feature_path":"features/data-layer-multiple-observation-sources.feature","background_hash":"7eff79698fd64e8f9a3868028adc9e1e92c8ecb38c6e280eb613d153d0449040","implementation_hash":"sha256:26395f56f4f1d4bd521432e84bd04d6f701842848822271dc2673df81e88768b","scenarios":[{"index":0,"name":"Data layer multiple observation sources 001","scenario_hash":"added693925b7a86c019ab3942c516ba4a3e38f11e340f38e3f16281d3eabe4f","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:28:59.714940324Z"},{"index":1,"name":"Data layer multiple observation sources 002","scenario_hash":"4db1b9e4e4e3633c700ec5eef5c6787b03a891bb90fed969fc1b91bfb0385bd7","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:28:59.714940324Z"},{"index":2,"name":"Data layer multiple observation sources 003","scenario_hash":"18a43d1f9a7f87ece7a0c47eb229d9952fb5779d6ac37dac1a87c4a61f433819","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:28:59.714940324Z"},{"index":3,"name":"Data layer multiple observation sources 004","scenario_hash":"50ce2389c663500e44ea2821accf212c22e43b2e2cb18248679383a6a79cd752","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:28:59.714940324Z"},{"index":4,"name":"Data layer multiple observation sources 005","scenario_hash":"6e2acfe089d395e327165d64e75621f640f7350bb3853d6d0f3a875e2f5ca43b","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:28:59.714940324Z"},{"index":5,"name":"Data layer multiple observation sources 006","scenario_hash":"19554b4f24821326f86748b8fcce6f6d7dfa2793a93e362d8e4445d228519d71","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:28:59.714940324Z"},{"index":6,"name":"Data layer multiple observation sources 007","scenario_hash":"f9c9a1141f9163534db71043640887d1bb1875ee7da4f884cfa38d39f0db24ed","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-10T12:28:59.714940324Z"}]}
# acceptance-mutation-manifest-end

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
