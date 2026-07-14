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
