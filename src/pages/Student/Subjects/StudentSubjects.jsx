import React, { useMemo, useState } from 'react';
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
    RefreshCw
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useStudentData } from '../../../context/StudentDataContext';
import studentService from '../../../services/studentService';
import '../Student.css';

const StudentSubjects = () => {
    const { t } = useTheme();
    const {
        dashboardData,
        loading,
        error,
        refreshData
    } = useStudentData();
    const [selectedSubject, setSelectedSubject] = useState(null);
    const subjects = useMemo(() => {
        const courseData = dashboardData?.courses?.courses || [];
        return courseData.map((course, index) => ({
            id: course.course_id,
            classroom_id: course.classroom_id,
            name: course.course_name,
            teacher: course.teacher_name,
            description: `${course.course_code} - ${course.grade_name}`,
            progress: 0,
            grade: 'N/A',
            nextClass: 'Scheduled',
            color: ['#0891b2', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][index % 5],
            materials: [],
            assignments: []
        }));
    }, [dashboardData?.courses?.courses]);

    const fetchSubjectDetails = async (subject) => {
        try {
            setSelectedSubject({ ...subject, loading: true });
            const materialsData = await studentService.getLearningMaterials({
                course: subject.id,
                classroom: subject.classroom_id
            });

            // Map materials
            const materials = (materialsData.results || materialsData || []).map(m => ({
                id: m.id,
                title: m.title,
                type: m.file_type || 'resource',
                date: new Date(m.created_at).toLocaleDateString(),
                size: m.file_size ? `${(m.file_size / 1024 / 1024).toFixed(1)} MB` : 'N/A',
                url: m.file_url
            }));

            setSelectedSubject({ ...subject, materials, loading: false });
        } catch (error) {
            console.error('Error fetching subject details:', error);
            setSelectedSubject({ ...subject, loading: false });
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'lecture': return <FileText size={18} />;
            case 'resource': return <Book size={18} />;
            case 'exercise': return <Star size={18} />;
            default: return <FileText size={18} />;
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <RefreshCw className="animate-spin" size={40} />
                <p>Loading subjects...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <FileText size={48} color="#ef4444" />
                <p>{error}</p>
                <button onClick={refreshData} className="retry-btn">
                    Try Again
                </button>
            </div>
        );
    }

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
                        onClick={() => fetchSubjectDetails(subject)}
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
</div>
    );
};

export default StudentSubjects;
