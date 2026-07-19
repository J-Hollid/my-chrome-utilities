Feature: Data layer Flow documentation export

  Background:
    Given Checkout journey contains context-setting and interaction occurrences
    And it contains expected-next, alternative, parallel, and merge relationships
    And its occurrences have effective schemas, named Assignments, examples, provenance, and manual expectations
    And saved project revision 24 is selected

  # Data layer Flow documentation export 001
  Scenario: Data layer Flow documentation export 001
    When the operator generates complete Confluence-ready documentation
    Then it identifies Shop, Checkout journey, Draft revision 24, and generated time
    And it contains a directional diagram with text alternative, Base, Pages, Events, Profiles, authored requirements, occurrences, relationships, effective contracts, effective requirements, Assignments, examples, provenance, and developer and tester notes
    And its legend states that payload validation is automatic while ordering, branches, and occurrence expectations are manual
    And every section derives from revision 24

  # Data layer Flow documentation export 002
  Scenario Outline: Data layer Flow documentation export 002
    When Spreadsheet table <table> is generated
    Then its fixed columns in order are <columns>
    And cross-links use stable human-readable export keys rather than raw storage identifiers

    Examples:
      | table                  | columns                                                                                                                                                                                                                   |
      | Overview               | Field, Value                                                                                                                                                                                                              |
      | Bases                  | Base key, Base name, Requirement keys, Used by occurrence keys                                                                                                                                                            |
      | Pages                  | Page key, Page name, Matcher summary, Requirement keys, Used by occurrence keys                                                                                                                                           |
      | Events                 | Event key, Event name, Role, Requirement keys, Used by occurrence keys                                                                                                                                                    |
      | Profiles               | Profile key, Profile name, Applicability summary, Requirement keys, Used by occurrence keys                                                                                                                               |
      | Authored requirements  | Requirement key, Layer, Owner key, Path, Presence, Type, Exact value, Allowed values, Rule, Severity, Example, Description                                                                                               |
      | Occurrences            | Occurrence key, Flow name, Event key, Event name, Page key, Page name, Obligation, Multiplicity, Profile keys, Contract key, Assignment key, Trigger, Developer note, Tester note                                         |
      | Relationships          | Relationship key, Source occurrence key, Kind, Group, Label, Condition, Target occurrence key, Human expectation                                                                                                         |
      | Effective contracts    | Contract key, Occurrence key, Composition order, Effective requirement keys, Schema revision, Complete provenance                                                                                                        |
      | Effective requirements | Effective requirement key, Source requirement keys, Contract key, Occurrence key, Path, Presence, Type, Exact value, Allowed values, Rule, Severity, Example, Description, Winning origin, Complete provenance, Schema revision |
      | Assignments            | Assignment key, Assignment name, Page keys, Event key, Observable matcher summary, Priority, Contract key, Matcher result                                                                                                |
      | Examples               | Example key, Occurrence key, Contract key, Observable context, Payload, Expected Assignment, Expected validity, Expected issues                                                                                          |

  # Data layer Flow documentation export 003
  Scenario: Data layer Flow documentation export 003
    Given Retail Purchase and Trade Purchase have different stable occurrence export keys
    When both display names are changed to Purchase confirmation
    Then both keys remain distinct in diagram, text alternative, Confluence-ready content, and Spreadsheet tables
    And every Base, Page, Event, Profile, authored requirement, effective contract, effective requirement, Assignment, example, and provenance cross-link resolves to one exported record
    And neither export key exposes a raw storage identifier

  # Data layer Flow documentation export 004
  Scenario: Data layer Flow documentation export 004
    Given Shipping and Payment are parallel required occurrences with different Page contexts
    When Confluence-ready content and Spreadsheet tables are generated
    Then both formats retain the same Parallel group and branch Page names
    And each occurrence retains its own obligation, multiplicity, trigger, developer note, and tester note
    And neither format claims that a branch ran, joined, passed, or failed

  # Data layer Flow documentation export 005
  Scenario Outline: Data layer Flow documentation export 005
    Given the operator omits <category>
    When documentation preview and output are generated
    Then both identify <category> as lossy
    And direct the operator to include it or use full project JSON
    And omission does not change selected revision 24

    Examples:
      | category             |
      | graph relationships  |
      | effective schemas    |
      | Assignments          |
      | provenance           |

  # Data layer Flow documentation export 006
  Scenario: Data layer Flow documentation export 006
    When full project JSON is exported and reimported
    Then Pages, Events, Flows, occurrences, relationships, layout, schemas, Profiles, Assignments, examples, provenance, and revision identities round-trip
    And the reimported graph and effective schemas equal the selected saved revision
    And Confluence-ready and Spreadsheet outputs are labelled documentation rather than interchange formats
