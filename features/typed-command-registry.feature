# mutation-stamp: sha256=e03b05436fa908aef9e73366e6234947a4a699d6509f7e0ae75010a721a89ebb
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T09:28:12.109288399Z","feature_name":"Typed command registry","feature_path":"features/typed-command-registry.feature","background_hash":"7010dbc38239bc7043db7168e3ce76337d3bc72582407db6296288f1ba4d4743","implementation_hash":"sha256:8276d2d22aa29d016d334b87160c25092c388772ad51b59d84a06b5b55ff14e8","scenarios":[{"index":3,"name":"Typed command registry 004","scenario_hash":"6633deecc8ccb1e61acc3c1f479a69d27c83f4a180780e71d8e861386b1eb545","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T19:03:27.783045736Z"},{"index":0,"name":"Typed command registry 001","scenario_hash":"be7ea690298860c247ef4ffd487ccdfd954714dcba972175b120c8d742e564d1","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-08T18:57:17.598761653Z"},{"index":1,"name":"Typed command registry 002","scenario_hash":"c353af844828a26fe1971416daf9975d86a20dad24581e9151d0b26f28f5431c","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-08T18:57:17.598761653Z"},{"index":2,"name":"Typed command registry 003","scenario_hash":"8f8c1290cb428cd45f15855a0376ce601f7f4dec620980f68d45b0ce6e506540","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-08T18:57:17.598761653Z"}]}
# acceptance-mutation-manifest-end

Feature: Typed command registry

  Background:
    Given a repository for project <project_name>

  # Typed command registry 001
  Scenario Outline: Typed command registry 001
    When the command registry contract is inspected
    Then each command defines <id_field>, <title_field>, <description_field>, <category_field>, and <run_field>
    And the registry can list commands
    And command registry logic is separated from side panel rendering

    Examples:
      | project_name         | id_field | title_field | description_field | category_field | run_field |
      | my-chrome-utilities | id       | title       | description       | category       | run       |

  # Typed command registry 002
  Scenario Outline: Typed command registry 002
    When command <command_id> is inspected
    Then command <command_id> is registered
    And command <command_id> has a title, description, category, and run behavior

    Examples:
      | project_name         | command_id     |
      | my-chrome-utilities | demo.say-hello |

  # Typed command registry 003
  Scenario Outline: Typed command registry 003
    When command <command_id> is run by id
    Then visible app state or log records that command <command_id> ran

    Examples:
      | project_name         | command_id     |
      | my-chrome-utilities | demo.say-hello |

  # Typed command registry 004
  Scenario Outline: Typed command registry 004
    When command features are inspected
    Then no user-configurable keybindings are present

    Examples:
      | project_name         |
      | my-chrome-utilities |
