import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface DataPoint {
    date: string;
    fullDate: string;
    value: number;
}

export interface VitalTrend {
    name: string;
    code: string;
    unit: string;
    dataType: string;
    gridMax: number;
    gridValues: number[];
    color: string;
    v1: DataPoint[];
    v2?: DataPoint[];
}

export const VitalsCharts = ({ trends }: { trends: VitalTrend[] }) => {
    const [chartWidth, setChartWidth] = useState(screenWidth - 40 - 45); // fallback default
    const chartHeight = 120;

    if (!trends || trends.length === 0) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>Not enough data for vitals trends.</Text>
            </View>
        );
    }

    // Helper to render segment line between two points
    const renderLineSegment = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        key: string
    ) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        return (
            <View
                key={key}
                style={{
                    position: 'absolute',
                    left: x1,
                    top: y1,
                    width: distance,
                    height: 2,
                    backgroundColor: color,
                    transform: [
                        { translateX: dx / 2 - distance / 2 },
                        { translateY: dy / 2 },
                        { rotate: `${angle}rad` },
                    ],
                }}
            />
        );
    };

    const renderChart = (
        vital: VitalTrend
    ) => {
        const hasV1 = vital.v1 && vital.v1.length > 0;
        const hasV2 = vital.v2 && vital.v2.length > 0;
        
        if (!hasV1 && !hasV2) return null;

        // Use v1 or v2 to extract common labels depending on what's available
        const labels = hasV1 ? vital.v1.map(p => p.date) : (hasV2 ? vital.v2!.map(p => p.date) : []);
        const gridValues = [...vital.gridValues].reverse(); // high to low for display

        const renderPoints = (data: DataPoint[], lineColor: string, dotColor: string) => {
            const points = data
                .map((pt, i) => {
                    const val = pt.value;
                    const x = data.length === 1 ? chartWidth / 2 : (i / (data.length - 1)) * chartWidth;
                    const y = chartHeight - (Math.min(val, vital.gridMax) / vital.gridMax) * chartHeight;
                    return { x, y, val };
                });

            const dotSize = 8;

            return (
                <React.Fragment key={lineColor}>
                    {/* Connecting Line Segments */}
                    {points.map((p, i) => {
                        if (i === points.length - 1) return null;
                        const next = points[i + 1];
                        return renderLineSegment(p.x, p.y, next.x, next.y, lineColor, `line-${lineColor}-${i}`);
                    })}

                    {/* Data Point Dots */}
                    {points.map((p, i) => (
                        <View
                            key={`dot-${lineColor}-${i}`}
                            style={[
                                styles.dot,
                                {
                                    left: p.x - dotSize / 2,
                                    top: p.y - dotSize / 2,
                                    width: dotSize,
                                    height: dotSize,
                                    borderRadius: dotSize / 2,
                                    borderColor: lineColor,
                                    backgroundColor: dotColor,
                                }
                            ]}
                        />
                    ))}
                </React.Fragment>
            );
        };

        return (
            <View key={vital.code} style={styles.chartWrap}>
                <Text style={styles.chartTitle}>{vital.name} {vital.unit ? `(${vital.unit})` : ''}</Text>
                
                <View style={styles.chartRow}>
                    {/* Y-Axis Labels */}
                    <View style={styles.yAxis}>
                        {gridValues.map((val, idx) => (
                            <Text key={idx} style={styles.axisText}>
                                {val}
                            </Text>
                        ))}
                    </View>

                    {/* Chart Plot Area */}
                    <View 
                        style={styles.plotArea}
                        onLayout={(e) => {
                            const { width } = e.nativeEvent.layout;
                            if (width > 0) setChartWidth(width);
                        }}
                    >
                        {/* Dotted Grid Lines */}
                        {gridValues.map((_, idx) => {
                            const topPercent = (idx / (gridValues.length - 1)) * 100;
                            return (
                                <View
                                    key={idx}
                                    style={[
                                        styles.gridLine,
                                        { top: `${topPercent}%` }
                                    ]}
                                />
                            );
                        })}

                        {hasV1 && renderPoints(vital.v1, vital.color, '#FFF')}
                        {hasV2 && renderPoints(vital.v2!, '#6B7280', '#FFF')}
                    </View>
                </View>

                {/* X-Axis Labels */}
                <View style={styles.xAxisRow}>
                    <View style={{ width: 35 }} />
                    <View style={styles.xAxisLabels}>
                        {labels.map((label, idx) => (
                            <Text key={idx} style={[styles.axisText, { textAlign: 'center' }]}>
                                {label}
                            </Text>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.trendIconContainer}>
                    <Text style={{ fontSize: 16 }}>📈</Text>
                </View>
                <Text style={styles.title}>Vitals Trends (Last 7 Data Points)</Text>
            </View>

            {trends.map(vital => renderChart(vital))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, marginBottom: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    trendIconContainer: { marginRight: 8 },
    title: { fontSize: 16, fontWeight: '700', color: '#111827' },
    
    chartWrap: { 
        backgroundColor: '#FFF', 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
            android: { elevation: 1 },
        }),
    },
    chartTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 18 },
    
    chartRow: { flexDirection: 'row', height: 130 },
    yAxis: { 
        width: 30, 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        paddingRight: 8,
        height: 120 
    },
    axisText: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
    
    plotArea: { 
        flex: 1, 
        height: 120, 
        position: 'relative' 
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    
    dot: {
        position: 'absolute',
        borderWidth: 2,
        zIndex: 10,
    },
    
    xAxisRow: { flexDirection: 'row', marginTop: 10 },
    xAxisLabels: { 
        flex: 1, 
        flexDirection: 'row', 
        justifyContent: 'space-between' 
    },
    
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#9CA3AF', fontSize: 14 },
});

export default VitalsCharts;
