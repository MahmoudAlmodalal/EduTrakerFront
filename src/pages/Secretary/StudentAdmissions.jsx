import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, Upload, Download, Check, X, UserPlus, Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';
import './Secretary.css';
import '../WorkstreamManager/Workstream.css';

const StudentAdmissions = () => {
    const { t } = useTheme();
    const [activeTab, setActiveTab] = useState('applications');
    const [loading, setLoading] = useState(false);

    // Backend Data States
    const [applications, setApplications] = useState([]);
    const [unassignedStudents, setUnassignedStudents] = useState([]);
    const [files] = useState([]); // File management can be connected later if needed

    // Form States
    const [newStudent, setNewStudent] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: 'ChangeMe123!', // Default password
        date_of_birth: '',
        gender: 'Male',
        grade_level_id: '',
        school_id: 1, // Should be fetched from profile
        guardian_name: '',
        guardian_phone: ''
    });

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');

    useEffect(() => {
        if (activeTab === 'applications') {
            fetchApplications();
        } else if (activeTab === 'class-assignment') {
            fetchUnassignedStudents();
        }
    }, [activeTab]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const data = await secretaryService.getApplications();
            // Data might be paginated
            setApplications(data.results || data);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnassignedStudents = async () => {
        try {
            setLoading(true);
            const data = await secretaryService.getUnassignedStudents();
            setUnassignedStudents(data.results || data);
        } catch (error) {
            console.error('Error fetching unassigned students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await secretaryService.approveApplication(id);
            fetchApplications();
        } catch (error) {
            alert('Error approving application: ' + error.message);
        }
    };

    const handleReject = async (id) => {
        try {
            await secretaryService.rejectApplication(id);
            fetchApplications();
        } catch (error) {
            alert('Error rejecting application: ' + error.message);
        }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            // Transform data if needed
            const payload = {
                email: newStudent.email,
                full_name: `${newStudent.first_name} ${newStudent.last_name}`,
                password: newStudent.password,
                school_id: 1, // Mock school id
                date_of_birth: newStudent.date_of_birth,
                gender: newStudent.gender,
                // Add other fields as per backend expectations
            };
            await secretaryService.createStudent(payload);
            alert('Student record created successfully!');
            setActiveTab('applications');
        } catch (error) {
            alert('Error creating student: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedClass || !selectedStudent) return;
        try {
            await secretaryService.assignToClass(selectedStudent, selectedClass);
            alert('Student assigned successfully!');
            fetchUnassignedStudents();
            setSelectedStudent('');
        } catch (error) {
            alert('Error assigning student: ' + error.message);
        }
    };

    // Render Functions
    const renderNewApplications = () => (
        <div className="management-card">
            <div className="table-controls">
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search applications..."
                        className="search-input"
                    />
                </div>
                <button className="btn-primary">
                    <Filter size={18} />
                    Filter
                </button>
            </div>
            {loading ? <p className="p-4 text-center">Loading applications...</p> : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student Name</th>
                            <th>Grade Applied</th>
                            <th>Submitted Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map((app) => (
                            <tr key={app.id}>
                                <td>#{app.id}</td>
                                <td className="font-medium">{app.student_name || 'N/A'}</td>
                                <td>{app.grade_name || app.grade_level || 'N/A'}</td>
                                <td>{app.created_at?.split('T')[0] || 'N/A'}</td>
                                <td>
                                    <span className={`status-badge ${app.is_active ? 'status-active' : 'status-inactive'}`}>
                                        {app.is_active ? 'Active' : 'Pending'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-btn-group">
                                        <button className="btn-icon success" title="Approve" onClick={() => handleApprove(app.id)}>
                                            <Check size={18} />
                                        </button>
                                        <button className="btn-icon danger" title="Reject" onClick={() => handleReject(app.id)}>
                                            <X size={18} />
                                        </button>
                                        <button className="btn-icon info" title="View Details">
                                            <FileText size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {applications.length === 0 && (
                            <tr><td colSpan="6" className="text-center p-4">No applications found.</td></tr>
                        )}
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
                        <label className="form-label">First Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. John"
                            value={newStudent.first_name}
                            onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Doe"
                            value={newStudent.last_name}
                            onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="student@example.com"
                            value={newStudent.email}
                            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input
                            type="date"
                            className="form-input"
                            value={newStudent.date_of_birth}
                            onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select
                            className="form-select"
                            value={newStudent.gender}
                            onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="font-bold mb-4 text-lg text-gray-800">Guardian Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                            <label className="form-label">Guardian Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newStudent.guardian_name}
                                onChange={(e) => setNewStudent({ ...newStudent, guardian_name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact Number</label>
                            <input
                                type="tel"
                                className="form-input"
                                value={newStudent.guardian_phone}
                                onChange={(e) => setNewStudent({ ...newStudent, guardian_phone: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <button type="button" className="btn-secondary bg-white border border-gray-300" onClick={() => setActiveTab('applications')}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Student Record'}
                    </button>
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
                        <option>Birth Certificate</option>
                        <option>ID Card</option>
                        <option>Medical Record</option>
                        <option>Previous School Report</option>
                    </select>
                </div>
                <button className="btn-primary w-full" style={{ justifyContent: 'center' }}>Upload File</button>
            </div>

            <div className="file-list-card">
                <div className="table-controls">
                    <h3 className="font-bold">Recent Uploads</h3>
                    <div className="search-wrapper">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Search files..." className="search-input" />
                    </div>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>File Name / Type</th>
                            <th>Student</th>
                            <th>Size</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((file) => (
                            <tr key={file.id}>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <FileText size={16} className="text-blue-500" />
                                        <span className="font-medium">{file.type}</span>
                                    </div>
                                </td>
                                <td>{file.student}</td>
                                <td className="text-gray-500">{file.size}</td>
                                <td className="text-gray-500">{file.date}</td>
                                <td>
                                    <button className="btn-icon">
                                        <Download size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderClassAssignment = () => {
        const toggleStudentSelection = (id) => {
            const strId = id.toString();
            setSelectedStudent(selectedStudent === strId ? '' : strId);
        };

        return (
            <div className="management-card">
                <div className="widget-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Class Assignment</h3>
                        <p className="text-gray-500 text-sm">Select students to assign them to a class.</p>
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="form-select"
                            value={selectedClass}
                            style={{ width: '200px' }}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">Select Target Class...</option>
                            <option value="1">Class 1-A</option>
                            <option value="2">Class 1-B</option>
                        </select>
                        <button
                            className={`btn-primary ${(!selectedStudent || !selectedClass) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleAssign}
                            disabled={!selectedStudent || !selectedClass}
                        >
                            <UserPlus size={18} style={{ marginRight: '8px' }} />
                            Assign Student
                        </button>
                    </div>
                </div>

                <div className="assignment-grid-container">
                    {loading ? <p className="text-center p-8">Loading students...</p> : unassignedStudents.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <Users size={48} className="mx-auto mb-2 opacity-20" />
                            <p>All students have been assigned!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unassignedStudents.map(student => (
                                <div
                                    key={student.id}
                                    onClick={() => toggleStudentSelection(student.id)}
                                    className={`student-card p-4 rounded-lg border transition-all cursor-pointer relative overflow-hidden group ${selectedStudent === student.id.toString()
                                        ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500'
                                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${selectedStudent === student.id.toString() ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                                                }`}>
                                                {(student.full_name || student.user?.full_name || 'S').charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{student.full_name || student.user?.full_name}</h4>
                                                <p className="text-xs text-gray-500">{student.grade_name || 'No Grade'}</p>
                                            </div>
                                        </div>
                                        {selectedStudent === student.id.toString() && (
                                            <div className="bg-blue-500 text-white rounded-full p-1">
                                                <Check size={14} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">ID: #{student.id}</span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Pending</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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

            <div className="secretary-tabs">
                <button
                    className={`secretary-tab ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    <div className="tab-content">
                        <FileText size={18} />
                        {t('secretary.admissions.newApplications')}
                        <span className="tab-badge">{applications.length}</span>
                    </div>
                </button>
                <button
                    className={`secretary-tab ${activeTab === 'add-student' ? 'active' : ''}`}
                    onClick={() => setActiveTab('add-student')}
                >
                    <div className="tab-content">
                        <UserPlus size={18} />
                        {t('secretary.admissions.addStudent')}
                    </div>
                </button>
                <button
                    className={`secretary-tab ${activeTab === 'class-assignment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('class-assignment')}
                >
                    <div className="tab-content">
                        <Users size={18} />
                        {t('secretary.admissions.classAssignment')}
                    </div>
                </button>
                <button
                    className={`secretary-tab ${activeTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveTab('files')}
                >
                    <div className="tab-content">
                        <Upload size={18} />
                        {t('secretary.admissions.manageFiles')}
                    </div>
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
