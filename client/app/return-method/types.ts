export type DisplayType = 'popup' | 'inline-injection';

export interface DisplayConfiguration {
    id: string;
    configurationName: string;
    displayType: DisplayType;
    operator: string;
    value: string;
    widgetDesign?: {
        layout: string;
        theme: string;
        spacing: string;
        size: string;
    };
    createdAt: string;
    updatedAt: string;
}
