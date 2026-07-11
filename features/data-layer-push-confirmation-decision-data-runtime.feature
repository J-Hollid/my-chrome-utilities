Feature: Data layer Push confirmation decision data runtime completion

  Background:
    Given the built extension Library editor is running in a browser
    And template Purchase confirmation version 3 has event purchase and validation state Valid
    And active target Signal Shop has URL https://signal.example.test/checkout
    And the push destination is queue.history

  # Data layer Push confirmation decision data runtime completion 001
  Scenario: Data layer Push confirmation decision data runtime completion 001
    Given Push draft is ready and no push has executed
    When the operator opens Push confirmation
    Then the source adapter is not invoked
    And the rendered confirmation presents these separate labelled rows
      | label        | value                                |
      | Event        | purchase                             |
      | Target title | Signal Shop                          |
      | Target URL   | https://signal.example.test/checkout |
      | Destination  | queue.history                        |
      | Version      | 3                                    |
      | Validation   | Valid                                |
    And no semicolon-delimited sentence substitutes for the labelled rows

  # Data layer Push confirmation decision data runtime completion 002
  Scenario: Data layer Push confirmation decision data runtime completion 002
    Given the review model supplies these payload differences
      | Path                 | Previous   | Pushed      | Change  |
      | ecommerce.value      | 18         | 19          | changed |
      | items[0].quantity    | 1          | 2           | changed |
      | experiment.variant   | Not present | treatment-b | added   |
      | legacy.debug         | true       | Not present | removed |
    When the rendered changed-property summary is inspected
    Then it contains exactly 1 labelled row for every supplied payload difference
    And the ecommerce.value row shows previous value 18 and pushed value 19
    And the items[0].quantity row shows previous value 1 and pushed value 2
    And the experiment.variant row shows previous value Not present and pushed value treatment-b
    And the legacy.debug row shows previous value true and pushed value Not present
    And path, previous value, and pushed value occupy distinct fields
    And unchanged properties are absent from the summary
    And the renderer does not select or special-case property paths

  # Data layer Push confirmation decision data runtime completion 003
  Scenario: Data layer Push confirmation decision data runtime completion 003
    Given the draft payload equals saved version 3
    When the rendered changed-property summary is inspected
    Then it visibly states No payload changes
    And no empty changed-property list or blank placeholder is displayed

  # Data layer Push confirmation decision data runtime completion 004
  Scenario Outline: Data layer Push confirmation decision data runtime completion 004
    Given Push confirmation is displayed at <panel_width> CSS px
    When decision-row and changed-property rectangles are measured
    Then labelled rows use <row_layout>
    And every label remains adjacent to its value
    And the Target URL and property values remain readable without clipping
    And the confirmation and side-panel document have no horizontal scrolling

    Examples:
      | panel_width | row_layout                                  |
      | 360         | one column with each label above its value  |
      | 520         | a compact 2-column definition list          |
      | 720         | a compact 2-column definition list          |

  # Data layer Push confirmation decision data runtime completion 005
  Scenario: Data layer Push confirmation decision data runtime completion 005
    Given Push draft has keyboard focus and baseline event count is 0
    When the operator opens Push confirmation
    Then keyboard focus remains trapped within the confirmation
    And Tab and Shift+Tab wrap at its focus boundaries
    When the operator presses Escape
    Then the confirmation closes without executing a push
    And keyboard focus returns to Push draft
    When the operator reopens the same confirmation and confirms Push purchase to Signal Shop
    Then exactly 1 purchase event is created on Signal Shop
    And exactly 1 immutable execution record is added

  # Data layer Push confirmation decision data runtime completion 006
  Scenario: Data layer Push confirmation decision data runtime completion 006
    When the automated Push-confirmation browser test is inspected
    Then it queries rendered labelled rows instead of only the review data model
    And it asserts the rendered ecommerce.value change from 18 to 19
    And it asserts multiple changed, added, and removed property rows supplied by the review model
    And it asserts No payload changes for an unchanged draft
    And it measures decision-row layout at 360, 520, and 720 CSS px
    And it retains focus trap, Escape restoration, and exactly-one-event assertions
