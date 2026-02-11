import React, { useState, useMemo } from 'react';
import {
    Award,
    TrendingUp,
    TrendingDown,
    BarChart2,
    ChevronDown,
    Star,
    Target,
    Medal,
    Minus,
    RefreshCw,
    AlertCircle,
    BookOpen
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useStudentData } from '../../../context/StudentDataContext';
import '../Student.css';

const StudentResults = () => {
    const { t } = useTheme();
    const {
        dashboardData,
        loading,
        error,
        refreshData
    } = useStudentData();
    const [expandedSubject, setExpandedSubject] = useState(null);

    const resultsData = useMemo(() => {
        const grades = dashboardData?.grades || {};
        return {
            overallAverage: grades.overall_average || 0,
            totalAssignments: grades.total_assignments || 0,
            gradedAssignments: grades.graded_assignments || 0,
            marks: Array.isArray(grades.marks) ? grades.marks : [],
            byType: grades.by_type || {}
        };
    }, [dashboardData]);

    const groupedResults = useMemo(() => {
        if (!resultsData.marks.length) return [];

        const groups = {};
        const colors = ['#0891b2', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

        resultsData.marks.forEach(m => {
            const courseName = m.course_name || 'General';
            if (!groups[courseName]) {
                groups[courseName] = {
                    subject: courseName,
                    color: colors[Object.keys(groups).length % colors.length],
                    assessments: [],
                    totalScore: 0,
                    totalFullMark: 0
                };
            }
            groups[courseName].assessments.push({
                title: m.title || 'Assignment',
                date: m.due_date ? new Date(m.due_date).toLocaleDateString() : 'N/A',
                grade: m.score || 0,
                total: m.full_mark || 0,
                percentage: m.percentage || 0,
                type: m.exam_type || 'Task'
            });
            groups[courseName].totalScore += (Number(m.score) || 0);
            groups[courseName].totalFullMark += (Number(m.full_mark) || 0);
        });

        return Object.values(groups).map(group => {
            const finalGrade = group.totalFullMark > 0
                ? Math.round((group.totalScore / group.totalFullMark) * 100)
                : 0;

            return {
                ...group,
                finalGrade,
                letterGrade: finalGrade >= 90 ? 'A' : finalGrade >= 80 ? 'B' : finalGrade >= 70 ? 'C' : finalGrade >= 60 ? 'D' : 'F',
                trend: 'stable' // Can be logic-based if we have historical data
            };
        });
    }, [resultsData.marks]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <RefreshCw className="animate-spin" size={40} />
                <p>Loading your academic performance...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <AlertCircle size={48} color="#ef4444" />
                <p>{error}</p>
                <button onClick={refreshData} className="retry-btn">
                    <RefreshCw size={18} />
                    Try Again
                </button>
            </div>
        );
    }

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up': return <TrendingUp size={16} />;
            case 'down': return <TrendingDown size={16} />;
            default: return <Minus size={16} />;
        }
    };

    const getTrendClass = (trend) => {
        switch (trend) {
            case 'up': return 'trend-up';
            case 'down': return 'trend-down';
            default: return 'trend-stable';
        }
    };

    const getGradeColor = (percentage) => {
        if (percentage >= 90) return '#10b981';
        if (percentage >= 80) return '#0891b2';
        if (percentage >= 70) return '#f59e0b';
        return '#ef4444';
    };

    const overallStats = {
        gpa: (resultsData.overallAverage / 25).toFixed(2),
        rank: 'N/A',
        totalAssessments: resultsData.gradedAssignments,
        successRate: resultsData.overallAverage
    };

    return (
        <div className="student-results">
            <header className="page-header">
                <div>
                    <h1 className="page-title">{t('student.results.title') || 'Academic Results'}</h1>
                    <p className="page-subtitle">{t('student.results.subtitle') || 'Track your grades and performance across all subjects'}</p>
                </div>
            </header>

            <div className="results-stats-grid">
                <div className="result-stat-card gpa-card">
                    <div className="result-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                        <Award size={28} />
                    </div>
                    <div className="result-stat-content">
                        <span className="result-stat-value">{overallStats.gpa}</span>
                        <span className="result-stat-label">{t('student.results.currentGPA') || 'Current GPA'}</span>
                    </div>
                    <div className="gpa-ring">
                        <svg viewBox="0 0 36 36">
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="#e0f2fe" strokeWidth="3"
                            />
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"
                                strokeDasharray={`${(overallStats.gpa / 4) * 100}, 100`}
                            />
                        </svg>
                    </div>
                </div>

                <div className="result-stat-card">
                    <div className="result-stat-icon" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>
                        <Medal size={28} />
                    </div>
                    <div className="result-stat-content">
                        <span className="result-stat-value">{overallStats.rank}</span>
                        <span className="result-stat-label">{t('student.results.classRanking') || 'Class Rank'}</span>
                    </div>
                </div>

                <div className="result-stat-card">
                    <div className="result-stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
                        <BarChart2 size={28} />
                    </div>
                    <div className="result-stat-content">
                        <span className="result-stat-value">{overallStats.totalAssessments}</span>
                        <span className="result-stat-label">Graded Tasks</span>
                    </div>
                </div>

                <div className="result-stat-card">
                    <div className="result-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                        <Target size={28} />
                    </div>
                    <div className="result-stat-content">
                        <span className="result-stat-value">{overallStats.successRate}%</span>
                        <span className="result-stat-label">Average Score</span>
                    </div>
                </div>
            </div>

            <div className="results-list">
                {groupedResults.length > 0 ? (
                    groupedResults.map((result, index) => (
                        <div
                            key={index}
                            className={`result-card ${expandedSubject === index ? 'expanded' : ''}`}
                            style={{ '--subject-color': result.color }}
                        >
                            <div
                                className="result-card-header"
                                onClick={() => setExpandedSubject(expandedSubject === index ? null : index)}
                            >
                                <div className="result-subject-info">
                                    <div className="result-subject-indicator" style={{ background: result.color }}></div>
                                    <div>
                                        <h3 className="result-subject-name">{result.subject}</h3>
                                        <div className="result-assessments-count">
                                            {result.assessments.length} assessment{result.assessments.length !== 1 ? 's' : ''} completed
                                        </div>
                                    </div>
                                </div>

                                <div className="result-grade-section">
                                    <div className="result-letter-grade" style={{ color: result.color }}>
                                        {result.letterGrade}
                                    </div>
                                    <div className="result-percentage">
                                        <span className="grade-value">{result.finalGrade}%</span>
                                        <span className={`trend-badge ${getTrendClass(result.trend)}`}>
                                            {getTrendIcon(result.trend)}
                                            <span>{result.trend === 'up' ? 'Improving' : result.trend === 'down' ? 'Declining' : 'Stable'}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="result-progress-ring">
                                    <svg viewBox="0 0 36 36">
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none" stroke="#e0f2fe" strokeWidth="3"
                                        />
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none" stroke={result.color} strokeWidth="3" strokeLinecap="round"
                                            strokeDasharray={`${result.finalGrade}, 100`}
                                        />
                                    </svg>
                                </div>

                                <button className="expand-btn">
                                    <ChevronDown size={20} />
                                </button>
                            </div>

                            <div className="result-card-details">
                                <table className="assessments-table">
                                    <thead>
                                        <tr>
                                            <th>{t('student.results.assessment') || 'Title'}</th>
                                            <th>Type</th>
                                            <th>{t('student.results.date') || 'Date'}</th>
                                            <th>{t('student.results.score') || 'Score'}</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.assessments.map((assessment, aIndex) => (
                                            <tr key={aIndex}>
                                                <td className="assessment-title">{assessment.title}</td>
                                                <td><span className="type-badge">{assessment.type}</span></td>
                                                <td className="assessment-date">{assessment.date}</td>
                                                <td>
                                                    <span className="assessment-score">
                                                        {assessment.grade}/{assessment.total}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="percentage-display">
                                                        <div className="percentage-bar-bg">
                                                            <div
                                                                className="percentage-bar-fill"
                                                                style={{
                                                                    width: `${assessment.percentage}%`,
                                                                    backgroundColor: getGradeColor(assessment.percentage)
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="percentage-text">{assessment.percentage}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-results">
                        <BookOpen size={48} />
                        <p>No graded assignments found yet.</p>
                    </div>
                )}
            </div>
</div>
    );
};

export default StudentResults;
