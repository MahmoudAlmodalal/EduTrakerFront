import React, { useState } from 'react';
import { Users, UserCheck, AlertTriangle, Check, Search, Filter } from 'lucide-react';

const ClassManagement = () => {
    const [selectedClass, setSelectedClass] = useState('Grade 10-A');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

    // Mock Data
    const classes = ['Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B'];

    // Mock Student Data with Attendance State
    const [students, setStudents] = useState([
        { id: 1, name: 'Ahmed Ali', status: 'Present', behavior: 'Neutral' },
        { id: 2, name: 'Sara Khan', status: 'Present', behavior: 'Neutral' },
        { id: 3, name: 'Mohamed Zaki', status: 'Absent', behavior: 'Negative' },
        { id: 4, name: 'Layla Mahmoud', status: 'Present', behavior: 'Positive' },
        { id: 5, name: 'Omar Youssef', status: 'Present', behavior: 'Neutral' },
        { id: 6, name: 'Hana Salem', status: 'Absent', behavior: 'Neutral' },
        { id: 7, name: 'Yarah Ahmed', status: 'Present', behavior: 'Positive' },
    ]);

    const handleAttendanceToggle = (id) => {
        setStudents(students.map(student => {
            if (student.id === id) {
                return { ...student, status: student.status === 'Present' ? 'Absent' : 'Present' };
            }
            return student;
        }));
    };

    const handleBehaviorLog = (id, type) => {
        setStudents(students.map(student => {
            if (student.id === id) {
                return { ...student, behavior: type };
            }
            return student;
        }));
    };

    return (
        <div className="p-6 space-y-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Class Management</h1>
                    <p className="text-gray-600">Manage students, attendance, and behavior.</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                    <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Total Students</p>
                        <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                        <Users size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Present Today</p>
                        <p className="text-2xl font-bold text-green-600">
                            {students.filter(s => s.status === 'Present').length}
                        </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-green-600">
                        <UserCheck size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Absent Today</p>
                        <p className="text-2xl font-bold text-red-600">
                            {students.filter(s => s.status === 'Absent').length}
                        </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                </div>
            </div>

            {/* Student List Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Student List - {selectedClass}</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search student..."
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                            <tr>
                                <th className="px-6 py-4">Student Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Attendance Action</th>
                                <th className="px-6 py-4">Behavior Log</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-800 font-medium">{student.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'Present'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleAttendanceToggle(student.id)}
                                            className={`text-sm px-3 py-1 rounded-md border transition-colors ${student.status === 'Present'
                                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                    : 'border-green-200 text-green-600 hover:bg-green-50'
                                                }`}
                                        >
                                            Mark as {student.status === 'Present' ? 'Absent' : 'Present'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button
                                            onClick={() => handleBehaviorLog(student.id, 'Positive')}
                                            className={`p-1.5 rounded-md transition-colors ${student.behavior === 'Positive'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-gray-100 text-gray-400 hover:text-green-600'
                                                }`}
                                            title="Log Positive Behavior"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleBehaviorLog(student.id, 'Negative')}
                                            className={`p-1.5 rounded-md transition-colors ${student.behavior === 'Negative'
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-gray-100 text-gray-400 hover:text-red-600'
                                                }`}
                                            title="Log Negative Behavior"
                                        >
                                            <AlertTriangle size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassManagement;
