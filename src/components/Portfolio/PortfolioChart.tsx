import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';
import type { IChartApi, Time } from 'lightweight-charts';

interface PortfolioChartProps {
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
        areaTopColor?: string;
        areaBottomColor?: string;
    };
    height?: number | string;
    timeframe?: '1D' | '7D' | '30D' | 'All';
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({
    colors = {
        backgroundColor: '#15050C',
        lineColor: '#5D5FEF', // Blurple
        textColor: '#A77590',
        areaTopColor: 'rgba(93, 95, 239, 0.4)',
        areaBottomColor: 'rgba(93, 95, 239, 0.0)',
    },
    height = '100%',
    timeframe = '30D'
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    // Generate dummy equity growth data based on timeframe
    const generateData = () => {
        const initialValue = 10000;
        const targetValue = 14350.25;
        const res = [];
        const date = new Date();

        let points = 90;

        // Setup start date based on timeframe
        switch (timeframe) {
            case '1D':
                // 1 Day: 24 hourly points? Or minute data?
                // Using timestamp logic for intraday
                points = 24;
                date.setHours(date.getHours() - 24);
                break;
            case '7D':
                points = 7;
                date.setDate(date.getDate() - 7);
                break;
            case '30D':
                points = 30;
                date.setDate(date.getDate() - 30);
                break;
            case 'All':
            default:
                points = 90;
                date.setDate(date.getDate() - 90);
                break;
        }

        let currentValue = initialValue;

        // Adjust start value to simulate realistic growth over different periods
        if (timeframe === '1D') currentValue = targetValue * 0.99;
        else if (timeframe === '7D') currentValue = targetValue * 0.96;
        else if (timeframe === '30D') currentValue = targetValue * 0.85;

        for (let i = 0; i < points; i++) {
            let time: Time;

            if (timeframe === '1D') {
                // Hourly increments
                date.setHours(date.getHours() + 1);
                // Lightweight charts needs proper unix timestamp for intraday
                time = (Math.floor(date.getTime() / 1000)) as Time;
            } else {
                // Daily increments
                date.setDate(date.getDate() + 1);
                time = date.toISOString().split('T')[0] as Time;
            }

            const remainingSteps = points - i;
            // Linear interpolation to target + noise
            const requiredGrowth = (targetValue - currentValue) / remainingSteps;

            // Less volatility for shorter timeframes
            const volatility = timeframe === '1D' ? 20 : (timeframe === '7D' ? 100 : 200);

            const randomChange = (Math.random() - 0.45) * volatility;
            currentValue += randomChange + requiredGrowth;

            res.push({
                time: time,
                value: currentValue,
            });
        }

        // Fix last point
        if (res.length > 0) {
            res[res.length - 1].value = targetValue;
        }

        return res;
    };

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Ensure container has dimensions before creating chart
        const container = chartContainerRef.current;
        if (container.clientWidth === 0 || container.clientHeight === 0) {
            // If dimensions are 0, we might need to wait for layout or resize
            // We can retry or just use a default
            // But let's log it
            console.warn("Chart container has 0 dimensions, chart might not render correctly immediately.");
        }

        console.log('Mounting Lightweight Chart');

        const chart = createChart(container, {
            layout: {
                background: { type: ColorType.Solid, color: colors.backgroundColor },
                textColor: colors.textColor,
                fontFamily: "'Satoshi', sans-serif",
                // @ts-ignore
                attributionLogo: false,
            },
            width: container.clientWidth || 600, // Fallback width
            height: container.clientHeight || 300, // Fallback height
            grid: {
                vertLines: { color: 'rgba(58, 37, 48, 0.2)' },
                horzLines: { color: 'rgba(58, 37, 48, 0.2)' },
            },
            rightPriceScale: {
                visible: false,
                scaleMargins: {
                    top: 0.80,
                    bottom: 0.06,
                },
                borderVisible: false,
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
            handleScroll: {
                mouseWheel: false,
                pressedMouseMove: false,
                horzTouchDrag: false,
                vertTouchDrag: false,
            },
            handleScale: {
                axisPressedMouseMove: false,
                mouseWheel: false,
                pinch: false,
            },
            // Explicitly disable any watermark
            watermark: {
                visible: false,
            },
            // Disable attribution logo (available in some builds)
            trackingMode: { exitMode: 0 },
            attributionLogo: false,
        });

        const newSeries = chart.addSeries(AreaSeries, {
            lineColor: colors.lineColor,
            topColor: colors.areaTopColor,
            bottomColor: colors.areaBottomColor,
            lineWidth: 2,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
            // The "Blue Highlight" is the Last Value Label on the price scale check
            lastValueVisible: true,
            priceLineVisible: true,
        });

        const data = generateData();
        newSeries.setData(data);

        chart.timeScale().fitContent();

        chartRef.current = chart;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [colors, timeframe]);

    return (
        <div
            ref={chartContainerRef}
            style={{
                width: '100%',
                height: height,
                position: 'relative' // Needed for chart absolute positioning if any
            }}
        />
    );
};

export default PortfolioChart;
