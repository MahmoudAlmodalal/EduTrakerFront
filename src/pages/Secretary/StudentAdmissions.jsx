import React, { useState } from 'react';
import { Search, Filter, FileText, Upload, Download, Check, X, UserPlus, Users } from 'lucide-react';
import './Secretary.css';
import '../WorkstreamManager/Workstream.css';

const StudentAdmissions = () => {
    const [activeTab, setActiveTab] = useState('applications');

    // Mock Data
    // Mock Data
    const [applications] = useState([
        { id: 101, name: 'Alice Johnson', grade: '1st Grade', submittedDate: '2025-12-10', status: 'Pending' },
        { id: 102, name: 'Bob Smith', grade: '2nd Grade', submittedDate: '2025-12-11', status: 'Under Review' },
        { id: 103, name: 'Charlie Brown', grade: '1st Grade', submittedDate: '2025-12-12', status: 'Pending' },
    ]);

    const [files] = useState([
        { id: 1, student: 'Alice Johnson', type: 'Birth Certificate', size: '1.2 MB', date: '2025-12-10' },
        { id: 2, student: 'Bob Smith', type: 'Immunization Record', size: '2.5 MB', date: '2025-12-11' },
    ]);

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
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Application ID</th>
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
                            <td className="font-medium">{app.name}</td>
                            <td>{app.grade}</td>
                            <td>{app.submittedDate}</td>
                            <td>
                                <span className={`status-badge ${app.status === 'Pending' ? 'status-inactive' : 'status-active'}`}
                                    style={app.status === 'Pending' ? { backgroundColor: '#fff7ed', color: '#c2410c' } : {}}
                                >
                                    {app.status}
                                </span>
                            </td>
                            <td>
                                <div className="action-btn-group">
                                    <button className="btn-icon success" title="Approve">
                                        <Check size={18} />
                                    </button>
                                    <button className="btn-icon danger" title="Reject">
                                        <X size={18} />
                                    </button>
                                    <button className="btn-icon info" title="View Details">
                                        <FileText size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderAddNewStudent = () => (
        <div className="management-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h2 className="widget-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>Manual Student Entry</h2>
            <form>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input type="text" className="form-input" placeholder="e.g. John" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input type="text" className="form-input" placeholder="e.g. Doe" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input type="date" className="form-input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select className="form-select">
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Grade Level</label>
                        <select className="form-select">
                            <option>1st Grade</option>
                            <option>2nd Grade</option>
                            <option>3rd Grade</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Class Assignment</label>
                        <select className="form-select">
                            <option>Class 1-A</option>
                            <option>Class 1-B</option>
                            <option>Pending</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                    <h3 className="font-bold mb-4">Guardian Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Guardian Name</label>
                            <input type="text" className="form-input" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact Number</label>
                            <input type="tel" className="form-input" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mt-4">
                    <button type="button" className="btn-secondary" style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}>Cancel</button>
                    <button type="submit" className="btn-primary">Save Student Record</button>
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

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>Student Registration & Admissions</h1>
                <p>Manage new applications, enroll students, and handle documents.</p>
            </header>

            <div className="secretary-tabs">
                <button
                    className={`secretary-tab ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    <div className="tab-content">
                        <FileText size={18} />
                        New Applications
                        <span className="tab-badge">3</span>
                    </div>
                </button>
                <button
                    className={`secretary-tab ${activeTab === 'add-student' ? 'active' : ''}`}
                    onClick={() => setActiveTab('add-student')}
                >
                    <div className="tab-content">
                        <UserPlus size={18} />
                        Add New Student
                    </div>
                </button>
                <button
                    className={`secretary-tab ${activeTab === 'class-assignment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('class-assignment')}
                >
                    <div className="tab-content">
                        <Users size={18} />
                        Class Assignment
                    </div>
                </button>
                <button
                    className={`secretary-tab ${activeTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveTab('files')}
                >
                    <div className="tab-content">
                        <Upload size={18} />
                        Manage Student Files
                    </div>
                </button>
            </div>

            <div className="secretary-content">
                {activeTab === 'applications' && renderNewApplications()}
                {activeTab === 'add-student' && renderAddNewStudent()}
                {activeTab === 'class-assignment' && (
                    <div className="management-card p-6 text-center" style={{ padding: '3rem' }}>
                        <Users size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
                        <h3 className="font-bold text-gray-700">Class Assignment Interface</h3>
                        <p className="text-gray-500 mt-2">Select a grade level to begin assigning students to classes.</p>
                        <button className="btn-primary mt-4" style={{ margin: '1rem auto 0' }}>Select Grade Level</button>
                    </div>
                )}
                {activeTab === 'files' && renderManageFiles()}
            </div>
        </div>
    );
};

export default StudentAdmissions;
