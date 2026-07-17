export { DEFECT_LIBRARY_STORAGE_KEY, DefectLibrary, DefectStatus, ReportedDefect, addDefect, attachSavedSessionToDefect, cancelDefectDeletion, confirmDefectDeletion, createMissingEventDefect, createOccurrenceDefect, createValidationDefect, currentDefectIssues, editDefect, eventContainsDefectIssue, eventMatchesOccurrenceDefect, presentedEventTriage, requestDefectDeletion, restoreDefectLibrary, searchDefects, serializeDefectLibrary, updateDefectStatus } from "../../../../data-layer-defect-library.js";
export { MissingEventBuilderController, missingEventVisits, renderMissingEventDefectReportBuilder } from "../../../../data-layer-missing-event-defect-report-ui.js";
export { MissingEventReport, generateMissingEventRepresentations } from "../../../../data-layer-missing-event-defect-report.js";
export { OccurrenceReport, renderOccurrenceReport } from "../../../../data-layer-event-occurrence-defect-report.js";
export { browserDefectReportClipboard, createLiveDefectReportNavigation } from "../../../../data-layer-defect-report-browser.js";
export { copyStoredDefectForJira } from "../../../../data-layer-defect-library-copy.js";
export { findDefectLibraryElements, renderDefectLibrary } from "../../../../data-layer-defect-library-ui.js";
export { renderDefectReportBuilder } from "../../../../data-layer-defect-report-ui.js";
export { renderOccurrenceDefectReportBuilder } from "../../../../data-layer-event-occurrence-defect-report-ui.js";
