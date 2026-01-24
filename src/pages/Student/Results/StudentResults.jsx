import React, { useState, useEffect } from 'react';
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
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { useTheme } from '../../../context/ThemeContext';
import '../Student.css';

const StudentResults = () => {
    const { t } = useTheme();
    const [expandedSubject, setExpandedSubject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [overallStats, setOverallStats] = useState({
        gpa: 0.0,
        rank: 'N/A',
        totalCredits: 0,
        successRate: 0
    });
    const [results, setResults] = useState([]);

    const safeJSONParse = (key, fallback) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            console.error(`Error parsing ${key}:`, e);
            return fallback;
        }
    };

    useEffect(() => {
        try {
            // 1. Identify User
            const students = safeJSONParse('sec_students', []);
            const user = students.length > 0 ? students[0] : {
                id: 999,
                firstName: 'Student',
                lastName: 'Demo',
                assignedClass: 'Grade 10-A'
            };

            // 2. Fetch Data
            const allAssessments = safeJSONParse('teacher_assessments', []);
            const allGrades = safeJSONParse('teacher_grades', []);

            // Filter assessments relevant to student's class if possible, or just all for now if no class link
            // Using a simple filter if 'gradeLevel' matches 'assignedClass' roughly
            const myClassAssessments = allAssessments.filter(a =>
                !a.gradeLevel || a.gradeLevel === user.assignedClass || a.gradeLevel === 'All'
            );

            // Group by Subject
            const subjectMap = {};

            myClassAssessments.forEach(assess => {
                const subject = assess.subject || 'General';
                if (!subjectMap[subject]) {
                    subjectMap[subject] = {
                        assessments: [],
                        totalScore: 0,
                        totalMax: 0
                    };
                }

                // Get student's grade
                const myGradeRecord = allGrades.find(g =>
                    g.assessmentId === assess.id &&
                    (g.studentId === user.id || g.name === `${user.firstName} ${user.lastName}`)
                );
                const myScore = myGradeRecord ? parseFloat(myGradeRecord.grade) : 0;
                const maxScore = 100; // Default max score

                // Calculate Class Average for this assessment
                const assessmentGrades = allGrades.filter(g => g.assessmentId === assess.id);
                const avgScore = assessmentGrades.length > 0
                    ? Math.round(assessmentGrades.reduce((acc, curr) => acc + parseFloat(curr.grade), 0) / assessmentGrades.length)
                    : 0;

                subjectMap[subject].assessments.push({
                    title: assess.title,
                    date: assess.date,
                    grade: myScore,
                    total: maxScore,
                    average: avgScore,
                    status: myScore >= avgScore ? 'above' : 'below' // Helper status
                });

                if (myGradeRecord) { // Only count meaningful scores
                    subjectMap[subject].totalScore += myScore;
                    subjectMap[subject].totalMax += maxScore;
                }
            });

            // Process Subject Results
            const processedResults = Object.keys(subjectMap).map((subject, index) => {
                const data = subjectMap[subject];
                const count = data.assessments.filter(a => a.grade > 0).length; // Count graded ones
                // Final Grade calculation
                const finalGrade = data.totalMax > 0 ? Math.round((data.totalScore / data.totalMax) * 100) : 0;

                // Determine Letter Grade
                let letter = 'F';
                if (finalGrade >= 97) letter = 'A+';
                else if (finalGrade >= 93) letter = 'A';
                else if (finalGrade >= 90) letter = 'A-';
                else if (finalGrade >= 87) letter = 'B+';
                else if (finalGrade >= 83) letter = 'B';
                else if (finalGrade >= 80) letter = 'B-';
                else if (finalGrade >= 77) letter = 'C+';
                else if (finalGrade >= 70) letter = 'C';
                else if (finalGrade >= 60) letter = 'D';

                // Trend (Mock for now, or compare last 2 assessments)
                let trend = 'stable';
                if (data.assessments.length >= 2) {
                    const sorted = [...data.assessments].sort((a, b) => new Date(a.date) - new Date(b.date));
                    const last = sorted[sorted.length - 1].grade;
                    const prev = sorted[sorted.length - 2].grade;
                    if (last > prev) trend = 'up';
                    else if (last < prev) trend = 'down';
                }

                return {
                    subject,
                    color: ['#0891b2', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][index % 5],
                    assessments: data.assessments,
                    finalGrade,
                    letterGrade: letter,
                    trend
                };
            });

            setResults(processedResults);

            // Calculate Overall Stats
            if (processedResults.length > 0) {
                const totalAvg = processedResults.reduce((acc, curr) => acc + curr.finalGrade, 0) / processedResults.length;
                // GPA (4.0 Scale) approx
                let gpa = 0.0;
                if (totalAvg >= 93) gpa = 4.0;
                else if (totalAvg >= 90) gpa = 3.7;
                else if (totalAvg >= 87) gpa = 3.3;
                else if (totalAvg >= 83) gpa = 3.0;
                else if (totalAvg >= 80) gpa = 2.7;
                else if (totalAvg >= 77) gpa = 2.3;
                else if (totalAvg >= 73) gpa = 2.0;
                else if (totalAvg >= 70) gpa = 1.7;
                else if (totalAvg >= 60) gpa = 1.0;

                // Rank
                let rank = 'Top 50%';
                if (totalAvg >= 95) rank = 'Top 5%';
                else if (totalAvg >= 90) rank = 'Top 10%';
                else if (totalAvg >= 80) rank = 'Top 25%';

                setOverallStats({
                    gpa: gpa.toFixed(1),
                    rank: rank,
                    totalCredits: processedResults.length * 3, // Mock credits per subject
                    successRate: Math.round(totalAvg)
                });
            } else {
                setOverallStats({ gpa: 0, rank: 'N/A', totalCredits: 0, successRate: 0 });
            }

            setLoading(false);

        } catch (err) {
            console.error("Error loading results:", err);
            setLoading(false);
        }
    }, []);

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

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading academic results...</div>;
    }

    return (
        <div className="student-results animate-fade-in">
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

            {/* Performance Overview Charts */}
            <div className="performance-overview-grid">
                <div className="performance-chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">GPA Progress Trend</h3>
                        <p className="chart-subtitle">Your academic growth over time</p>
                    </div>
                    <div className="chart-container-premium">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart
                                data={[
                                    { month: 'Sep', gpa: 3.2 },
                                    { month: 'Oct', gpa: 3.4 },
                                    { month: 'Nov', gpa: 3.3 },
                                    { month: 'Dec', gpa: 3.5 },
                                    { month: 'Jan', gpa: 3.7 },
                                    { month: 'Current', gpa: parseFloat(overallStats.gpa) }
                                ]}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(8, 145, 178, 0.1)" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <YAxis
                                    domain={[0, 4]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                        background: 'white'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="gpa"
                                    stroke="#0891b2"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorGpa)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="performance-chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Subject Performance</h3>
                        <p className="chart-subtitle">Score comparison across courses</p>
                    </div>
                    <div className="chart-container-premium">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={results.map(r => ({ name: r.subject, score: r.finalGrade, color: r.color }))}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(8, 145, 178, 0.1)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(8, 145, 178, 0.05)' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                        background: 'white'
                                    }}
                                />
                                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                                    {results.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Subject Results */}
            <div className="results-list">
                {results.length > 0 ? results.map((result, index) => (
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
                                                <span className={`status-badge ${assessment.status}`}>
                                                    {assessment.status === 'above' ? (
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
                )) : (
                    <div className="p-8 text-center text-slate-500 bg-white rounded-2xl shadow-sm">
                        No results available yet.
                    </div>
                )}
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

                /* Charts Styles */
                .performance-overview-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                @media (max-width: 1024px) {
                    .performance-overview-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .performance-chart-card {
                    background: white;
                    border-radius: 20px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.06);
                }

                .chart-header {
                    margin-bottom: 1.5rem;
                }

                .chart-title {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: var(--color-text-main, #0f172a);
                    margin: 0 0 0.25rem;
                }

                .chart-subtitle {
                    font-size: 0.8125rem;
                    color: var(--color-text-muted, #64748b);
                    margin: 0;
                }

                [data-theme="dark"] .performance-chart-card {
                    background: #1e293b;
                }

                [data-theme="dark"] .chart-title {
                    color: #f1f5f9;
                }

                [data-theme="dark"] .recharts-cartesian-grid-horizontal line,
                [data-theme="dark"] .recharts-cartesian-grid-vertical line {
                    stroke: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </div>
    );
};

export default StudentResults;
