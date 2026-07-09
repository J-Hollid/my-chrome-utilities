# mutation-stamp: sha256=65f925bcf27173348124d395dcdff4c6880e31bce1b971490eaba374df423cb0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T20:51:22.657926638Z","feature_name":"Data layer pageload observation refresh","feature_path":"features/data-layer-pageload-observation-refresh.feature","background_hash":"c9b3d2ad3f7e5052a158c6a70222e7839b5b2afcc508ed80aa23b3e30b71d124","implementation_hash":"sha256:1674e48596a406cac776635bf44eaa4433cd2a0966fe039cd371f2fcfb42de14","scenarios":[{"index":0,"name":"Data layer pageload observation refresh 001","scenario_hash":"3fd0e1f85e767f1f47c0f74353ed34c158eadcfcfc8838e9f5b001c501737167","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-09T20:51:15.408708980Z"},{"index":1,"name":"Data layer pageload observation refresh 002","scenario_hash":"9362ed906f7499b53519db9bff38e5a4dfb4d2e9d6369421c96f039a893945b9","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-09T20:51:15.408708980Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer pageload observation refresh

  Background:
    Given a repository for project <project_name>
    And the project skeleton is inspected
    And package metadata identifies the project as <project_name>
    And history array path <history_path> is configured
    And a data layer testing session is active

  # Data layer pageload observation refresh 001
  Scenario Outline: Data layer pageload observation refresh 001
    Given observation is attached on page <page_url>
    When the active tab navigates to page <refreshed_page_url> where history array path <history_path> becomes ready after pageload
    Then observation refreshes automatically for page <refreshed_page_url>
    And the pageload refresh starts from the canonical page URL
    And the pageload refresh uses the canonical product page URL
    And no manual observation restart is required
    And entry <event_name> pushed after history array path <history_path> is ready is captured once with URL <refreshed_page_url>
    And the pageload refresh uses the canonical history path
    And the pageload refresh captures the canonical event

    Examples:
      | project_name         | history_path  | page_url                 | refreshed_page_url               | event_name |
      | my-chrome-utilities | event.history | https://www.example.com/ | https://www.example.com/product  | pageview   |

  # Data layer pageload observation refresh 002
  Scenario Outline: Data layer pageload observation refresh 002
    Given observation is attached on page <page_url>
    When page <page_url> reloads and history array path <history_path> is missing until after pageload
    Then observation waits for history array path <history_path> to become ready
    And the pageload refresh starts from the canonical page URL
    And the pageload refresh uses the canonical reload page URL
    And entry <event_name> pushed after history array path <history_path> is ready is captured once with URL <refreshed_page_url>
    And the pageload refresh uses the canonical history path
    And the pageload refresh captures the canonical event

    Examples:
      | project_name         | history_path  | page_url                 | refreshed_page_url       | event_name |
      | my-chrome-utilities | event.history | https://www.example.com/ | https://www.example.com/ | pageview   |
