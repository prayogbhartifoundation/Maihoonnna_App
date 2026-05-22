import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface TrendData {
    labels: string[];
    bpSystolic: number[];
    heartRate: number[];
    bloodSugar: number[];
}

export const VitalsCharts = ({ trends }: { trends: TrendData }) => {
    const [chartWidth, setChartWidth] = useState(screenWidth - 40 - 45); // fallback default
    const chartHeight = 120;

    if (!trends || !trends.labels || trends.labels.length === 0) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>Not enough data for vitals trends.</Text>
            </View>
        );
    }

    const labels = trends.labels;

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
        title: string,
        data: number[],
        gridValues: number[],
        maxVal: number,
        lineColor: string,
        dotBorderColor: string,
        dotFillColor: string,
        dotSize = 8
    ) => {
        // Calculate point coordinates (filtering out nulls while keeping correct chronological X positions)
        const points = data
            .map((val, i) => {
                if (val === null || val === undefined) return null;
                const x = data.length === 1 ? chartWidth / 2 : (i / (data.length - 1)) * chartWidth;
                const y = chartHeight - (Math.min(val, maxVal) / maxVal) * chartHeight;
                return { x, y, val };
            })
            .filter((p): p is { x: number; y: number; val: number } => p !== null);

        return (
            <View style={styles.chartWrap}>
                <Text style={styles.chartTitle}>{title}</Text>
                
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

                        {/* Connecting Line Segments */}
                        {points.map((p, i) => {
                            if (i === points.length - 1) return null;
                            const next = points[i + 1];
                            return renderLineSegment(p.x, p.y, next.x, next.y, lineColor, `line-${i}`);
                        })}

                        {/* Data Point Dots */}
                        {points.map((p, i) => (
                            <View
                                key={`dot-${i}`}
                                style={[
                                    styles.dot,
                                    {
                                        left: p.x - dotSize / 2,
                                        top: p.y - dotSize / 2,
                                        width: dotSize,
                                        height: dotSize,
                                        borderRadius: dotSize / 2,
                                        borderColor: dotBorderColor,
                                        backgroundColor: dotFillColor,
                                    }
                                ]}
                            />
                        ))}
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
                {/* Visual Line Chart Icon Trend */}
                <View style={styles.trendIconContainer}>
                    <Text style={{ fontSize: 16 }}>📈</Text>
                </View>
                <Text style={styles.title}>Vitals Trends (Last 7 Visits)</Text>
            </View>

            {/* 1. Blood Pressure Chart: Orange theme matching Ramesh Kumar mockup */}
            {renderChart(
                'Blood Pressure (Systolic)',
                trends.bpSystolic,
                [140, 105, 70, 35, 0],
                140,
                '#F97316', // Orange line
                '#F97316', // Orange border
                '#FFF',    // White inner fill
                10         // Larger, highly visible dots
            )}

            {/* 2. Heart Rate Chart: Dark Grey/Black theme matching mockup */}
            {renderChart(
                'Heart Rate (BPM)',
                trends.heartRate,
                [80, 60, 40, 20, 0],
                80,
                '#1F2937', // Dark charcoal/black line
                '#1F2937', // Dark charcoal border
                '#FFF',    // White inner fill
                8
            )}

            {/* 3. Blood Sugar Chart: Emerald/Cyan theme matching mockup */}
            {renderChart(
                'Blood Sugar (mg/dL)',
                trends.bloodSugar,
                [140, 105, 70, 35, 0],
                140,
                '#10B981', // Emerald green line
                '#10B981', // Emerald border
                '#FFF',    // White inner fill
                8
            )}
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
