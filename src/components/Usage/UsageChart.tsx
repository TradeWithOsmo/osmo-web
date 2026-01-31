import React, { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface DataPoint {
    timestamp: string;
    displayTime: string;
    value: number;
}

const UsageChart: React.FC = () => {
    const [timeframe, setTimeframe] = useState('1D');
    const [chartData, setChartData] = useState<DataPoint[]>([]);

    useEffect(() => {
        const data: DataPoint[] = [];
        const now = new Date();
        let points = 20;
        let interval = 60 * 60 * 1000;

        if (timeframe === '7D') { points = 28; interval = 6 * 60 * 60 * 1000; }
        else if (timeframe === '1M') { points = 30; interval = 24 * 60 * 60 * 1000; }
        else if (timeframe === 'ALL') { points = 50; interval = 48 * 60 * 60 * 1000; }

        let lastVal = 50 + Math.random() * 20;
        for (let i = points; i >= 0; i--) {
            const time = new Date(now.getTime() - i * interval);
            lastVal += (Math.random() - 0.45) * 10;
            if (lastVal < 0) lastVal = 0;
            data.push({
                timestamp: time.toISOString(),
                displayTime: timeframe === '1D'
                    ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : time.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                value: parseFloat(lastVal.toFixed(2))
            });
        }
        setChartData(data);
    }, [timeframe]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '0px 0',
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
                            <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
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
                            cursor={{ stroke: '#660035', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#660035"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorUsage)"
                            animationDuration={800}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default UsageChart;
