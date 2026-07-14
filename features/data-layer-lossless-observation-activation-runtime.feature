# mutation-stamp: sha256=ebd6d4b4014f7ce89666ba8ecef2081b5cb0a94c9e1bdd2a926022f79525e8f2
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T11:00:27.257375038Z","feature_name":"Data layer lossless observation activation runtime","feature_path":"features/data-layer-lossless-observation-activation-runtime.feature","background_hash":"46a2ae1428ed4832838b3bd1f040c0bb0a8e7f282000e10d5f2d0d90b0b95c4b","implementation_hash":"sha256:ed7e699c4d9d2dae03f7ce4efdc804fb8cce2c943eaa9507c4bad79b4f36bb88","scenarios":[{"index":1,"name":"Data layer lossless observation activation runtime 002","scenario_hash":"4a6d575898167fe50b51224b95a6e974ae631c58c9800d28bbf61d02d65a7409","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-14T11:00:27.257375038Z"},{"index":2,"name":"Data layer lossless observation activation runtime 003","scenario_hash":"cad094f22efc3e20e4470adeaefeed8f5daa2dd2978b410e082c3af2cb30f589","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-14T11:00:27.257375038Z"},{"index":5,"name":"Data layer lossless observation activation runtime 006","scenario_hash":"5dd8f7878261a25b51dad8981fb5aaa9ee2a88761b0232d305c9b9d4eb66969b","mutation_count":14,"result":{"Total":14,"Killed":14,"Survived":0,"Errors":0},"tested_at":"2026-07-14T10:59:20.308009381Z"},{"index":6,"name":"Data layer lossless observation activation runtime 007","scenario_hash":"c9de6806048ee2e549edd9f4b1bba31a8d1b4e3742a73a0534eb181dbf8a9cf9","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-14T10:59:20.308009381Z"},{"index":0,"name":"Data layer lossless observation activation runtime 001","scenario_hash":"9d993a30a53d24308410bddccc76c93a276b42a1b16935c329e8e79cd4df67b7","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-14T10:57:59.064783220Z"},{"index":3,"name":"Data layer lossless observation activation runtime 004","scenario_hash":"57a710fd589f7a4ee4263f050990ebd73392f693f913600c078809013aad5b2b","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-14T10:57:59.064783220Z"},{"index":4,"name":"Data layer lossless observation activation runtime 005","scenario_hash":"e995dfbb881a71ca3501a8f1cfab3148c730dd7d66300158bd5b1d14a01bba6c","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-14T10:57:59.064783220Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer lossless observation activation runtime

  Background:
    Given history array path <history_path> is configured
    And the production observation runtime is connected to a controllable page, Chrome messaging, and navigation harness
    And snapshot, page-hook, extension-activation, retry, and navigation phases advance only when explicitly completed

  # Data layer lossless observation activation runtime 001
  Scenario Outline: Data layer lossless observation activation runtime 001
    Given page load <page_load> at <page_url> owns an empty array at <history_path> whose original push records its calls and returns page-defined results
    When observation activation begins
    And the historical snapshot phase completes
    And the page pushes events <handoff_events> in separate calls before page-hook activation finishes
    And page-hook and extension-side activation finish
    And the page pushes events <live_events> in separate calls
    Then the page array and the array referenced by the production history-array registry contain <handoff_events> followed by <live_events>
    And the Live feed contains <handoff_events> followed by <live_events> exactly once in capture order
    And every captured event is associated with page load <page_load> at <page_url>
    And the original push recorded each event once with the page-owned array as its receiver
    And the push calls returned <push_returns>
    And exactly one effective active subscription observes <history_path>

    Examples:
      | history_path  | page_load | page_url                 | handoff_events                         | live_events     | push_returns                  |
      | queue.history | load-1    | https://example.test/new | event-1, event-2, event-3, event-4     | event-5, event-6 | 101, 102, 103, 104, 105, 106 |

  # Data layer lossless observation activation runtime 002
  Scenario Outline: Data layer lossless observation activation runtime 002
    Given page load <page_load> at <page_url> has existing events <initial_events> at <history_path>
    When observation activation begins
    And the historical snapshot phase completes
    And the page hook is installed while extension-side activation remains pending
    And the page pushes handoff events <handoff_events>
    And extension-side activation finishes
    And the page pushes live events <live_events>
    Then the Live feed contains <initial_events> followed by <handoff_events> and <live_events> exactly once in capture order
    And every captured event is associated with page load <page_load> at <page_url>
    And exactly one effective active subscription observes <history_path>

    Examples:
      | history_path  | page_load | page_url                 | initial_events | handoff_events | live_events |
      | queue.history | load-2    | https://example.test/new | event-1, event-2 | event-3, event-4 | event-5     |

  # Data layer lossless observation activation runtime 003
  Scenario Outline: Data layer lossless observation activation runtime 003
    Given page load <page_load> at <page_url> does not yet contain <history_path>
    When observation activation begins and its snapshot reports the path missing
    And the page creates an empty array at <history_path> and pushes <initial_events>
    And the observation retry begins and its historical snapshot phase completes
    And the page pushes <handoff_events> before retry page-hook activation finishes
    And page-hook and extension-side activation finish
    And the page pushes <live_events>
    Then the Live feed contains <initial_events> followed by <handoff_events> and <live_events> exactly once in capture order
    And every captured event is associated with page load <page_load> at <page_url>
    And exactly one effective active subscription observes <history_path>

    Examples:
      | history_path  | page_load | page_url                     | initial_events | handoff_events | live_events |
      | queue.history | load-3    | https://example.test/delayed | event-1, event-2 | event-3, event-4 | event-5, event-6 |

  # Data layer lossless observation activation runtime 004
  Scenario Outline: Data layer lossless observation activation runtime 004
    Given testing is active on page load <first_page_load> at <first_page> and has captured <first_page_event>
    When the selected target tab navigates to page load <current_page_load> at <current_page> with an empty <history_path>
    And the navigation snapshot phase completes
    And the next page pushes <handoff_events> before navigation page-hook activation finishes
    And page-hook and extension-side activation finish
    And the next page pushes <live_events>
    Then <first_page_event> remains associated with page load <first_page_load> at <first_page>
    And the Live feed contains <handoff_events> followed by <live_events> exactly once in capture order for page load <current_page_load> at <current_page>
    And exactly one effective active subscription observes <history_path> for page load <current_page_load> at <current_page>

    Examples:
      | history_path  | first_page_load | first_page                | first_page_event | current_page_load | current_page                     | handoff_events | live_events |
      | queue.history | load-4           | https://example.test/home | home-view        | load-5            | https://example.test/checkout | event-1, event-2, event-3, event-4 | event-5, event-6 |

  # Data layer lossless observation activation runtime 005
  Scenario Outline: Data layer lossless observation activation runtime 005
    Given testing captured <repeated_events> from page load <first_page_load> at <current_page>
    When the selected target tab reloads <current_page> as page load <current_page_load>
    And the new page array contains the same <repeated_events> before activation begins
    And reload observation activation completes
    Then each occurrence of <repeated_events> appears exactly once for each page load in page-load order
    And the occurrences from <first_page_load> and <current_page_load> have distinct stable event identities
    And equal URL, history path, array index, and payload do not merge events from different page loads
    And exactly one effective active subscription observes <history_path> for page load <current_page_load> at <current_page>

    Examples:
      | history_path  | current_page              | first_page_load | current_page_load | repeated_events    |
      | queue.history | https://example.test/home | load-6          | load-7            | pageview, purchase |

  # Data layer lossless observation activation runtime 006
  Scenario Outline: Data layer lossless observation activation runtime 006
    Given page load <page_load> at <page_url> has captured <initial_events> through an active <history_path> wrapper
    When <repeat_action> repeats observation activation for the same page load and page-owned array
    And repeated activation finishes
    And the page pushes event <live_event>
    Then <initial_events> remain in the Live feed exactly once
    And <live_event> appears exactly once after <initial_events>
    And the production history-array registry has one effective channel for <history_path>
    And the original push records <live_event> once and returns <push_return>

    Examples:
      | history_path  | page_load | page_url                  | initial_events | repeat_action       | live_event | push_return |
      | queue.history | load-8    | https://example.test/home | event-1, event-2 | a readiness retry | event-3   | 3           |
      | queue.history | load-8    | https://example.test/home | event-1, event-2 | a capture restart | event-3   | 3           |

  # Data layer lossless observation activation runtime 007
  Scenario Outline: Data layer lossless observation activation runtime 007
    Given navigation generation <stale_generation> for <stale_page> is paused with snapshot result <stale_event> before activation finishes
    When the selected target tab navigates to <current_page> and starts newer generation <current_generation>
    And generation <current_generation> completes activation and captures <current_existing_event>
    And generation <stale_generation> is allowed to finish
    And the current page pushes <current_live_event>
    Then <stale_event> is not appended or associated with <current_page>
    And the Live feed contains <current_existing_event> followed by <current_live_event> exactly once for generation <current_generation>
    And generation <stale_generation> cannot replace or remove the current page hook, bridge, or subscription
    And the session remains associated with <current_page>

    Examples:
      | history_path  | stale_generation | stale_page                   | stale_event | current_generation | current_page                  | current_existing_event | current_live_event |
      | queue.history | generation-1     | https://example.test/old     | old-view    | generation-2       | https://example.test/current  | current-view           | purchase           |
