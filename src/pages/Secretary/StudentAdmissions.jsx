import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, FileText, Upload, Download, Check, X, UserPlus, Users, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import secretaryService from '../../services/secretaryService';
import './Secretary.css';
import '../WorkstreamManager/Workstream.css';

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

    const filteredGrades = useMemo(() =>
        (grades || []).filter(g =>
            g?.name?.toLowerCase().includes(gradeQuery.toLowerCase())
        ), [grades, gradeQuery]
    );

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
        if (activeTab === 'applications') fetchApplications();
        else if (activeTab === 'add-student') fetchGrades();
        else if (activeTab === 'class-assignment') {
            fetchStudents(); fetchAcademicYears(); fetchGrades();
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedAcademicYear && schoolId) {
            fetchClassrooms(schoolId, selectedAcademicYear);
        }
    }, [selectedAcademicYear, schoolId]);

    const fetchApplications = async () => {
        try { setLoading(true); const data = await secretaryService.getApplications(); setApplications(data.results || data || []); }
        catch (err) { console.error('Error fetching applications:', err); }
        finally { setLoading(false); }
    };

    const fetchStudents = async () => {
        try { setLoading(true); const data = await secretaryService.getStudents({ school_id: schoolId }); setStudents(data.results || data || []); }
        catch (err) { console.error('Error fetching students:', err); }
        finally { setLoading(false); }
    };

    const fetchGrades = async () => {
        try { const data = await secretaryService.getGrades(); setGrades(data.results || data || []); }
        catch (err) { console.error('Error fetching grades:', err); }
    };

    const fetchAcademicYears = async () => {
        try {
            const data = await secretaryService.getAcademicYears();
            const years = data.results || data || [];
            setAcademicYears(years);
            const active = years.find(y => y.is_active);
            if (active) setSelectedAcademicYear(active.id.toString());
        } catch (err) { console.error('Error fetching academic years:', err); }
    };

    const fetchClassrooms = async (school, academicYearId) => {
        try { const data = await secretaryService.getClassrooms(school, academicYearId); setClassrooms(data.results || data || []); }
        catch (err) { console.error('Error fetching classrooms:', err); setClassrooms([]); }
    };

    const handleApprove = async (id) => {
        try { await secretaryService.approveApplication(id); setSuccess('Application approved!'); fetchApplications(); }
        catch (err) { setError('Error approving: ' + (err.response?.data?.detail || err.message)); }
    };

    const handleReject = async (id) => {
        try { await secretaryService.rejectApplication(id); setSuccess('Application rejected.'); fetchApplications(); }
        catch (err) { setError('Error rejecting: ' + (err.response?.data?.detail || err.message)); }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault(); setError('');
        try {
            setLoading(true);
            const payload = {
                email: newStudent.email,
                full_name: (newStudent.first_name + ' ' + newStudent.last_name).trim(),
                password: newStudent.password || 'Student@123',
                school_id: schoolId,
                grade_id: parseInt(newStudent.grade_id),
                date_of_birth: newStudent.date_of_birth,
                admission_date: new Date().toISOString().split('T')[0],
            };
            await secretaryService.createStudent(payload);
            setSuccess('Student created successfully!');
            setNewStudent({ first_name: '', last_name: '', email: '', password: 'Student@123', date_of_birth: '', grade_id: '' });
            setGradeQuery('');
        } catch (err) {
            const errData = err.response?.data;
            if (errData && typeof errData === 'object') {
                setError(Object.entries(errData).map(([k,v]) => k + ': ' + (Array.isArray(v) ? v.join(', ') : v)).join(' | '));
            } else { setError('Error creating student: ' + (err.message || 'Unknown error')); }
        } finally { setLoading(false); }
    };

    const handleAssign = async () => {
        if (!selectedClassroom || !selectedStudent || !selectedAcademicYear) {
            setError('Please select a student, academic year, and classroom.'); return;
        }
        try {
            setLoading(true);
            await secretaryService.assignToClass({
                student_id: parseInt(selectedStudent),
                class_room_id: parseInt(selectedClassroom),
                academic_year_id: parseInt(selectedAcademicYear),
            });
            setSuccess('Student assigned to class successfully!');
            setSelectedStudent(''); setSelectedClassroom(''); fetchStudents();
        } catch (err) {
            const errData = err.response?.data;
            if (errData && typeof errData === 'object') {
                setError(Object.entries(errData).map(([k,v]) => k + ': ' + (Array.isArray(v) ? v.join(', ') : v)).join(' | '));
            } else { setError('Error assigning student: ' + (err.message || 'Unknown error')); }
        } finally { setLoading(false); }
    };

    const renderNewApplications = () => (
        <div className="management-card">
            <div className="table-controls">
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search applications..." className="search-input" />
                </div>
                <button className="btn-primary"><Filter size={18} /> Filter</button>
            </div>
            {loading ? <p className="p-4 text-center">Loading applications...</p> : (
                <table className="data-table">
                    <thead><tr><th>ID</th><th>Student Name</th><th>Grade</th><th>Classroom</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {applications.map((app) => (
                            <tr key={app.id}>
                                <td>#{app.id}</td>
                                <td className="font-medium">{app.student_name || app.student?.full_name || 'N/A'}</td>
                                <td>{app.grade_name || 'N/A'}</td>
                                <td>{app.classroom_name || 'N/A'}</td>
                                <td><span className={`status-badge ${app.is_active ? 'status-active' : 'status-inactive'}`}>{app.is_active ? 'Active' : 'Pending'}</span></td>
                                <td>
                                    <div className="action-btn-group">
                                        <button className="btn-icon success" title="Approve" onClick={() => handleApprove(app.id)}><Check size={18} /></button>
                                        <button className="btn-icon danger" title="Reject" onClick={() => handleReject(app.id)}><X size={18} /></button>
                                        <button className="btn-icon info" title="View Details"><FileText size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {applications.length === 0 && <tr><td colSpan="6" className="text-center p-4">No applications found.</td></tr>}
                    </tbody>
                </table>
            )}
        </div>
    );

    const renderAddNewStudent = () => (
        <div className="management-card max-w-3xl mx-auto p-8">
            <h2 className="widget-header text-xl font-bold mb-6 pb-4 border-b border-gray-100">Manual Student Entry</h2>
            <form onSubmit={handleCreateStudent}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                        <label className="form-label">First Name *</label>
                        <input type="text" className="form-input" placeholder="e.g. John" value={newStudent.first_name} onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Last Name *</label>
                        <input type="text" className="form-input" placeholder="e.g. Doe" value={newStudent.last_name} onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input type="email" className="form-input" placeholder="student@example.com" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input type="text" className="form-input" placeholder="Default: Student@123" value={newStudent.password} onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date of Birth *</label>
                        <input type="date" className="form-input" value={newStudent.date_of_birth} onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Grade *</label>
                        <input type="text" className="form-input" placeholder="Search and select grade..." value={gradeQuery}
                            onChange={(e) => { setGradeQuery(e.target.value); setShowGradeDropdown(true); }}
                            onFocus={() => setShowGradeDropdown(true)}
                            onBlur={() => setTimeout(() => setShowGradeDropdown(false), 200)}
                            required={!newStudent.grade_id}
                        />
                        {showGradeDropdown && filteredGrades.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                {filteredGrades.map(grade => (
                                    <div key={grade.id} onMouseDown={() => handleGradeSelect(grade)}
                                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', background: newStudent.grade_id === grade.id.toString() ? '#eff6ff' : 'white' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = newStudent.grade_id === grade.id.toString() ? '#eff6ff' : 'white'; }}
                                    >{grade.name}</div>
                                ))}
                            </div>
                        )}
                        {showGradeDropdown && filteredGrades.length === 0 && gradeQuery && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', color: '#9ca3af', textAlign: 'center' }}>No grades found</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button type="button" className="btn-secondary bg-white border border-gray-300" onClick={() => setActiveTab('applications')}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Student Record'}</button>
                </div>
            </form>
        </div>
    );

    const renderManageFiles = () => (
        <div className="file-management-grid">
            <div className="upload-card">
                <h3 className="font-bold mb-4">Upload Documents</h3>
                <div className="file-upload-area">
                    <Upload size={32} className="file-upload-icon" />
                    <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG up to 10MB</p>
                </div>
                <div className="form-group">
                    <label className="form-label">Assign to Student</label>
                    <input type="text" className="form-input" placeholder="Search student name..." />
                </div>
                <div className="form-group">
                    <label className="form-label">Document Type</label>
                    <select className="form-select">
                        <option>Birth Certificate</option><option>ID Card</option><option>Medical Record</option><option>Previous School Report</option>
                    </select>
                </div>
                <button className="btn-primary w-full" style={{ justifyContent: 'center' }}>Upload File</button>
            </div>
            <div className="file-list-card">
                <div className="table-controls">
                    <h3 className="font-bold">Recent Uploads</h3>
                    <div className="search-wrapper"><Search size={16} className="search-icon" /><input type="text" placeholder="Search files..." className="search-input" /></div>
                </div>
                <table className="data-table">
                    <thead><tr><th>File Name / Type</th><th>Student</th><th>Size</th><th>Date</th><th>Actions</th></tr></thead>
                    <tbody>
                        {files.map((file) => (
                            <tr key={file.id}>
                                <td><div className="flex items-center gap-2"><FileText size={16} className="text-blue-500" /><span className="font-medium">{file.type}</span></div></td>
                                <td>{file.student}</td><td className="text-gray-500">{file.size}</td><td className="text-gray-500">{file.date}</td>
                                <td><button className="btn-icon"><Download size={18} /></button></td>
                            </tr>
                        ))}
                        {files.length === 0 && <tr><td colSpan="5" className="text-center p-4">No files uploaded yet.</td></tr>}
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
                <div className="widget-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Class Assignment</h3>
                            <p className="text-gray-500 text-sm">Select a student and assign them to a class.</p>
                        </div>
                        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                            <select className="form-select" value={selectedAcademicYear} style={{ width: '180px' }} onChange={(e) => setSelectedAcademicYear(e.target.value)}>
                                <option value="">Academic Year...</option>
                                {academicYears.map(y => <option key={y.id} value={y.id}>{y.name} {y.is_active ? '(Active)' : ''}</option>)}
                            </select>
                            <select className="form-select" value={selectedGradeFilter} style={{ width: '150px' }} onChange={(e) => setSelectedGradeFilter(e.target.value)}>
                                <option value="">All Grades</option>
                                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <select className="form-select" value={selectedClassroom} style={{ width: '180px' }} onChange={(e) => setSelectedClassroom(e.target.value)}>
                                <option value="">Select Classroom...</option>
                                {filteredClassrooms.map(c => <option key={c.id} value={c.id}>{c.classroom_name} {c.grade_name ? '(' + c.grade_name + ')' : ''}</option>)}
                            </select>
                            <button className={'btn-primary' + ((!selectedStudent || !selectedClassroom || !selectedAcademicYear) ? ' opacity-50 cursor-not-allowed' : '')}
                                onClick={handleAssign} disabled={!selectedStudent || !selectedClassroom || !selectedAcademicYear}>
                                <UserPlus size={18} style={{ marginRight: '8px' }} /> Assign Student
                            </button>
                        </div>
                    </div>
                </div>

                {!selectedAcademicYear ? (
                    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <AlertCircle size={48} className="mx-auto mb-2 opacity-20" />
                        <p>Please select an academic year to see classrooms and assign students.</p>
                    </div>
                ) : loading ? (
                    <p className="text-center p-8">Loading students...</p>
                ) : students.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <Users size={48} className="mx-auto mb-2 opacity-20" />
                        <p>No students found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map(student => {
                            const studentId = (student.user_id || student.id)?.toString();
                            const isSelected = selectedStudent === studentId;
                            return (
                                <div key={studentId} onClick={() => setSelectedStudent(isSelected ? '' : studentId)}
                                    className={'student-card p-4 rounded-lg border transition-all cursor-pointer relative overflow-hidden group ' + (isSelected ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm')}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ' + (isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600')}>
                                                {(student.full_name || 'S').charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{student.full_name}</h4>
                                                <p className="text-xs text-gray-500">{student.email}</p>
                                            </div>
                                        </div>
                                        {isSelected && <div className="bg-blue-500 text-white rounded-full p-1"><Check size={14} /></div>}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">ID: #{studentId}</span>
                                        {student.current_grade?.name && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">{student.current_grade.name}</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}
            {success && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                    {success}
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
        </div>
    );
};

export default StudentAdmissions;
