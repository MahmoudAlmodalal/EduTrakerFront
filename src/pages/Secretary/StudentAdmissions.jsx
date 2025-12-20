import React, { useState } from 'react';
import { Search, Filter, FileText, Upload, Download, Check, X, UserPlus, Users, Edit, Trash2, Folder } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import './Secretary.css';
import '../WorkstreamManager/Workstream.css';

const StudentAdmissions = () => {
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'applications';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync if URL params change later
    React.useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    // Mock Data
    // State for Applications
    const [applications, setApplications] = useState(() => {
        const saved = localStorage.getItem('secretary_applications');
        return saved ? JSON.parse(saved) : [
            { id: 101, name: 'Alice Johnson', grade: '1st Grade', submittedDate: '2025-12-10', status: 'Pending' },
            { id: 102, name: 'Bob Smith', grade: '2nd Grade', submittedDate: '2025-12-11', status: 'Under Review' },
            { id: 103, name: 'Charlie Brown', grade: '1st Grade', submittedDate: '2025-12-12', status: 'Pending' },
        ];
    });

    // State for Students (Registered)
    const [students, setStudents] = useState(() => {
        const saved = localStorage.getItem('secretary_students');
        return saved ? JSON.parse(saved) : [];
    });

    // Persist changes
    React.useEffect(() => {
        localStorage.setItem('secretary_applications', JSON.stringify(applications));
    }, [applications]);

    React.useEffect(() => {
        localStorage.setItem('secretary_students', JSON.stringify(students));
    }, [students]);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentStudentId, setCurrentStudentId] = useState(null);
    const [newStudent, setNewStudent] = useState({
        firstName: '', lastName: '', dob: '', gender: 'Male', grade: '1st Grade', class: 'Pending',
        guardianName: '', guardianContact: ''
    });

    const handleSaveStudent = (e) => {
        e.preventDefault();
        
        if (isEditing) {
            // Update existing student
            const updatedStudents = students.map(s => 
                s.id === currentStudentId 
                ? { ...s, name: `${newStudent.firstName} ${newStudent.lastName}`, ...newStudent }
                : s
            );
            setStudents(updatedStudents);
            alert('Student Record Updated Successfully!');
            setIsEditing(false);
            setCurrentStudentId(null);
        } else {
            // Create new student
            const student = {
                id: Date.now(),
                name: `${newStudent.firstName} ${newStudent.lastName}`,
                ...newStudent,
                enrollmentDate: new Date().toISOString().split('T')[0]
            };
            setStudents([...students, student]);
            alert('Student Registered Successfully!');
        }

        setNewStudent({ firstName: '', lastName: '', dob: '', gender: 'Male', grade: '1st Grade', class: 'Pending', guardianName: '', guardianContact: '' });
        setActiveTab('view-students'); 
    };

    const handleDeleteStudent = (id) => {
        if (window.confirm('Are you sure you want to delete this student record?')) {
            const updatedStudents = students.filter(s => s.id !== id);
            setStudents(updatedStudents);
        }
    };

    const handleEditStudent = (student) => {
        const [firstName, ...lastNameParts] = student.name.split(' ');
        setNewStudent({
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
            dob: student.dob || '',
            gender: student.gender || 'Male',
            grade: student.grade || '1st Grade',
            class: student.class || 'Pending',
            guardianName: student.guardianName || '',
            guardianContact: student.guardianContact || ''
        });
        setIsEditing(true);
        setCurrentStudentId(student.id);
        setActiveTab('add-student');
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setCurrentStudentId(null);
        setNewStudent({ firstName: '', lastName: '', dob: '', gender: 'Male', grade: '1st Grade', class: 'Pending', guardianName: '', guardianContact: '' });
        setActiveTab('view-students');
    };

    const handleViewDocuments = (studentName) => {
        // In a real app we would set a filter here
        setActiveTab('files');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewStudent(prev => ({ ...prev, [name]: value }));
    };

    // File Management State
    const [files, setFiles] = useState(() => {
        const saved = localStorage.getItem('secretary_files');
        return saved ? JSON.parse(saved) : [
            { id: 1, student: 'Alice Johnson', type: 'Birth Certificate', size: '1.2 MB', date: '2025-12-10' },
            { id: 2, student: 'Bob Smith', type: 'Immunization Record', size: '2.5 MB', date: '2025-12-11' },
        ];
    });

    const [fileForm, setFileForm] = useState({
        studentName: '',
        docType: 'Birth Certificate',
        file: null
    });

    const [fileSearch, setFileSearch] = useState('');

    React.useEffect(() => {
        localStorage.setItem('secretary_files', JSON.stringify(files));
    }, [files]);

    const handleUploadFile = (e) => {
        e.preventDefault();
        // In a real app, we would upload the actual file to a server.
        // Here we mock it by creating a record.
        const newFileRecord = {
            id: Date.now(),
            student: fileForm.studentName || 'Unknown Student',
            type: fileForm.docType,
            size: fileForm.file ? (fileForm.file.size / 1024 / 1024).toFixed(2) + ' MB' : '0.5 MB', // Mock size if no file obj or calculate
            date: new Date().toISOString().split('T')[0]
        };

        setFiles([newFileRecord, ...files]);
        setFileForm({ studentName: '', docType: 'Birth Certificate', file: null });
        alert('File uploaded successfully!');
    };

    const handleDeleteFile = (id) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            setFiles(files.filter(f => f.id !== id));
        }
    };

    const handleDownloadFile = (file) => {
        // If it's a real file uploaded in this session
        if (file.file) {
            const url = URL.createObjectURL(file.file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return;
        }

        // For mock files or persistent mocks, ask for format
        const choice = window.prompt(`Download "${file.type}" as PDF or Word? (Type 'p' for PDF, 'w' for Word)`, 'p');
        
        if (!choice) return;

        const isPdf = choice.toLowerCase().startsWith('p');
        const extension = isPdf ? 'pdf' : 'docx';
        const mimeType = isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const fileName = `${file.student.replace(' ', '_')}_${file.type.replace(' ', '_')}.${extension}`;

        // Create dummy content
        const content = `This is a mock content for document: ${file.type}\nStudent: ${file.student}\nDate: ${file.date}`;
        const blob = new Blob([content], { type: 'text/plain' }); // Using text/plain so it's readable if opened in text editor, though ext is pdf/doc
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleApproveApplication = (appId) => {
        const appIndex = applications.findIndex(a => a.id === appId);
        if (appIndex === -1) return;

        const app = applications[appIndex];
        if (app.status === 'Approved') {
            alert('This application is already approved.');
            return;
        }

        // Create new student from application
        const [firstName, ...lastNameParts] = app.name.split(' ');
        const newStudentData = {
            id: Date.now(),
            name: app.name,
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
            grade: app.grade,
            gender: 'Unknown', // Default or need to add to app form
            dob: '2018-01-01', // Default or need to add to app form
            enrollmentDate: new Date().toISOString().split('T')[0],
            class: 'Pending',
            guardianName: 'Pending',
            guardianContact: ''
        };

        setStudents(prev => [...prev, newStudentData]);

        // Update application status
        const updatedApps = [...applications];
        updatedApps[appIndex] = { ...app, status: 'Approved' };
        setApplications(updatedApps);

        alert(`Application for ${app.name} approved! Student record created.`);
    };

    const handleRejectApplication = (appId) => {
        if (window.confirm('Are you sure you want to reject this application?')) {
            const updatedApps = applications.map(app => 
                app.id === appId ? { ...app, status: 'Rejected' } : app
            );
            setApplications(updatedApps);
        }
    };

    const handleDeleteApplication = (appId) => {
        if (window.confirm('Are you sure you want to permanently delete this application?')) {
            const updatedApps = applications.filter(app => app.id !== appId);
            setApplications(updatedApps);
        }
    };

    const handleViewApplication = (app) => {
        alert(`Viewing Application Details:\nName: ${app.name}\nGrade: ${app.grade}\nDate: ${app.submittedDate}\nStatus: ${app.status}`);
        // In real app, open a modal
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
                <button className="btn-primary" onClick={() => {
                    const newApp = { id: Date.now(), name: `Applicant ${applications.length + 1}`, grade: '1st Grade', submittedDate: new Date().toISOString().split('T')[0], status: 'Pending' };
                    setApplications([newApp, ...applications]);
                }}>
                    <UserPlus size={18} />
                    New Test App
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
                                <span className={`status-badge ${
                                    app.status === 'Approved' ? 'status-active' : 
                                    app.status === 'Rejected' ? 'status-inactive' : 
                                    'status-warning' // Use a yellowish class or inline style
                                }`}
                                    style={{
                                        backgroundColor: 
                                            app.status === 'Approved' ? '#dcfce7' : 
                                            app.status === 'Rejected' ? '#fee2e2' : '#ffedd5',
                                        color: 
                                            app.status === 'Approved' ? '#166534' : 
                                            app.status === 'Rejected' ? '#b91c1c' : '#c2410c'
                                    }}
                                >
                                    {app.status}
                                </span>
                            </td>
                            <td>
                                <div className="action-btn-group">
                                    {app.status === 'Pending' && (
                                        <>
                                            <button className="btn-icon success" title="Approve" onClick={() => handleApproveApplication(app.id)}>
                                                <Check size={18} />
                                            </button>
                                            <button className="btn-icon danger" title="Reject" onClick={() => handleRejectApplication(app.id)}>
                                                <X size={18} />
                                            </button>
                                        </>
                                    )}
                                    {app.status === 'Rejected' && (
                                        <button className="btn-icon danger" title="Delete Application" onClick={() => handleDeleteApplication(app.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    <button className="btn-icon info" title="View Details" onClick={() => handleViewApplication(app)}>
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
            <h2 className="widget-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                {isEditing ? 'Edit Student Record' : 'Manual Student Entry'}
            </h2>
            <form onSubmit={handleSaveStudent}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input type="text" name="firstName" value={newStudent.firstName} onChange={handleInputChange} className="form-input" placeholder="e.g. John" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input type="text" name="lastName" value={newStudent.lastName} onChange={handleInputChange} className="form-input" placeholder="e.g. Doe" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input type="date" name="dob" value={newStudent.dob} onChange={handleInputChange} className="form-input" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select name="gender" value={newStudent.gender} onChange={handleInputChange} className="form-select">
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Grade Level</label>
                        <select name="grade" value={newStudent.grade} onChange={handleInputChange} className="form-select">
                            <option>1st Grade</option>
                            <option>2nd Grade</option>
                            <option>3rd Grade</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Class Assignment</label>
                        <select name="class" value={newStudent.class} onChange={handleInputChange} className="form-select">
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
                            <input type="text" name="guardianName" value={newStudent.guardianName} onChange={handleInputChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact Number</label>
                            <input type="tel" name="guardianContact" value={newStudent.guardianContact} onChange={handleInputChange} className="form-input" required />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mt-4">
                    <button 
                        type="button" 
                        onClick={isEditing ? handleCancelEdit : () => setActiveTab('view-students')} 
                        className="btn-secondary" 
                        style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                        {isEditing ? 'Update Student Record' : 'Save Student Record'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderManageFiles = () => {
        const filteredFiles = files.filter(f => 
            f.student.toLowerCase().includes(fileSearch.toLowerCase()) || 
            f.type.toLowerCase().includes(fileSearch.toLowerCase())
        );

        return (
            <div className="file-management-grid">
                <div className="upload-card">
                    <h3 className="font-bold mb-4">Upload Documents</h3>
                    <form onSubmit={handleUploadFile}>
                        <div className="file-upload-area" style={{ position: 'relative' }}>
                            <Upload size={32} className="file-upload-icon" />
                            <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500 mt-1">PDF, JPG up to 10MB</p>
                            <input 
                                type="file" 
                                style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                    opacity: 0, cursor: 'pointer'
                                }}
                                onChange={(e) => setFileForm({ ...fileForm, file: e.target.files[0] })}
                                required
                            />
                        </div>
                        {fileForm.file && (
                            <p className="text-sm text-green-600 mt-2 text-center">Selected: {fileForm.file.name}</p>
                        )}
                        
                        <div className="form-group mt-4">
                            <label className="form-label">Assign to Student</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Student Name..." 
                                value={fileForm.studentName}
                                onChange={(e) => setFileForm({ ...fileForm, studentName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Document Type</label>
                            <select 
                                className="form-select"
                                value={fileForm.docType}
                                onChange={(e) => setFileForm({ ...fileForm, docType: e.target.value })}
                            >
                                <option>Birth Certificate</option>
                                <option>ID Card</option>
                                <option>Medical Record</option>
                                <option>Previous School Report</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-primary w-full" style={{ justifyContent: 'center' }}>Upload File</button>
                    </form>
                </div>

                <div className="file-list-card">
                    <div className="table-controls">
                        <h3 className="font-bold">Recent Uploads</h3>
                        <div className="search-wrapper">
                            <Search size={16} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search files..." 
                                className="search-input" 
                                value={fileSearch}
                                onChange={(e) => setFileSearch(e.target.value)}
                            />
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
                            {filteredFiles.length > 0 ? (
                                filteredFiles.map((file) => (
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
                                            <div className="action-btn-group">
                                                <button className="btn-icon info" title="Download" onClick={() => handleDownloadFile(file.type)}>
                                                    <Download size={18} />
                                                </button>
                                                <button className="btn-icon danger" title="Delete" onClick={() => handleDeleteFile(file.id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-gray-500">No files found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderViewStudents = () => (
        <div className="management-card">
            <div className="table-controls">
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search enrolled students..."
                        className="search-input"
                    />
                </div>
                <button 
                    className="btn-primary" 
                    onClick={() => {
                        setIsEditing(false);
                        setNewStudent({ firstName: '', lastName: '', dob: '', gender: 'Male', grade: '1st Grade', class: 'Pending', guardianName: '', guardianContact: '' });
                        setActiveTab('add-student');
                    }}
                >
                    <UserPlus size={18} />
                    Add New Student
                </button>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Student Name</th>
                        <th>Grade</th>
                        <th>Gender</th>
                        <th>Enrollment Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {students.length > 0 ? (
                        students.map((student) => (
                            <tr key={student.id}>
                                <td>#{student.id}</td>
                                <td className="font-medium">{student.name}</td>
                                <td>{student.grade}</td>
                                <td>{student.gender}</td>
                                <td>{student.enrollmentDate}</td>
                                <td>
                                    <div className="action-btn-group">
                                        <button className="btn-icon info" title="View Documents" onClick={() => handleViewDocuments(student.name)}>
                                            <Folder size={18} />
                                        </button>
                                        <button className="btn-icon warning" title="Edit Student" onClick={() => handleEditStudent(student)}>
                                            <Edit size={18} />
                                        </button>
                                        <button className="btn-icon danger" title="Delete Student" onClick={() => handleDeleteStudent(student.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center py-4 text-gray-500">No enrolled students found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    // Class Assignment State
    const [assignmentGrade, setAssignmentGrade] = useState('1st Grade');
    const [targetClass, setTargetClass] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);

    const handleToggleStudent = (studentId) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(selectedStudents.filter(id => id !== studentId));
        } else {
            setSelectedStudents([...selectedStudents, studentId]);
        }
    };

    const handleAssignClass = () => {
        if (!targetClass) {
            alert('Please select a target class.');
            return;
        }
        if (selectedStudents.length === 0) {
            alert('Please select at least one student.');
            return;
        }

        const updatedStudents = students.map(student => 
            selectedStudents.includes(student.id) ? { ...student, class: targetClass } : student
        );
        setStudents(updatedStudents);
        setSelectedStudents([]);
        alert(`Successfully assigned ${selectedStudents.length} students to ${targetClass}.`);
    };

    const renderClassAssignment = () => {
        // Filter students by selected grade
        const filteredStudents = students.filter(s => s.grade === assignmentGrade);

        return (
            <div className="management-card">
                <div className="table-controls">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-700">Filter by Grade:</span>
                        <select 
                            className="form-select" 
                            style={{ width: '200px' }}
                            value={assignmentGrade}
                            onChange={(e) => {
                                setAssignmentGrade(e.target.value);
                                setSelectedStudents([]); // Reset selection on grade change
                            }}
                        >
                            <option>1st Grade</option>
                            <option>2nd Grade</option>
                            <option>3rd Grade</option>
                        </select>
                    </div>
                </div>

                <div className="my-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-200">
                    <div className="flex items-center gap-2">
                        <Users size={20} className="text-gray-500" />
                        <span className="font-medium">{selectedStudents.length} Students Selected</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Assign to:</span>
                        <select 
                            className="form-select" 
                            style={{ width: '150px' }}
                            value={targetClass}
                            onChange={(e) => setTargetClass(e.target.value)}
                        >
                            <option value="">Select Class</option>
                            <option value="Class 1-A">Class 1-A</option>
                            <option value="Class 1-B">Class 1-B</option>
                            <option value="Class 2-A">Class 2-A</option>
                            <option value="Class 2-B">Class 2-B</option>
                            <option value="Class 3-A">Class 3-A</option>
                        </select>
                        <button className="btn-primary" onClick={handleAssignClass}>
                            Assign Class
                        </button>
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>
                                <input 
                                    type="checkbox" 
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedStudents(filteredStudents.map(s => s.id));
                                        } else {
                                            setSelectedStudents([]);
                                        }
                                    }}
                                    checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                                />
                            </th>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Current Class</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <tr key={student.id}>
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedStudents.includes(student.id)}
                                            onChange={() => handleToggleStudent(student.id)}
                                        />
                                    </td>
                                    <td>#{student.id}</td>
                                    <td className="font-medium">{student.name}</td>
                                    <td>{student.class || 'Pending'}</td>
                                    <td>
                                        <span className={`status-badge ${student.class && student.class !== 'Pending' ? 'status-active' : 'status-inactive'}`}>
                                            {student.class && student.class !== 'Pending' ? 'Assigned' : 'Unassigned'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-500">No students found for this grade.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>Student Registration & Admissions</h1>
                <p>Manage new applications, enroll students, and handle documents.</p>
            </header>

            <div className="secretary-tabs">
                <button
                    className={`secretary-tab ${activeTab === 'view-students' ? 'active' : ''}`}
                    onClick={() => setActiveTab('view-students')}
                >
                    <div className="tab-content">
                        <Users size={18} />
                        Enrolled Students
                        <span className="tab-badge">{students.length}</span>
                    </div>
                </button>
                <button
                    className={`secretary-tab ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    <div className="tab-content">
                        <FileText size={18} />
                        New Applications
                        <span className="tab-badge">{applications.filter(a => a.status === 'Pending').length}</span>
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
                {activeTab === 'view-students' && renderViewStudents()}
                {activeTab === 'applications' && renderNewApplications()}
                {activeTab === 'add-student' && renderAddNewStudent()}
                {activeTab === 'class-assignment' && renderClassAssignment()}
                {activeTab === 'files' && renderManageFiles()}
            </div>
        </div>
    );
};

export default StudentAdmissions;
