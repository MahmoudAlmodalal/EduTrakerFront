import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, FileText, Upload, Download, Check, X, UserPlus, Users, AlertCircle, Edit2, GraduationCap, Clock, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import secretaryService from '../../services/secretaryService';
import { getSecretaryIconStyle } from '../../utils/secretaryHelpers';
import './Secretary.css';

const StudentAdmissions = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('applications');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [applications, setApplications] = useState([]);
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [files] = useState([]);

    const schoolId = user?.school_id || user?.school;

    const [newStudent, setNewStudent] = useState({
        first_name: '', last_name: '', email: '',
        password: 'Student@123', date_of_birth: '', grade_id: '',
    });

    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
    const [selectedGradeFilter, setSelectedGradeFilter] = useState('');

    const [gradeQuery, setGradeQuery] = useState('');
    const [showGradeDropdown, setShowGradeDropdown] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    const filteredGrades = useMemo(() =>
        (grades || []).filter(g =>
            g?.name?.toLowerCase().includes(gradeQuery.toLowerCase())
        ), [grades, gradeQuery]
    );

    // Summary stats
    const totalStudents = applications.length;
    const activeStudents = applications.filter(s => s.current_status === 'active' || s.is_active).length;
    const pendingStudents = applications.filter(s => s.current_status === 'pending').length;
    const assignedStudents = applications.filter(s => s.classroom?.classroom_name).length;

    const statCards = [
        { label: 'Total Students', value: totalStudents, icon: Users, color: 'indigo' },
        { label: 'Active', value: activeStudents, icon: CheckCircle, color: 'green' },
        { label: 'Pending', value: pendingStudents, icon: Clock, color: 'amber' },
        { label: 'Assigned to Class', value: assignedStudents, icon: GraduationCap, color: 'rose' },
    ];

    const handleGradeSelect = (grade) => {
        setNewStudent(prev => ({ ...prev, grade_id: grade.id.toString() }));
        setGradeQuery(grade.name);
        setShowGradeDropdown(false);
    };

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => { setError(''); setSuccess(''); }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    useEffect(() => {
        if (activeTab === 'applications') {
            fetchStudentApplications();
            fetchAcademicYears();
        } else if (activeTab === 'add-student') fetchGrades();
        else if (activeTab === 'class-assignment') {
            if (students.length === 0) {
                fetchStudents();
            }
            fetchAcademicYears();
            fetchGrades();
        }
        // Intentionally run when the visible tab changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    useEffect(() => {
        if (selectedAcademicYear && schoolId) {
            fetchClassrooms(schoolId, selectedAcademicYear);
        }
    }, [selectedAcademicYear, schoolId]);

    const fetchStudentApplications = async (yearId = selectedAcademicYear) => {
        try {
            setLoading(true);
            // Fetch all students instead of just applications
            const params = { school_id: schoolId };
            if (yearId) params.academic_year_id = yearId;

            const data = await secretaryService.getStudents(params);
            const studentData = data.results || data || [];

            setApplications(studentData);
            if (!yearId || students.length === 0) {
                setStudents(studentData);
            }
        }
        catch (err) { console.error('Error fetching students:', err); }
        finally { setLoading(false); }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        if (!newStudent.first_name || !newStudent.last_name || !newStudent.email || !newStudent.date_of_birth || !newStudent.grade_id) {
            setError('Please fill all required fields.');
            return;
        }

        try {
            setLoading(true);
            const studentData = {
                ...newStudent,
                username: newStudent.email, // using email as username
                role: 'student',
                school_id: schoolId
            };

            await secretaryService.createStudent(studentData);
            setSuccess('Student created successfully!');
            setNewStudent({
                first_name: '', last_name: '', email: '',
                password: 'Student@123', date_of_birth: '', grade_id: '',
            });
            setGradeQuery('');
            setActiveTab('applications');
            fetchStudentApplications();
        } catch (err) {
            console.error('Error creating student:', err);
            setError(err.response?.data?.message || 'Failed to create student. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedStudent || !selectedClassroom || !selectedAcademicYear) {
            setError('Please select a student, classroom and academic year.');
            return;
        }

        try {
            setLoading(true);
            await secretaryService.assignToClass({
                student_id: selectedStudent,
                class_room_id: selectedClassroom,
                academic_year_id: selectedAcademicYear
            });
            setSuccess('Student assigned to class successfully!');
            setSelectedStudent('');
            if (activeTab === 'class-assignment') fetchStudents(true);
        } catch (err) {
            console.error('Error assigning student:', err);
            setError(err.response?.data?.message || 'Failed to assign student to class.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        if (!editingStudent) return;

        try {
            setLoading(true);
            const studentId = editingStudent.user_id || editingStudent.id;
            await secretaryService.updateStudent(studentId, {
                current_status: editingStudent.current_status.toLowerCase()
            });
            setSuccess('Student status updated successfully!');
            setEditingStudent(null);
            fetchStudentApplications();
        } catch (err) {
            console.error('Error updating student:', err);
            setError(err.response?.data?.message || 'Failed to update student status.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async (force = false) => {
        if (!force && students.length > 0) {
            return;
        }

        try {
            setLoading(true);
            const data = await secretaryService.getStudents({ school_id: schoolId });
            setStudents(data.results || data || []);
        } catch (err) {
            console.error('Error fetching students for assignment:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGrades = async () => {
        try {
            const data = await secretaryService.getGrades({ school_id: schoolId });
            setGrades(data.results || data || []);
        } catch (err) {
            console.error('Error fetching grades:', err);
        }
    };

    const fetchAcademicYears = async () => {
        try {
            const data = await secretaryService.getAcademicYears({ school_id: schoolId });
            setAcademicYears(data.results || data || []);
        } catch (err) {
            console.error('Error fetching academic years:', err);
        }
    };

    const fetchClassrooms = async (sId, aId) => {
        try {
            const data = await secretaryService.getClassrooms(sId, aId);
            setClassrooms(data.results || data || []);
        } catch (err) {
            console.error('Error fetching classrooms:', err);
        }
    };

    const renderNewApplications = () => (
        <>
            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontSize: '13px', color: 'var(--sec-text-muted)', fontWeight: '500', marginBottom: '4px' }}>{stat.label}</p>
                                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--sec-text-main)', margin: 0 }}>{stat.value}</p>
                            </div>
                            <div style={{
                                ...getSecretaryIconStyle(stat.color),
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="management-card">
                {/* Filters Row */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    padding: '20px',
                    borderBottom: '1px solid var(--sec-border)',
                    alignItems: 'flex-end'
                }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>
                            Search Student
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sec-text-muted)' }} />
                            <input type="text" placeholder="Search by name..." className="form-input" style={{ paddingLeft: '36px', width: '100%' }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>
                            Academic Year
                        </label>
                        <select
                            className="form-select"
                            value={selectedAcademicYear}
                            style={{ minWidth: '180px' }}
                            onChange={(e) => {
                                const yearId = e.target.value;
                                setSelectedAcademicYear(yearId);
                                fetchStudentApplications(yearId);
                            }}
                        >
                            <option value="">All Academic Years</option>
                            {academicYears.map(y => (
                                <option key={y.id} value={y.id}>
                                    {y.name} {y.is_active ? '(Active)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--sec-text-muted)' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                border: '3px solid var(--sec-primary)',
                                borderTop: '3px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 12px'
                            }}></div>
                            Loading students...
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>ID</th>
                                    <th>Student Name</th>
                                    <th>Grade</th>
                                    <th>Classroom</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((student) => {
                                    const studentId = student.user_id || student.id;
                                    const status = student.current_status || (student.is_active ? 'active' : 'inactive');
                                    return (
                                        <tr key={studentId}>
                                            <td style={{ color: 'var(--sec-text-muted)', fontSize: '13px' }}>#{studentId}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '8px',
                                                        background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                                                        color: '#4f46e5',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: '600',
                                                        fontSize: '13px'
                                                    }}>
                                                        {(student.full_name || 'S').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: '500', color: 'var(--sec-text-main)' }}>
                                                        {student.full_name || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--sec-text-main)' }}>{student.current_grade?.name || 'N/A'}</td>
                                            <td style={{ color: 'var(--sec-text-muted)', fontSize: '13px' }}>{student.classroom?.classroom_name || 'Not Assigned'}</td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    ...(status === 'active'
                                                        ? { background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#059669' }
                                                        : status === 'pending'
                                                            ? { background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#d97706' }
                                                            : { background: 'var(--sec-border)', color: 'var(--sec-text-muted)' })
                                                }}>
                                                    {status === 'active' && <CheckCircle size={14} />}
                                                    {status === 'pending' && <Clock size={14} />}
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn-icon"
                                                        title="Edit Status"
                                                        onClick={() => setEditingStudent({ ...student, current_status: student.current_status || 'pending' })}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                                                            color: '#4f46e5',
                                                            border: 'none',
                                                            padding: '8px',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-icon"
                                                        title="View Details"
                                                        style={{
                                                            background: 'var(--sec-surface)',
                                                            color: 'var(--sec-text-muted)',
                                                            border: '1px solid var(--sec-border)',
                                                            padding: '8px',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {applications.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--sec-text-muted)' }}>
                                            <Users size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                            <p style={{ margin: 0 }}>No students found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );

    const renderAddNewStudent = () => (
        <div className="management-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--sec-border)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--sec-text-main)', margin: 0 }}>Manual Student Entry</h2>
                <p style={{ fontSize: '13px', color: 'var(--sec-text-muted)', marginTop: '4px' }}>Add a new student to your school</p>
            </div>
            <form onSubmit={handleCreateStudent}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>First Name *</label>
                        <input type="text" className="form-input" placeholder="e.g. John" value={newStudent.first_name} onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })} required style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>Last Name *</label>
                        <input type="text" className="form-input" placeholder="e.g. Doe" value={newStudent.last_name} onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })} required style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>Email *</label>
                        <input type="email" className="form-input" placeholder="student@example.com" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} required style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>Password</label>
                        <input type="text" className="form-input" placeholder="Default: Student@123" value={newStudent.password} onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>Date of Birth *</label>
                        <input type="date" className="form-input" value={newStudent.date_of_birth} onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>Grade *</label>
                        <input type="text" className="form-input" placeholder="Search and select grade..." value={gradeQuery}
                            onChange={(e) => { setGradeQuery(e.target.value); setShowGradeDropdown(true); }}
                            onFocus={() => setShowGradeDropdown(true)}
                            onBlur={() => setTimeout(() => setShowGradeDropdown(false), 200)}
                            required={!newStudent.grade_id}
                            style={{ width: '100%' }}
                        />
                        {showGradeDropdown && filteredGrades.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--sec-surface)', border: '1px solid var(--sec-border)', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                {filteredGrades.map(grade => (
                                    <div key={grade.id} onMouseDown={() => handleGradeSelect(grade)}
                                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--sec-border)', background: newStudent.grade_id === grade.id.toString() ? 'rgba(79, 70, 229, 0.1)' : 'var(--sec-surface)', color: 'var(--sec-text-main)' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sec-surface-hover, rgba(0,0,0,0.02))'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = newStudent.grade_id === grade.id.toString() ? 'rgba(79, 70, 229, 0.1)' : 'var(--sec-surface)'; }}
                                    >{grade.name}</div>
                                ))}
                            </div>
                        )}
                        {showGradeDropdown && filteredGrades.length === 0 && gradeQuery && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--sec-surface)', border: '1px solid var(--sec-border)', borderRadius: '8px', padding: '12px', color: 'var(--sec-text-muted)', textAlign: 'center' }}>No grades found</div>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--sec-border)' }}>
                    <button type="button" className="btn-secondary" onClick={() => setActiveTab('applications')} style={{ background: 'var(--sec-surface)', border: '1px solid var(--sec-border)', color: 'var(--sec-text-main)' }}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Student Record'}</button>
                </div>
            </form>
        </div>
    );

    const renderManageFiles = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            <div className="management-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--sec-text-main)', marginBottom: '20px' }}>Upload Documents</h3>
                <div style={{
                    border: '2px dashed var(--sec-border)',
                    borderRadius: '12px',
                    padding: '32px',
                    textAlign: 'center',
                    marginBottom: '20px',
                    background: 'var(--sec-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                        color: '#4f46e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px'
                    }}>
                        <Upload size={28} />
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--sec-text-main)', marginBottom: '4px' }}>Click to upload or drag and drop</p>
                    <p style={{ fontSize: '12px', color: 'var(--sec-text-muted)' }}>PDF, JPG up to 10MB</p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>Assign to Student</label>
                    <input type="text" className="form-input" placeholder="Search student name..." style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>Document Type</label>
                    <select className="form-select" style={{ width: '100%' }}>
                        <option>Birth Certificate</option>
                        <option>ID Card</option>
                        <option>Medical Record</option>
                        <option>Previous School Report</option>
                    </select>
                </div>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Upload File</button>
            </div>
            <div className="management-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--sec-text-main)' }}>Recent Uploads</h3>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sec-text-muted)' }} />
                        <input type="text" placeholder="Search files..." className="form-input" style={{ paddingLeft: '32px', width: '180px' }} />
                    </div>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>File Type</th>
                            <th>Student</th>
                            <th>Size</th>
                            <th>Date</th>
                            <th style={{ width: '60px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((file) => (
                            <tr key={file.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileText size={16} style={{ color: '#4f46e5' }} />
                                        <span style={{ fontWeight: '500', color: 'var(--sec-text-main)' }}>{file.type}</span>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--sec-text-main)' }}>{file.student}</td>
                                <td style={{ color: 'var(--sec-text-muted)', fontSize: '13px' }}>{file.size}</td>
                                <td style={{ color: 'var(--sec-text-muted)', fontSize: '13px' }}>{file.date}</td>
                                <td>
                                    <button style={{
                                        background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                                        color: '#059669',
                                        border: 'none',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}>
                                        <Download size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {files.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--sec-text-muted)' }}>
                                    <FileText size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                    <p style={{ margin: 0 }}>No files uploaded yet.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderClassAssignment = () => {
        const filteredClassrooms = selectedGradeFilter
            ? classrooms.filter(c => (c.grade || c.grade_id)?.toString() === selectedGradeFilter)
            : classrooms;

        return (
            <div className="management-card">
                {/* Header with controls */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    padding: '20px',
                    borderBottom: '1px solid var(--sec-border)',
                    alignItems: 'flex-end'
                }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--sec-text-main)', marginBottom: '4px' }}>Class Assignment</h3>
                        <p style={{ fontSize: '13px', color: 'var(--sec-text-muted)', margin: 0 }}>Select a student and assign them to a class.</p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        <select className="form-select" value={selectedAcademicYear} style={{ minWidth: '160px' }} onChange={(e) => setSelectedAcademicYear(e.target.value)}>
                            <option value="">Academic Year...</option>
                            {academicYears.map(y => <option key={y.id} value={y.id}>{y.name} {y.is_active ? '(Active)' : ''}</option>)}
                        </select>
                        <select className="form-select" value={selectedGradeFilter} style={{ minWidth: '130px' }} onChange={(e) => setSelectedGradeFilter(e.target.value)}>
                            <option value="">All Grades</option>
                            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        <select className="form-select" value={selectedClassroom} style={{ minWidth: '160px' }} onChange={(e) => setSelectedClassroom(e.target.value)}>
                            <option value="">Select Classroom...</option>
                            {filteredClassrooms.map(c => <option key={c.id} value={c.id}>{c.classroom_name} {c.grade_name ? '(' + c.grade_name + ')' : ''}</option>)}
                        </select>
                        <button
                            className="btn-primary"
                            onClick={handleAssign}
                            disabled={!selectedStudent || !selectedClassroom || !selectedAcademicYear}
                            style={{ opacity: (!selectedStudent || !selectedClassroom || !selectedAcademicYear) ? 0.5 : 1 }}
                        >
                            <UserPlus size={18} style={{ marginRight: '8px' }} /> Assign Student
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '20px' }}>
                    {!selectedAcademicYear ? (
                        <div style={{
                            padding: '48px',
                            textAlign: 'center',
                            color: 'var(--sec-text-muted)',
                            background: 'var(--sec-surface)',
                            borderRadius: '12px',
                            border: '2px dashed var(--sec-border)'
                        }}>
                            <AlertCircle size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                            <p style={{ margin: 0 }}>Please select an academic year to see classrooms and assign students.</p>
                        </div>
                    ) : loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--sec-text-muted)' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                border: '3px solid var(--sec-primary)',
                                borderTop: '3px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 12px'
                            }}></div>
                            Loading students...
                        </div>
                    ) : students.length === 0 ? (
                        <div style={{
                            padding: '48px',
                            textAlign: 'center',
                            color: 'var(--sec-text-muted)',
                            background: 'var(--sec-surface)',
                            borderRadius: '12px',
                            border: '2px dashed var(--sec-border)'
                        }}>
                            <Users size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                            <p style={{ margin: 0 }}>No students found.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {students.map(student => {
                                const studentId = (student.user_id || student.id)?.toString();
                                const isSelected = selectedStudent === studentId;
                                return (
                                    <div
                                        key={studentId}
                                        onClick={() => setSelectedStudent(isSelected ? '' : studentId)}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: isSelected ? '2px solid #4f46e5' : '1px solid var(--sec-border)',
                                            background: isSelected ? 'rgba(79, 70, 229, 0.05)' : 'var(--sec-surface)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.15)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    background: isSelected ? 'linear-gradient(135deg, #c7d2fe, #a5b4fc)' : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                                                    color: '#4f46e5',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: '700',
                                                    fontSize: '16px'
                                                }}>
                                                    {(student.full_name || 'S').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 style={{ fontWeight: '600', color: 'var(--sec-text-main)', margin: 0, fontSize: '14px' }}>{student.full_name}</h4>
                                                    <p style={{ fontSize: '12px', color: 'var(--sec-text-muted)', margin: '2px 0 0' }}>{student.email}</p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div style={{
                                                    background: '#4f46e5',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    padding: '4px'
                                                }}>
                                                    <Check size={14} />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                background: 'var(--sec-border)',
                                                color: 'var(--sec-text-muted)',
                                                padding: '4px 8px',
                                                borderRadius: '6px'
                                            }}>ID: #{studentId}</span>
                                            {student.current_grade?.name && (
                                                <span style={{
                                                    fontSize: '11px',
                                                    background: 'rgba(79, 70, 229, 0.1)',
                                                    color: '#4f46e5',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px'
                                                }}>{student.current_grade.name}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderEditModal = () => {
        if (!editingStudent) return null;

        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    background: 'var(--sec-surface)',
                    borderRadius: '16px',
                    padding: '24px',
                    width: '100%',
                    maxWidth: '420px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--sec-text-main)', margin: 0 }}>Edit Student Status</h3>
                        <button
                            onClick={() => setEditingStudent(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--sec-text-muted)',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <form onSubmit={handleUpdateStudent}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>Student Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={editingStudent.full_name || ''}
                                readOnly
                                style={{ width: '100%', background: 'var(--sec-border)', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>Enrollment Status</label>
                            <select
                                className="form-select"
                                value={editingStudent.current_status}
                                onChange={(e) => setEditingStudent({ ...editingStudent, current_status: e.target.value })}
                                style={{ width: '100%' }}
                            >
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="graduated">Graduated</option>
                                <option value="expelled">Expelled</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setEditingStudent(null)}
                                style={{
                                    background: 'var(--sec-surface)',
                                    border: '1px solid var(--sec-border)',
                                    color: 'var(--sec-text-main)',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>{t('secretary.admissions.title')}</h1>
                <p>{t('secretary.admissions.subtitle')}</p>
            </header>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}
            {success && (
                <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#16a34a',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <CheckCircle size={18} /> {success}
                </div>
            )}

            <div className="secretary-tabs">
                <button className={'secretary-tab ' + (activeTab === 'applications' ? 'active' : '')} onClick={() => setActiveTab('applications')}>
                    <div className="tab-content"><FileText size={18} /> {t('secretary.admissions.newApplications')} <span className="tab-badge">{applications.length}</span></div>
                </button>
                <button className={'secretary-tab ' + (activeTab === 'add-student' ? 'active' : '')} onClick={() => setActiveTab('add-student')}>
                    <div className="tab-content"><UserPlus size={18} /> {t('secretary.admissions.addStudent')}</div>
                </button>
                <button className={'secretary-tab ' + (activeTab === 'class-assignment' ? 'active' : '')} onClick={() => setActiveTab('class-assignment')}>
                    <div className="tab-content"><Users size={18} /> {t('secretary.admissions.classAssignment')}</div>
                </button>
                <button className={'secretary-tab ' + (activeTab === 'files' ? 'active' : '')} onClick={() => setActiveTab('files')}>
                    <div className="tab-content"><Upload size={18} /> {t('secretary.admissions.manageFiles')}</div>
                </button>
            </div>

            <div className="secretary-content">
                {activeTab === 'applications' && renderNewApplications()}
                {activeTab === 'add-student' && renderAddNewStudent()}
                {activeTab === 'class-assignment' && renderClassAssignment()}
                {activeTab === 'files' && renderManageFiles()}
            </div>
            {renderEditModal()}

        </div>
    );
};

export default StudentAdmissions;
