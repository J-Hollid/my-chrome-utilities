Feature: Data layer timeline expanded state

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active

  # Data layer timeline expanded state 001
  Scenario Outline: Data layer timeline expanded state 001
    Given pageload <page_url> is expanded in the side panel timeline
    When observed event <event_name> is recorded for pageload <page_url>
    Then pageload <page_url> remains expanded
    And observed event <event_name> is visible without re-expanding pageload <page_url>

    Examples:
      | project_name         | page_url                 | event_name |
      | my-chrome-utilities | https://www.example.com/ | scroll     |
