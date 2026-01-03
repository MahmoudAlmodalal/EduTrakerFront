import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, Upload, Download, Check, X, UserPlus, Users, Trash2, Edit } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Secretary.css';
// import '../WorkstreamManager/Workstream.css'; // Commenting out potentially missing CSS to be safe

const StudentAdmissions = () => {
    const { t } = useTheme();
    const [activeTab, setActiveTab] = useState('applications');

    // --- MOCK DATA & STATE ---

    const safeParse = (key, fallback) => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch (e) {
            console.error(`Error parsing ${key}:`, e);
            return fallback;
        }
    };

    // Applications
    const [applications, setApplications] = useState(() => safeParse('sec_applications', [
        { id: 101, name: 'Alice Johnson', grade: '1st Grade', submittedDate: '2025-12-10', status: 'Pending' },
        { id: 102, name: 'Bob Smith', grade: '2nd Grade', submittedDate: '2025-12-11', status: 'Under Review' },
        { id: 103, name: 'Charlie Brown', grade: '1st Grade', submittedDate: '2025-12-12', status: 'Pending' },
    ]));

    // Files
    const [files, setFiles] = useState(() => safeParse('sec_files', [
        { id: 1, student: 'Alice Johnson', type: 'Birth Certificate', size: '1.2 MB', date: '2025-12-10', content: 'Demo Content 1' },
        { id: 2, student: 'Bob Smith', type: 'Immunization Record', size: '2.5 MB', date: '2025-12-11', content: 'Demo Content 2' },
    ]));

    // Students
    const [allStudents, setAllStudents] = useState(() => safeParse('sec_students', [
        { id: 201, name: 'David Lee', grade: '1st Grade', class: null, gender: 'Male', dob: '2018-05-15', guardian: 'Sarah Lee', contact: '555-0101' },
        { id: 202, name: 'Eva Green', grade: '1st Grade', class: null, gender: 'Female', dob: '2018-08-20', guardian: 'Tom Green', contact: '555-0102' },
        { id: 203, name: 'Frank White', grade: '2nd Grade', class: null, gender: 'Male', dob: '2017-03-10', guardian: 'Mary White', contact: '555-0103' },
        { id: 204, name: 'Grace Hall', grade: '1st Grade', class: null, gender: 'Female', dob: '2018-11-05', guardian: 'John Hall', contact: '555-0104' },
        { id: 1, name: 'Alice Johnson', grade: '1st Grade', class: '1-A', gender: 'Female', dob: '2018-01-01', guardian: 'Mrs. Johnson', contact: '555-1111' },
        { id: 2, name: 'Bob Smith', grade: '2nd Grade', class: '1-B', gender: 'Male', dob: '2017-06-15', guardian: 'Mr. Smith', contact: '555-2222' },
    ]));

    
    // --- PERSISTENCE ---
    useEffect(() => { localStorage.setItem('sec_applications', JSON.stringify(applications)); }, [applications]);
    useEffect(() => { localStorage.setItem('sec_files', JSON.stringify(files)); }, [files]);
    useEffect(() => { localStorage.setItem('sec_students', JSON.stringify(allStudents)); }, [allStudents]);


    // --- LOCAL UI STATE ---

    // Application Search
    const [appSearchTerm, setAppSearchTerm] = useState('');
    const [appFilterStatus, setAppFilterStatus] = useState('All');

    // New Student Form
    const [newStudentForm, setNewStudentForm] = useState({
        firstName: '', lastName: '', grade: '1st Grade', dob: '', gender: 'Male', guardian: '', contact: ''
    });

    // Class Assignment
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [editStudent, setEditStudent] = useState(null); // For Modal

    // File Management
    const [fileSearchTerm, setFileSearchTerm] = useState('');
    const [uploadConfig, setUploadConfig] = useState({ studentName: '', docType: 'Birth Certificate' });


    // --- HANDLERS ---

    const handleSaveStudent = (e) => {
        e.preventDefault();
        const studentName = `${newStudentForm.firstName} ${newStudentForm.lastName}`;
        const newStudent = {
            id: Date.now(),
            name: studentName,
            grade: newStudentForm.grade,
            dob: newStudentForm.dob,
            gender: newStudentForm.gender,
            guardian: newStudentForm.guardian,
            contact: newStudentForm.contact,
            class: null 
        };
        setAllStudents([...allStudents, newStudent]);
        alert(`Student ${studentName} saved!`);
        setNewStudentForm({ firstName: '', lastName: '', grade: '1st Grade', dob: '', gender: 'Male', guardian: '', contact: '' });
        setActiveTab('class-assignment');
    };

    const handleAssign = () => {
        if (!selectedClass || !selectedStudent) return;
        setAllStudents(prev => prev.map(s => 
            s.id.toString() === selectedStudent ? { ...s, class: selectedClass } : s
        ));
        setSelectedStudent('');
        alert('Student assigned successfully!');
    };

    const handleUpdateStudent = (e) => {
        e.preventDefault();
        if (!editStudent) return;
        setAllStudents(prev => prev.map(s => s.id === editStudent.id ? editStudent : s));
        setEditStudent(null);
        alert('Student details updated!');
    };

    const handleFileUploadChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const newFileRecord = {
                id: Date.now(),
                student: uploadConfig.studentName || 'Unassigned',
                type: uploadConfig.docType,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                date: new Date().toISOString().split('T')[0],
                name: file.name,
                content: "Real file content would go here" // In a real app we'd upload to server
            };
            setFiles([newFileRecord, ...files]);
            alert(`File "${file.name}" uploaded!`);
        }
    };

    const handleDownload = (file) => {
        // Create a dummy blob for validation/demo
        const element = document.createElement("a");
        const fileContent = file.content || "Demo File Content for " + file.type;
        const fileBlob = new Blob([fileContent], {type: 'text/plain'});
        element.href = URL.createObjectURL(fileBlob);
        element.download = file.name || `${file.type.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };


    // --- RENDERERS ---

    const renderNewApplications = () => {
        // Defensive filtering
        const filteredApps = (applications || []).filter(app => 
            (appFilterStatus === 'All' || app.status === appFilterStatus) &&
            (app.name?.toLowerCase().includes(appSearchTerm.toLowerCase()) || 
             app.id?.toString().includes(appSearchTerm))
        );

        return (
            <div className="management-card">
                <div className="table-controls">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search applications..."
                            className="search-input"
                            value={appSearchTerm}
                            onChange={(e) => setAppSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="form-select" 
                        style={{ width: 'auto' }}
                        value={appFilterStatus}
                        onChange={(e) => setAppFilterStatus(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Approved">Approved</option>
                    </select>
                </div>
                <div style={{overflowX: 'auto'}}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Application ID</th>
                                <th>Student Name</th>
                                <th>Grade</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApps.map((app) => (
                                <tr key={app.id}>
                                    <td>#{app.id}</td>
                                    <td>{app.name}</td>
                                    <td>{app.grade}</td>
                                    <td>{app.submittedDate}</td>
                                    <td><span className={`status-badge ${app.status === 'Pending' ? 'status-inactive' : 'status-active'}`}>{app.status}</span></td>
                                    <td>
                                        <div className="action-btn-group">
                                            <button className="btn-icon success" onClick={() => setApplications(apps => apps.map(x => x.id === app.id ? {...x, status: 'Approved'} : x))}><Check size={18}/></button>
                                            <button className="btn-icon danger" onClick={() => setApplications(apps => apps.filter(x => x.id !== app.id))}><X size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderAddNewStudent = () => (
        <div className="management-card max-w-3xl mx-auto p-4 md:p-8">
            <h2 className="widget-header text-xl font-bold mb-6 pb-4 border-b border-gray-100">Manual Student Entry</h2>
            <form onSubmit={handleSaveStudent}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input type="text" className="form-input" required value={newStudentForm.firstName} onChange={e => setNewStudentForm({...newStudentForm, firstName: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input type="text" className="form-input" required value={newStudentForm.lastName} onChange={e => setNewStudentForm({...newStudentForm, lastName: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input type="date" className="form-input" value={newStudentForm.dob} onChange={e => setNewStudentForm({...newStudentForm, dob: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select className="form-select" value={newStudentForm.gender} onChange={e => setNewStudentForm({...newStudentForm, gender: e.target.value})}>
                            <option>Male</option>
                            <option>Female</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Grade</label>
                        <select className="form-select" value={newStudentForm.grade} onChange={e => setNewStudentForm({...newStudentForm, grade: e.target.value})}>
                            <option>1st Grade</option>
                            <option>2nd Grade</option>
                        </select>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="font-bold mb-4 text-lg text-gray-800">Guardian Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                            <label className="form-label">Guardian Name</label>
                            <input type="text" className="form-input" value={newStudentForm.guardian} onChange={e => setNewStudentForm({...newStudentForm, guardian: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact</label>
                            <input type="tel" className="form-input" value={newStudentForm.contact} onChange={e => setNewStudentForm({...newStudentForm, contact: e.target.value})} />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button type="submit" className="btn-primary">Save Student Record</button>
                </div>
            </form>
        </div>
    );

    const renderClassAssignment = () => {
        // Filter unassigned students by search term
        const unassignedStudents = (allStudents || []).filter(s => 
            !s.class && 
            s.name?.toLowerCase().includes(studentSearchTerm.toLowerCase())
        );

        const toggleStudentSelection = (id) => {
            const strId = id.toString();
            setSelectedStudent(selectedStudent === strId ? '' : strId);
        };

        return (
            <div className="management-card">
                <div className="widget-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Class Assignment</h3>
                        <p className="text-gray-500 text-sm">Select target class and assign pending students. <span className="text-blue-600 font-medium ml-2">(Double-click student to edit)</span></p>
                    </div>
                    <div className="flex gap-2">
                        <select className="form-select" value={selectedClass} style={{ width: '200px' }} onChange={(e) => setSelectedClass(e.target.value)}>
                            <option value="">Select Target Class...</option>
                            <option value="1-A">Class 1-A</option>
                            <option value="1-B">Class 1-B</option>
                            <option value="2-A">Class 2-A</option>
                        </select>
                        <button className={`btn-primary ${(!selectedStudent || !selectedClass) ? 'opacity-50' : ''}`} onClick={handleAssign} disabled={!selectedStudent || !selectedClass}>
                            <UserPlus size={18} style={{ marginRight: '8px' }} />
                            Assign
                        </button>
                    </div>
                </div>

                <div className="assignment-grid-container">
                    <div style={{ marginBottom: '1rem' }}>
                         <input 
                            type="text" 
                            placeholder="Search unassigned students..." 
                            className="form-input"
                            value={studentSearchTerm}
                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                        />
                    </div>
                    {unassignedStudents.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <Users size={48} className="mx-auto mb-2 opacity-20" />
                            <p>No matching unassigned students found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unassignedStudents.map(student => (
                                <div
                                    key={student.id}
                                    onClick={() => toggleStudentSelection(student.id)}
                                    onDoubleClick={() => setEditStudent(student)}
                                    className={`student-card p-4 rounded-lg border transition-all cursor-pointer relative overflow-hidden group ${selectedStudent === student.id.toString()
                                        ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500'
                                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${selectedStudent === student.id.toString() ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                                                {student.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{student.name}</h4>
                                                <p className="text-xs text-gray-500">{student.grade}</p>
                                            </div>
                                        </div>
                                        {selectedStudent === student.id.toString() && (
                                            <div className="bg-blue-500 text-white rounded-full p-1"><Check size={14} /></div>
                                        )}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">ID: #{student.id}</span>
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Edit Student Modal */}
                {editStudent && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                            <h3 className="text-xl font-bold mb-4">Edit Student</h3>
                            <form onSubmit={handleUpdateStudent}>
                                <div className="space-y-4">
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <input type="text" className="form-input" value={editStudent.name} onChange={e => setEditStudent({...editStudent, name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Grade</label>
                                        <select className="form-select" value={editStudent.grade} onChange={e => setEditStudent({...editStudent, grade: e.target.value})}>
                                            <option>1st Grade</option>
                                            <option>2nd Grade</option>
                                            <option>3rd Grade</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Guardian</label>
                                        <input type="text" className="form-input" value={editStudent.guardian || ''} onChange={e => setEditStudent({...editStudent, guardian: e.target.value})} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" className="btn-secondary" onClick={() => setEditStudent(null)}>Cancel</button>
                                    <button type="submit" className="btn-primary">Update</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderManageFiles = () => {
        const filteredFiles = (files || []).filter(f => 
            f.student?.toLowerCase().includes(fileSearchTerm.toLowerCase()) || 
            f.type?.toLowerCase().includes(fileSearchTerm.toLowerCase())
        );

        return (
            <div className="file-management-grid">
                <div className="upload-card">
                    <h3 className="font-bold mb-4">Upload Documents</h3>
                     <div className="form-group">
                        <label className="form-label">Assign to Student</label>
                        <input type="text" className="form-input" placeholder="Student Name..." value={uploadConfig.studentName} onChange={(e) => setUploadConfig({...uploadConfig, studentName: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Document Type</label>
                        <select className="form-select" value={uploadConfig.docType} onChange={(e) => setUploadConfig({...uploadConfig, docType: e.target.value})}>
                            <option>Birth Certificate</option>
                            <option>ID Card</option>
                            <option>Medical Record</option>
                        </select>
                    </div>
                    <div className="file-upload-area relative">
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUploadChange} />
                        <div className="text-center">
                            <Upload size={32} className="file-upload-icon mx-auto" />
                            <p className="text-sm font-medium text-gray-700">Click to upload or drag file</p>
                            <p className="text-xs text-gray-500 mt-1">PDF, JPG up to 10MB</p>
                        </div>
                    </div>
                </div>

                <div className="file-list-card">
                    <div className="table-controls">
                        <h3 className="font-bold">Recent Uploads</h3>
                        <div className="search-wrapper">
                            <Search size={16} className="search-icon" />
                            <input type="text" placeholder="Search files..." className="search-input" value={fileSearchTerm} onChange={(e) => setFileSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div style={{overflowX: 'auto'}}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>File Name / Type</th>
                                <th>Student</th>
                                <th>Size</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFiles.map((file) => (
                                <tr key={file.id}>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-blue-500" />
                                            <span className="font-medium">{file.type}</span>
                                            <span className="text-xs text-gray-400">({file.name || 'document'})</span>
                                        </div>
                                    </td>
                                    <td>{file.student}</td>
                                    <td className="text-gray-500">{file.size}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-icon" title="Download" onClick={() => handleDownload(file)}>
                                                <Download size={18} />
                                            </button>
                                            <button className="btn-icon danger" title="Delete" onClick={() => { if(window.confirm('Delete?')) setFiles(files.filter(f => f.id !== file.id)); }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>{t('secretary.admissions.title') || 'Student Admissions'}</h1>
                <p>{t('secretary.admissions.subtitle') || 'Manage new applications and enrollment.'}</p>
            </header>

            <div className="secretary-tabs">
                <button className={`secretary-tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
                    <div className="tab-content"><FileText size={18} />{t('secretary.admissions.newApplications') || 'Applications'}<span className="tab-badge">{(applications || []).filter(a => a.status === 'Pending').length}</span></div>
                </button>
                <button className={`secretary-tab ${activeTab === 'add-student' ? 'active' : ''}`} onClick={() => setActiveTab('add-student')}>
                    <div className="tab-content"><UserPlus size={18} />{t('secretary.admissions.addStudent') || 'Add Student'}</div>
                </button>
                <button className={`secretary-tab ${activeTab === 'class-assignment' ? 'active' : ''}`} onClick={() => setActiveTab('class-assignment')}>
                    <div className="tab-content"><Users size={18} />{t('secretary.admissions.classAssignment') || 'Class Assignment'}{(allStudents || []).filter(s => !s.class).length > 0 && <span className="tab-badge bg-yellow-500">{(allStudents || []).filter(s => !s.class).length}</span>}</div>
                </button>
                <button className={`secretary-tab ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
                    <div className="tab-content"><Upload size={18} />{t('secretary.admissions.manageFiles') || 'Manage Files'}</div>
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
