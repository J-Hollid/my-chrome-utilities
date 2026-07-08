# mutation-stamp: sha256=6cb6ce639c4b896df0b90766cfd60d4ad6269b7db67ecd7f66105fc4e6467b78
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-08T22:18:34.536641036Z","feature_name":"Data layer event timeline","feature_path":"features/data-layer-event-timeline.feature","background_hash":"7eff79698fd64e8f9a3868028adc9e1e92c8ecb38c6e280eb613d153d0449040","implementation_hash":"sha256:d0cbed267d35bb9c58954731a34b7264f86998473b9436a9c87aaf75cb79a3af","scenarios":[{"index":0,"name":"Data layer event timeline 001","scenario_hash":"f5db5d52ddfb5f58e1acf17afe8cd9fb16cd72e85e314239b18420f05cae2a86","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:06:05.039967153Z"},{"index":1,"name":"Data layer event timeline 002","scenario_hash":"02a5931d93c5bb4d44756c71d739ec43f76ba9bdf021a2dccdac5b87917881cb","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:06:05.039967153Z"},{"index":2,"name":"Data layer event timeline 003","scenario_hash":"409105f2bca3b19e7122ab6310512a19c56bfce1246f087fe298a0921886e90d","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T21:06:05.039967153Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer event timeline

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active

  # Data layer event timeline 001
  Scenario Outline: Data layer event timeline 001
    When observed event entries are recorded
    Then the side panel shows them in capture order
    And each timeline entry shows event name <event_name>
    And each timeline entry shows page URL <page_url>
    And each timeline entry shows capture time
    And each timeline entry shows observer path <history_path>

    Examples:
      | project_name         | history_path  | page_url                | event_name |
      | my-chrome-utilities | queue.history | https://example.test/p/ | signup     |

  # Data layer event timeline 002
  Scenario Outline: Data layer event timeline 002
    Given timeline entry <event_name> is visible
    When the timeline entry is expanded
    Then the expanded entry shows event name <event_name>
    And the expanded entry shows page URL <page_url>
    And the expanded entry shows observer path <history_path>
    And the expanded entry shows payload <payload_label>
    And the expanded entry shows raw value <raw_label>

    Examples:
      | project_name         | history_path  | page_url                | event_name | payload_label | raw_label  |
      | my-chrome-utilities | queue.history | https://example.test/p/ | signup     | signup-values | signup-raw |

  # Data layer event timeline 003
  Scenario Outline: Data layer event timeline 003
    When data layer timeline features are inspected
    Then timeline filtering is not present
    And timeline search is not present
    And validation results are not present

    Examples:
      | project_name         |
      | my-chrome-utilities |
