# mutation-stamp: sha256=8cb683bbdf27d38a7cfee96dfc3121eaadb90bb03b57449ae753e709bea80e84
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-08T19:14:19.884151147Z","feature_name":"Portable build package flow","feature_path":"features/portable-build-package-flow.feature","background_hash":"7010dbc38239bc7043db7168e3ce76337d3bc72582407db6296288f1ba4d4743","implementation_hash":"sha256:1cff34d8efb6accbf65fe19e0ad5e643a2f8a6b567b9e369238d1d725c8d84a0","scenarios":[{"index":0,"name":"Portable build package flow 001","scenario_hash":"58fb98875b1798f0c384495189e6ad93758629bd799f3516f003434f5fc6fd69","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-08T19:14:19.884151147Z"},{"index":1,"name":"Portable build package flow 002","scenario_hash":"dc7f0afdb7e6bbd61bdc4993b7cf2ed544f15aec2f35789035ca68b9aed9c804","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-08T19:14:19.884151147Z"},{"index":2,"name":"Portable build package flow 003","scenario_hash":"2e0d455b8d91abde61604befc44955f466011eeec7276d30a7c24ed74a98da5a","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-08T19:14:19.884151147Z"},{"index":3,"name":"Portable build package flow 004","scenario_hash":"619708eae3508aecd7837e32d59c9af0336ad608208b077b49d16f805fd0dccb","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T19:14:19.884151147Z"}]}
# acceptance-mutation-manifest-end

Feature: Portable build package flow

  Background:
    Given a repository for project <project_name>

  # Portable build package flow 001
  Scenario Outline: Portable build package flow 001
    When command <build_command> is run
    Then output directory <dist_dir> is created
    And <dist_dir> contains a loadable Chrome extension build

    Examples:
      | project_name         | build_command | dist_dir |
      | my-chrome-utilities | npm run build | dist     |

  # Portable build package flow 002
  Scenario Outline: Portable build package flow 002
    When command <package_command> is run after a production build
    Then a <artifact_type> package artifact is created from <dist_dir>
    And the package artifact contains the Chrome extension build from <dist_dir>

    Examples:
      | project_name         | package_command | artifact_type | dist_dir |
      | my-chrome-utilities | npm run package | zip           | dist     |

  # Portable build package flow 003
  Scenario Outline: Portable build package flow 003
    When the README is inspected
    Then the README documents copying the <artifact_type> package artifact to another machine
    And the README documents copying <dist_dir> to another machine
    And the README documents loading the unpacked extension in Chrome
    And the README includes smoke test steps for the installed extension

    Examples:
      | project_name         | artifact_type | dist_dir |
      | my-chrome-utilities | zip           | dist     |

  # Portable build package flow 004
  Scenario Outline: Portable build package flow 004
    When package flow documentation and scripts are inspected
    Then Chrome Web Store packaging is not present
    And signing is not present
    And auto-update behavior is not present

    Examples:
      | project_name         |
      | my-chrome-utilities |
