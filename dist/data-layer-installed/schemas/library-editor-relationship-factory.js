import { SchemaInstalledEditorWorkflow } from "./installed-editor-workflow.js";
import { SchemaLibraryController } from "./library-controller.js";
import { SchemaLibraryEditor } from "./library-editor.js";
import { SchemaProjectHydrationCoordinator } from "./project-hydration.js";
import { createSchemaRelationshipTreeController } from "./relationship-tree-controller.js";
import { SchemaRelationshipViewCoordinator } from "./relationship-view-coordinator.js";
import { schemaEditorDraft, withSchemaParent } from "./schema-model.js";
import { SchemaSourceController } from "./source-controller.js";
/** Owns complete library, editor, relationship, and project-hydration composition. */
export function createSchemaLibraryEditorRelationshipDomain(libraryPorts, treePorts) {
    const library = new SchemaLibraryController(libraryPorts), relationshipTree = createSchemaRelationshipTreeController(treePorts);
    let editor, workflow, relationship, hydration;
    const connect = (p) => {
        const render = () => relationship.render(), active = () => library.active(), persist = () => library.persist(), persistLibraries = () => { persist(); p.rule.persist(); };
        library.configure({ elements: { importFile: p.elements.library.importFile, importReview: p.elements.library.importReview, importSummary: p.elements.library.importReviewSummary, deleteReview: p.elements.library.deleteReview, deleteSummary: p.elements.library.deleteReviewSummary, exportButton: p.elements.library.exportButton, exportChoices: p.elements.library.exportChoices, exportReview: p.elements.library.exportReview, result: p.elements.result },
            rules: () => p.rule.rules, replaceRules: (rules) => { p.rule.rules = rules; }, persistRules: () => p.rule.persist(), renderAll: render, renderRules: () => p.rule.render(), download: p.download });
        const source = new SchemaSourceController({ setDraft: (schema) => { library.activeSchemaId = undefined; library.draft = schema; }, setSelectedPath: (path) => { p.property.selectedPath = path; }, showSchemas: p.showSchemas, render, result: (message) => { if (p.elements.result)
                p.elements.result.textContent = message; }, focusName: () => p.elements.name?.focus({ preventScroll: true }) });
        editor = new SchemaLibraryEditor({ root: p.root, document: p.document, library, canonical: p.canonical, active, editorDraft: schemaEditorDraft, replaceActive: (schema) => library.replaceActive(schema), persist, renderAll: render, renderProperty: () => p.propertyView.render(),
            revisionVersion: () => Number(p.elements.revisionSelector?.value || active().version), openSpecification: (schema, surface, trigger) => workflow.openSpecification(schema, surface, trigger), listen: (target, type, listener) => relationshipTree.listen(target, type, listener), proposeName: p.proposeName,
            persistIfStored: () => { if (library.activeIndex() >= 0)
                persist(); }, persistLibraries, closeCanonical: () => p.persistence.close(), beginSettlement: (id) => p.persistence.beginSettlement(id), clearSettlement: (id, settlement) => p.persistence.clearSettlement(id, settlement),
            ...(p.settle ? { settle: p.settle } : {}), mounted: () => p.lifecycle.isMounted(), renderCanonical: () => p.persistence.render(), revalidate: p.refreshLive, rules: () => p.rule.rules, addPublishedRules: (published) => { let changed = false; for (const rule of published.attachedRules ?? []) {
                if (!rule.id.startsWith("rule:") || p.rule.rules.some(({ id }) => id === rule.id))
                    continue;
                p.rule.rules = [...p.rule.rules, { id: rule.id, name: rule.name ?? rule.id, kind: rule.operator ?? "required", version: rule.version, enabled: rule.enabled !== false, ...(rule.operator ? { operator: rule.operator } : {}), ...(rule.parameters ? { parameters: rule.parameters } : {}), ...(rule.severity ? { severity: rule.severity } : {}), ...(rule.message ? { message: rule.message } : {}), attachments: [published.id] }];
                changed = true;
            } return changed; }, withParent: withSchemaParent });
        workflow = new SchemaInstalledEditorWorkflow({ root: p.root, library, editor, property: p.property, schemaEditor: p.elements.editor, schemaDetailEmpty: p.elements.detailEmpty, schemaEditorName: p.elements.name, propertyFilter: p.elements.propertyFilter, subviews: p.elements.subviews, panels: p.elements.panels, liveEventQuery: p.elements.liveEventQuery, specificationBuilder: p.elements.specificationBuilder,
            renderProperty: () => p.propertyView.render(), renderAll: render, showSchemas: p.showSchemas, openRoute: () => p.route.open(p.elements.createButton ?? undefined), createEmpty: () => source.createEmpty(), settleCanonical: Boolean(p.settle), renderSpecification: p.renderSpecification });
        relationship = new SchemaRelationshipViewCoordinator({ controller: relationshipTree, library, route: p.route, canonical: p.canonical, list: p.elements.list, detail: p.elements.detail, mounted: () => p.lifecycle.isMounted(), relationship: p.relationship, renderDraft: () => editor.render(), renderAssignments: () => p.assignment.render(), persist,
            openSaved: (schema) => p.canonicalView.openSaved(schema), adopt: p.adopt, build: (schema, trigger) => workflow.openSpecification(schema, `published:${schema.version}`, trigger), openContributor: p.openContributor, openContributorInStudio: p.openContributorInStudio, openProject: p.openProject, reportMissing: p.reportMissing });
        const contributorRoute = { collectionKinds: ["profiles", "propertySets", "pages", "events", "flows"], includeFlowGraphs: true };
        hydration = new SchemaProjectHydrationCoordinator({ activeProjectId: p.activeProjectId, generation: () => p.lifecycle.generation(), isMounted: () => p.lifecycle.isMounted(), ensure: (id) => p.ensureContributors(id, contributorRoute), invalidate: () => relationshipTree.invalidateProject(), render, result: p.elements.result });
        return { source, editor, workflow, relationship, hydration, render, update: () => relationship.update(), persistScroll: () => relationship.persistScroll(), navigate: (event) => relationship.navigate(event) };
    };
    return { library, relationshipTree, connect, dispose: () => { hydration?.reset(); relationshipTree.dispose(); } };
}
//# sourceMappingURL=library-editor-relationship-factory.js.map