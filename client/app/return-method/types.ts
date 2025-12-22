export type DisplayType = 'popup' | 'custom-widget';
export type SelectorType = 'id' | 'class' | 'custom';
export type MatchOperator = 'equals' | 'contains' | 'starts-with' | 'regex';

export interface DisplayConfiguration {
    id: string;
    name: string;
    displayType: DisplayType;
    // For Custom Widget
    targetSelector?: {
        type: SelectorType;
        operator: MatchOperator;
        value: string;
    };
    widgetDesign?: {
        layout: string;
        theme: string;
        spacing: string;
        size: string;
    };
    // For Popup
    urlTrigger?: {
        operator: MatchOperator;
        value: string;
    };
    slotName?: string;
    createdAt: string;
    updatedAt: string;
}
