import React from 'react';
import styles from './LivePreview.module.css';
import { DisplayType, LayoutJson, StyleJson, FieldConfig } from '../../types';

interface LivePreviewProps {
    displayType: DisplayType;
    styleJson: StyleJson;
    layoutJson: LayoutJson;
    sortedFields: FieldConfig[];
    showImage: boolean;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
    displayType,
    styleJson,
    layoutJson,
    sortedFields,
    showImage
}) => {
    const isPopup = displayType === 'popup';
    const theme = styleJson.theme;
    const currentDensity = styleJson.tokens.densityBySize[styleJson.size || 'md'];
    const radius = styleJson.tokens.radius.card;
    const shadow = styleJson.tokens.shadow.card;

    const surfaceColor = styleJson.tokens.colors.surface;
    const textColor = styleJson.tokens.colors.textPrimary;
    const secondaryColor = styleJson.tokens.colors.textSecondary;
    const borderColor = styleJson.tokens.colors.border;
    const typoTitle = styleJson.tokens.typography.title;
    const previewBg = '#f3f4f6';

    const dynamicPreviewContainer = {
        backgroundColor: previewBg,
        fontFamily: styleJson.tokens.typography.fontFamily
    };

    const dynamicWidgetCard: React.CSSProperties = {
        backgroundColor: surfaceColor,
        borderRadius: `${radius}px`,
        boxShadow: shadow === 'none' ? 'none' : shadow,
        border: `1px solid ${borderColor}`,
        padding: `${currentDensity.cardPadding}px`,
        width: isPopup ? (layoutJson.wrapper?.popup?.widthMode === 'fixed' ? `${layoutJson.wrapper?.popup?.width}px` : '90%') : '100%',
        maxWidth: isPopup ? '400px' : '100%',
        ...(isPopup && shadow === 'none' ? { filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' } : {})
    };

    const MockProduct = ({ id }: { id: number }) => {
        const activeTextFields = sortedFields.filter(f => f.isEnabled && !f.key.includes('image'));
        const colors = styleJson.tokens.colors;
        const isCarousel = layoutJson.contentMode === 'carousel';
        const isList = layoutJson.contentMode === 'list';
        const contentAlign = isList ? 'flex-start' : 'left';
        const textAlignment = isList ? 'left' : 'left';

        const carouselItemStyle: React.CSSProperties = isCarousel ? {
            width: '100%',
            flexShrink: 0,
            scrollSnapAlign: 'center'
        } : {};

        const imgConfig = (layoutJson.card?.image?.sizeByMode as any)?.[layoutJson.contentMode || 'grid'] || {};

        let imgW = '100%';
        let imgH = `${currentDensity.imageHeight}px`;

        if (isList) {
            imgW = '96px'; imgH = '96px';
        } else if (isCarousel) {
            imgW = imgConfig.width ? `${imgConfig.width}px` : '100%';
            imgH = imgConfig.height ? `${imgConfig.height}px` : '140px';
            if (imgConfig.aspectRatio === '1:1' && imgConfig.width) imgH = `${imgConfig.width}px`;
        } else {
            imgW = imgConfig.width ? `${imgConfig.width}px` : '100%';
            imgH = imgConfig.height ? `${imgConfig.height}px` : `${currentDensity.imageHeight}px`;
        }

        return (
            <div key={id} className={styles.mockProductCard} style={{
                flexDirection: layoutJson.contentMode === 'list' ? 'row' : 'column',
                gap: `${currentDensity.rowGap}px`,
                borderColor: borderColor,
                borderRadius: `${Math.max(4, radius - 4)}px`,
                backgroundColor: colors.surface,
                ...carouselItemStyle
            }}>
                {showImage && (
                    <div className={styles.mockProductImage} style={{
                        width: imgW,
                        height: imgH,
                        borderRadius: `${Math.max(2, radius - 6)}px`,
                        flexShrink: 0,
                        margin: isList ? '0' : '0 auto'
                    }}></div>
                )}

                <div className={styles.mockProductContent} style={{
                    alignItems: contentAlign,
                    textAlign: textAlignment as any
                }}>
                    {activeTextFields.map((fieldConfig) => {
                        const key = fieldConfig.key;
                        const override = styleJson.components.fieldRow.overrides?.[key] || {};

                        let baseStyle: React.CSSProperties = { fontSize: '11px', color: colors.textSecondary, marginTop: '2px' };
                        if (key.includes('item_name') || key.includes('title')) {
                            baseStyle = {
                                fontWeight: '600',
                                fontSize: '14px',
                                color: colors.textPrimary
                            };
                        } else if (key.includes('price')) {
                            baseStyle = {
                                fontWeight: '700',
                                fontSize: '14px',
                                color: colors.primary
                            };
                        } else if (key.includes('categories')) {
                            baseStyle = {
                                fontWeight: '400',
                                fontSize: '11px',
                                color: colors.primary
                            };
                        } else if (key.includes('rating')) {
                            baseStyle = {
                                color: colors.warning,
                                fontSize: '12px'
                            };
                        }

                        const finalStyle = {
                            ...baseStyle,
                            ...(override.fontSize ? { fontSize: `${override.fontSize}px` } : {}),
                            ...(override.fontWeight ? { fontWeight: override.fontWeight } : {}),
                            ...(override.color ? { color: override.color } : {}),
                        };

                        let content = 'Sample Value';
                        if (key.includes('item_name') || key.includes('title')) content = 'Iphone 18 Pro Max';
                        else if (key.includes('price')) content = '$100.00';
                        else if (key.includes('rating')) content = '★★★★★';
                        else if (key.includes('categories')) content = 'Apple, Phone, ...';
                        else if (key.includes('description')) content = 'This is the most modern phone...';
                        return (
                            <div key={key} style={finalStyle}>
                                {content}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderWidgetBody = () => {
        const isCarousel = layoutJson.contentMode === 'carousel';
        const isList = layoutJson.contentMode === 'list';
        const gridColumns = (layoutJson.modes?.grid as any)?.columns || 2;

        const navBtnStyle: React.CSSProperties = {
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: theme === 'dark' ? '#374151' : '#fff',
            border: `1px solid ${borderColor}`,
            color: textColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '18px',
            lineHeight: 1,
            paddingBottom: '2px'
        };

        const containerStyle: React.CSSProperties = {
            display: isList ? 'flex' : (isCarousel ? 'flex' : 'grid'),
            flexDirection: isList ? 'column' : 'row',
            gridTemplateColumns: !isList && !isCarousel ? `repeat(${gridColumns}, 1fr)` : undefined,
            gap: '12px',
            padding: isCarousel ? '0 12px' : '0',
            overflow: 'hidden',
            position: 'relative',
            alignItems: 'stretch'
        };

        return (
            <div style={{ position: 'relative', padding: isCarousel ? '0 24px' : '0' }}>
                {isCarousel && (
                    <>
                        <button style={{ ...navBtnStyle, left: '-12px' }}>‹</button>
                        <button style={{ ...navBtnStyle, right: '-12px' }}>›</button>
                    </>
                )}

                <div style={containerStyle}>
                    <MockProduct id={1} />
                    {!isCarousel && <MockProduct id={2} />}
                    {!isCarousel && !isPopup && !isList && (
                        <>
                            <MockProduct id={3} />
                            <MockProduct id={4} />
                        </>
                    )}
                    {!isCarousel && !isPopup && !isList && displayType === 'inline-injection' && (
                        <>
                            <MockProduct id={5} />
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.previewBox}>
            <p className={styles.previewLabel}>{isPopup ? 'Popup Preview' : 'Inline Injection Preview'}</p>
            <div className={styles.previewContainer} style={dynamicPreviewContainer}>
                <div className={styles.previewFakeHeader}>Client Website (Background)</div>
                <div className={styles.previewFakeBody}>
                    <div className={styles.placeholderBar} style={{ height: '30px', marginBottom: '12px', width: '60%' }}></div>
                    <div className={styles.placeholderBarSm} style={{ height: '10px', marginBottom: '8px', width: '90%' }}></div>
                    <div className={styles.placeholderBarSm} style={{ height: '10px', marginBottom: '24px', width: '80%' }}></div>

                    {!isPopup && (
                        <div className={styles.widgetWrapperInline}>
                            <div className={styles.widgetCard} style={dynamicWidgetCard}>
                                <h4 className={styles.widgetHeader} style={{ margin: '0 0 12px 0', color: textColor, fontSize: `${typoTitle.fontSize}px`, fontWeight: typoTitle.fontWeight }}>
                                    Recommended
                                </h4>
                                {renderWidgetBody()}
                            </div>
                        </div>
                    )}
                    <div className={styles.placeholderBlock}></div>
                </div>

                {isPopup && (
                    <div className={styles.popupOverlayLayer} style={{
                        alignItems: layoutJson.wrapper?.popup?.position?.includes('center') ? 'center' : 'flex-end',
                        justifyContent: layoutJson.wrapper?.popup?.position?.includes('right') ? 'flex-end' :
                            layoutJson.wrapper?.popup?.position?.includes('left') ? 'flex-start' : 'center'
                    }}>
                        <div className={styles.widgetCard} style={{ ...dynamicWidgetCard, pointerEvents: 'auto' }}>
                            <div className={styles.widgetHeader} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                <h4 style={{ margin: 0, color: textColor, fontSize: `${typoTitle.fontSize}px`, fontWeight: typoTitle.fontWeight }}>
                                    Recommended
                                </h4>
                                <span style={{ cursor: 'pointer', opacity: 0.6, color: secondaryColor }}>✕</span>
                            </div>
                            <div style={{ paddingTop: '12px' }}>
                                {renderWidgetBody()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <p className={styles.helperText} style={{ textAlign: 'center', marginTop: '12px' }}>
                *Preview shows layoutJson structure and colors. Actual content will vary by product.
            </p>
        </div>
    );
};
