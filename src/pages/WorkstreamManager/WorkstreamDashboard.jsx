import React from 'react';
import { School, Users, GraduationCap, TrendingUp, TrendingDown } from 'lucide-react';
import './Workstream.css';

const WorkstreamDashboard = () => {
    // Mock Data
    const stats = [
        { title: 'Total Schools', value: '12', icon: School, trend: '+2 this month', trendUp: true },
        { title: 'Total Students', value: '3,450', icon: GraduationCap, trend: '+150 this month', trendUp: true },
        { title: 'Total Teachers', value: '245', icon: Users, trend: '-3 this month', trendUp: false },
    ];

    const schoolPerformance = [
        { name: 'School A', score: 85 },
        { name: 'School B', score: 92 },
        { name: 'School C', score: 78 },
        { name: 'School D', score: 88 },
        { name: 'School E', score: 65 },
        { name: 'School F', score: 95 },
    ];

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <h1 className="workstream-title">Workstream Overview</h1>
                <p className="workstream-subtitle">Welcome back, Manager. Here's what's happening in your cluster.</p>
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
                {/* Academic Performance Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Academic Performance by School</h3>
                    </div>
                    <div className="css-chart-container">
                        {schoolPerformance.map((school, index) => (
                            <div key={index} className="css-bar-group">
                                <div
                                    className="css-bar"
                                    style={{ height: `${school.score * 1.5}px` }}
                                    data-value={`${school.score}%`}
                                ></div>
                                <span className="legend-item" style={{ fontSize: '10px' }}>{school.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Enrollment Trends (Mocked Dual Bar) */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Enrollment vs. Graduation</h3>
                    </div>
                    <div className="css-chart-container">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div key={item} className="css-bar-group">
                                <div
                                    className="css-bar"
                                    style={{ height: `${Math.random() * 80 + 40}px`, width: '20px' }}
                                ></div>
                                <div
                                    className="css-bar secondary"
                                    style={{ height: `${Math.random() * 60 + 20}px`, width: '20px' }}
                                ></div>
                                <span className="legend-item" style={{ fontSize: '10px' }}>Month {item}</span>
                            </div>
                        ))}
                    </div>
                    <div className="chart-legend">
                        <div className="legend-item">
                            <div className="legend-color" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                            <span>New Enrollments</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color" style={{ backgroundColor: 'var(--color-info)' }}></div>
                            <span>Graduates</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkstreamDashboard;
