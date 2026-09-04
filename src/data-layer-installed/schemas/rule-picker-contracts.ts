import type { createRuleConfiguration, SchemaDefinition, SchemaPropertyType, } from "../../utilities/data-layer/schemas.js";
export type RulePickerConfiguration = ReturnType<typeof createRuleConfiguration>;
export interface RulePickerPorts {
    picker: HTMLDialogElement | null;
    active(): SchemaDefinition;
    draft(): SchemaDefinition | undefined;
    capturedValue(): unknown;
    propertyType(document: SchemaDefinition["document"], path: string): SchemaPropertyType | undefined;
    incrementRender(): void;
    close(): void;
    closeForCommit(): void;
    createConfigured(): boolean;
}
