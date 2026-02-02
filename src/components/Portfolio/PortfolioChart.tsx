import React, { useState, useEffect, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import styles from './Portfolio.module.css';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useWallet } from '../../hooks';

interface DataPoint {
    timestamp: string;
    displayTime: string;
    value: number;
}

const PortfolioChart: React.FC = () => {
    const [timeframe, setTimeframe] = useState('1D');
    const [chartData, setChartData] = useState<DataPoint[]>([]);
    const { summary, history, fetchHistory } = usePortfolioStore();
    const { authenticated, walletAddress } = useWallet();

    // Fetch history when timeframe or wallet changes
    useEffect(() => {
        if (authenticated && walletAddress) {
            fetchHistory(walletAddress, timeframe);
        }
    }, [authenticated, walletAddress, timeframe, fetchHistory]);

    // Use current account value or default to 0
    const currentValue = summary?.account_value ?? 0;

    // Generate Chart Data from Store History
    useEffect(() => {
        if (history && history.length > 0) {
            const data: DataPoint[] = history.map(point => {
                const time = new Date(point.timestamp);
                return {
                    timestamp: point.timestamp,
                    displayTime: timeframe === '1D'
                        ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : time.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                    value: point.value
                };
            });
            setChartData(data);
        } else if (currentValue > 0) {
            // Fallback: If no history but we have current value, show a flat line or single point
            // For now, let's just show an empty chart or single point to indicate "no history"
            const now = new Date();
            setChartData([{
                timestamp: now.toISOString(),
                displayTime: timeframe === '1D'
                    ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : now.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                value: currentValue
            }]);
        } else {
            setChartData([]);
        }
    }, [history, timeframe, currentValue]);

    const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '0',
            boxSizing: 'border-box',
            position: 'relative'
        }}>
            {/* Minimalist Timeframe Buttons */}
            <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                zIndex: 10,
                display: 'flex',
                gap: '8px'
            }}>
                {['1D', '7D', '1M', 'ALL'].map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        style={{
                            background: timeframe === tf ? 'rgba(102, 0, 53, 0.4)' : 'transparent',
                            color: timeframe === tf ? '#FFE1F2' : '#8B8B9B',
                            border: '1px solid',
                            borderColor: timeframe === tf ? '#660035' : '#3A2530',
                            borderRadius: '20px',
                            padding: '4px 14px',
                            fontSize: '15px',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'all 0.2s',
                            fontWeight: timeframe === tf ? 600 : 400
                        }}
                    >
                        {tf.toLowerCase()}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 60, right: 4, left: 4, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#660035" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#12000A" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="displayTime"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#8B8B9B', fontSize: 10 }}
                            minTickGap={60}
                            interval="preserveStart"
                        />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1A0010',
                                border: '1px solid #3A2530',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                color: '#FFE1F2'
                            }}
                            itemStyle={{ color: '#FFE1F2', fontSize: '13px', fontWeight: 600 }}
                            labelStyle={{ color: '#8B8B9B', fontSize: '11px', marginBottom: '2px' }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                            cursor={{ stroke: '#660035', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#660035"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            animationDuration={800}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PortfolioChart;
