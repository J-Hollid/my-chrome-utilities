# mutation-stamp: sha256=b9d6fac75afda9e3fa9adb13852f81d97a6397abf8fd48f93af2061ce6b59662
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-29T16:40:12.662740674Z","feature_name":"Specification Studio choice controls runtime","feature_path":"features/specification-studio-choice-controls-runtime.feature","background_hash":"b1c91efd60907e4e2d082767addab0cc8ba4d671775b27afe4a5deadb41c675b","implementation_hash":"unknown","scenarios":[{"index":0,"name":"Specification Studio choice controls runtime 001","scenario_hash":"2018725d79950f732357cf5a474c319deee67d3e5711bd6d2b15a77c364e65e3","mutation_count":21,"result":{"Total":21,"Killed":21,"Survived":0,"Errors":0},"tested_at":"2026-07-29T16:40:12.662740674Z"},{"index":1,"name":"Specification Studio choice controls runtime 002","scenario_hash":"a9c9e9b432ac3e8dbe34fa6a1c1e6f6bcc982439cfb743962339927e1352ee53","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-29T16:40:12.662740674Z"},{"index":4,"name":"Specification Studio choice controls runtime 005","scenario_hash":"5b7c4eb5ba0fbf0faaed0b133ec1f2bd36e47d2942576d889a8aa22962c132ef","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-29T16:40:12.662740674Z"}]}
# acceptance-mutation-manifest-end

Feature: Specification Studio choice controls runtime

  Background:
    Given the built extension is running with production Specification Studio
    And production Studio workspaces expose binary settings, selection lists, confirmations, and batch choices

  # Specification Studio choice controls runtime 001
  Scenario Outline: Specification Studio choice controls runtime 001
    Given installed control <control> has production consequence <consequence>
    When DOM role and control type are inspected
    Then the rendered pattern is <pattern>
    And its accessible description communicates the production consequence

    Examples:
      | control                      | consequence                                      | pattern  |
      | Only defined fields          | immediately applies one reversible Draft setting | switch   |
      | Include concept subheadings  | changes configuration pending preview refresh     | checkbox |
      | Include ecommerce concept    | selects membership in an ordered group             | checkbox |
      | Export Sitewide              | selects membership in an export scope               | checkbox |
      | Confirm incomplete export    | records an acknowledgement                          | checkbox |
      | Select staged property       | selects membership for a later batch action          | checkbox |
      | Borders                      | stages a theme option for an explicit save            | checkbox |

  # Specification Studio choice controls runtime 002
  Scenario Outline: Specification Studio choice controls runtime 002
    Given production checkbox rows are rendered for <pointer_context>
    Then computed checkbox width and height are each between 16 and 18 CSS pixels
    And computed square-to-label gap is 8 CSS pixels
    And pointer hit testing across the labelled row succeeds at minimum height <target_height>
    And computed text-input dimensions and padding do not apply to the checkbox

    Examples:
      | pointer_context                | target_height |
      | fine pointer at desktop width  | 36 CSS pixels |
      | coarse pointer at narrow width | 44 CSS pixels |

  # Specification Studio choice controls runtime 003
  Scenario: Specification Studio choice controls runtime 003
    Given production grouped checkboxes and adjacent row actions are rendered
    Then every checkbox resolves one visible label through matching id and for values
    And pointer activation on either input or label changes exactly one checked property
    And each related group has one fieldset and legend with vertically ordered choice rows
    And each optional description is connected to its checkbox and aligned under its label
    And action bounds do not intersect the input-label target

  # Specification Studio choice controls runtime 004
  Scenario: Specification Studio choice controls runtime 004
    Given production Only defined fields is rendered as an immediate reversible setting
    When keyboard focus reaches its installed switch and Space is pressed
    Then accessible role is switch and accessible checked state changes once
    And visible On or Off text and a non-color state mark change with it
    And production canonical Draft bytes and Undo count change exactly once
    And controls requiring Save, Refresh, confirmation, or batch execution retain checkbox role

  # Specification Studio choice controls runtime 005
  Scenario Outline: Specification Studio choice controls runtime 005
    Given production choice fixtures are rendered at <presentation>
    When long labels wrap and each control receives keyboard focus
    Then bounding boxes keep each indicator adjacent to its complete visible label
    And label, description, and action bounding boxes neither overlap nor clip
    And computed focus indication differs visibly from the default state
    And document horizontal overflow is zero

    Examples:
      | presentation                 |
      | 1280 CSS pixel Studio        |
      | 360 CSS pixel Studio         |
      | 200 percent browser zoom     |

  # Specification Studio choice controls runtime 006
  Scenario: Specification Studio choice controls runtime 006
    Given production Documentation, schema, theme, conflict, and bulk-stage choice controls use the shared pattern
    When actual controls change, save, refresh, Undo, Redo, and reload their values as applicable
    Then persisted values and visible consequences equal their pre-migration contracts
    And command, staged-change, and project-revision counts increase only for established product operations
    And packaged side-panel control DOM and presentation hashes remain unchanged
