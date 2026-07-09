# mutation-stamp: sha256=3297fc2c1263e6b368728036d45f19fa39255261680f757a7ecebab53bcb56fb
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T14:52:28.810007558Z","feature_name":"Project skeleton","feature_path":"features/project-skeleton.feature","background_hash":"7010dbc38239bc7043db7168e3ce76337d3bc72582407db6296288f1ba4d4743","implementation_hash":"sha256:e314737b4f3286ae5126d053354990dfa380d41141244000c268b07417532dee","scenarios":[{"index":0,"name":"Project skeleton 001","scenario_hash":"500d9350b31cebe5a6f07ae129eda2ba24f1f9d3e5c681af6ba0e1fe2c89d330","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-09T10:23:59.222091095Z"},{"index":1,"name":"Project skeleton 002","scenario_hash":"8b69b28521d3fb377b4c3ff40f232a656e1035fddb925e07fae7dfc9daf151b1","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T17:10:54.043884453Z"}]}
# acceptance-mutation-manifest-end

Feature: Project skeleton

  Background:
    Given a repository for project <project_name>

  # Project skeleton 001
  Scenario Outline: Project skeleton 001
    When the project skeleton is inspected
    Then package metadata identifies the project as <project_name>
    And the skeleton includes TypeScript source
    And the skeleton includes a browser app entry point
    And generated dependency and transient outputs are ignored

    Examples:
      | project_name         |
      | my-chrome-utilities |

  # Project skeleton 002
  Scenario Outline: Project skeleton 002
    When the project build command is run
    Then TypeScript checking succeeds
    And a production build for <project_name> completes

    Examples:
      | project_name         |
      | my-chrome-utilities |
