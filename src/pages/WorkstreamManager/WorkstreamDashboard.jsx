import React from 'react';
import { School, Users, GraduationCap, TrendingUp, TrendingDown } from 'lucide-react';
import './Workstream.css';

const WorkstreamDashboard = () => {
    // Mock Data
    // Get data from localStorage
    const getSchools = () => {
        const saved = localStorage.getItem('schools');
        return saved ? JSON.parse(saved) : [
            { id: 1, name: 'Springfield Elementary', students: 450, capacity: 500 },
            { id: 2, name: 'Shelbyville High', students: 1100, capacity: 1200 },
            { id: 3, name: 'Ogdenville Tech', students: 150, capacity: 300 }
        ];
    };

    const schools = getSchools();
    const totalSchools = schools.length;
    const totalStudents = schools.reduce((acc, curr) => acc + (parseInt(curr.students) || 0), 0);
    const totalCapacity = schools.reduce((acc, curr) => acc + (parseInt(curr.capacity) || 0), 0);

    const stats = [
        { title: 'Total Schools', value: totalSchools, icon: School, trend: '+2 this month', trendUp: true },
        { title: 'Total Students', value: totalStudents.toLocaleString(), icon: GraduationCap, trend: '+150 this month', trendUp: true },
        { title: 'Capacity Utilization', value: `${Math.round((totalStudents / totalCapacity) * 100)}%`, icon: Users, trend: '-3% this month', trendUp: false },
    ];

    const schoolPerformance = schools.map(school => ({
        name: school.name,
        score: Math.floor(Math.random() * (98 - 75) + 75) // Mock score derived from "data"
    }));

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
                    <div className="css-chart-container" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                        {schoolPerformance.map((school, index) => (
                            <div key={index} className="css-bar-group" style={{ minWidth: '60px' }}>
                                <div
                                    className="css-bar"
                                    style={{ height: `${school.score * 1.5}px`, backgroundColor: 'var(--color-primary)' }}
                                    title={`${school.name}: ${school.score}%`}
                                >
                                     <span style={{ 
                                        position: 'absolute', 
                                        top: '-20px', 
                                        left: '50%', 
                                        transform: 'translateX(-50%)', 
                                        fontSize: '10px', 
                                        fontWeight: 'bold', 
                                        color: '#333' 
                                    }}>
                                        {school.score}%
                                    </span>
                                </div>
                                <span className="legend-item" style={{ fontSize: '10px', textAlign: 'center', marginTop: '5px', wordWrap: 'break-word', width: '100%' }}>
                                    {school.name.length > 10 ? school.name.substring(0, 8) + '...' : school.name}
                                </span>
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
