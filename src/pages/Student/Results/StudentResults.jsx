import React, { useState } from 'react';
import {
    Award,
    TrendingUp,
    TrendingDown,
    BarChart2,
    ChevronDown,
    Star,
    Target,
    Medal,
    Minus
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import '../Student.css';

const StudentResults = () => {
    const { t } = useTheme();
    const [expandedSubject, setExpandedSubject] = useState(null);

    // Mock Result Data
    const overallStats = {
        gpa: 3.8,
        rank: 'Top 10%',
        totalCredits: 42,
        successRate: 92
    };

    const results = [
        {
            subject: 'Mathematics',
            color: '#0891b2',
            assessments: [
                { title: 'Quiz 1', date: '2024-10-15', grade: 92, total: 100, average: 85 },
                { title: 'Midterm', date: '2024-11-20', grade: 88, total: 100, average: 75 },
                { title: 'Homework 3', date: '2024-12-05', grade: 95, total: 100, average: 88 },
            ],
            finalGrade: 91,
            letterGrade: 'A-',
            trend: 'up'
        },
        {
            subject: 'Physics',
            color: '#8b5cf6',
            assessments: [
                { title: 'Lab Report 1', date: '2024-10-18', grade: 78, total: 100, average: 80 },
                { title: 'Lab Report 2', date: '2024-11-25', grade: 85, total: 100, average: 82 },
            ],
            finalGrade: 81,
            letterGrade: 'B+',
            trend: 'stable'
        },
        {
            subject: 'English',
            color: '#10b981',
            assessments: [
                { title: 'Essay 1', date: '2024-10-22', grade: 88, total: 100, average: 85 },
                { title: 'Poetry Analysis', date: '2024-11-30', grade: 90, total: 100, average: 86 },
            ],
            finalGrade: 89,
            letterGrade: 'A-',
            trend: 'up'
        },
        {
            subject: 'Computer Science',
            color: '#f59e0b',
            assessments: [
                { title: 'Algorithm Test', date: '2024-11-10', grade: 95, total: 100, average: 70 },
                { title: 'Project Phase 1', date: '2024-12-01', grade: 98, total: 100, average: 85 },
            ],
            finalGrade: 96,
            letterGrade: 'A+',
            trend: 'up'
        },
    ];

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

    const getGradeColor = (grade) => {
        if (grade >= 90) return '#10b981';
        if (grade >= 80) return '#0891b2';
        if (grade >= 70) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="student-results">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">{t('student.results.title') || 'Academic Results'}</h1>
                    <p className="page-subtitle">{t('student.results.subtitle') || 'Track your grades and performance across all subjects'}</p>
                </div>
            </header>

            {/* Stats Overview */}
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
                                fill="none"
                                stroke="#e0f2fe"
                                strokeWidth="3"
                            />
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                                strokeLinecap="round"
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
                        <span className="result-stat-label">{t('student.results.classRanking') || 'Class Ranking'}</span>
                    </div>
                </div>

                <div className="result-stat-card">
                    <div className="result-stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
                        <Star size={28} />
                    </div>
                    <div className="result-stat-content">
                        <span className="result-stat-value">{overallStats.totalCredits}</span>
                        <span className="result-stat-label">Credits Earned</span>
                    </div>
                </div>

                <div className="result-stat-card">
                    <div className="result-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                        <Target size={28} />
                    </div>
                    <div className="result-stat-content">
                        <span className="result-stat-value">{overallStats.successRate}%</span>
                        <span className="result-stat-label">{t('student.results.overallSuccessRate') || 'Success Rate'}</span>
                    </div>
                </div>
            </div>

            {/* Subject Results */}
            <div className="results-list">
                {results.map((result, index) => (
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
                                        {result.assessments.length} assessments completed
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
                                        fill="none"
                                        stroke="#e0f2fe"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke={result.color}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray={`${result.finalGrade}, 100`}
                                    />
                                </svg>
                            </div>

                            <button className="expand-btn">
                                <ChevronDown size={20} />
                            </button>
                        </div>

                        {/* Expanded Details */}
                        <div className="result-card-details">
                            <table className="assessments-table">
                                <thead>
                                    <tr>
                                        <th>{t('student.results.assessment') || 'Assessment'}</th>
                                        <th>{t('student.results.date') || 'Date'}</th>
                                        <th>{t('student.results.score') || 'Score'}</th>
                                        <th>{t('student.results.average') || 'Class Avg'}</th>
                                        <th>{t('student.results.status') || 'Status'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.assessments.map((assessment, aIndex) => (
                                        <tr key={aIndex}>
                                            <td className="assessment-title">{assessment.title}</td>
                                            <td className="assessment-date">{assessment.date}</td>
                                            <td>
                                                <span
                                                    className="assessment-score"
                                                    style={{ color: getGradeColor(assessment.grade) }}
                                                >
                                                    {assessment.grade}/{assessment.total}
                                                </span>
                                            </td>
                                            <td className="assessment-average">{assessment.average}</td>
                                            <td>
                                                <span className={`status-badge ${assessment.grade >= assessment.average ? 'above' : 'below'}`}>
                                                    {assessment.grade >= assessment.average ? (
                                                        <>{t('student.results.aboveAvg') || 'Above Avg'}</>
                                                    ) : (
                                                        <>{t('student.results.belowAvg') || 'Below Avg'}</>
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .results-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.25rem;
                    margin-bottom: 2rem;
                }
                
                @media (max-width: 1200px) {
                    .results-stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                
                @media (max-width: 640px) {
                    .results-stats-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                .result-stat-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.06);
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                
                .result-stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 30px rgba(8, 145, 178, 0.1);
                }
                
                .gpa-card {
                    grid-column: span 1;
                }
                
                .result-stat-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    flex-shrink: 0;
                }
                
                .result-stat-content {
                    flex: 1;
                }
                
                .result-stat-value {
                    display: block;
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--color-text-main, #0f172a);
                    line-height: 1.2;
                }
                
                .result-stat-label {
                    font-size: 0.8125rem;
                    color: var(--color-text-muted, #64748b);
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    font-weight: 500;
                }
                
                .gpa-ring {
                    width: 48px;
                    height: 48px;
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    opacity: 0.3;
                }
                
                .results-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .result-card {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.06);
                    overflow: hidden;
                    border-left: 4px solid var(--subject-color);
                    transition: all 0.3s ease;
                }
                
                .result-card:hover {
                    box-shadow: 0 8px 30px rgba(8, 145, 178, 0.1);
                }
                
                .result-card-header {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    padding: 1.25rem 1.5rem;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }
                
                .result-card-header:hover {
                    background: #f8fafc;
                }
                
                .result-subject-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex: 1;
                }
                
                .result-subject-indicator {
                    width: 4px;
                    height: 40px;
                    border-radius: 2px;
                }
                
                .result-subject-name {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: var(--color-text-main, #0f172a);
                    margin: 0 0 0.25rem;
                }
                
                .result-assessments-count {
                    font-size: 0.8125rem;
                    color: var(--color-text-muted, #64748b);
                }
                
                .result-grade-section {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }
                
                .result-letter-grade {
                    font-size: 1.75rem;
                    font-weight: 700;
                }
                
                .result-percentage {
                    text-align: right;
                }
                
                .grade-value {
                    display: block;
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--color-text-main, #0f172a);
                }
                
                .trend-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.6875rem;
                    font-weight: 600;
                    padding: 0.125rem 0.5rem;
                    border-radius: 20px;
                    margin-top: 0.25rem;
                }
                
                .trend-up {
                    background: #dcfce7;
                    color: #16a34a;
                }
                
                .trend-down {
                    background: #fef2f2;
                    color: #dc2626;
                }
                
                .trend-stable {
                    background: #f1f5f9;
                    color: #64748b;
                }
                
                .result-progress-ring {
                    width: 48px;
                    height: 48px;
                }
                
                .result-progress-ring svg {
                    transform: rotate(-90deg);
                }
                
                .expand-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    border: none;
                    border-radius: 8px;
                    color: var(--color-text-muted, #64748b);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .expand-btn:hover {
                    background: var(--student-primary, #0891b2);
                    color: white;
                }
                
                .result-card.expanded .expand-btn {
                    transform: rotate(180deg);
                }
                
                .result-card-details {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                }
                
                .result-card.expanded .result-card-details {
                    max-height: 500px;
                }
                
                .assessments-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .assessments-table th,
                .assessments-table td {
                    padding: 0.875rem 1.5rem;
                    text-align: left;
                }
                
                .assessments-table th {
                    background: #f8fafc;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--color-text-muted, #64748b);
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    border-top: 1px solid rgba(8, 145, 178, 0.08);
                }
                
                .assessments-table td {
                    border-top: 1px solid rgba(8, 145, 178, 0.05);
                }
                
                .assessment-title {
                    font-weight: 500;
                    color: var(--color-text-main, #1e293b);
                }
                
                .assessment-date {
                    color: var(--color-text-muted, #64748b);
                    font-size: 0.875rem;
                }
                
                .assessment-score {
                    font-weight: 700;
                    font-size: 0.9375rem;
                }
                
                .assessment-average {
                    color: var(--color-text-muted, #64748b);
                }
                
                .status-badge {
                    display: inline-flex;
                    padding: 0.25rem 0.625rem;
                    border-radius: 20px;
                    font-size: 0.6875rem;
                    font-weight: 600;
                }
                
                .status-badge.above {
                    background: #dcfce7;
                    color: #16a34a;
                }
                
                .status-badge.below {
                    background: #fef3c7;
                    color: #d97706;
                }
                
                [data-theme="dark"] .result-stat-card,
                [data-theme="dark"] .result-card {
                    background: #1e293b;
                }
                
                [data-theme="dark"] .result-stat-value,
                [data-theme="dark"] .result-subject-name,
                [data-theme="dark"] .grade-value,
                [data-theme="dark"] .assessment-title {
                    color: #f1f5f9;
                }
                
                [data-theme="dark"] .assessments-table th {
                    background: rgba(30, 41, 59, 0.5);
                }
                
                [data-theme="dark"] .result-card-header:hover {
                    background: rgba(30, 41, 59, 0.8);
                }
            `}</style>
        </div>
    );
};

export default StudentResults;
