import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Users,
    Calendar,
    AlertTriangle,
    Plus,
    CheckCircle,
    Search
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import managerService from '../../services/managerService';
import './SchoolManager.css';

const AcademicConfiguration = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('subjects');
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    const schoolId = user?.school;

    useEffect(() => {
        const fetchData = async () => {
            if (!schoolId) return;
            setLoading(true);
            try {
                const [coursesData, teachersData] = await Promise.all([
                    managerService.getCourses(schoolId),
                    managerService.getTeachers()
                ]);
                setCourses(coursesData.results || coursesData);
                setTeachers(teachersData.results || teachersData);
            } catch (error) {
                console.error('Failed to fetch academic configuration data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [schoolId]);

    const fetchCourses = async () => {
        if (!schoolId) return;
        try {
            const data = await managerService.getCourses(schoolId);
            setCourses(data.results || data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    }

    // Mock conflicts - keep for UI demonstration until backend supports it
    const [conflicts] = useState([
        { id: 1, type: 'Room Double Booking', description: 'Room 101 booked for Math 1-A and Sci 1-B at Monday 9:00 AM', severity: 'High' },
        { id: 2, type: 'Teacher Overlap', description: 'Mr. Smith assigned to 1-A and 1-B at Tuesday 10:00 AM', severity: 'High' },
    ]);

    const renderTabContent = () => {
        if (loading) return <div>Loading...</div>;
        switch (activeTab) {
            case 'subjects':
                return <SubjectAllocation courses={courses} schoolId={schoolId} onCourseUpdated={fetchCourses} />;
            case 'teachers':
                return <TeacherAllocation courses={courses} teachers={teachers} schoolId={schoolId} onCourseUpdated={fetchCourses} />;
            case 'timetable':
                return <TimetableGenerator />;
            case 'conflicts':
                return <ConflictDetection conflicts={conflicts} />;
            default:
                return <SubjectAllocation courses={courses} schoolId={schoolId} onCourseUpdated={fetchCourses} />;
        }
    };

    return (
        <div className="academic-config-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">{t('school.config.title')}</h1>
                <p className="school-manager-subtitle">{t('school.config.subtitle')}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 w-full" style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
                <button
                    style={{
                        paddingBottom: '0.5rem',
                        color: activeTab === 'subjects' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'subjects' ? '2px solid var(--color-primary)' : '2px solid transparent'
                    }}
                    onClick={() => setActiveTab('subjects')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} />
                        Subject Allocation
                    </div>
                </button>
                <button
                    style={{
                        paddingBottom: '0.5rem',
                        color: activeTab === 'teachers' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'teachers' ? '2px solid var(--color-primary)' : '2px solid transparent'
                    }}
                    onClick={() => setActiveTab('teachers')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} />
                        Teacher Allocation
                    </div>
                </button>
                <button
                    style={{
                        paddingBottom: '0.5rem',
                        color: activeTab === 'timetable' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'timetable' ? '2px solid var(--color-primary)' : '2px solid transparent'
                    }}
                    onClick={() => setActiveTab('timetable')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} />
                        Timetable Generator
                    </div>
                </button>
                <button
                    style={{
                        paddingBottom: '0.5rem',
                        color: activeTab === 'conflicts' ? 'var(--color-error)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'conflicts' ? '2px solid var(--color-error)' : '2px solid transparent'
                    }}
                    onClick={() => setActiveTab('conflicts')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} />
                        Conflict Detection
                    </div>
                </button>
            </div>

            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

// Sub-components for Tabs
const SubjectAllocation = ({ courses, schoolId, onCourseUpdated }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [grades, setGrades] = useState([]);
    const [formData, setFormData] = useState({ grade_id: '', course_code: '', name: '' });

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const data = await managerService.getGrades();
                setGrades(data.results || data);
            } catch (error) {
                console.error('Failed to fetch grades:', error);
            }
        };
        fetchGrades();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await managerService.createCourse(schoolId, formData);
            onCourseUpdated();
            setIsModalOpen(false);
            setFormData({ grade_id: '', course_code: '', name: '' });
        } catch (error) {
            console.error('Failed to create course:', error);
            alert('Failed to create course. Please check your permissions.');
        }
    };

    const handleRemove = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this subject?')) return;
        try {
            await managerService.deactivateCourse(schoolId, id);
            onCourseUpdated();
        } catch (error) {
            console.error('Failed to deactivate course:', error);
        }
    };

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Subject Allocations</h3>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Add Subject
                </button>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Grade</th>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {courses.map((item) => (
                        <tr key={item.id}>
                            <td className="font-medium text-gray-900">{item.grade_name || item.grade}</td>
                            <td>{item.course_code}</td>
                            <td>{item.name}</td>
                            <td>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    background: item.is_active ? 'var(--color-success-light)' : 'var(--color-error-light)',
                                    color: item.is_active ? 'var(--color-success)' : 'var(--color-error)'
                                }}>
                                    {item.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>
                                <button onClick={() => handleRemove(item.id)} style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}>Deactivate</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: '0.5rem', width: '400px',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>Add Subject to School</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Grade</label>
                                <select
                                    required
                                    value={formData.grade_id}
                                    onChange={e => setFormData({ ...formData, grade_id: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                >
                                    <option value="">Select Grade</option>
                                    {grades.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Course Code</label>
                                <input
                                    required
                                    placeholder="e.g. MATH101"
                                    value={formData.course_code}
                                    onChange={e => setFormData({ ...formData, course_code: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Name</label>
                                <input
                                    required
                                    placeholder="e.g. Mathematics"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>Cancel</button>
                                <button type="submit" className="btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const TeacherAllocation = ({ courses, teachers, schoolId, onCourseUpdated }) => {
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState('');

    const handleOpenAssign = (course) => {
        setSelectedCourse(course);
        setSelectedTeacher('');
        setIsAssignModalOpen(true);
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedCourse || !selectedTeacher) return;

        try {
            await managerService.assignTeacherToCourse(schoolId, selectedCourse.id, selectedTeacher);
            setIsAssignModalOpen(false);
            onCourseUpdated();
        } catch (error) {
            console.error('Failed to assign teacher:', error);
            alert('Failed to assign teacher.');
        }
    };

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Teacher Allocations</h3>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Grade</th>
                        <th>Assigned Teacher</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {courses.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                No subjects found. Configure subjects first.
                            </td>
                        </tr>
                    ) : courses.map((item) => (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.grade_name || item.grade}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--color-text-main)' }}>
                                        {item.teacher_name ? item.teacher_name.charAt(0) : 'U'}
                                    </div>
                                    {item.teacher_name || 'Unassigned'}
                                </div>
                            </td>
                            <td>
                                <button
                                    onClick={() => handleOpenAssign(item)}
                                    style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    Assign
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Assign Teacher Modal */}
            {isAssignModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: '0.5rem', width: '400px',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>Assign Teacher</h2>
                        <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                            Assigning teacher for <strong>{selectedCourse?.name} ({selectedCourse?.grade_name})</strong>
                        </p>
                        <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Select Teacher</label>
                                <select
                                    required
                                    value={selectedTeacher}
                                    onChange={e => setSelectedTeacher(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                >
                                    <option value="">Select a teacher...</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsAssignModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>Cancel</button>
                                <button type="submit" className="btn-primary">Assign Teacher</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const TimetableGenerator = () => {
    const [isGenerated, setIsGenerated] = useState(false);

    const timeSlots = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const mockSchedule = {
        'Monday-08:00 AM': 'Math (1-A)',
        'Monday-10:00 AM': 'Science (1-A)',
        'Tuesday-09:00 AM': 'English (1-A)',
        'Wednesday-11:00 AM': 'History (1-A)',
        'Thursday-08:00 AM': 'Math (1-A)',
        'Friday-10:00 AM': 'Art (1-A)',
    };

    return (
        <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="management-card p-6" style={{ padding: '1.5rem' }}>
                <h3 className="chart-title mb-4" style={{ marginBottom: '1rem' }}>Generate Weekly Schedule</h3>
                <p className="text-gray-500 mb-6" style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                    Automatically generate the weekly timetable based on subject allocations and teacher availability.
                </p>
                <div className="flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" onClick={() => setIsGenerated(true)}>
                        <Calendar size={18} />
                        {isGenerated ? 'Regenerate Timetable' : 'Generate Timetable'}
                    </button>
                    <button style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', background: 'var(--color-bg-surface)', cursor: 'pointer', color: 'var(--color-text-main)' }}>
                        View Constraints
                    </button>
                </div>
            </div>

            <div className="management-card">
                <div className="table-header-actions">
                    <h3 className="chart-title">Generated Timetable Preview</h3>
                </div>
                <div className="p-6" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                    {!isGenerated ? (
                        <div style={{ background: 'var(--color-bg-body)', padding: '2rem', borderRadius: '0.5rem', border: '2px dashed var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            Timetable not yet generated. Click "Generate Timetable" to start.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '0.75rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', textAlign: 'center' }}>Time / Day</th>
                                    {days.map(day => (
                                        <th key={day} style={{ padding: '0.75rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', textAlign: 'center' }}>{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map(time => (
                                    <tr key={time}>
                                        <td style={{ padding: '0.75rem', border: '1px solid var(--color-border)', fontWeight: '600', color: 'var(--color-text-muted)' }}>{time}</td>
                                        {days.map(day => {
                                            const key = `${day}-${time}`;
                                            const entry = mockSchedule[key];
                                            return (
                                                <td key={key} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', textAlign: 'center', height: '60px' }}>
                                                    {entry ? (
                                                        <div style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '500' }}>
                                                            {entry}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#cbd5e1' }}>-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const ConflictDetection = ({ conflicts }) => (
    <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="management-card">
            <div className="table-header-actions" style={{ justifyContent: 'space-between' }}>
                <h3 className="chart-title">System Alerts & Conflicts</h3>
                <button className="btn-primary" style={{ background: 'var(--color-warning)', color: '#000' }}>
                    Run Conflict Check
                </button>
            </div>

            {conflicts.length > 0 ? (
                <div style={{ padding: '0' }}>
                    {conflicts.map((conflict) => (
                        <div key={conflict.id} style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ color: 'var(--color-error)', marginTop: '2px' }}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{conflict.type}</h4>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{conflict.description}</p>
                                <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', background: '#fee2e2', color: '#991b1b' }}>
                                    {conflict.severity} Severity
                                </span>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <button style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', color: 'var(--color-primary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                    Resolve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <CheckCircle size={48} className="text-green-500" style={{ color: 'var(--color-success)' }} />
                    <h3 className="text-lg font-medium">No Conflicts Detected</h3>
                    <p className="text-gray-500">All academic allocations look good.</p>
                </div>
            )}
        </div>
    </div>
);

export default AcademicConfiguration;
