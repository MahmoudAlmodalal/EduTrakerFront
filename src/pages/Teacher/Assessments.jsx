import React, { useState } from 'react';
import { FileText, Plus, Save, Send, Users, Trash2 } from 'lucide-react';

const Assessments = () => {
    const [activeTab, setActiveTab] = useState('gradebook'); // 'create', 'gradebook'
    const [selectedClass, setSelectedClass] = useState('Grade 10-A');
    const [selectedAssessment, setSelectedAssessment] = useState('Midterm Exam');

    // Mock Data
    const classes = ['Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B'];
    const assessmentTypes = ['Homework', 'Quiz', 'Midterm', 'Final Project'];

    // Mock Assessments List
    const [assessments, setAssessments] = useState([
        { id: 1, title: 'Midterm Exam', type: 'Midterm', date: '2025-11-15', points: 100 },
        { id: 2, title: 'Homework 1', type: 'Homework', date: '2025-12-01', points: 20 },
        { id: 3, title: 'Quiz A', type: 'Quiz', date: '2025-12-10', points: 10 },
    ]);

    // Mock Students & Grades
    const [grades, setGrades] = useState([
        { id: 1, name: 'Ahmed Ali', grade: 85, status: 'Graded', feedback: '' },
        { id: 2, name: 'Sara Khan', grade: 92, status: 'Graded', feedback: 'Great job!' },
        { id: 3, name: 'Mohamed Zaki', grade: '', status: 'Pending', feedback: '' },
        { id: 4, name: 'Layla Mahmoud', grade: 78, status: 'Graded', feedback: 'Good effort.' },
        { id: 5, name: 'Omar Youssef', grade: '', status: 'Pending', feedback: '' },
    ]);

    // Form State for New Assessment
    const [newAssessment, setNewAssessment] = useState({
        title: '',
        type: 'Homework',
        date: '',
        points: '',
        description: ''
    });

    const handleCreateAssessment = (e) => {
        e.preventDefault();
        const assessment = {
            id: assessments.length + 1,
            ...newAssessment
        };
        setAssessments([...assessments, assessment]);
        setSelectedAssessment(newAssessment.title); // Select the new assessment
        setActiveTab('gradebook');
        // Reset form
        setNewAssessment({ title: '', type: 'Homework', date: '', points: '', description: '' });

        // Reset grades for new assessment (mock logic)
        setGrades(grades.map(s => ({ ...s, grade: '', status: 'Pending', feedback: '' })));

        alert(`Assessment "${assessment.title}" created successfully!`);
    };

    const handleGradeChange = (id, value) => {
        setGrades(grades.map(student => {
            if (student.id === id) {
                return { ...student, grade: value, status: value ? 'Graded' : 'Pending' };
            }
            return student;
        }));
    };

    const handleFeedbackChange = (id, value) => {
        setGrades(grades.map(student => {
            if (student.id === id) {
                return { ...student, feedback: value };
            }
            return student;
        }));
    };

    const handlePublishResults = () => {
        const gradedCount = grades.filter(g => g.status === 'Graded').length;
        if (gradedCount === 0) {
            alert('No grades to publish!');
            return;
        }
        alert(`Results published for ${gradedCount} students in ${selectedClass} for ${selectedAssessment}. Notifications sent to students and parents.`);
    };

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Assessments & Gradebook</h1>
                    <p className="text-gray-600">Create tests and manage student grades.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('gradebook')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'gradebook'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Gradebook
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'create'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        + Create Assessment
                    </button>
                </div>
            </header>

            {activeTab === 'create' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Plus size={20} className="text-blue-600" />
                        Create New Assessment
                    </h2>
                    <form className="space-y-4" onSubmit={handleCreateAssessment}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newAssessment.title}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                    placeholder="e.g. Algebra Quiz 1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={newAssessment.type}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    {assessmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    value={newAssessment.date}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
                                <input
                                    type="number"
                                    required
                                    value={newAssessment.points}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, points: e.target.value })}
                                    placeholder="100"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Instructions</label>
                            <textarea
                                rows="3"
                                value={newAssessment.description}
                                onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setActiveTab('gradebook')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Create Assessment</button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'gradebook' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-3">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                            </select>
                            <select
                                value={selectedAssessment}
                                onChange={(e) => setSelectedAssessment(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                {assessments.map(a => <option key={a.id} value={a.title}>{a.title}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePublishResults}
                                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                            >
                                <Send size={18} />
                                Publish Results
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                                <tr>
                                    <th className="px-6 py-4">Student Name</th>
                                    <th className="px-6 py-4">Grade (pts)</th>
                                    <th className="px-6 py-4">Feedback (Optional)</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {grades.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-800">{student.name}</td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                value={student.grade}
                                                onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                                className="w-20 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-center"
                                                placeholder="0-100"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                value={student.feedback || ''}
                                                onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                                                placeholder="Add comment..."
                                                className="w-full max-w-xs px-3 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-blue-400"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'Graded'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assessments;
