# mutation-stamp: sha256=d7b9d3f08be391c68458284725b5b468e12579525d942cef48d9eabdea77d9c7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T19:53:17.795625824Z","feature_name":"Manifest V3 side panel extension","feature_path":"features/manifest-v3-side-panel-extension.feature","background_hash":"7010dbc38239bc7043db7168e3ce76337d3bc72582407db6296288f1ba4d4743","implementation_hash":"sha256:delivery-boundary-v1","scenarios":[{"index":3,"name":"Manifest V3 side panel extension 004","scenario_hash":"8b73ffdd9c919ce1de09e6278cccca3030ef4ab4d4f59a19ddca4b2fa1bb59e2","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-10T19:53:17.795625824Z"},{"index":0,"name":"Manifest V3 side panel extension 001","scenario_hash":"fd2303efc1eb09868c154c8db6402e35560662d250d585b711da4dfc89e0f2ba","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-08T18:49:32.590926936Z"},{"index":1,"name":"Manifest V3 side panel extension 002","scenario_hash":"d0c26f7b81b62c3e16883be9739c033582fe78ed8d1340bfcb525672cbe63db0","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T18:49:32.590926936Z"},{"index":2,"name":"Manifest V3 side panel extension 003","scenario_hash":"deaa79e6ef22e65b35eb15674c4034bc628d53ddfc0ee45e821b80dd864c72f2","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T18:49:32.590926936Z"}]}
# acceptance-mutation-manifest-end

Feature: Manifest V3 side panel extension

  Background:
    Given a repository for project <project_name>

  # Manifest V3 side panel extension 001
  Scenario Outline: Manifest V3 side panel extension 001
    When the extension manifest is inspected
    Then manifest_version is <manifest_version>
    And the extension name is <project_name>
    And side_panel.default_path points to the side panel HTML entry
    And permission <permission> is declared
    And no content scripts are declared

    Examples:
      | project_name         | manifest_version | permission |
      | my-chrome-utilities | 3                | sidePanel  |

  # Manifest V3 side panel extension 002
  Scenario Outline: Manifest V3 side panel extension 002
    When the extension action is clicked
    Then the side panel opens for the active tab

    Examples:
      | project_name         |
      | my-chrome-utilities |

  # Manifest V3 side panel extension 003
  Scenario Outline: Manifest V3 side panel extension 003
    When the production extension is built
    Then dist can be loaded unpacked in Chrome
    And the built side panel HTML entry exists
    And the side panel displays <project_name>

    Examples:
      | project_name         |
      | my-chrome-utilities |
  # Manifest V3 side panel extension 004
  Scenario Outline: Manifest V3 side panel extension 004
    When the extension implementation is inspected
    Then no command registry is present in manifest or background delivery boundaries
    And no command palette is present in manifest or background delivery boundaries
    And no data layer functionality is present in manifest or background delivery boundaries

    Examples:
      | project_name         |
      | my-chrome-utilities |
