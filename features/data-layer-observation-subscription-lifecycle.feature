# mutation-stamp: sha256=c9535ae4f207e994b52360be553118fce2412653190c356ac787abcf59e64572
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-10T15:52:46.992454824Z","feature_name":"Data layer observation subscription lifecycle","feature_path":"features/data-layer-observation-subscription-lifecycle.feature","background_hash":"6e304abd57ae925cb95c9665fbca9743b617d9ce9458f1ef6eedda2cd706ff51","implementation_hash":"sha256:live-event-presentation-semantic-v4","scenarios":[{"index":0,"name":"Data layer observation subscription lifecycle 001","scenario_hash":"886ac7770e901a9835e4b9fd2a19d8fe22ff28b5702f2a35265248964d2d05b4","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T15:45:11.060581566Z"},{"index":3,"name":"Data layer observation subscription lifecycle 004","scenario_hash":"094315591b967e76bfc52a8431e853e5e709ee7ff16fcfe262cf79c3e73e2d0c","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T15:45:11.060581566Z"},{"index":1,"name":"Data layer observation subscription lifecycle 002","scenario_hash":"d56336ebbb3180ebbd53c2d01d091061fbe624ce76fa605cda5faf3501f8eecf","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T15:43:43.541900855Z"},{"index":2,"name":"Data layer observation subscription lifecycle 003","scenario_hash":"4e144d4f85041a133cb2f77b3d9c52642ae5e384a13c915df3125e75bf4ce81f","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-10T15:43:43.541900855Z"},{"index":4,"name":"Data layer observation subscription lifecycle 005","scenario_hash":"11a04c170541ad987a6d418b7c9fe582184de33c925bc75edd38da088bbb5376","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-10T15:43:43.541900855Z"},{"index":5,"name":"Data layer observation subscription lifecycle 006","scenario_hash":"0b1389740f44bff17b66c8a692bad72696decbedfdef531bfe0c4e14c2633eb4","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-10T15:43:43.541900855Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer observation subscription lifecycle

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active on page <page_url>
    And history array path <history_path> is configured

  # Data layer observation subscription lifecycle 001
  Scenario Outline: Data layer observation subscription lifecycle 001
    Given the history array contains existing events <existing_events> before observation starts
    When observation attaches and event <live_event> is pushed afterward
    Then existing events <existing_events> are imported once in array order
    And event <live_event> is captured once after the imported events
    And the boundary between existing history and subsequent pushes does not omit or duplicate an event

    Examples:
      | project_name         | page_url                 | history_path  | existing_events        | live_event |
      | my-chrome-utilities | https://www.example.com/ | event.history | pageview, offer_view    | purchase   |

  # Data layer observation subscription lifecycle 002
  Scenario Outline: Data layer observation subscription lifecycle 002
    Given existing event <existing_event> was already imported from the current page and history array
    When observation is restarted for the same page, array, and <history_path>
    Then <existing_event> is not appended to the session again
    And exactly one active subscription observes <history_path>
    When event <live_event> is pushed
    Then <live_event> is captured once

    Examples:
      | project_name         | page_url                 | history_path  | existing_event | live_event |
      | my-chrome-utilities | https://www.example.com/ | event.history | pageview       | purchase   |

  # Data layer observation subscription lifecycle 003
  Scenario Outline: Data layer observation subscription lifecycle 003
    Given event <event_name> was captured on page <first_page>
    When the selected target tab navigates to new page <page_url> with a new history array containing <event_name>
    Then the new page's existing history is imported once
    And both occurrences of <event_name> remain distinct and retain their page URLs
    And exactly one active subscription observes <history_path> on <page_url>

    Examples:
      | project_name         | first_page                | page_url                         | history_path  | event_name |
      | my-chrome-utilities | https://www.example.com/  | https://www.example.com/checkout | event.history | pageview   |

  # Data layer observation subscription lifecycle 004
  Scenario Outline: Data layer observation subscription lifecycle 004
    Given observation start request <first_request> is still pending
    When newer start request <second_request> is made for the same page and source
    Then request <second_request> becomes the current observation
    And request <first_request> cannot leave an active listener or page hook after it completes
    And one page push produces one captured event and one Live feed row

    Examples:
      | project_name         | page_url                 | history_path  | first_request       | second_request      |
      | my-chrome-utilities | https://www.example.com/ | event.history | path input refresh  | manual restart      |

  # Data layer observation subscription lifecycle 005
  Scenario Outline: Data layer observation subscription lifecycle 005
    Given observation is active for history array path <old_path>
    When the configured history array path changes to <history_path>
    Then the subscription for <old_path> is removed before <history_path> becomes active
    And pushes to <old_path> are no longer captured
    And one push to <history_path> produces one captured event

    Examples:
      | project_name         | page_url                 | old_path         | history_path     |
      | my-chrome-utilities | https://www.example.com/ | window.dataLayer | event.history    |

  # Data layer observation subscription lifecycle 006
  Scenario Outline: Data layer observation subscription lifecycle 006
    Given observation is active for <history_path>
    When session action <session_action> completes
    Then its runtime listener and page hook are removed
    And the page array's original push behavior remains restored when no observer uses it
    And later pushes are not appended to the ended session or Live feed

    Examples:
      | project_name         | page_url                 | history_path  | session_action |
      | my-chrome-utilities | https://www.example.com/ | event.history | Stop capture   |
      | my-chrome-utilities | https://www.example.com/ | event.history | End testing    |
