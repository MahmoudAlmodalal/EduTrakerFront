import React from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const AttendanceTrendChart = ({ trendData }) => {
    return (
        <div className="sec-chart-body">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <AreaChart data={trendData}>
                    <defs>
                        <linearGradient id="secAttendanceTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--sec-primary)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--sec-primary)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--sec-border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--sec-text-muted)', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--sec-text-muted)', fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid var(--sec-border)',
                            background: 'var(--sec-surface)',
                            boxShadow: 'var(--sec-shadow)',
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="var(--sec-primary)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#secAttendanceTrend)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AttendanceTrendChart;
