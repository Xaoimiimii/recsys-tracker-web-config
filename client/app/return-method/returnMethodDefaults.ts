import { LayoutJson, StyleJson } from './types';

export const DARK_MODE_COLORS = {
    background: "#111827",      
    surface: "#1F2937",         
    textPrimary: "#F9FAFB",     
    textSecondary: "#9CA3AF",   
    border: "#374151",          
    muted: "#374151",          
    primary: "#60A5FA",         
    success: "#34D399",
    danger: "#F87171",
    warning: "#FBBF24",
};

export const SHARED_MODES_CONFIG = {
    grid: {
        columns: 2,
        gap: "md",
        responsive: {
            lg: { columns: 2 },
            md: { columns: 2 },
            sm: { columns: 2 },
            xs: { columns: 1 }
        }
    },
    list: {
        rowGap: "md",
        showDivider: true,
        imageLeftWidth: 96
    },
    carousel: {
        itemsPerView: 4,
        gap: "md",
        loop: false,
        peek: 24,
        autoplay: { enabled: false, intervalMs: 4000 }
    }
};

// 2. CẤU HÌNH CHI TIẾT THẺ SẢN PHẨM (CARD CONFIG)
// Quy định ảnh, text, nút bấm hiển thị ra sao tương ứng với từng Mode
export const SHARED_CARD_CONFIG = {
    blocks: ["image", "fields", "actions"],

    image: {
        enabled: true,
        // Tự động đổi vị trí dựa trên mode
        positionByMode: {
            grid: "top",
            list: "left",
            carousel: "top"
        },
        // Tự động đổi kích thước/tỷ lệ dựa trên mode
        sizeByMode: {
            grid: { width: 0, height: 0, aspectRatio: "1:1" },   
            list: { width: 96, height: 96, aspectRatio: "1:1" },
            carousel: { width: 0, height: 0, aspectRatio: "1:1" } 
        }
    },

    fields: {
        enabled: true,
        source: "customizingFields", // Mapping với cột CustomizingFields bên ngoài
        orderBy: "order",
        direction: "asc" as const,
        render: "stack" as const,
        // Giới hạn số dòng hiển thị khác nhau cho mỗi mode
        maxItemsByMode: {
            grid: 6,
            list: 8,
            carousel: 6
        },
        row: {
            labelWidth: 92,
            valueAlign: "center" as const,
            gap: "sm"
        }
    },

    actions: {
        enabled: true,
        positionByMode: {
            grid: "bottom",
            list: "right",
            carousel: "bottom"
        },
        variantByMode: {
            grid: "compact",
            list: "icon-only",
            carousel: "compact"
        }
    }
};


export const DEFAULT_POPUP_LAYOUT: LayoutJson = {
    displayMode: 'popup',   
    contentMode: 'grid',   
    wrapper: {
        popup: {
            position: "bottom-right",
            widthMode: "fixed",
            width: 340,
        },
    },

    modes: SHARED_MODES_CONFIG,
    card: SHARED_CARD_CONFIG
};


export const DEFAULT_INLINE_LAYOUT: LayoutJson = {
    displayMode: 'inline-injection',
    contentMode: 'grid',
    
    wrapper: {
        inline: {
            selector: '#recommendation-slot', // Selector mặc định
            injectionMode: 'append'
        }
    }, 

    modes: SHARED_MODES_CONFIG,
    card: SHARED_CARD_CONFIG
};

export const LAYOUT_MODE_OPTIONS = [
    { value: 'grid', label: 'Grid Layout' },
    { value: 'carousel', label: 'Carousel Slider' },
    { value: 'list', label: 'List View' }
];

export const DEFAULT_STYLE_CONFIG: StyleJson = {
    theme: "light",
    spacing: "md",
    size: "lg",

    tokens: {
        colors: {
            background: "#FFFFFF",
            surface: "#FFFFFF",
            textPrimary: "#111827",
            textSecondary: "#6B7280",
            border: "#E5E7EB",
            muted: "#F3F4F6",
            primary: "#2563EB",
            success: "#16A34A",
            danger: "#DC2626",
            warning: "#F59E0B",
        },

        radius: {
            card: 12,
            image: 12,
            button: 10,
            badge: 999
        },

        shadow: {
            card: "0 2px 10px rgba(0,0,0,0.06)",
            cardHover: "0 10px 25px rgba(0,0,0,0.10)"
        },

        typography: {
            title: { fontSize: 18, fontWeight: 600, lineHeight: 1.25 },
        },

        spacingScale: {
            xs: 4, sm: 8, md: 12, lg: 16, xl: 24
        },

        densityBySize: {
            sm: { cardPadding: 12, rowGap: 6, imageHeight: 120 },
            md: { cardPadding: 14, rowGap: 8, imageHeight: 130 },
            lg: { cardPadding: 16, rowGap: 10, imageHeight: 140 }
        }
    },

    components: {
        canvas: {
            backgroundToken: "background"
        },
        dropdown: {
            heightBySize: { sm: 32, md: 36, lg: 40 },
            radiusToken: "button",
            borderToken: "border",
            textToken: "textPrimary"
        },
        card: {
            backgroundToken: "surface",
            border: true,
            borderColorToken: "border",
            radiusToken: "card",
            shadowToken: "card",
            hover: {
                enabled: true,
                liftPx: 2,
                shadowToken: "cardHover"
            }
        },
        image: {
            radiusFollowsCard: true,
            objectFit: "cover" as const, // Dùng as const để fix lỗi Type
            placeholder: {
                backgroundToken: "muted",
                iconOpacity: 0.5
            }
        },
        badge: {
            enabled: true,
            variant: "solid" as const,
            backgroundToken: "primary",
            textColor: "#FFFFFF",
            radiusToken: "badge",
            padding: { x: 10, y: 4 },
            position: "top-right",
            offset: { x: 10, y: 10 }
        },
        fieldRow: {
            layout: "two-column",
            label: {
                colorToken: "textSecondary",
                typographyToken: "label",
                widthPx: 92,
                truncate: true
            },
            value: {
                colorToken: "textPrimary",
                typographyToken: "body",
                truncate: true
            },
            rowGapToken: "sm"
        },
        actions: {
            button: {
                variant: "ghost",
                radiusToken: "button",
                heightBySize: { sm: 30, md: 34, lg: 38 }
            },
            iconSizeBySize: { sm: 16, md: 18, lg: 20 }
        }
    },

    modeOverrides: {
        grid: {
            card: { paddingFromDensity: "cardPadding" },
            image: { heightFromDensity: "imageHeight" },
            fieldRow: { maxRows: 6 }
        },
        list: {
            card: {
                paddingFromDensity: "cardPadding",
                shadowToken: "card",
                hover: { enabled: false }
            },
            image: {
                fixed: { widthPx: 96, heightPx: 96, radiusToken: "image" }
            },
            fieldRow: {
                label: { widthPx: 110 },
                maxRows: 8
            },
            typography: {
                title: { fontSize: 16, fontWeight: 600 },
                body: { fontSize: 13 }
            }
        },
        carousel: {
            card: { paddingFromDensity: "cardPadding" },
            image: { heightFromDensity: "imageHeight" },
            fieldRow: { maxRows: 6 },
            actions: {
                button: { variant: "solid", backgroundToken: "primary", textColor: "#FFFFFF" }
            }
        }
    },

    customizingFieldsIntegration: {
        orderSource: "customizingFields.order",
        visibleSource: "customizingFields.visible",
        fallback: {
            visible: true,
            order: 9999
        },
        sorting: {
            direction: "asc" as const,
            tieBreaker: "field_key"
        }
    }
};