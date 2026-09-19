export const schemaViewContainmentRuntime = `(() => {
  const q = (selector) => { const element = document.querySelector(selector); if (!element) throw new Error("Missing " + selector); return element; };
  const schemasPanel = q("#data-layer-panel-schemas");
  q("#data-layer-view-schemas").click();
  q("#create-schema").click();
  const name = q("#schema-editor-name");
  name.value = "Unsaved checkout schema";
  name.dispatchEvent(new Event("input", { bubbles:true }));
  const containedControls = [
    "#schema-editor", "#close-schema-editor", "#save-and-close-schema",
    "#schema-assignment-editor", "#schema-assignment-version-policy",
    "#schema-revision-review", "#close-schema-editor-review",
    "#schema-import-review", "#schema-delete-review",
    "#schema-rule-delete-review", "#schema-rule-upgrade-review",
  ].every((selector) => schemasPanel.contains(q(selector)));
  const closeReviewContainsActions = [
    "#keep-editing-schema", "#discard-schema-draft", "#save-schema-close-review",
  ].every((selector) => q("#close-schema-editor-review").contains(q(selector)));
  const editorContainsActions = ["#close-schema-editor", "#save-and-close-schema"]
    .every((selector) => q("#schema-editor").contains(q(selector)));
  const assignmentContainsPolicy = q("#schema-assignment-editor").contains(q("#schema-assignment-version-policy"));
  const presentationByView = {};
  for (const view of ["Live", "Library", "Sessions"]) {
    q("#data-layer-view-" + view.toLowerCase()).click();
    const hiddenControls = Array.from(schemasPanel.querySelectorAll("button, input, select, textarea, dialog"));
    presentationByView[view] = {
      panelDisplay:getComputedStyle(schemasPanel).display,
      painted:hiddenControls.some((control) => control.getClientRects().length > 0),
      focusable:hiddenControls.some((control) => { control.focus(); return document.activeElement === control; }),
      closeReviewOpen:q("#close-schema-editor-review").open,
    };
    q("#data-layer-view-schemas").click();
  }
  const restored = {
    editorVisible:q("#schema-editor").getClientRects().length > 0,
    name:name.value,
    closeReviewOpen:q("#close-schema-editor-review").open,
  };
  q("#schema-subview-assignments").click();
  q("#create-schema-assignment").click();
  const assignmentWasOpen = !q("#schema-assignment-editor").hidden;
  q("#data-layer-view-library").click();
  const assignmentHiddenWhileAway = q("#schema-assignment-editor").getClientRects().length === 0;
  q("#data-layer-view-schemas").click();
  q("#schema-subview-rules").click();
  q("#create-schema-rule").click();
  const ruleWasOpen = !q("#schema-rule-editor").hidden;
  q("#data-layer-view-sessions").click();
  const ruleHiddenWhileAway = q("#schema-rule-editor").getClientRects().length === 0;
  return {
    containedControls,
    editorContainsActions,
    closeReviewContainsActions,
    assignmentContainsPolicy,
    standaloneAssignmentPolicy:document.querySelectorAll("#schema-assignment-policy").length,
    presentationByView,
    editorStates:{ assignmentWasOpen, assignmentHiddenWhileAway, ruleWasOpen, ruleHiddenWhileAway },
    restored,
  };
})()`;

export const containmentFixturePrograms = Object.freeze({ schemaViewContainmentRuntime });
