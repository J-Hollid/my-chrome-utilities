# mutation-stamp: sha256=046de48c741977f0e36a2c4f57cf281a10486a0dbf6709d68795fc1b401ac420
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-08T19:03:37.520965188Z","feature_name":"Project skeleton","feature_path":"features/project-skeleton.feature","background_hash":"7010dbc38239bc7043db7168e3ce76337d3bc72582407db6296288f1ba4d4743","implementation_hash":"sha256:e314737b4f3286ae5126d053354990dfa380d41141244000c268b07417532dee","scenarios":[{"index":0,"name":"Project skeleton 001","scenario_hash":"ccc55b0e41f11f5d3070308b98a5bbff4c0d17dc44427a7f7cafc2fe06759174","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T17:10:54.043884453Z"},{"index":1,"name":"Project skeleton 002","scenario_hash":"8b69b28521d3fb377b4c3ff40f232a656e1035fddb925e07fae7dfc9daf151b1","mutation_count":1,"result":{"Total":1,"Killed":1,"Survived":0,"Errors":0},"tested_at":"2026-07-08T17:10:54.043884453Z"}]}
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
    And generated dependency and build outputs are ignored

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
