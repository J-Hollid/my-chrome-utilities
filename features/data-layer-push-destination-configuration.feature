# mutation-stamp: sha256=dfd5961fd6a34863ad007375fdaec72ffc42fe43a7380d3e14d40b8dc2f16148
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-11T01:18:04.238031739Z","feature_name":"Data layer push destination configuration","feature_path":"features/data-layer-push-destination-configuration.feature","background_hash":"5b4846e9f20fff9fb7e190a95e9d0a72afb99c92c8ec73b4e61f6defcec91dca","implementation_hash":"sha256:selected-target-event-push-v1","scenarios":[{"index":0,"name":"Data layer push destination configuration 001","scenario_hash":"81ab18a34588977c4186d6c668aabeaeb6e77eeb1a335aed83559d46d1b37972","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-11T01:18:04.238031739Z"},{"index":1,"name":"Data layer push destination configuration 002","scenario_hash":"ef438e244e79e26297b160a502408616b0cb17e494988c2cfc3775d9c1da1102","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-11T01:18:04.238031739Z"},{"index":2,"name":"Data layer push destination configuration 003","scenario_hash":"70a2bb2e12e331bf777e377ab09f4b5c4911d33b69ab08770576b47addd0b170","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-11T01:18:04.238031739Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer push destination configuration

  Background:
    Given observation history path <history_path> is configured in the Live view
    And event template <template_name> is open in the Library editor

  # Data layer push destination configuration 001
  Scenario Outline: Data layer push destination configuration 001
    When the Library editor is displayed
    Then a separately labelled Push destination path control contains <push_path>
    And the Push destination path control is distinct from the observation history path control
    And the observation history path remains <history_path>

    Examples:
      | history_path  | template_name         | push_path |
      | queue.history | Purchase confirmation | dataLayer |

  # Data layer push destination configuration 002
  Scenario Outline: Data layer push destination configuration 002
    When the user changes the Push destination path from <first_push_path> to <second_push_path>
    And saves the template revision
    Then template <template_name> targets <second_push_path>
    And reopening template <template_name> displays <second_push_path>
    And the observation history path remains <history_path>

    Examples:
      | history_path  | template_name         | first_push_path | second_push_path |
      | queue.history | Purchase confirmation | dataLayer       | analytics.queue  |

  # Data layer push destination configuration 003
  Scenario Outline: Data layer push destination configuration 003
    Given Push destination path <invalid_push_path> is not a valid object path
    When the user attempts to push the template
    Then the template is not pushed
    And the Push destination path control identifies the invalid path
    And no successful push result is displayed

    Examples:
      | history_path  | template_name         | invalid_push_path |
      | queue.history | Purchase confirmation | analytics[         |
