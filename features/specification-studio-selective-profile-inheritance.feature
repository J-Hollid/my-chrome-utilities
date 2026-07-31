# mutation-stamp: sha256=5b475c6d6c96c30074450b2e5a93ef1167617cd69cfe302f8dc5aebf3580ef9b
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-31T16:11:46.521422177Z","feature_name":"Specification Studio selective profile inheritance","feature_path":"features/specification-studio-selective-profile-inheritance.feature","background_hash":"7c598459cd5f2d10c6b8dd26227107d43083b9a46709856598430bc06fe95009","implementation_hash":"6bfe9a367f-architect","scenarios":[{"index":0,"name":"Specification Studio selective profile inheritance 001","scenario_hash":"2ac8076479b41bcef64adde58d5d0e298e39deef7a71286a2e38b377a4d5cd69","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-31T16:11:46.521422177Z"},{"index":1,"name":"Specification Studio selective profile inheritance 002","scenario_hash":"b6a48ff6ef8416fa4384c573801b75c34d815cbebc6d4fd106e334c045edcaf5","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-31T16:11:46.521422177Z"},{"index":3,"name":"Specification Studio selective profile inheritance 004","scenario_hash":"e08b996d43e35501f9a83f997efe2a0d0a4dc69fc64bc34ba3600c33726ee7b0","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-31T16:11:46.521422177Z"},{"index":7,"name":"Specification Studio selective profile inheritance 008","scenario_hash":"7e3bebf127bd508eb0b20f7225ddd88e750e1a1425402ef7b23fcf177631c2c4","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-31T16:11:46.521422177Z"},{"index":9,"name":"Specification Studio selective profile inheritance 010","scenario_hash":"3e0f331379014212706a4788e86bede31e4d2af61bf866335bc44347b01cb9de","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-31T16:11:46.521422177Z"},{"index":13,"name":"Specification Studio selective profile inheritance 014","scenario_hash":"d923c10bcdfa520e9e4b5ea8338b0451de2c316341d2a99152e2e1795a9d7a8a","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-31T16:11:46.521422177Z"}]}
# acceptance-mutation-manifest-end

Feature: Specification Studio selective profile inheritance

  Background:
    Given Master is a Shared Profile with hundreds of canonical properties grouped by concepts
    And Pages, Page Groups, and Events can compose Shared Profiles with local schema contributions
    And selective inheritance never mutates Master

  # Specification Studio selective profile inheritance 001
  Scenario Outline: Specification Studio selective profile inheritance 001
    Given the operator is authoring <target>
    When Master is added as a Shared Profile source
    Then one inheritance recipe is created between Master and <target>
    And the recipe can select concepts, property branches, and individual properties
    And only its selected contribution participates before the local <target> contribution
    And the same authoring behavior is used for every target kind

    Examples:
      | target              |
      | Error Page          |
      | Checkout Page Group |
      | Offer Click Event   |

  # Specification Studio selective profile inheritance 002
  Scenario Outline: Specification Studio selective profile inheritance 002
    When the operator begins a Master inheritance recipe from <starting_point>
    Then initial selection contains <initial_selection>
    And the operator reviews the effective property count before applying it

    Examples:
      | starting_point    | initial_selection                  |
      | Everything        | every Master property              |
      | Choose concepts   | no property until a concept is chosen |
      | Choose properties | no property until a branch or property is chosen |
      | Start empty       | structural root only               |

  # Specification Studio selective profile inheritance 003
  Scenario: Specification Studio selective profile inheritance 003
    When its inheritance recipe workspace opens
    Then the target editor retains one compact Master summary card
    And the dedicated workspace provides search by name, path, description, and example
    And it filters by concept, type, required state, and selection state
    And concepts and property branches show selected and total counts with tri-state selection
    And a persistent summary shows direct selections, structural dependencies, rule dependencies, conflicts, and effective total
    And no complete inherited property table is inserted into the ordinary target form

  # Specification Studio selective profile inheritance 004
  Scenario Outline: Specification Studio selective profile inheritance 004
    Given Master contains concepts page, form, ecommerce, error, and offer
    When the operator composes <target>
    Then its recipe includes <selection>
    And its effective schema excludes every unselected Master property

    Examples:
      | target              | selection                                             |
      | Error Page          | all page properties and selected error properties    |
      | Checkout Page Group | all form properties and selected ecommerce and error properties |
      | Offer Click Event   | all offer properties                                  |

  # Specification Studio selective profile inheritance 005
  Scenario: Specification Studio selective profile inheritance 005
    Given the Error Page recipe selects all properties in concept page
    And it selects seven individual properties from concept error
    When Master later adds one page property and one error property
    Then the new page property becomes inherited through the live concept selection
    And the new error property remains unselected through the pinned property selection
    And the recipe summary distinguishes all synchronized page properties from seven fixed error properties
    And explicit exclusions remain excluded when their concept changes

  # Specification Studio selective profile inheritance 006
  Scenario: Specification Studio selective profile inheritance 006
    Given Master has object error with nested code, message, and details properties
    When the operator selects error
    Then its complete subtree is selected initially
    When details is deselected
    Then error becomes partially selected
    And code and message remain selected with their complete definitions
    And the effective target schema contains a valid partial error branch without details

  # Specification Studio selective profile inheritance 007
  Scenario: Specification Studio selective profile inheritance 007
    Given only nested property /error/message is directly selected
    When selection closure is calculated
    Then /error is included as a structural dependency
    And /error/message retains its type, presence, values, rules, documentation, examples, and Shared Profile provenance
    And the structural container is distinguished from directly selected business properties
    And no unselected sibling becomes validatable merely because its ancestor is required structurally

  # Specification Studio selective profile inheritance 008
  Scenario Outline: Specification Studio selective profile inheritance 008
    Given selected property error_message has an ordinary rule requiring page_type equal to error
    And page_type is not selected
    When the operator reviews the missing rule dependency
    Then action <action> produces <outcome>
    And the chosen resolution applies only to this inheritance recipe
    And Master and every other consumer remain unchanged

    Examples:
      | action                         | outcome                                                   |
      | Include page_type              | the original rule and its dependency remain effective     |
      | Exclude this rule              | error_message remains inherited without that rule          |
      | Replace rule for this target   | error_message uses one reviewed target-specific rule       |

  # Specification Studio selective profile inheritance 009
  Scenario: Specification Studio selective profile inheritance 009
    Given Master makes error_message required when page_type equals error
    And Standalone Error Event selects error_message but not page_type
    When the operator excludes that conditional presence rule
    Then error_message retains its inherited definition and is optional for Standalone Error Event
    And the effective Event schema contains no page_type condition or unresolved dependency
    And provenance identifies the Master rule and its exclusion at the Event inheritance boundary
    And another Page inheriting the same Master rule still requires error_message when page_type equals error

  # Specification Studio selective profile inheritance 010
  Scenario Outline: Specification Studio selective profile inheritance 010
    Given a selected inherited rule is <rule_kind>
    When the operator requests <change>
    Then <result>
    And no source rule is copied into the target as an untracked duplicate

    Examples:
      | rule_kind             | change                              | result                                                        |
      | ordinary validation   | exclude it                          | the recipe records its stable rule identity as excluded       |
      | ordinary validation   | replace it                          | the target rule names the stable source rule it replaces      |
      | conditional presence  | replace it with required            | target presence becomes required without the source condition |
      | invariant validation  | exclude or weaken it                | the action is unavailable and the invariant source is named   |

  # Specification Studio selective profile inheritance 011
  Scenario: Specification Studio selective profile inheritance 011
    Given the operator has staged property, concept, exclusion, and rule-resolution choices
    When Apply inheritance is confirmed
    Then one Draft command stores one recipe using stable profile, property, and rule identities
    And the target recompiles from the selected Shared Profile contribution plus its local contribution
    And Cancel stores no recipe or local schema change
    And Undo and Redo restore the complete prior and applied recipe respectively
    And the recipe stores no copied Shared Profile property definitions

  # Specification Studio selective profile inheritance 012
  Scenario: Specification Studio selective profile inheritance 012
    Given a target composes selective recipes from Master and Commerce
    When both selected contributions define the same effective property or incompatible facets
    Then the existing peer composition and conflict rules apply after each recipe filters its source
    And preview names both Shared Profiles, their selected paths, effective facets, and conflicts
    And applying an unresolved conflict preserves the Draft recipe but keeps the effective schema blocked
    And exclusion cannot be presented as a resolution unless the operator actually removes that source contribution

  # Specification Studio selective profile inheritance 013
  Scenario: Specification Studio selective profile inheritance 013
    Given Checkout Page Group has an applied Master recipe
    When its normal schema workspace opens
    Then the Master card summarizes synchronized concepts, fixed selections, exclusions, rule overrides, and effective count
    And Edit selection returns to the complete recipe workspace
    And effective rows identify Master inheritance, selection reason, local differences, and provenance
    When a local override is reset to parents
    Then it returns to the recipe-selected Master definition
    And no property excluded by the recipe is reintroduced

  # Specification Studio selective profile inheritance 014
  Scenario Outline: Specification Studio selective profile inheritance 014
    Given an applied recipe references a stable Master property or rule
    When Master performs <source_change>
    Then the target shows <target_effect>
    And affected validation, Test cases, documentation, and export are marked stale
    And the impact summary identifies added, removed, or changed effective paths before the target is presented as current

    Examples:
      | source_change                                      | target_effect                                             |
      | rename or move of a selected property              | selection follows the stable identity and displays its new path |
      | edit of an included non-overridden rule            | the current source rule becomes effective                 |
      | edit of an excluded rule                           | exclusion remains attached to that stable rule identity   |
      | deletion of a pinned selected property             | missing selection is identified for recipe repair         |
      | new dependency in a live selected property rule    | unresolved rule dependency requires an explicit resolution |

  # Specification Studio selective profile inheritance 015
  Scenario: Specification Studio selective profile inheritance 015
    Given Error Page has a reviewed Master recipe
    When the operator chooses Copy selection from Error Page while authoring another target
    Then a new independently reviewable recipe starts with the same concepts, property identities, exclusions, and rule resolutions
    And its target-specific preview is recalculated before Apply inheritance is enabled
    And later edits to either recipe do not edit the other
    And no separately managed named preset is required

  # Specification Studio selective profile inheritance 016
  Scenario: Specification Studio selective profile inheritance 016
    When the recipe is completed at desktop width, 360 CSS pixels, or 200 percent browser zoom using only the keyboard
    Then property results are rendered with bounded work while preserving search and selection position
    And concept, branch, property, dependency, and rule-resolution controls have programmatic names and states
    And the selection summary and Apply inheritance remain reachable without horizontal page scrolling
    And focus returns to the operated property, dependency, or Master summary card after each action
    And selection, partial selection, dependency, conflict, and exclusion never depend on color alone
