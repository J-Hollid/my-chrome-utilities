# Data layer schema context JSON Schema export 001–007
Feature: Data layer schema context JSON Schema export

  Background:
    Given Shop has accepted Draft schemas with inherited and local properties

  # Data layer schema context JSON Schema export 001
  Scenario Outline: Data layer schema context JSON Schema export 001
    Given the schema host shows <source>
    And property search hides an otherwise included property
    When Export JSON Schema 2020-12 is opened
    Then the preview identifies <identity>
    And the export contains <effective_content>
    And it includes the property hidden by search
    And no other schema or sample payload is substituted

    Examples:
      | source                                      | identity                       | effective_content                                      |
      | unpublished Saved Schema draft              | Saved Schema Draft             | accepted draft properties without a published $id       |
      | Saved Schema revision 4 with a newer draft   | Saved Schema revision 4        | revision 4 properties and its existing absolute $id     |
      | Shared Profile Sitewide                     | Sitewide Shared Profile Draft  | Sitewide properties and active rules                   |
      | Property Set Checkout                       | Checkout Property Set Draft    | inherited and local Checkout properties                |
      | Page Cart with an inherited exclusion       | Cart Page Draft                | Cart effective properties without the excluded property |
      | Event Purchase                              | Purchase Event Draft           | Purchase effective properties and enabled rules        |
      | Cart step in Flow Checkout                  | Checkout Cart step Draft       | Cart step local overrides and inherited properties     |
      | Purchase occurrence in Checkout Cart step   | Checkout Cart Purchase Draft   | selected Page and occurrence constraints                |

  # Data layer schema context JSON Schema export 002
  Scenario Outline: Data layer schema context JSON Schema export 002
    Given the selected effective schema contains <facet>
    When Export JSON Schema 2020-12 is opened
    Then the standalone Draft 2020-12 document preserves <representation>
    And it declares the Draft 2020-12 dialect
    And its validation references need no extension storage or external fetch

    Examples:
      | facet                                                | representation                                              |
      | required String currency with allowed values EUR USD | parent required and string enum EUR USD                      |
      | products array with required String name per object  | items object with properties name and item required name     |
      | nested arrays containing Number items                | recursive items schemas with numeric leaf type               |
      | Number amount with minimum 0 and maximum 1000        | numeric minimum 0 and maximum 1000                           |
      | String code with pattern ^[A-Z]+$ and maximum length 8 | pattern ^[A-Z]+$ and maxLength 8                            |
      | tags array with minimum 1 and maximum 3 items        | minItems 1 and maxItems 3                                    |
      | currency required only when kind equals purchase     | if and then that test kind and require currency conditionally |
      | forbidden debug and Only defined fields             | forbidden debug and closed declared object boundaries        |
      | description Total and Number example 12.5           | description Total and examples containing numeric 12.5       |
      | concept ecommerce on products only                  | annotation x-concept ecommerce only on products              |

  # Data layer schema context JSON Schema export 003
  Scenario Outline: Data layer schema context JSON Schema export 003
    Given the selected schema has <state>
    When export availability is shown
    Then the action has <availability>
    And the interface gives <reason>
    And no schema command or export side effect occurs

    Examples:
      | state                                  | availability | reason                                        |
      | unconfirmed property edits             | disabled     | confirm or cancel the property edits          |
      | a durable save in progress             | disabled     | wait for the current save                     |
      | conflicting effective property types   | disabled     | resolve the named property conflict           |
      | an array with no item type             | disabled     | set the named array item type                 |
      | a broken required schema reference     | disabled     | repair the named reference                    |
      | no properties and no schema errors     | enabled      | valid empty schema                            |
      | missing Fixture and Assignment warnings | enabled     | schema is valid despite those warnings        |

  # Data layer schema context JSON Schema export 004
  Scenario Outline: Data layer schema context JSON Schema export 004
    Given a current valid export preview with required compatibility confirmed
    When <change> occurs
    Then Copy JSON and Download JSON are <availability>
    And the export review has <result>

    Examples:
      | change                              | availability | result                                             |
      | an effective parent value changes   | disabled     | stale explanation and Refresh export               |
      | the selected schema context changes | disabled     | stale explanation and Refresh export               |
      | a new accepted Draft is saved       | disabled     | stale explanation and Refresh export               |
      | only property search changes        | enabled      | the same snapshot and confirmation                 |

  # Data layer schema context JSON Schema export 005
  Scenario Outline: Data layer schema context JSON Schema export 005
    Given the effective schema includes one <compatibility_case>
    When Export JSON Schema 2020-12 is opened
    Then compatibility review identifies <review_detail>
    And Copy JSON and Download JSON require confirmation for this snapshot
    When the operator cancels the review
    Then neither clipboard write nor download occurs
    When the operator opens the same export and confirms the review
    Then the export contains <effective_content>
    And its completion reports <omitted_count> omitted rules
    And stored rules and schema content remain unchanged

    Examples:
      | compatibility_case                       | review_detail                              | effective_content                                  | omitted_count |
      | unsupported active validation rule       | rule name path and unsupported behavior    | compatible assertions with that rule omitted        | 1             |
      | warning rule with a custom issue message | warning becomes pass or fail without message | standard assertion without severity or message   | 0             |

  # Data layer schema context JSON Schema export 006
  Scenario: Data layer schema context JSON Schema export 006
    Given a current valid export preview with required compatibility confirmed
    When Copy JSON and Download JSON both succeed
    Then clipboard and downloaded text exactly match the two-space-indented preview with one final newline
    And the UTF-8 download uses application/schema+json and a safe schema-context filename ending in .schema.json
    And internal storage fields are absent while identically named payload properties remain
    And project data, schema data, publication state, Undo history, and selection remain unchanged

  # Data layer schema context JSON Schema export 007
  Scenario: Data layer schema context JSON Schema export 007
    Given a Saved Schema has published revision 4 and accepted Draft changes
    When the existing library row and bundle standard exports are used
    Then they retain their existing published-resource scope and revision identities
    When the new action is used inside the Draft editor
    Then it exports the accepted Draft and omits the published $id
    And project production export, backup, import, and documentation export keep their existing behavior
