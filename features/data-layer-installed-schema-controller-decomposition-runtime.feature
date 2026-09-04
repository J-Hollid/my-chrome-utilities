Feature: Data Layer installed Schema controller decomposition runtime

  Background:
    Given the built extension is running with an active project and installed Schema controllers
    And the approved pre-decomposition Schema controller result is the behavior baseline

  # Data Layer installed Schema controller decomposition runtime 001
  Scenario Outline: Data Layer installed Schema controller decomposition runtime 001
    Given installed Schema workflow <workflow> has its required project and schema state
    When actual controls execute <operation>
    Then the installed view shows <result> as in current QA
    And persistence contains <stored_result> as in current QA

    Examples:
      | workflow                    | operation                                      | result                                      | stored_result                          |
      | editor route and tree return | open and close a saved Schema editor          | focus and tree scroll return exactly        | project and schema bytes are unchanged |
      | relationship-tree view       | filter, expand, and open a contributor        | the same rows and route are available       | view state uses the same storage key   |
      | library and draft lifecycle  | edit, review, publish, export, and close       | the same revision and feedback are produced | the same schema bytes are persisted    |
      | property authoring           | add, copy, remove, restore, and undo properties | the same property rows and focus are shown | the same draft command is persisted    |
      | reusable-rule authoring      | edit, promote, and synchronize rules          | the same legal actions and reviews appear   | the same rule library is persisted     |
      | assignment authoring         | edit conditions and save an assignment        | the same assignment and conflicts appear    | the same schema assignment is persisted |
      | validation records           | validate a capture and recheck its result      | the same validation record and result appear | the same record history is retained   |
      | guided validation            | continue captured validation work             | the same destination and guidance are shown | the same continuation is persisted     |
      | compact canonical editing    | apply, settle, retry, undo, and redo a command | the same canonical state and status appear | the same command history is persisted  |

  # Data Layer installed Schema controller decomposition runtime 002
  Scenario Outline: Data Layer installed Schema controller decomposition runtime 002
    Given installed controller <controller> is in lifecycle state <initial_state>
    When lifecycle operation <operation> occurs
    Then lifecycle result is <lifecycle_result>
    And one user input can cause at most one owned action

    Examples:
      | controller                    | initial_state | operation           | lifecycle_result                                                   |
      | editor route                  | new           | mount               | one listener set is active                                         |
      | relationship tree             | mounted       | mount again         | no listener, subscription, or render is duplicated                 |
      | library                       | mounted       | dispose             | listeners and subscriptions are removed and pending work is closed |
      | property authoring            | disposed      | dispose again       | disposal is an idempotent no-op                                    |
      | reusable rules                | disposed      | mount again         | one fresh listener set and current stored state are active          |
      | assignments                   | mounted       | dispose             | open condition and review listeners are removed                     |
      | validation records            | mounted       | late work completes | disposed or superseded work cannot change the current view          |
      | guided validation             | mounted       | pagehide            | pending continuation work cannot outlive the page lifecycle         |
      | compact canonical editing     | mounted       | pagehide            | disposal completes before the page lifecycle ends                   |

  # Data Layer installed Schema controller decomposition runtime 003
  Scenario: Data Layer installed Schema controller decomposition runtime 003
    When all extracted Schema controllers are mounted through the installed Data Layer runtime
    Then each existing Schema command and control remains available
    And every existing DOM identity, accessible relation, and visible result remains compatible
    And every existing storage key, serialized value, project revision, and schema revision remains compatible
    And the packaged extension retains the same manifest capabilities and browser entry points
