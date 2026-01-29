import React, { useState, useEffect } from 'react';
import { portfolioService, type PortfolioTimeframe, type PortfolioHistoryPoint } from '../../api/portfolioService';
import styles from './Portfolio.module.css';

interface PortfolioChartProps {
    userAddress: string;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ userAddress }) => {
    const [timeframe, setTimeframe] = useState<PortfolioTimeframe>('1d');
    const [chartData, setChartData] = useState<PortfolioHistoryPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userAddress) return;

        setIsLoading(true);
        setError(null);

        portfolioService.getPortfolioHistory(userAddress, timeframe)
            .then(response => {
                setChartData(response.data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch portfolio history:', err);
                setError('Failed to load chart data');
                setIsLoading(false);
            });
    }, [userAddress, timeframe]);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        if (timeframe === '1d') {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const formatCurrency = (val: number) => {
        if (val >= 1000000) {
            return `$${(val / 1000000).toFixed(2)}M`;
        } else if (val >= 1000) {
            return `$${(val / 1000).toFixed(2)}K`;
        } else {
            return `$${val.toFixed(2)}`;
        }
    };

    // Calculate min/max for Y-axis
    const values = chartData.map(d => d.value);
    const minValue = Math.min(...values) * 0.95; // 5% padding below
    const maxValue = Math.max(...values) * 1.05; // 5% padding above
    const valueRange = maxValue - minValue;

    // SVG dimensions
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Generate path data
    const generatePath = () => {
        if (chartData.length === 0) return '';

        const points = chartData.map((point, index) => {
            const x = padding.left + (index / (chartData.length - 1 || 1)) * chartWidth;
            const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    };

    // Generate area path (for gradient fill)
    const generateAreaPath = () => {
        if (chartData.length === 0) return '';

        const points = chartData.map((point, index) => {
            const x = padding.left + (index / (chartData.length - 1 || 1)) * chartWidth;
            const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
            return `${x},${y}`;
        });

        const firstX = padding.left;
        const lastX = padding.left + chartWidth;
        const bottomY = padding.top + chartHeight;

        return `M ${firstX},${bottomY} L ${points.join(' L ')} L ${lastX},${bottomY} Z`;
    };

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '120px 24px', color: '#A77590' }}>
                Loading chart...
            </div>
        );
    }

    if (error || chartData.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '120px 24px', color: '#A77590' }}>
                <div style={{ fontSize: '14px' }}>
                    Start trading to see your portfolio performance
                </div>
            </div>
        );
    }

    const currentValue = chartData[chartData.length - 1]?.value || 0;
    const firstValue = chartData[0]?.value || 0;
    const change = currentValue - firstValue;
    const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;

    return (
        <div className={styles.chartContainer}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFE1F2' }}>
                        {formatCurrency(currentValue)}
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: change >= 0 ? '#00E396' : '#FF4560',
                        marginTop: '4px'
                    }}>
                        {change >= 0 ? '+' : ''}{formatCurrency(change)} ({change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                    </div>
                </div>

                {/* Timeframe Selector */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['1d', '7d', '30d', 'all'] as PortfolioTimeframe[]).map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            style={{
                                background: timeframe === tf ? '#663399' : 'transparent',
                                color: timeframe === tf ? '#FFF' : '#A77590',
                                border: '1px solid #3A2530',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                        >
                            {tf.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart SVG */}
            <svg width={width} height={height} style={{ overflow: 'visible' }}>
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                </defs>

                {/* Gradient Area */}
                <path
                    d={generateAreaPath()}
                    fill="url(#chartGradient)"
                />

                {/* Line */}
                <path
                    d={generatePath()}
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fill="none"
                />

                {/* Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                    const value = minValue + valueRange * ratio;
                    const y = padding.top + chartHeight - ratio * chartHeight;
                    return (
                        <g key={ratio}>
                            <line
                                x1={padding.left}
                                y1={y}
                                x2={padding.left + chartWidth}
                                y2={y}
                                stroke="#3A2530"
                                strokeWidth={1}
                                strokeDasharray="4 4"
                            />
                            <text
                                x={padding.left - 10}
                                y={y + 4}
                                textAnchor="end"
                                fill="#A77590"
                                fontSize={12}
                            >
                                {formatCurrency(value)}
                            </text>
                        </g>
                    );
                })}

                {/* X-axis labels */}
                {chartData.filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 6)) === 0).map((point, index) => {
                    const dataIndex = chartData.indexOf(point);
                    const x = padding.left + (dataIndex / (chartData.length - 1 || 1)) * chartWidth;
                    return (
                        <text
                            key={index}
                            x={x}
                            y={padding.top + chartHeight + 20}
                            textAnchor="middle"
                            fill="#A77590"
                            fontSize={12}
                        >
                            {formatTime(point.timestamp)}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};

export default PortfolioChart;
