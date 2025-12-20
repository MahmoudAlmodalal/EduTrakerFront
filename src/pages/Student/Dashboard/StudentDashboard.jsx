import React from 'react';
import { Clock, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import '../../Student/Student.css';

const StudentDashboard = () => {
    // Mock Data
    const todaySchedule = [
        { id: 1, time: '08:00 - 09:30', subject: 'Mathematics', room: 'Room 101', status: 'completed' },
        { id: 2, time: '09:45 - 11:15', subject: 'Physics', room: 'Lab 2', status: 'current' },
        { id: 3, time: '11:45 - 13:15', subject: 'Chemistry', room: 'Lab 1', status: 'upcoming' },
        { id: 4, time: '13:30 - 15:00', subject: 'English', room: 'Room 203', status: 'upcoming' },
    ];

    const assignments = [
        { id: 1, title: 'Calculus Homework 3', subject: 'Mathematics', due: 'Today', status: 'urgent' },
        { id: 2, title: 'Physics Lab Report', subject: 'Physics', due: 'Tomorrow', status: 'pending' },
        { id: 3, title: 'Essay Draft', subject: 'English', due: 'In 3 days', status: 'pending' },
    ];

    const attendanceStats = {
        present: 92,
        absent: 8,
        warning: false
    };

    return (
        <div className="student-dashboard">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Welcome back, Student!</h1>
                <p className="text-slate-500">Here's what's happening today.</p>
            </header>

            <div className="student-dashboard-grid">

                {/* Daily Schedule */}
                <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h2 className="card-title flex items-center gap-2">
                            <Clock size={20} className="text-blue-600" />
                            Daily Schedule
                        </h2>
                        <span className="text-sm text-slate-500">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="space-y-4">
                        {todaySchedule.map((classItem) => (
                            <div key={classItem.id} className={`flex items-center p-3 rounded-lg border ${classItem.status === 'current' ? 'border-blue-200 bg-blue-50' : 'border-slate-100'}`}>
                                <div className="w-24 font-medium text-slate-700">{classItem.time}</div>
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-800">{classItem.subject}</div>
                                    <div className="text-sm text-slate-500">{classItem.room}</div>
                                </div>
                                <div>
                                    {classItem.status === 'completed' && <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Done</span>}
                                    {classItem.status === 'current' && <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">Now</span>}
                                    {classItem.status === 'upcoming' && <span className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-full">Upcoming</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column Stack */}
                <div className="space-y-6">

                    {/* Attendance Alert */}
                    <div className={`dashboard-card ${attendanceStats.warning ? 'bg-red-50 border-red-100' : 'bg-white'}`}>
                        <div className="card-header">
                            <h2 className="card-title flex items-center gap-2">
                                <Calendar size={20} className={attendanceStats.warning ? 'text-red-600' : 'text-slate-600'} />
                                Attendance
                            </h2>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-slate-800">{attendanceStats.present}%</div>
                                <div className="text-xs text-slate-500">Attendance</div>
                            </div>
                            <div className="h-10 w-px bg-slate-200"></div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-slate-800">{attendanceStats.absent}%</div>
                                <div className="text-xs text-slate-500">Absence</div>
                            </div>
                        </div>
                        {attendanceStats.absent > 15 && (
                            <div className="mt-4 flex items-start gap-2 text-sm text-red-600 bg-red-100 p-2 rounded">
                                <AlertCircle size={16} className="mt-0.5" />
                                <span>High absence rate warning! Please contact administration.</span>
                            </div>
                        )}
                    </div>

                    {/* Assignments */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2 className="card-title flex items-center gap-2">
                                <CheckCircle size={20} className="text-orange-600" />
                                Assignments
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {assignments.map((assignment) => (
                                <div key={assignment.id} className="p-3 bg-slate-50 rounded border border-slate-100">
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium text-slate-800">{assignment.title}</div>
                                        {assignment.status === 'urgent' && <AlertCircle size={16} className="text-red-500" />}
                                    </div>
                                    <div className="flex justify-between items-center mt-1 text-xs">
                                        <span className="text-slate-500">{assignment.subject}</span>
                                        <span className={`font-medium ${assignment.status === 'urgent' ? 'text-red-600' : 'text-slate-600'}`}>
                                            Due: {assignment.due}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
