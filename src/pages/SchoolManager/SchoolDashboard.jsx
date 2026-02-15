import React, { useState, useEffect } from 'react';
import {
    Users,
    GraduationCap,
    AlertCircle,
    UserCheck,
    Briefcase,
    BookOpen
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import managerService from '../../services/managerService';
import './SchoolManager.css';

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeClassroom = (room = {}, index = 0) => {
    const rawGrade = typeof room?.grade === 'object' ? room?.grade?.name : room?.grade;

    return {
        ...room,
        classroom_id: room?.classroom_id ?? room?.id ?? null,
        classroom_name: room?.classroom_name || room?.name || room?.class_name || `Classroom ${index + 1}`,
        grade: rawGrade || room?.grade_name || room?.['grade__name'] || 'Unassigned',
        student_count: toNumber(
            room?.student_count ?? room?.count ?? room?.total_students ?? room?.students_count,
            0
        )
    };
};

const SchoolDashboard = () => {
    const { t } = useTheme();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            try {
                // Backend: GET /api/statistics/dashboard/
                // Response: { role, statistics: { school_name, total_students, total_teachers, total_secretaries, classroom_count, course_count, by_grade, by_classroom }, recent_activity, activity_chart }
                const data = await managerService.getDashboardStats();
                setStats(data?.statistics || {
                    total_students: 0,
                    total_teachers: 0,
                    total_secretaries: 0,
                    classroom_count: 0,
                    course_count: 0
                });
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
                setError(err.message || 'Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const dashboardCards = [
        { title: t('school.dashboard.totalStudents') || 'Total Students', value: stats?.total_students ?? 0, icon: Users, color: 'blue', bgColor: '#dbeafe', iconColor: '#2563eb' },
        { title: t('activeTeachers') || 'Active Teachers', value: stats?.total_teachers ?? 0, icon: UserCheck, color: 'green', bgColor: '#dcfce7', iconColor: '#16a34a' },
        { title: t('secretaries') || 'Secretaries', value: stats?.total_secretaries ?? 0, icon: Briefcase, color: 'purple', bgColor: '#f3e8ff', iconColor: '#9333ea' },
        { title: t('classrooms') || 'Classrooms', value: stats?.classroom_count ?? 0, icon: GraduationCap, color: 'orange', bgColor: '#ffedd5', iconColor: '#ea580c' },
        { title: t('courses') || 'Courses', value: stats?.course_count ?? 0, icon: BookOpen, color: 'teal', bgColor: '#ccfbf1', iconColor: '#0d9488' }
    ];

    const gradeBreakdownClassrooms = (
        Array.isArray(stats?.by_classroom)
            ? stats.by_classroom
            : Array.isArray(stats?.summary?.by_classroom)
                ? stats.summary.by_classroom
                : []
    ).map(normalizeClassroom);

    if (loading) {
        return (
            <div className="school-dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: 'var(--color-text-muted)' }}>{t('common.loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="school-dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', color: 'var(--color-error)' }}>
                    <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: '1rem' }}>
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="school-dashboard-page">
            <div className="school-manager-header">
                <div>
                    <h1 className="school-manager-title">
                        {stats?.school_name
                            ? `${stats.school_name} — ${t('school.dashboard.title') || 'Command Center'}`
                            : (t('school.dashboard.title') || 'Command Center')
                        }
                    </h1>
                    <p className="school-manager-subtitle">{t('school.dashboard.subtitle') || 'Real-time overview of school operations and academic status.'}</p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid">
                {dashboardCards.map((card, index) => (
                    <div key={index} className="stat-card" style={{
                        background: 'var(--color-bg-surface)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        border: '1px solid var(--color-border)',
                        transition: 'all 0.2s ease',
                        cursor: 'default'
                    }}>
                        <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{
                                backgroundColor: card.bgColor,
                                color: card.iconColor,
                                padding: '14px',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 4px 12px ${card.bgColor}`
                            }}>
                                <card.icon size={28} strokeWidth={2.25} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ fontSize: '2rem', fontWeight: '800', marginTop: '1.25rem', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>{card.value}</div>
                        <div className="stat-label" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.375rem', fontWeight: '500' }}>{card.title}</div>
                    </div>
                ))}
            </div>

            {/* Grade Breakdown */}
            <GradeBreakdown classrooms={gradeBreakdownClassrooms} />
        </div>
    );
};

// Sub-component: Grade Breakdown (classrooms and students per grade)
const GradeBreakdown = ({ classrooms = [] }) => {
    const { t } = useTheme();

    // Group classrooms by grade name, preserving each classroom's student_count
    const gradeMap = classrooms.reduce((acc, room) => {
        const gradeName = (typeof room.grade === 'object' ? room.grade?.name : room.grade)
            || room.grade_name
            || 'Unassigned';
        if (!acc[gradeName]) acc[gradeName] = [];
        acc[gradeName].push(room);
        return acc;
    }, {});

    const grades = Object.entries(gradeMap)
        .map(([grade_name, rooms]) => ({
            grade_name,
            classrooms: rooms,
            classroom_count: rooms.length,
            total_students: rooms.reduce((s, r) => s + (r.student_count || 0), 0)
        }))
        .sort((a, b) => a.grade_name.localeCompare(b.grade_name, undefined, { numeric: true }));

    return (
        <div className="management-card" style={{ marginTop: '1.5rem' }}>
            <div className="table-header-actions">
                <h3 className="chart-title">{t('gradeBreakdown') || 'Grade & Classroom Overview'}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {classrooms.length} classroom{classrooms.length !== 1 ? 's' : ''} total
                </span>
            </div>
            <div style={{ padding: '1rem' }}>
                {grades.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <GraduationCap size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0 }}>{t('noData') || 'No classroom data available'}</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {grades.map((grade, idx) => (
                            <div key={idx} style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: '10px',
                                overflow: 'hidden'
                            }}>
                                {/* Grade header row */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.625rem 1rem',
                                    background: 'var(--color-bg-body)',
                                    borderBottom: '1px solid var(--color-border)'
                                }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                                        {grade.grade_name}
                                    </span>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        <span>{grade.classroom_count} classroom{grade.classroom_count !== 1 ? 's' : ''}</span>
                                        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                                            {grade.total_students} student{grade.total_students !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                {/* Classroom rows */}
                                {grade.classrooms.map((room, rIdx) => (
                                    <div key={rIdx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem 1rem 0.5rem 1.5rem',
                                        borderBottom: rIdx < grade.classrooms.length - 1 ? '1px solid var(--color-border)' : 'none',
                                        background: 'var(--color-bg-surface)'
                                    }}>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-main)' }}>
                                            {room.classroom_name}
                                        </span>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                            {room.student_count ?? 0} student{(room.student_count ?? 0) !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchoolDashboard;
