# mutation-stamp: sha256=b83e05743b9f7d535c1aca9e313f11e9c2eb66b442212d1ae93f14afd66c96b1
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T01:03:46.483975157Z","feature_name":"Data layer Specification workspace navigation runtime","feature_path":"features/data-layer-specification-workspace-navigation-runtime.feature","background_hash":"f849ac55fc8318d39bbab0d24d66723bedb83fb3d567af42fb1308f2bd050814","implementation_hash":"sha256:fc74d9fd84afa92c2c79f114cdf885a46bf07299d375c91fae34b2688b628c5b","scenarios":[{"index":3,"name":"Data layer Specification workspace navigation runtime 004","scenario_hash":"15511546199bf04625868bf230737471bdbf4eca233cf3cdad1d6dddef9ebe85","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:46.483975157Z"},{"index":4,"name":"Data layer Specification workspace navigation runtime 005","scenario_hash":"820aac1d75a534b14b84114456f8f915dc77bca95959e8fa86d3d4011a190459","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:46.483975157Z"},{"index":5,"name":"Data layer Specification workspace navigation runtime 006","scenario_hash":"1c816de266708c14d3180b9a1f7749cf0d19fefa5b110ce1eea65e4b42acb56a","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:46.483975157Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Specification workspace navigation runtime

  Background:
    Given the built extension is running with the actual Specification Builder page and side-panel companion
    And the production project contains every first-class project entity

  # Data layer Specification workspace navigation runtime 001
  Scenario: Data layer Specification workspace navigation runtime 001
    When a side-panel issue deep link opens the full-page workspace
    Then the actual extension page renders the correct tree selection, breadcrumb, editor field, and inspector
    And browser focus reaches the exact field in no more than 2 actions
    And returning restores actual side-panel selection and scroll geometry

  # Data layer Specification workspace navigation runtime 002
  Scenario: Data layer Specification workspace navigation runtime 002
    Given production navigation state includes selection, expansion, filter, view, and scroll offset
    When the operator navigates Back, Forward, reloads, and reopens the workspace
    Then the rendered workspace and production persistence restore every navigation value
    And focus never lands in hidden or detached content

  # Data layer Specification workspace navigation runtime 003
  Scenario: Data layer Specification workspace navigation runtime 003
    Given the benchmark project contains 500 properties and 50 flows
    When production tree and grid components are measured during search, filter, selection, and scrolling
    Then DOM row counts remain bounded by the visible window and overscan
    And measured interaction tasks satisfy the 100 millisecond budget
    And no hidden collection contains thousands of editor controls

  # Data layer Specification workspace navigation runtime 004
  Scenario Outline: Data layer Specification workspace navigation runtime 004
    Given the actual extension surface is <surface>
    When the complete navigation path is exercised with the keyboard
    Then computed layout has <pane_mode> and one primary vertical scroll owner
    And actual focus order, names, announcements, and non-color status semantics pass

    Examples:
      | surface             | pane_mode                           |
      | 360 CSS px          | one active side-panel pane          |
      | 520 CSS px          | one active side-panel pane          |
      | 720 CSS px          | one active side-panel pane          |
      | full extension page | persistent tree, workspace, inspector |

  # Data layer Specification workspace navigation runtime 005
  Scenario Outline: Data layer Specification workspace navigation runtime 005
    When actual global search queries <query>
    Then production indexing returns the stored <expected_source>
    And rendered Where used links open each stored source without losing query state

    Examples:
      | query                          | expected_source         |
      | Retail checkout                | project entity name     |
      | /ecommerce/transaction_id      | property path           |
      | Final order total              | documentation text      |
      | ISO 4217 currency              | rule                    |
      | /checkout/confirmation         | matcher term            |
      | Trade missing account          | fixture name            |

  # Data layer Specification workspace navigation runtime 006
  Scenario Outline: Data layer Specification workspace navigation runtime 006
    Given the actual side panel at <width> contains every action class and a nested disclosure
    When computed style, layout, and the accessibility tree are inspected after keyboard traversal
    Then primary, secondary, overflow, and destructive actions have distinct non-color cues
    And the disclosure accessible name includes its rendered entity or section context
    And computed layout has one full-height sheet with sticky title, context, action bar, and one primary scroll owner

    Examples:
      | width      |
      | 360 CSS px |
      | 520 CSS px |
      | 720 CSS px |

  # Data layer Specification workspace navigation runtime 007
  Scenario: Data layer Specification workspace navigation runtime 007
    Given the actual full extension page contains every action class and a nested disclosure
    When computed style, layout, and the accessibility tree are inspected after keyboard traversal
    Then primary, secondary, overflow, and destructive actions have distinct non-color cues
    And the disclosure accessible name includes its rendered entity or section context
    And tree, workspace, inspector, and contextual actions remain persistently rendered
