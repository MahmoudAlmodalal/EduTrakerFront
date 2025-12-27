import React, { useState } from 'react';
import {
    Book,
    FileText,
    Upload,
    ChevronRight,
    Download,
    ChevronLeft,
    Clock,
    CheckCircle,
    Users,
    Calendar,
    Star,
    TrendingUp
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import '../Student.css';

const StudentSubjects = () => {
    const { t } = useTheme();
    const [selectedSubject, setSelectedSubject] = useState(null);

    // Mock Data with enhanced information
    const subjects = [
        {
            id: 1,
            name: 'Mathematics',
            teacher: 'Dr. Smith',
            description: 'Advanced Calculus and Linear Algebra',
            progress: 75,
            grade: 'A-',
            nextClass: 'Tomorrow 9:00 AM',
            color: '#0891b2',
            materials: [
                { id: 1, title: 'Week 1: Introduction to Limits', type: 'lecture', date: '2025-01-10', size: '2.4 MB' },
                { id: 2, title: 'Calculus Cheat Sheet', type: 'resource', date: '2025-01-12', size: '1.1 MB' },
                { id: 3, title: 'Practice Problems Set 1', type: 'exercise', date: '2025-01-14', size: '856 KB' },
            ],
            assignments: [
                { id: 1, title: 'Homework 3', due: '2025-12-15', status: 'pending', points: 100 },
                { id: 2, title: 'Midterm Project', due: '2025-12-20', status: 'pending', points: 200 },
            ]
        },
        {
            id: 2,
            name: 'Physics',
            teacher: 'Prof. Johnson',
            description: 'Mechanics and Thermodynamics',
            progress: 60,
            grade: 'B+',
            nextClass: 'Today 11:45 AM',
            color: '#8b5cf6',
            materials: [
                { id: 1, title: 'Newton Laws Notes', type: 'lecture', date: '2025-01-11', size: '1.8 MB' },
            ],
            assignments: [
                { id: 1, title: 'Lab Report', due: '2025-12-18', status: 'submitted', points: 150 },
            ]
        },
        {
            id: 3,
            name: 'English Literature',
            teacher: 'Ms. Davis',
            description: 'Modern American Literature',
            progress: 90,
            grade: 'A',
            nextClass: 'Wednesday 2:00 PM',
            color: '#10b981',
            materials: [
                { id: 1, title: 'The Great Gatsby Analysis', type: 'lecture', date: '2025-01-09', size: '3.2 MB' },
            ],
            assignments: []
        },
        {
            id: 4,
            name: 'Computer Science',
            teacher: 'Mr. Wilson',
            description: 'Algorithms and Data Structures',
            progress: 45,
            grade: 'A+',
            nextClass: 'Thursday 10:30 AM',
            color: '#f59e0b',
            materials: [
                { id: 1, title: 'Sorting Algorithms', type: 'lecture', date: '2025-01-08', size: '4.5 MB' },
                { id: 2, title: 'Big O Notation Guide', type: 'resource', date: '2025-01-10', size: '920 KB' },
            ],
            assignments: [
                { id: 1, title: 'Coding Challenge #5', due: '2025-12-22', status: 'pending', points: 100 },
            ]
        },
    ];

    const getTypeIcon = (type) => {
        switch (type) {
            case 'lecture': return <FileText size={18} />;
            case 'resource': return <Book size={18} />;
            case 'exercise': return <Star size={18} />;
            default: return <FileText size={18} />;
        }
    };

    if (selectedSubject) {
        return (
            <div className="subject-detail-view">
                {/* Back Button */}
                <button onClick={() => setSelectedSubject(null)} className="back-button">
                    <ChevronLeft size={20} />
                    <span>{t('student.subjects.backToSubjects') || 'Back to Subjects'}</span>
                </button>

                {/* Subject Header Card */}
                <div className="subject-detail-header" style={{ '--subject-color': selectedSubject.color }}>
                    <div className="subject-detail-info">
                        <div className="subject-detail-icon" style={{ background: selectedSubject.color }}>
                            <Book size={28} />
                        </div>
                        <div>
                            <h1 className="subject-detail-title">{selectedSubject.name}</h1>
                            <p className="subject-detail-teacher">
                                <Users size={14} />
                                {selectedSubject.teacher}
                            </p>
                            <p className="subject-detail-desc">{selectedSubject.description}</p>
                        </div>
                    </div>
                    <div className="subject-detail-stats">
                        <div className="subject-stat-box">
                            <span className="subject-stat-value">{selectedSubject.grade}</span>
                            <span className="subject-stat-label">Current Grade</span>
                        </div>
                        <div className="subject-stat-box">
                            <span className="subject-stat-value">{selectedSubject.progress}%</span>
                            <span className="subject-stat-label">Progress</span>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="subject-detail-grid">
                    {/* Course Materials */}
                    <div className="subject-section-card">
                        <div className="section-header">
                            <h3 className="section-title">
                                <Book size={20} />
                                {t('student.subjects.courseMaterials') || 'Course Materials'}
                            </h3>
                            <span className="section-count">{selectedSubject.materials.length} files</span>
                        </div>
                        <div className="materials-list">
                            {selectedSubject.materials.length > 0 ? selectedSubject.materials.map((material) => (
                                <div key={material.id} className="material-item">
                                    <div className="material-icon" style={{ color: selectedSubject.color }}>
                                        {getTypeIcon(material.type)}
                                    </div>
                                    <div className="material-info">
                                        <div className="material-title">{material.title}</div>
                                        <div className="material-meta">
                                            <span className="material-type">{material.type}</span>
                                            <span className="material-date">{material.date}</span>
                                            <span className="material-size">{material.size}</span>
                                        </div>
                                    </div>
                                    <button className="download-btn">
                                        <Download size={16} />
                                    </button>
                                </div>
                            )) : (
                                <div className="empty-state-mini">
                                    <FileText size={32} />
                                    <p>{t('student.subjects.noMaterials') || 'No materials yet'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Assignments */}
                    <div className="subject-section-card">
                        <div className="section-header">
                            <h3 className="section-title">
                                <Upload size={20} />
                                {t('student.subjects.assignmentsSubmissions') || 'Assignments'}
                            </h3>
                            <span className="section-count">{selectedSubject.assignments.length} tasks</span>
                        </div>
                        <div className="assignments-list">
                            {selectedSubject.assignments.length > 0 ? selectedSubject.assignments.map((assignment) => (
                                <div key={assignment.id} className={`assignment-card ${assignment.status}`}>
                                    <div className="assignment-info">
                                        <div className="assignment-title-row">
                                            <span className="assignment-name">{assignment.title}</span>
                                            <span className={`assignment-status-badge ${assignment.status}`}>
                                                {assignment.status === 'submitted' ? (
                                                    <><CheckCircle size={12} /> Submitted</>
                                                ) : (
                                                    <><Clock size={12} /> Pending</>
                                                )}
                                            </span>
                                        </div>
                                        <div className="assignment-details">
                                            <span className="assignment-due">
                                                <Calendar size={12} /> Due: {assignment.due}
                                            </span>
                                            <span className="assignment-points">
                                                <Star size={12} /> {assignment.points} pts
                                            </span>
                                        </div>
                                    </div>
                                    {assignment.status !== 'submitted' && (
                                        <button className="submit-btn" style={{ background: selectedSubject.color }}>
                                            <Upload size={14} />
                                            Submit
                                        </button>
                                    )}
                                </div>
                            )) : (
                                <div className="empty-state-mini">
                                    <CheckCircle size={32} />
                                    <p>{t('student.subjects.noAssignments') || 'No pending assignments'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <style>{`
                    .subject-detail-view {
                        animation: fadeInUp 0.3s ease-out;
                    }
                    
                    .back-button {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 0;
                        background: none;
                        border: none;
                        color: var(--color-text-muted, #64748b);
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        margin-bottom: 1.5rem;
                    }
                    
                    .back-button:hover {
                        color: var(--student-primary, #0891b2);
                        transform: translateX(-4px);
                    }
                    
                    .subject-detail-header {
                        background: white;
                        border-radius: 20px;
                        padding: 2rem;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 2rem;
                        box-shadow: 0 4px 20px rgba(8, 145, 178, 0.08);
                        margin-bottom: 1.5rem;
                        border-top: 4px solid var(--subject-color);
                    }
                    
                    .subject-detail-info {
                        display: flex;
                        gap: 1.25rem;
                        flex: 1;
                    }
                    
                    .subject-detail-icon {
                        width: 64px;
                        height: 64px;
                        border-radius: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        flex-shrink: 0;
                    }
                    
                    .subject-detail-title {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: var(--color-text-main, #0f172a);
                        margin: 0 0 0.5rem;
                    }
                    
                    .subject-detail-teacher {
                        display: flex;
                        align-items: center;
                        gap: 0.375rem;
                        color: var(--color-text-muted, #64748b);
                        font-size: 0.875rem;
                        margin: 0 0 0.5rem;
                    }
                    
                    .subject-detail-desc {
                        color: var(--color-text-secondary, #475569);
                        font-size: 0.9375rem;
                        margin: 0;
                    }
                    
                    .subject-detail-stats {
                        display: flex;
                        gap: 1rem;
                    }
                    
                    .subject-stat-box {
                        background: #f8fafc;
                        padding: 1rem 1.5rem;
                        border-radius: 12px;
                        text-align: center;
                        min-width: 100px;
                    }
                    
                    .subject-stat-value {
                        display: block;
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: var(--student-primary, #0891b2);
                    }
                    
                    .subject-stat-label {
                        font-size: 0.6875rem;
                        color: var(--color-text-muted, #64748b);
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                    }
                    
                    .subject-detail-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1.5rem;
                    }
                    
                    @media (max-width: 1024px) {
                        .subject-detail-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                    
                    .subject-section-card {
                        background: white;
                        border-radius: 16px;
                        padding: 1.5rem;
                        box-shadow: 0 4px 20px rgba(8, 145, 178, 0.06);
                    }
                    
                    .section-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1.25rem;
                        padding-bottom: 1rem;
                        border-bottom: 1px solid rgba(8, 145, 178, 0.08);
                    }
                    
                    .section-title {
                        display: flex;
                        align-items: center;
                        gap: 0.625rem;
                        font-size: 1rem;
                        font-weight: 600;
                        color: var(--color-text-main, #0f172a);
                        margin: 0;
                    }
                    
                    .section-title svg {
                        color: var(--student-primary, #0891b2);
                    }
                    
                    .section-count {
                        font-size: 0.75rem;
                        color: var(--color-text-muted, #64748b);
                        background: #f1f5f9;
                        padding: 0.25rem 0.625rem;
                        border-radius: 20px;
                    }
                    
                    .materials-list, .assignments-list {
                        display: flex;
                        flex-direction: column;
                        gap: 0.75rem;
                    }
                    
                    .material-item {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1rem;
                        background: #f8fafc;
                        border-radius: 12px;
                        border: 1px solid transparent;
                        transition: all 0.2s ease;
                    }
                    
                    .material-item:hover {
                        border-color: var(--student-primary, #0891b2);
                        background: #f0f9ff;
                    }
                    
                    .material-icon {
                        width: 40px;
                        height: 40px;
                        background: white;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                    }
                    
                    .material-info {
                        flex: 1;
                    }
                    
                    .material-title {
                        font-weight: 600;
                        font-size: 0.875rem;
                        color: var(--color-text-main, #1e293b);
                        margin-bottom: 0.25rem;
                    }
                    
                    .material-meta {
                        display: flex;
                        gap: 0.75rem;
                        font-size: 0.75rem;
                        color: var(--color-text-muted, #64748b);
                    }
                    
                    .material-type {
                        text-transform: capitalize;
                    }
                    
                    .download-btn {
                        width: 36px;
                        height: 36px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        color: var(--color-text-muted, #64748b);
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    
                    .download-btn:hover {
                        background: var(--student-primary, #0891b2);
                        border-color: var(--student-primary, #0891b2);
                        color: white;
                    }
                    
                    .assignment-card {
                        padding: 1rem;
                        background: #f8fafc;
                        border-radius: 12px;
                        border: 1px solid transparent;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 1rem;
                        transition: all 0.2s ease;
                    }
                    
                    .assignment-card:hover {
                        border-color: var(--student-primary, #0891b2);
                    }
                    
                    .assignment-card.submitted {
                        border-left: 3px solid #10b981;
                    }
                    
                    .assignment-card.pending {
                        border-left: 3px solid #f59e0b;
                    }
                    
                    .assignment-name {
                        font-weight: 600;
                        font-size: 0.9375rem;
                        color: var(--color-text-main, #1e293b);
                    }
                    
                    .assignment-title-row {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    .assignment-status-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.25rem;
                        padding: 0.25rem 0.5rem;
                        border-radius: 20px;
                        font-size: 0.6875rem;
                        font-weight: 600;
                    }
                    
                    .assignment-status-badge.submitted {
                        background: #dcfce7;
                        color: #16a34a;
                    }
                    
                    .assignment-status-badge.pending {
                        background: #fef3c7;
                        color: #d97706;
                    }
                    
                    .assignment-details {
                        display: flex;
                        gap: 1rem;
                        font-size: 0.75rem;
                        color: var(--color-text-muted, #64748b);
                    }
                    
                    .assignment-due, .assignment-points {
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;
                    }
                    
                    .submit-btn {
                        display: flex;
                        align-items: center;
                        gap: 0.375rem;
                        padding: 0.5rem 1rem;
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-size: 0.8125rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    
                    .submit-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    }
                    
                    .empty-state-mini {
                        text-align: center;
                        padding: 2rem;
                        color: var(--color-text-muted, #94a3b8);
                    }
                    
                    .empty-state-mini svg {
                        margin-bottom: 0.5rem;
                        opacity: 0.5;
                    }
                    
                    .empty-state-mini p {
                        margin: 0;
                        font-size: 0.875rem;
                    }
                    
                    [data-theme="dark"] .subject-detail-header,
                    [data-theme="dark"] .subject-section-card {
                        background: #1e293b;
                    }
                    
                    [data-theme="dark"] .subject-stat-box,
                    [data-theme="dark"] .material-item,
                    [data-theme="dark"] .assignment-card {
                        background: rgba(30, 41, 59, 0.8);
                    }
                    
                    [data-theme="dark"] .subject-detail-title,
                    [data-theme="dark"] .section-title,
                    [data-theme="dark"] .material-title,
                    [data-theme="dark"] .assignment-name {
                        color: #f1f5f9;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="student-subjects">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">{t('student.subjects.title') || 'My Subjects'}</h1>
                    <p className="page-subtitle">{t('student.subjects.subtitle') || 'Access your courses, materials, and assignments'}</p>
                </div>
                <div className="header-stats">
                    <div className="header-stat">
                        <Book size={18} />
                        <span>{subjects.length} Courses</span>
                    </div>
                </div>
            </header>

            {/* Subjects Grid */}
            <div className="subjects-grid">
                {subjects.map((subject, index) => (
                    <div
                        key={subject.id}
                        onClick={() => setSelectedSubject(subject)}
                        className="subject-card-premium"
                        style={{ '--subject-color': subject.color, animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="subject-card-header">
                            <div className="subject-icon-wrapper" style={{ background: subject.color }}>
                                <Book size={24} />
                            </div>
                            <div className="subject-grade-badge">{subject.grade}</div>
                        </div>

                        <h3 className="subject-card-title">{subject.name}</h3>
                        <p className="subject-card-teacher">{subject.teacher}</p>

                        <div className="subject-progress-section">
                            <div className="progress-header">
                                <span>Progress</span>
                                <span>{subject.progress}%</span>
                            </div>
                            <div className="progress-bar-wrapper">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${subject.progress}%`, background: subject.color }}
                                ></div>
                            </div>
                        </div>

                        <div className="subject-card-footer">
                            <div className="subject-next-class">
                                <Clock size={14} />
                                <span>{subject.nextClass}</span>
                            </div>
                            <div className="subject-view-more">
                                <span>View</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                
                .page-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--color-text-main, #0f172a);
                    margin: 0 0 0.5rem;
                }
                
                .page-subtitle {
                    color: var(--color-text-muted, #64748b);
                    font-size: 0.9375rem;
                    margin: 0;
                }
                
                .header-stats {
                    display: flex;
                    gap: 1rem;
                }
                
                .header-stat {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    background: white;
                    border-radius: 10px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--color-text-main, #334155);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                }
                
                .header-stat svg {
                    color: var(--student-primary, #0891b2);
                }
                
                .subjects-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                }
                
                .subject-card-premium {
                    background: white;
                    border-radius: 20px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.06);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border-top: 4px solid var(--subject-color);
                    animation: fadeInUp 0.4s ease-out backwards;
                }
                
                .subject-card-premium:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 48px rgba(8, 145, 178, 0.15);
                }
                
                .subject-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }
                
                .subject-icon-wrapper {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    transition: transform 0.3s ease;
                }
                
                .subject-card-premium:hover .subject-icon-wrapper {
                    transform: scale(1.05);
                }
                
                .subject-grade-badge {
                    padding: 0.375rem 0.75rem;
                    background: #f0fdf4;
                    color: #16a34a;
                    border-radius: 20px;
                    font-size: 0.8125rem;
                    font-weight: 700;
                }
                
                .subject-card-title {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: var(--color-text-main, #0f172a);
                    margin: 0 0 0.25rem;
                }
                
                .subject-card-teacher {
                    font-size: 0.875rem;
                    color: var(--color-text-muted, #64748b);
                    margin: 0 0 1rem;
                }
                
                .subject-progress-section {
                    margin-bottom: 1rem;
                }
                
                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: var(--color-text-muted, #64748b);
                    margin-bottom: 0.5rem;
                }
                
                .progress-bar-wrapper {
                    height: 8px;
                    background: #e0f2fe;
                    border-radius: 10px;
                    overflow: hidden;
                }
                
                .progress-bar-fill {
                    height: 100%;
                    border-radius: 10px;
                    transition: width 0.5s ease;
                }
                
                .subject-card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(8, 145, 178, 0.08);
                }
                
                .subject-next-class {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    font-size: 0.75rem;
                    color: var(--color-text-muted, #64748b);
                }
                
                .subject-view-more {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: var(--student-primary, #0891b2);
                    transition: transform 0.2s ease;
                }
                
                .subject-card-premium:hover .subject-view-more {
                    transform: translateX(4px);
                }
                
                [data-theme="dark"] .subject-card-premium {
                    background: #1e293b;
                }
                
                [data-theme="dark"] .subject-card-title {
                    color: #f1f5f9;
                }
                
                [data-theme="dark"] .progress-bar-wrapper {
                    background: #334155;
                }
                
                [data-theme="dark"] .header-stat {
                    background: #1e293b;
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default StudentSubjects;
