Feature: Data layer pageload observation refresh

  Background:
    Given a repository for project <project_name>
    And history array path <history_path> is configured
    And a data layer testing session is active

  # Data layer pageload observation refresh 001
  Scenario Outline: Data layer pageload observation refresh 001
    Given observation is attached on page <page_url>
    When the active tab navigates to page <refreshed_page_url> where history array path <history_path> becomes ready after pageload
    Then observation refreshes automatically for page <refreshed_page_url>
    And no manual observation restart is required
    And entry <event_name> pushed after history array path <history_path> is ready is captured once with URL <refreshed_page_url>

    Examples:
      | project_name         | history_path  | page_url                 | refreshed_page_url               | event_name |
      | my-chrome-utilities | event.history | https://www.example.com/ | https://www.example.com/product  | pageview   |

  # Data layer pageload observation refresh 002
  Scenario Outline: Data layer pageload observation refresh 002
    Given observation is attached on page <page_url>
    When page <page_url> reloads and history array path <history_path> is missing until after pageload
    Then observation waits for history array path <history_path> to become ready
    And entry <event_name> pushed after history array path <history_path> is ready is captured once with URL <refreshed_page_url>

    Examples:
      | project_name         | history_path  | page_url                 | refreshed_page_url       | event_name |
      | my-chrome-utilities | event.history | https://www.example.com/ | https://www.example.com/ | pageview   |
