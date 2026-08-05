# mutation-stamp: sha256=fc5f3f13fb974c3d48edd2fd3966c73ec2d54d0180fd4d8c941e581ad70bebb9
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-08-05T14:24:51.815981794Z","feature_name":"Data layer layered schema constraints runtime","feature_path":"features/data-layer-layered-schema-constraints-runtime.feature","background_hash":"e3abf09522d1a7021ef5c4fddde53d634dd57d90657c227f341935b5a82edc94","implementation_hash":"sha256:07c0a4cc553c6b4ee620517e694ea7d5ed369cfdebe0d19d6f8ae00ee108d4f4","scenarios":[{"index":0,"name":"Data layer layered schema constraints runtime 001","scenario_hash":"841b58bac0a850830dd983e58475124102f2e9e7df6f82b643fd77f719b16764","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:51.815981794Z"},{"index":4,"name":"Data layer layered schema constraints runtime 005","scenario_hash":"e6f9b12fb82ce881ea1a801d881cef93539989a8ae6fcdc441241974c826ece5","mutation_count":32,"result":{"Total":32,"Killed":32,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:51.815981794Z"},{"index":13,"name":"Data layer layered schema constraints runtime 014","scenario_hash":"d8473b20394969c2c46850e4eeaa7760e591f3ba09c6e0b07f73304745a78e50","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:51.815981794Z"},{"index":19,"name":"Data layer layered schema constraints runtime 020","scenario_hash":"1d4735c775a66aaaeb64d8d2d882d91c5f770db945eceec40651d722079e715e","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:51.815981794Z"},{"index":22,"name":"Data layer layered schema constraints runtime 023","scenario_hash":"609973252394af0e6f51ab5d344bca7455cfb701af581dfe0c7607897ebec040","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:51.815981794Z"},{"index":25,"name":"Data layer layered schema constraints runtime 026","scenario_hash":"3dae011fbdffb91df7363b5285533a358be0d0bbaec3a0ac41c460c34beccb46","mutation_count":27,"result":{"Total":27,"Killed":27,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:51.815981794Z"},{"index":26,"name":"Data layer layered schema constraints runtime 027","scenario_hash":"674cf075f066406dde7c4db04fe9a4912f1bf298fa161ea5e29bb29f86467111","mutation_count":40,"result":{"Total":40,"Killed":40,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:51.815981794Z"},{"index":27,"name":"Data layer layered schema constraints runtime 028","scenario_hash":"5b49b611c9cd75330111e227830c230f5f50250a4716807d32f0b4704dee8d15","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:51.815981794Z"},{"index":29,"name":"Data layer layered schema constraints runtime 030","scenario_hash":"bf425d4c65fbcf7867ec9f6810f18ed705da72a43426174bfadcedf42959b3c4","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:51.815981794Z"},{"index":30,"name":"Data layer layered schema constraints runtime 031","scenario_hash":"3a4f8c772321bbd5581826270faa09f844fa50421f002fa0a3eabbafa3841ebc","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-08-05T14:24:51.815981794Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer layered schema constraints runtime

  Background:
    Given the built extension is running with the production project repository, canonical schema editor, compiler, assignment resolver, and per-Event validator
    And production Shop contains Shared Profiles Sitewide and Opened Article
    And it contains Checkout, Shipping, Article, Purchase, Article Opened, Alternative shipping, and Summer article
    And production Shipping and Article are context-setting pageview events while Purchase and Article Opened are interaction Events

  # Data layer layered schema constraints runtime 001
  Scenario Outline: Data layer layered schema constraints runtime 001
    Given actual controls open the schema contribution for <contributor>
    Then the installed editor renders the same canonical composed-property table and expandable row editors
    And installed root, child, sibling, rename, move, duplicate, and delete actions are operable
    And production type, presence, condition, allowed-value, rule, documentation, example, and impact-review controls are operable
    And rendered inherited, local, effective, superseded, and conflicting definitions are distinguished
    And saving sends property-scoped commands with the displayed contributor base revision
    And only rendered contributor name, scope, applicability, and provenance differ

    Examples:
      | contributor                         |
      | Shared Profile Sitewide             |
      | Page Group Checkout                 |
      | Page Shipping                       |
      | Event Purchase                      |
      | Flow Page instance Alternative shipping |
      | Event occurrence Alternative shipping Purchase |

  # Data layer layered schema constraints runtime 002
  Scenario: Data layer layered schema constraints runtime 002
    Given production Page-branch definitions are
      | contributor | property    | definition                              |
      | Sitewide    | funnel_name | optional string                         |
      | Sitewide    | funnel_step | optional string                         |
      | Checkout    | funnel_name | required with allowed value checkout    |
      | Checkout    | funnel_step | required                                |
      | Shipping    | funnel_step | required with allowed value 3a          |
    When actual Alternative shipping controls change local funnel_step allowed value to 3b
    Then the production Alternative shipping Page effective result is
      | property    | effective definition                  |
      | funnel_name | required with allowed value checkout   |
      | funnel_step | required with allowed value 3b         |
    And every other applicable Sitewide property remains inherited
    And rendered provenance shows Sitewide, Checkout, Shipping, and Alternative shipping in composition order
    And 3a remains the effective funnel_step value for an ordinary Shipping context

  # Data layer layered schema constraints runtime 003
  Scenario: Data layer layered schema constraints runtime 003
    Given production Opened Article requires string properties event and article_name
    And Opened Article restricts event to article_opened
    And Article Opened inherits Opened Article and documents article_name as the opened article title
    When actual occurrence controls set the title expectation to Summer sale
    Then its production Event result is
      | property     | effective definition                          |
      | event        | required string restricted to article_opened  |
      | article_name | required string restricted to Summer sale     |
    And rendered provenance names Opened Article, Article Opened, and the Summer article occurrence
    And reusable Article Opened storage has no Page Group membership and compiles its Shared Profile and Event branches before placement
    And its production occurrence exists only inside Summer article Page context

  # Data layer layered schema constraints runtime 004
  Scenario: Data layer layered schema constraints runtime 004
    Given production Summer article Article Opened receives branch values
      | branch | property  | value          |
      | Page   | page_type | article        |
      | Event  | event     | article_opened |
    When the production compiler builds Summer article Article Opened
    Then one effective property tree contains applicable Shared Profile, Page Group, Page, Flow Page-instance, Event, and Event-occurrence contributions
    And rendered properties and rules name their branch and human contributor
    When the Page branch requires consent_state value granted and the Event branch requires consent_state value denied
    Then production compilation blocks consent_state as a parallel-branch conflict
    And persisted order does not silently select either branch
    When actual controls resolve the conflict at the Article Opened occurrence with allowed value granted
    Then the effective schema is ready and production provenance records the resolution against both definitions

  # Data layer layered schema constraints runtime 005
  Scenario Outline: Data layer layered schema constraints runtime 005
    Given a production inherited property has <base contribution>
    When actual controls save <specific contribution> on a more-specific contributor
    Then the production compiler returns <outcome>
    And the rendered property result explains <explanation>

    Examples:
      | base contribution                | specific contribution       | outcome | explanation                                      |
      | type string                      | type number                 | blocked | type cannot change                               |
      | allowed values 3a and 3b         | allowed value 3b            | ready   | allowed values narrow to 3b                      |
      | allowed values 3a and 3b         | allowed value 4             | blocked | 4 is outside the inherited allowed universe      |
      | required                         | optional                    | blocked | required cannot be silently relaxed              |
      | forbidden                        | permitted                   | blocked | a forbidden property cannot be re-enabled        |
      | string matching the base pattern | a second compatible pattern | ready   | both patterns apply                              |
      | one conditional rule             | another conditional rule    | ready   | both conditions apply without a named replacement |
      | one named overridable expectation | a replacement for that name | ready   | the named expectation is explicitly superseded   |

  # Data layer layered schema constraints runtime 006
  Scenario: Data layer layered schema constraints runtime 006
    Given production contextual scopes are
      | contributor                  | included contexts                                      |
      | Sitewide                     | every selected specification context                   |
      | Checkout                     | every member Page and its Page instances                |
      | Shipping                     | every instance of Page Shipping                         |
      | Purchase                     | every Purchase occurrence independent of Page Group    |
      | Alternative shipping         | every Event occurrence contained by that Page instance |
      | Alternative shipping Purchase | that Event occurrence only                             |
    When production compiles Shipping Page event, Alternative shipping Page event, Alternative shipping Purchase occurrence, and reusable Purchase Event
    Then each effective schema contains exactly the contextually applicable contributions
    And rendered inclusion and exclusion evidence names contributor and scope
    And installed Page reassignment preserves both Pages' memberships while recompiling the occurrence against its selected Page branch
    And production storage uses stable contributor, property, and occurrence references rather than names or generated paths

  # Data layer layered schema constraints runtime 007
  Scenario: Data layer layered schema constraints runtime 007
    Given Alternative shipping Purchase is registered for matcher-driven production activation
    And its applicability is All of pathname matching /checkout/shipping, page_name equalling shipping, checkout_variant equalling alternative, and Event equalling Purchase
    When the installed matcher test receives one complete match and three observations each differing in one property
    Then exactly the complete match selects Alternative shipping Purchase
    And each rejected observation renders its failed human-name predicate
    And production assignment evidence uses applicability inputs without inferred Flow sequence
    And the production resolver consults no Flow context-binding record
    When an equal-priority production candidate also matches the complete observation
    Then automatic selection is blocked as ambiguous and renders both candidate names
    When actual controls give one candidate higher priority and retest
    Then that candidate wins and assignment evidence retains the rejected match

  # Data layer layered schema constraints runtime 008
  Scenario: Data layer layered schema constraints runtime 008
    Given validating against Alternative shipping Purchase requires explicit operator selection
    When actual validation controls select it by Flow, Page, and Event names
    Then the production validator uses that compiled schema without automatic applicability evaluation
    And unified evaluation records manual selection, stable target identity, effective schema revision, issues, and provenance
    And rendered output claims no automatic assignment winner

  # Data layer layered schema constraints runtime 009
  Scenario: Data layer layered schema constraints runtime 009
    Given Alternative shipping Purchase is registered as Documentation only
    When actual controls generate its effective schema and developer export
    Then production compilation returns complete property and provenance detail while excluding that target from automatic and manual validation choices
    And the rendered export states Alternative shipping, Shipping Page, Purchase Event, funnel_step value 3b, inherited funnel_name value checkout, and Documentation only
    And exported rows distinguish inherited definitions, local differences, conditions, and activation
    And production assignment indexes contain no Documentation-only target or resulting ambiguity

  # Data layer layered schema constraints runtime 010
  Scenario: Data layer layered schema constraints runtime 010
    Given actual controls select a Page Group, Page frame, or Event occurrence on the installed Flow canvas
    When the contextual Inspector renders its Schema summary
    Then inherited, local, effective, conflict, and activation counts render while the canvas remains mounted
    And one action opens the complete production schema editor in the main workspace at that contributor
    And the main editor exposes the same commands used for Shared Profiles
    And returning to Flow restores the selected canvas item and viewport
    And an actual save names affected scopes, stale compiled targets, Draft status, and one Undo action

  # Data layer layered schema constraints runtime 011
  Scenario: Data layer layered schema constraints runtime 011
    Given unified evaluation resolved the validation subject to Checkout journey, Alternative shipping, and Purchase
    And its selected rule fixes /funnel_step to string 3b
    When the production validator receives otherwise valid Purchase observations containing funnel_step 3b and 3a
    Then the 3b result contains no issue for /funnel_step
    And the 3a result contains path /funnel_step, code EXPECTED_VALUE, severity error, expected 3b, actual 3a, and Alternative shipping provenance
    And both results contain the selected stable target and effective schema revision
    And neither result claims that an expected Flow sequence or occurrence completed

  # Data layer layered schema constraints runtime 012
  Scenario: Data layer layered schema constraints runtime 012
    Given the production terminal context contains canonical definitions
      | contributor    | property          | local definition             |
      | Sitewide       | page_type         | string                       |
      | Sitewide       | consent_state     | string                       |
      | Opened Article | event             | string                       |
      | Opened Article | article_name      | string                       |
      | Opened Article | metadata.category | nested string                |
      | Article        | page_type         | allowed value article        |
      | Summer article | consent_state     | allowed value granted        |
      | Article Opened | event             | allowed value article_opened |
    When visible controls add the occurrence refinements
      | property          | allowed value |
      | article_name      | Summer sale   |
      | metadata.category | News          |
    Then the production selected-context export contains the complete effective Summer article Article Opened schema
    And inherited and local values, conditions, documentation, examples, and provenance are distinguishable
    When production validation receives matching valid and invalid Article Opened observations
    Then the valid observation passes per-Event schema validation
    And the invalid observation reports every violated effective property rule with exact provenance
    And neither result claims full Flow validation

  # Data layer layered schema constraints runtime 013
  Scenario: Data layer layered schema constraints runtime 013
    Given production Cart initially belongs only to Checkout
    When actual controls open Cart Page configuration
    Then the installed Page editor and Cart context menu expose the same Add to Page Group command
    When actual search finds Retail Checkout and Trade Checkout
    Then installed results render each name, purpose, applicability summary, and prospective rule impact
    When actual controls add both groups
    Then the production Page Group rule stack is
      | position | Page Group      |
      | 1        | Checkout        |
      | 2        | Retail Checkout |
      | 3        | Trade Checkout  |
    And rendered guidance explains top-to-bottom guarded refinement
    And canonical Cart storage contains one ordered stable-reference membership list
    And production Page Group member views derive Cart without a second editable membership collection
    And each row exposes Open Page Group, Move earlier, Move later, and Remove at 360px without horizontal page scroll
    When installed keyboard controls move Trade Checkout before Retail Checkout
    Then only the ordered Cart membership command is persisted and focus returns to Trade Checkout at position 2
    And the rendered impact preview names affected properties, Page instances, compiled targets, and stale exports before commit

  # Data layer layered schema constraints runtime 014
  Scenario Outline: Data layer layered schema constraints runtime 014
    Given production Cart membership order is Checkout followed by <specific order>
    And production Checkout requires funnel_name checkout and permits funnel_step 3a or 3b
    And production Retail Checkout and Trade Checkout have independent Applicability Sets and ordinary funnel_step values 3a and 3b
    When both independently applicable Page Groups participate in the installed effective-schema table
    Then production <winner> supplies funnel_step <effective value> with <superseded> shown as superseded provenance
    And no Applicability Set priority or winner changes the stored Page Group order
    When one production observation matches Retail Checkout and Trade Checkout
    Then both Page Groups participate without applicability ambiguity
    And production blocks only an invariant or structurally incompatible definition with direct repair links

    Examples:
      | specific order                      | winner          | effective value | superseded      |
      | Retail Checkout then Trade Checkout | Trade Checkout  | 3b              | Retail Checkout |
      | Trade Checkout then Retail Checkout | Retail Checkout | 3a              | Trade Checkout  |

  # Data layer layered schema constraints runtime 015
  Scenario: Data layer layered schema constraints runtime 015
    Given production legacy storage lists Checkout then Retail Checkout on Cart and lists Cart from Trade Checkout
    When the installed upgrade opens Cart
    Then migration review proposes Checkout, Retail Checkout, and Trade Checkout without membership loss
    And it preserves Page-owned order before group-only memberships and blocks any missing group reference
    When actual controls confirm the proposed order
    Then one production transaction stores only Cart's ordered stable Page Group IDs
    And installed group member views derive Cart from that canonical Saved Draft
    When actual Undo runs once
    Then serialized membership state equals the complete legacy fixture

  # Data layer layered schema constraints runtime 016
  Scenario: Data layer layered schema constraints runtime 016
    Given production Sitewide contributes page_name, funnel_name, funnel_step, and page_type
    And canonical Page Group revision pg-checkout-r5 contributes local facets at both funnel paths
    And production Cart belongs to Checkout with a local funnel_step override
    When Checkout is activated from the installed Page Groups overview
    Then the installed Page Group route renders its complete configuration and schema in the main workspace without Inspector interaction
    And Effective schema at Checkout rows contain composed effective values and compact Inheritance status
    When Cart is activated from the installed Pages overview
    Then the installed Page route renders applicability, ordered memberships, and Effective schema at Cart in the main workspace
    And four production rows remain mounted while focused details retain their complete Shared Profile, Checkout, and Cart contribution stacks
    And inherited rows open enabled ordinary Definition controls while Override here is limited to structural ownership
    And local funnel_step renders Reset to parents
    And opening the optional Inspector shows a summary linking to the same route without mounting another editor model

  # Data layer layered schema constraints runtime 017
  Scenario: Data layer layered schema constraints runtime 017
    Given the production ordinary parent universe for funnel_step contains 2, 3a, and 3b
    And the canonical Page-level expectation on Cart is 2
    When actual Page controls add Retail Checkout with ordinary expected value 3a
    Then production commits the membership revision as Draft and compiles Cart funnel_step as 2
    And the installed row renders Parent difference resolved by Cart override as a non-blocking warning
    And provenance names Checkout and Retail Checkout as shadowed with Cart effective
    And canonical Cart storage overrides only expected value while inheriting every other property facet
    When actual controls activate Reset to parents for funnel_step
    Then installed impact preview shows the prospective effective value, affected instances, stale outputs, and Undo
    When the operator confirms removal of Cart's local expected value
    Then canonical Cart storage removes its expected-value contribution without copying a parent value
    And production recompiles the row from Checkout and Retail Checkout immediately
    And a rendered Cart-only property uses Remove local property instead of Reset to parents

  # Data layer layered schema constraints runtime 018
  Scenario: Data layer layered schema constraints runtime 018
    Given canonical Cart storage covers funnel_step expected value but no other facet
    And production Checkout marks string funnel_name invariant
    When actual controls add Partner Checkout with number funnel_name and an incompatible funnel_step type
    Then the membership transaction commits as Draft and installed conflict summary remains visible
    And the production local expectation survives solely within its declared facet
    And uncovered funnel_step type plus Checkout funnel_name invariant block effective compilation
    And rendered rows separate winning local facets, unresolved parent facets, and invariant provenance
    And installed repair links offer permitted Cart adjustment, Partner Checkout editing, or membership removal
    And production validation and developer export expose Blocked rather than Ready without duplicate no-op controls

  # Data layer layered schema constraints runtime 019
  Scenario: Data layer layered schema constraints runtime 019
    Given Cart production compilation includes a parent-only property, a local-only property, an inherited property with a local override, and one unresolved conflict
    And one production property has provenance Data layer v3 - All Events - All Properties → Datalayer v3 - Ecommerce Sales Pages · direct selection
    When the installed extension opens Cart at desktop width, 360 CSS pixels, and 200 percent browser zoom
    Then every production effective-property row remains mounted in one table
    And the compact-width presentation has one production vertical scroll owner
    And bounding rectangles keep the effective-schema table, every row, and every cell within the main-workspace content box with zero horizontal document or workspace overflow
    And DOM columnheaders contain one Inheritance column and no Source or State column
    And the parent-only, local-only, and inherited-with-local rows render Inherited, Local, and Mixed / overridden respectively
    And unresolved validation remains programmatically identified independently from Inheritance text
    And the long contributor route is absent from the compact row and present in its focused provenance detail
    When actual controls expand the funnel_step row
    Then type, presence, expected or allowed values, conditions, rules, documentation, example, provenance, Override here, and Reset to parents render as stacked row detail
    And closing the row returns focus to funnel_step while the other production rows remain mounted

  # Data layer layered schema constraints runtime 020
  Scenario Outline: Data layer layered schema constraints runtime 020
    Given production <target> has canonical contributions from <effective contributors>
    And it remains authorable, compilable, and documented with no assignment record
    When actual controls create Retail Purchase assignment for Purchase observations and select <target>
    Then persisted assignment data contains that stable contributor ID and kind
    And repository inspection finds no standalone Schema, schemaDraftId, or copied schema document
    And production validation compiles current effective values from <effective contributors>
    And every other unassigned contributor remains operable without a missing-assignment diagnostic

    Examples:
      | target                                  | effective contributors                    |
      | Shared Profile Sitewide                 | Sitewide                                  |
      | Page Group Checkout                     | Sitewide and Checkout                     |
      | Page Cart                               | Sitewide, Checkout, and Cart              |
      | Event Purchase                          | Sitewide and Purchase                     |
      | Flow Page instance Alternative shipping | Sitewide, Shipping, Cart, and Alternative shipping |

  # Data layer layered schema constraints runtime 021
  Scenario: Data layer layered schema constraints runtime 021
    Given production Checkout / Payment Page instance is selected with its derived JSON open in installed contextual Details
    And production inheritance supplies payment for /oForm/formStepName and checkout for /oForm/formType
    When actual controls activate Open schema contribution from the selected Page toolbar
    Then the primary main-workspace region is the same compact composed-schema workspace rendered by production Property Set and Page routes
    And two collapsed rows render their effective definitions, Inherited status, and item-specific structural ownership controls
    And focused property details retain their exact parent sources and validation details
    And no empty local-only canonical navigator or eagerly expanded per-property facet table is visible
    And an Add local property action is operable without materializing inherited definitions
    And rendered text and controls contain none of Effective documentation, Compiled effective schema and documentation, Target Event, Activation, Priority, Applicability, Test observation, Manual Flow / Page / Event, Validation payload, or developer export
    When actual controls expand only /oForm/formStepName and open Definition
    Then inherited ordinary fields are editable in that one open facet editor while /oForm/formType remains collapsed
    When actual controls change the ordinary value to payment-review and confirm Review changes
    Then one durable property-scoped command adds only that sparse facet to the selected Page-frame record
    And /oForm/formType stays collapsed while hashes for the reusable Payment Page, a sibling Payment frame, unrelated contributors, and Published revision remain unchanged
    And installed contextual Details changes only /oForm/formStepName to payment-review
    When actual controls invoke Reset to parents on /oForm/formStepName
    Then production deletes the sparse facet and recompiles payment without storing an inherited snapshot
    When actual Return to Flow runs
    Then production restores the same frame selection, canvas viewport, open contextual Details, and focus to the originating Page toolbar control
    When actual contextual Page Details invokes Open schema contribution
    Then the same Flow Page-frame ID and compact composed-schema workspace are rendered

  # Data layer layered schema constraints runtime 022
  Scenario: Data layer layered schema constraints runtime 022
    Given production /lineOfCustomer has inherited, local, overridden, invariant, and conflicting facet and rule states
    When actual controls inspect every item menu
    Then ordinary inherited Definition controls are enabled without a preliminary Override here action
    And identity-bearing inherited rows render View, one legal item-specific ownership action, and Open source without Remove
    And local rows render View, Edit, and Remove local
    And locally overridden rows render View, Edit, and Reset to parent
    And conflicting rows render View conflict, Edit local resolution, and Open contributing sources
    When actual View opens an inherited rule
    Then read-only production detail renders its stable ID, complete definition, effective state, and source with zero Draft writes
    And invariant actions permit neither weakening nor removal
    And a replaceable inherited rule exposes Replace here with named replacement provenance
    When actual controls stage local-facet and local-rule removal
    Then both rows remain mounted as Removed with Restore and compiled preview independently shows parent or unset fallback
    When actual controls restore the rule and confirm the property review
    Then one durable sparse command deletes only the local facet
    And hashes for parent, sibling, unrelated facets, restored rule, and Published revision remain unchanged
    And one production Undo restores the local facet under its original stable ID

  # Data layer layered schema constraints runtime 023
  Scenario Outline: Data layer layered schema constraints runtime 023
    Given production canonical and composed contributor editors show the same inherited <rule_state> rule
    When installed rule-specific action inventories are compared
    Then both inventories contain exactly <available_actions>
    And both inventories exclude <unavailable_actions>

    Examples:
      | rule_state  | available_actions                    | unavailable_actions                      |
      | ordinary    | View, Override here, and Open source | Replace, Edit, and Remove                 |
      | invariant   | View and Open source                 | Override, Replace, Edit, and Remove       |
      | replaceable | View, Replace here, and Open source | Override, Edit, and Remove                |

  # Data layer layered schema constraints runtime 024
  Scenario: Data layer layered schema constraints runtime 024
    Given production shows a replaceable inherited rule in a composed contributor editor
    When actual Replace here runs in a composed contributor editor
    Then staged production state contains one new local rule identity with named replacement provenance
    And repository inspection finds unchanged parent bytes before one reviewed property command commits

  # Data layer layered schema constraints runtime 025
  Scenario: Data layer layered schema constraints runtime 025
    Given production Checkout has no local schema contribution
    And its sole Sitewide inheritance recipe selects every canonical property
    When the installed extension opens Effective schema at Checkout
    Then production compilation contains every Sitewide facet unchanged
    And rendered status is Ready for validation and developer export
    And no production row is marked as needing a decision

  # Data layer layered schema constraints runtime 026
  Scenario Outline: Data layer layered schema constraints runtime 026
    Given production Checkout inherits ordinary <facet> <parent_value> for customer_status from Sitewide
    When repository state contains only sparse Checkout <facet> <local_value>
    Then production compilation is Ready with effective <facet> <local_value>
    And the customer_status row renders Sitewide <parent_value> and Checkout <local_value> as inherited and effective values
    And no conflict repair action is rendered

    Examples:
      | facet                 | parent_value          | local_value             |
      | Concept               | Customer              | Account                 |
      | Type                  | String                | Number                  |
      | Presence              | Optional              | Required                |
      | Allowed values        | active and pending    | closed and archived     |
      | Expected value        | active                | pending                 |
      | Description           | Parent description    | Checkout description    |
      | Example               | parent-example        | checkout-example        |
      | named validation rule | Parent account format | Checkout account format |
      | array item definition | String items          | Number items            |

  # Data layer layered schema constraints runtime 027
  Scenario Outline: Data layer layered schema constraints runtime 027
    Given production has two properties needing decisions
    And customer_status has an unresolved <facet> issue between Checkout <local_value> and Sitewide <source_value>
    When the installed extension opens Effective schema at Checkout
    Then the status reports two properties need decisions before validation and developer export
    And Show properties needing decisions filters the mounted effective-schema table
    And the customer_status row renders Needs decision and <facet> without internal identities
    When actual controls open its regular advanced menu
    Then the <section> entry identifies <facet> as needing a decision
    When actual controls activate that entry
    Then the installed editor opens <section> with focus at the affected control or rule
    And adjacent issue copy renders Checkout <local_value>, Sitewide <source_value>, and <reason>
    And no Concept control is marked or focused

    Examples:
      | facet                       | section    | local_value      | source_value       | reason                                  |
      | Type                        | Definition | Number           | String             | Sitewide protects this definition       |
      | Presence                    | Definition | Forbidden        | Required           | Sitewide protects this definition       |
      | Expected value              | Definition | closed           | active             | Sitewide keeps active fixed              |
      | Pattern rule                | Rules      | digits only      | letters only       | the rules cannot both match              |
      | Range rule                  | Rules      | 10 or more       | 5 or less          | the ranges do not overlap                |
      | Cardinality rule            | Rules      | at least 5 items | at most 2 items    | the item counts do not overlap           |
      | Conditional rule dependency | Rules      | exclude country  | requires country   | the rule needs the excluded property     |
      | Array item definition       | Structure  | Number items     | String items       | existing values do not fit Number items  |

  # Data layer layered schema constraints runtime 028
  Scenario Outline: Data layer layered schema constraints runtime 028
    Given production customer_status's <facet> decision is caused by <issue_kind>
    When its targeted issue panel is rendered in <section>
    Then the issue panel offers <resolution_action> and the legal named source actions
    And no unavailable, duplicate, or ineffective repair is rendered
    When the reviewed <resolution_action> repair is applied
    Then repository inspection finds only <changed_content> changed
    And production recompiles <prospective_result>
    And one durable property command and one Undo entry are recorded
    And hashes for Sitewide, siblings, unrelated Checkout facets, and Published state remain unchanged

    Examples:
      | issue_kind               | facet          | section    | resolution_action                   | changed_content                 | prospective_result       |
      | protected parent         | Type           | Definition | Use Sitewide Type                   | Checkout Type contribution      | effective Sitewide String |
      | invariant parent         | Range rule     | Rules      | Remove Checkout Range rule          | Checkout Range rule             | effective Sitewide Range  |
      | ordinary parallel-parent | Allowed values | Definition | Use Checkout Allowed values here    | contextual Allowed values facet | Checkout allowed values   |
      | ordinary inherited-rule  | Pattern rule   | Rules      | Override Sitewide Pattern rule here | contextual Pattern rule         | Checkout Pattern rule     |

  # Data layer layered schema constraints runtime 029
  Scenario: Data layer layered schema constraints runtime 029
    Given production customer_status has an Allowed values decision between two same-precedence Shared Profile recipes
    And production customer_status has an unresolved Range rule decision
    And production order_total has an unresolved Type decision
    When the installed extension opens Effective schema at Checkout
    Then the status reports two properties need decisions before validation and developer export
    And customer_status renders Needs decision with two affected facets
    And its advanced menu marks only Definition and Rules
    When actual controls resolve the Allowed values decision
    Then the Range rule decision remains with the same table filter and scroll position
    And repository hashes preserve every unrelated facet, rule, contributor, and property
    When actual controls resolve the remaining decisions
    Then the Needs decision status and filter action are absent
    And production validation and developer export become operable without mounting another resolution workspace

  # Data layer layered schema constraints runtime 030
  Scenario Outline: Data layer layered schema constraints runtime 030
    Given production Sitewide defines customer_status with Concept Customer
    And imported Checkout repository state for the same path has <local_concept>
    When the production compiler resolves Checkout
    Then <effective_concept>
    And no decision record exists for customer_status
    And installed validation and developer export remain operable
    And distinct imported ownership or property IDs produce no conflict record

    Examples:
      | local_concept          | effective_concept                           |
      | no local Concept facet | effective Concept remains Sitewide Customer |
      | local Concept Account  | effective Concept becomes Checkout Account  |

  # Data layer layered schema constraints runtime 031
  Scenario Outline: Data layer layered schema constraints runtime 031
    Given production Sitewide supplies customer_status <facet> <original_parent_value>
    And repository state gives Checkout sparse customer_status <facet> <local_value>
    And a sibling Page has no local customer_status <facet>
    When a production command changes Sitewide customer_status <facet> to <updated_parent_value>
    Then Checkout compiles effective <facet> <local_value> with no decision record
    And its installed row renders the updated Sitewide value as a non-blocking parent difference
    And the sibling compiled schema contains <updated_parent_value>
    When actual controls reset only Checkout customer_status <facet> to parent
    Then repository state deletes that sparse facet and Checkout compiles <updated_parent_value>
    And hashes for every other local facet, contributor, property, and Published revision remain unchanged

    Examples:
      | facet          | original_parent_value | updated_parent_value       | local_value          |
      | Allowed values | active and pending    | active, pending, and paused | closed and archived  |
      | Presence       | Optional              | Required                   | Forbidden            |
      | Description    | Parent description    | Revised parent description | Checkout description |
