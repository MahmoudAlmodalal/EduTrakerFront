import React from 'react';
import {
    Users,
    GraduationCap,
    BookOpen,
    TrendingUp,
    TrendingDown,
    Calendar,
    Activity
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import './SchoolManager.css';

const SchoolDashboard = () => {
    // Mock Data for Stats
    const stats = [
        { title: 'Total Students', value: '1,250', icon: GraduationCap, trend: '+12 this month', trendUp: true, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Total Teachers', value: '85', icon: Users, trend: '+2 this month', trendUp: true, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Active Classes', value: '42', icon: BookOpen, trend: 'Stable', trendUp: true, color: 'text-purple-600', bg: 'bg-purple-100' },
        { title: 'Attendance Rate', value: '94%', icon: Calendar, trend: '-1.5% this week', trendUp: false, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    // Mock Data for Average Grades by Class
    const gradeData = [
        { name: '1-A', average: 82 },
        { name: '1-B', average: 78 },
        { name: '2-A', average: 85 },
        { name: '2-B', average: 88 },
        { name: '3-A', average: 76 },
        { name: '3-B', average: 90 },
        { name: '4-A', average: 84 },
    ];

    // Mock Data for Success Rates
    const successRateData = [
        { name: 'Passed', value: 850 },
        { name: 'Failed', value: 120 },
        { name: 'With Distinction', value: 280 },
    ];

    const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

    return (
        <div className="school-dashboard-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">School Overview</h1>
                <p className="school-manager-subtitle">Welcome back, Principal. Here's your school's performance at a glance.</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">{stat.title}</span>
                            <div className="stat-icon">
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-trend">
                            {stat.trendUp ? <TrendingUp size={16} className="trend-up" /> : <TrendingDown size={16} className="trend-down" />}
                            <span className={stat.trendUp ? 'trend-up' : 'trend-down'}>{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                {/* Average Grades by Class */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Average Grades by Class</h3>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart
                                data={gradeData}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f1f5f9' }}
                                />
                                <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Overall Success Rates */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Overall Success Rates</h3>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={successRateData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {successRateData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolDashboard;
