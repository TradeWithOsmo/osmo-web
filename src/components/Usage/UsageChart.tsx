import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';



import { useUsageStore } from '../../store/useUsageStore';

const UsageChart: React.FC = () => {
    const { chartData, chartTimeframe, setChartTimeframe } = useUsageStore();

    // Format data for chart
    const formattedData = useMemo(() => {
        let data = [...chartData].map(d => ({
            ...d,
            displayTime: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            value: d.cost // Plotting cost primarily
        }));

        // Fallback: If no data exists, show a flat line at 0 for the last 24h
        if (data.length === 0) {
            const now = new Date();
            const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            data = [
                {
                    date: past.toISOString(),
                    displayTime: past.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                    value: 0,
                    cost: 0,
                    tokens: 0,
                    requests: 0
                },
                {
                    date: now.toISOString(),
                    displayTime: now.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                    value: 0,
                    cost: 0,
                    tokens: 0,
                    requests: 0
                }
            ];
        } else if (data.length === 1) {
            // If only one point exists, add a baseline point to prevent vertical line
            const firstDate = new Date(data[0].date);
            const prevDate = new Date(firstDate);
            prevDate.setDate(firstDate.getDate() - 1);

            data.unshift({
                date: prevDate.toISOString().split('T')[0],
                displayTime: prevDate.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                value: 0, // Baseline cost 0
                cost: 0,
                tokens: 0,
                requests: 0
            });
        }
        return data;
    }, [chartData]);

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
            {/* Minimalist Dynamic Timeframe Buttons */}
            <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                {(() => {
                    const buttons = [];
                    const timeSpanDays = chartData.length; // Each point is usually 1 day in Usage snapshots

                    // Always show 1D
                    buttons.push('1D');
                    // Show 7D if we have at least 2 days of records
                    if (timeSpanDays >= 2) buttons.push('7D');
                    // Show 1M if we have at least 8 days of records
                    if (timeSpanDays >= 8) buttons.push('1M');
                    // Always show All if more than 1 point
                    if (chartData.length > 1) buttons.push('ALL');

                    return buttons.map((tf, idx) => (
                        <React.Fragment key={tf}>
                            {idx > 0 && <span style={{ color: '#3A2530', fontSize: '12px' }}>·</span>}
                            <button
                                onClick={() => setChartTimeframe(tf)}
                                style={{
                                    background: 'transparent',
                                    color: chartTimeframe === tf ? '#FFE1F2' : '#8B8B9B',
                                    border: 'none',
                                    padding: '4px 8px',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    fontWeight: chartTimeframe === tf ? 700 : 400,
                                    textTransform: tf === 'ALL' ? 'capitalize' : 'uppercase'
                                }}
                            >
                                {tf === 'ALL' ? 'All' : tf}
                            </button>
                        </React.Fragment>
                    ));
                })()}
            </div>

            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedData} margin={{ top: 60, right: 4, left: 4, bottom: 5 }}>
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
                        <YAxis hide domain={[0, (max: number) => Math.max(max, 0.1) * 1.2]} />
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
                            formatter={(value: any) => {
                                const n = Number(value);
                                if (!Number.isFinite(n)) return [String(value), 'Cost'];
                                return [
                                    `$${n.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`,
                                    'Cost'
                                ];
                            }}
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
