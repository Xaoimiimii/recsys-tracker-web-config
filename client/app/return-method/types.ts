export type DisplayType = 'popup' | 'custom-widget';

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
