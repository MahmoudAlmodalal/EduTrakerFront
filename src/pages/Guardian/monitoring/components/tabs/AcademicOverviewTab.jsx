import React, { useMemo, useState } from 'react';
import {
    AlertCircle,
    BookOpen,
    ChevronDown,
    Minus,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { useStudentMarks } from '../../hooks/useStudentMarks';
import { useStudentAssessments } from '../../hooks/useStudentAssessments';
import { formatDate, formatPercentage } from '../../utils/monitoringUtils';

const SUBJECT_COLORS = ['#0891b2', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

const getLetterGrade = (value) => {
    if (value >= 90) return 'A';
    if (value >= 80) return 'B';
    if (value >= 70) return 'C';
    if (value >= 60) return 'D';
    return 'F';
};

const getGradeColor = (value) => {
    if (value >= 90) return '#10b981';
    if (value >= 80) return '#0891b2';
    if (value >= 70) return '#f59e0b';
    return '#ef4444';
};

const parseId = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const getAssignmentId = (entry = {}) => {
    const candidates = [
        entry?.assignment_id,
        entry?.assignment,
        entry?.assignment?.id,
        entry?.assignment?.pk,
        entry?.assignmentId,
    ];

    for (const candidate of candidates) {
        const parsed = parseId(candidate);
        if (parsed !== null) {
            return parsed;
        }
    }

    return null;
};

const pickSubjectName = (...candidates) => {
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
        }
    }
    return null;
};

const toSubjectKey = (subject) => {
    if (typeof subject !== 'string') {
        return 'subject-not-set';
    }

    return subject
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
};

const computeTrend = (assessments = []) => {
    if (assessments.length < 2) {
        return 'stable';
    }

    const sorted = [...assessments].sort((left, right) => {
        const leftTime = new Date(left.rawDate || 0).getTime();
        const rightTime = new Date(right.rawDate || 0).getTime();
        return leftTime - rightTime;
    });

    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);
    const average = (items) => {
        if (items.length === 0) return 0;
        return items.reduce((sum, item) => sum + item.percentage, 0) / items.length;
    };

    const delta = average(secondHalf) - average(firstHalf);
    if (delta > 5) return 'up';
    if (delta < -5) return 'down';
    return 'stable';
};

const getTrendMeta = (trend) => {
    if (trend === 'up') {
        return {
            className: 'trend-up',
            label: 'Improving',
            icon: <TrendingUp size={14} />,
        };
    }

    if (trend === 'down') {
        return {
            className: 'trend-down',
            label: 'Declining',
            icon: <TrendingDown size={14} />,
        };
    }

    return {
        className: 'trend-stable',
        label: 'Stable',
        icon: <Minus size={14} />,
    };
};

const AcademicOverviewTab = ({ studentId }) => {
    const [expandedSubject, setExpandedSubject] = useState(null);

    const {
        data: marks = [],
        isLoading,
        error,
        refetch,
    } = useStudentMarks(studentId);

    const { data: assessments = [] } = useStudentAssessments(studentId);

    const assessmentsById = useMemo(() => {
        return new Map(
            assessments
                .map((assessment) => [getAssignmentId(assessment) ?? parseId(assessment?.id), assessment])
                .filter(([id]) => id !== null)
        );
    }, [assessments]);

    const groupedResults = useMemo(() => {
        if (!Array.isArray(marks) || marks.length === 0) {
            return [];
        }

        const grouped = marks.reduce((accumulator, mark) => {
            const linkedAssessment = assessmentsById.get(getAssignmentId(mark));
            const subjectName =
                pickSubjectName(
                    mark?.course_name,
                    mark?.subject_name,
                    mark?.subject,
                    mark?.course,
                    mark?.assignment_course_name,
                    linkedAssessment?.course_name,
                    linkedAssessment?.subject_name,
                    linkedAssessment?.course?.name
                ) || 'Subject Not Set';
            const subjectKey = toSubjectKey(subjectName);

            if (!accumulator[subjectKey]) {
                accumulator[subjectKey] = {
                    subject: subjectName,
                    assessments: [],
                    totalScore: 0,
                    totalMaxScore: 0,
                    color: SUBJECT_COLORS[Object.keys(accumulator).length % SUBJECT_COLORS.length],
                };
            }

            const score = Number(mark?.score) || 0;
            const maxScore = Number(mark?.max_score || mark?.full_mark || linkedAssessment?.full_mark) || 0;
            const percentage = Number(mark?.percentage) || (maxScore > 0 ? (score / maxScore) * 100 : 0);

            accumulator[subjectKey].assessments.push({
                id: mark?.id,
                title: mark?.assignment_title || mark?.title || linkedAssessment?.title || 'Assessment',
                type: mark?.assessment_type || linkedAssessment?.exam_type_display || linkedAssessment?.assignment_type || linkedAssessment?.exam_type || 'Assessment',
                date: formatDate(mark?.date_recorded || mark?.due_date || linkedAssessment?.due_date),
                rawDate: mark?.date_recorded || mark?.due_date || linkedAssessment?.due_date,
                score,
                total: maxScore,
                percentage,
            });

            accumulator[subjectKey].totalScore += score;
            accumulator[subjectKey].totalMaxScore += maxScore;

            return accumulator;
        }, {});

        return Object.values(grouped)
            .map((item) => {
                const finalPercentage =
                    item.totalMaxScore > 0
                        ? Math.round((item.totalScore / item.totalMaxScore) * 100)
                        : Math.round(
                            item.assessments.reduce((sum, assessment) => sum + assessment.percentage, 0) /
                            Math.max(item.assessments.length, 1)
                        );

                return {
                    ...item,
                    finalPercentage,
                    letterGrade: getLetterGrade(finalPercentage),
                    trend: computeTrend(item.assessments),
                };
            })
            .sort((left, right) => right.finalPercentage - left.finalPercentage);
    }, [assessmentsById, marks]);

    const overallAverage = useMemo(() => {
        if (groupedResults.length === 0) {
            return null;
        }

        const total = groupedResults.reduce((sum, entry) => sum + entry.finalPercentage, 0);
        return total / groupedResults.length;
    }, [groupedResults]);

    return (
        <div className="guardian-card academic-results-tab">
            <div className="academic-results-header">
                <div>
                    <h3>Academic Results</h3>
                    <p className="academic-results-subtitle">
                        Track grades and performance across all subjects
                    </p>
                </div>
                <p className="academic-header-average">
                    Overall Average: <strong>{formatPercentage(overallAverage)}</strong>
                </p>
            </div>

            {error && (
                <div className="monitoring-inline-error">
                    <AlertCircle size={16} />
                    <span>{error.message || 'Failed to load marks.'}</span>
                    <button type="button" className="btn-primary btn-sm" onClick={() => refetch()}>
                        Retry
                    </button>
                </div>
            )}

            {!error && isLoading && (
                <div className="monitoring-empty-state">Loading academic performance...</div>
            )}

            {!error && !isLoading && groupedResults.length === 0 && (
                <div className="monitoring-empty-state">No marks recorded for this student yet.</div>
            )}

            {!error && !isLoading && groupedResults.length > 0 && (
                <div className="monitoring-results-list">
                    {groupedResults.map((result, index) => {
                        const isExpanded = expandedSubject === index;
                        const trend = getTrendMeta(result.trend);

                        return (
                            <article
                                key={`${result.subject}-${index}`}
                                className={`monitoring-result-card ${isExpanded ? 'expanded' : ''}`}
                                style={{ '--result-color': result.color }}
                            >
                                <button
                                    type="button"
                                    className="monitoring-result-header"
                                    onClick={() => setExpandedSubject(isExpanded ? null : index)}
                                >
                                    <div className="monitoring-result-subject">
                                        <div className="monitoring-result-subject-indicator" />
                                        <div>
                                            <h4 className="monitoring-result-subject-name">{result.subject}</h4>
                                            <div className="monitoring-result-count">
                                                {result.assessments.length} assessment{result.assessments.length !== 1 ? 's' : ''} completed
                                            </div>
                                        </div>
                                    </div>

                                    <div className="monitoring-result-grade">
                                        <div className="monitoring-result-letter" style={{ color: result.color }}>
                                            {result.letterGrade}
                                        </div>
                                        <div className="monitoring-result-score">
                                            <span className="monitoring-result-score-value">{result.finalPercentage}%</span>
                                            <span className={`trend-badge ${trend.className}`}>
                                                {trend.icon}
                                                <span>{trend.label}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="monitoring-result-ring">
                                        <svg viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#e2e8f0"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke={result.color}
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeDasharray={`${result.finalPercentage}, 100`}
                                            />
                                        </svg>
                                    </div>

                                    <span className="monitoring-result-expand">
                                        <ChevronDown size={18} />
                                    </span>
                                </button>

                                <div className="monitoring-result-details">
                                    <table className="guardian-table monitoring-assessments-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Type</th>
                                                <th>Date</th>
                                                <th>Score</th>
                                                <th>Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.assessments.map((assessment) => (
                                                <tr key={assessment.id || `${assessment.title}-${assessment.date}`}>
                                                    <td className="monitoring-assessment-title">{assessment.title}</td>
                                                    <td>
                                                        <span className="monitoring-type-badge">{assessment.type}</span>
                                                    </td>
                                                    <td>{assessment.date}</td>
                                                    <td className="monitoring-assessment-score">
                                                        {assessment.score}/{assessment.total}
                                                    </td>
                                                    <td>
                                                        <div className="monitoring-percentage-display">
                                                            <div className="monitoring-percentage-bar-bg">
                                                                <div
                                                                    className="monitoring-percentage-bar-fill"
                                                                    style={{
                                                                        width: `${assessment.percentage}%`,
                                                                        backgroundColor: getGradeColor(assessment.percentage),
                                                                    }}
                                                                />
                                                            </div>
                                                            <span>{Math.round(assessment.percentage)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {!error && !isLoading && marks.length === 0 && (
                <div className="monitoring-academic-empty-icon">
                    <BookOpen size={42} />
                </div>
            )}
        </div>
    );
};

export default AcademicOverviewTab;
