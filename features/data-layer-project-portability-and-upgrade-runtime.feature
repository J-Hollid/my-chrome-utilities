Feature: Data layer project portability and upgrade runtime

  # Data layer project portability and upgrade runtime 001
  Scenario: Data layer project portability and upgrade runtime 001
    Given production project-retail is active at persisted Draft revision 14 with metadata, schemas, Pages, Page Groups, Events, Flows, occurrences, applicability, assignments, documentation settings, and adopted-schema lineage
    When actual Projects controls export Retail website
    Then one downloaded versioned bundle identifies project-retail and Draft revision 14
    And parsed bundle data contains the complete canonical project graph with resolvable stable references
    And it contains no unadopted library schema, permission, Live observation, compilation cache, interface state, or Undo history
    And storage hash, selected context, and Draft revision match their pre-export values

  # Data layer project portability and upgrade runtime 002
  Scenario: Data layer project portability and upgrade runtime 002
    Given production project-retail is active and a valid bundle also uses project-retail for linked Sitewide, Cart, Purchase, and Retail checkout records
    When actual controls choose that file through Import project
    Then the installed review renders format version, source name, Draft revision, entity counts, reference integrity, migrations, unique target name Retail website copy, and Import as new project
    And canonical project storage is unchanged before confirmation
    When actual controls confirm Import as new project
    Then production stores inactive Retail website copy with new project and project-owned entity identities
    And serialized parent, membership, occurrence, assignment, and Flow references point to the remapped identities
    And external Saved Schema Library lineage still names its original source revision
    And production project-retail plus every prior library entry remains byte-identical
    When actual controls open the imported project
    Then it is the sole active identity and production compilation resolves its effective schemas and Flow graph without source-installation state

  # Data layer project portability and upgrade runtime 003
  Scenario Outline: Data layer project portability and upgrade runtime 003
    Given production project-retail is active before import
    When actual file controls select a bundle with <problem>
    Then the installed review renders <repair> at the exact bundle section
    And the Import as new project control is disabled
    And the repository snapshot equals its pre-import snapshot with the same counts and selection

    Examples:
      | problem                              | repair                                      |
      | malformed JSON                       | choose a readable project bundle             |
      | unsupported future format version    | use a supported version or migrate externally |
      | missing Page referenced by a Flow    | restore the missing Page and export again    |

  # Data layer project portability and upgrade runtime 004
  Scenario: Data layer project portability and upgrade runtime 004
    Given production storage has only singleton Legacy shop project project-legacy with metadata, Draft revision 9, project graph, navigation, and Undo history
    When the installed project-library migration runs
    Then one atomic repository write creates one Legacy shop entry with unchanged project and entity identities
    And active-project persistence becomes project-legacy
    And every pre-upgrade content hash for metadata, Draft, graph, navigation, and history is conserved
    When the extension reloads twice
    Then repository bytes contain one unmigrated-again Legacy shop entry and the same active identity

  # Data layer project portability and upgrade runtime 005
  Scenario: Data layer project portability and upgrade runtime 005
    Given the actual extension starts with production Retail website active in its project library
    When installed project controls create Agency platform, edit metadata, switch to Retail website, and open its Project overview in Specification Studio
    And actual controls export Retail website, import it as a new inactive project, and open the imported project
    Then observed active-project history contains exactly one identity after every context change
    And serialized existing projects retain metadata, canonical graphs, and Draft revisions
    And the imported graph uses remapped stable references with effective schema output equivalent to Retail website
    When the installed side panel and Specification Studio reload
    Then both render the imported project as active with no Retail website or Agency platform entity in their project-bound views
